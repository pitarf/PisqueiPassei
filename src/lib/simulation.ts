import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";
import { validateAiQuestion, normalizeText } from "@/lib/question-validator";

const PORT_TOTAL = 10;
const MATH_TOTAL = 10;
const SPECIFIC_TOTAL = 40;
const MAX_STOCK_GENERATION_RETRIES = 2;

function shuffle<T>(items: T[]) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }

async function refillStock(
  targetTopics: { id: string; title: string; officialSource: string | null; subject: { name: string } }[],
  deficit: number,
  existingStatements: Set<string>
) {
  if (deficit <= 0 || !targetTopics.length) return;
  let remaining = deficit;
  let retries = 0;

  while (remaining > 0 && retries < MAX_STOCK_GENERATION_RETRIES) {
    retries++;
    for (const topic of shuffle(targetTopics)) {
      if (remaining <= 0) break;
      const requestCount = Math.min(remaining + 2, 8);
      try {
        const batch = await generateQuestionBatch(topic.title, topic.subject.name, requestCount, "MEDIA", topic.officialSource);
        const rawList = Array.isArray(batch?.questions) ? batch.questions : [];
        for (const raw of rawList) {
          if (remaining <= 0) break;
          const validation = validateAiQuestion(raw, "MEDIA");
          if (!validation.valid) continue;
          const q = validation.question;
          const key = normalizeText(q.statement);
          if (existingStatements.has(key)) continue;

          await prisma.question.create({
            data: {
              topicId: topic.id,
              statement: q.statement,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              optionE: q.optionE,
              correctOption: q.correctOption,
              explanation: q.explanation,
              difficulty: q.difficulty,
              origin: q.origin,
              banca: q.banca,
              sourceRef: q.sourceRef,
              questionType: q.questionType,
              cognitiveLevel: q.cognitiveLevel,
              subtopic: q.subtopic,
              verificationStatus: q.verificationStatus,
            },
          });
          existingStatements.add(key);
          remaining--;
        }
      } catch (err) {
        console.warn(`[Auto-Refill] Falha controlada ao gerar questão para "${topic.title}":`, (err as Error).message);
      }
    }
  }
}

export async function loadExamQuestions() {
  const [portSubject, mathSubject, specificSubjects] = await Promise.all([
    prisma.subject.findFirst({ where: { name: "Língua Portuguesa" } }),
    prisma.subject.findFirst({ where: { name: "Matemática" } }),
    prisma.subject.findMany({ where: { category: "ESPECIFICO" }, select: { id: true } }),
  ]);
  const specificIds = specificSubjects.map((s) => s.id);

  let [portPool, mathPool, specificPool] = await Promise.all([
    portSubject ? prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    mathSubject ? prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, include: { topic: { include: { subject: true } } } }),
  ]);

  // Se houver déficit em qualquer categoria, aciona suprimento resiliente antes de falhar
  const portDeficit = PORT_TOTAL - portPool.length;
  const mathDeficit = MATH_TOTAL - mathPool.length;
  const specificDeficit = SPECIFIC_TOTAL - specificPool.length;

  if (portDeficit > 0 || mathDeficit > 0 || specificDeficit > 0) {
    const allExisting = [...portPool, ...mathPool, ...specificPool];
    const existingStatements = new Set(allExisting.map((q) => normalizeText(q.statement)));

    if (portDeficit > 0 && portSubject) {
      const portTopics = await prisma.topic.findMany({ where: { subjectId: portSubject.id }, include: { subject: true } });
      await refillStock(portTopics, portDeficit, existingStatements);
      portPool = await prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, include: { topic: { include: { subject: true } } } });
    }

    if (mathDeficit > 0 && mathSubject) {
      const mathTopics = await prisma.topic.findMany({ where: { subjectId: mathSubject.id }, include: { subject: true } });
      await refillStock(mathTopics, mathDeficit, existingStatements);
      mathPool = await prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, include: { topic: { include: { subject: true } } } });
    }

    if (specificDeficit > 0 && specificIds.length) {
      const specTopics = await prisma.topic.findMany({ where: { subjectId: { in: specificIds } }, include: { subject: true } });
      await refillStock(specTopics, specificDeficit, existingStatements);
      specificPool = await prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, include: { topic: { include: { subject: true } } } });
    }
  }

  const portQuestions = shuffle(portPool).slice(0, PORT_TOTAL);
  const mathQuestions = shuffle(mathPool).slice(0, MATH_TOTAL);
  const specificQuestions = shuffle(specificPool).slice(0, SPECIFIC_TOTAL);
  return {
    questions: [...portQuestions, ...mathQuestions, ...specificQuestions],
    distribution: {
      portuguese: portQuestions.length,
      math: mathQuestions.length,
      specific: specificQuestions.length,
    },
    deficits: {
      portuguese: Math.max(0, PORT_TOTAL - portQuestions.length),
      math: Math.max(0, MATH_TOTAL - mathQuestions.length),
      specific: Math.max(0, SPECIFIC_TOTAL - specificQuestions.length),
    },
  };
}

export async function GET() {
  try {
    const { questions, distribution, deficits } = await loadExamQuestions();
    if (questions.length !== EXAM_TOTAL) {
      return NextResponse.json(
        {
          error: "Estoque insuficiente para montar a prova completa de 60 questões.",
          required: { portuguese: PORT_TOTAL, math: MATH_TOTAL, specific: SPECIFIC_TOTAL, total: EXAM_TOTAL },
          available: distribution,
          deficits,
          reason: "Não foi possível suprir todas as questões faltantes via IA no momento. Tente novamente em instantes.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ total: questions.length, questions, distribution });
  } catch (error) {
    console.error("Erro ao carregar simulado:", error);
    return NextResponse.json({ error: "Erro ao gerar ou carregar questões para o simulado." }, { status: 500 });
  }
}


export async function loadExamQuestions() {
  const [portSubject, mathSubject, specificSubjects] = await Promise.all([
    prisma.subject.findFirst({ where: { name: "Língua Portuguesa" } }),
    prisma.subject.findFirst({ where: { name: "Matemática" } }),
    prisma.subject.findMany({ where: { category: "ESPECIFICO" }, select: { id: true } }),
  ]);
  const specificIds = specificSubjects.map((s) => s.id);

  let [portPool, mathPool, specificPool] = await Promise.all([
    portSubject ? prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    mathSubject ? prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, include: { topic: { include: { subject: true } } } }),
  ]);

  // Se houver déficit em qualquer categoria, aciona suprimento resiliente antes de falhar
  const portDeficit = PORT_TOTAL - portPool.length;
  const mathDeficit = MATH_TOTAL - mathPool.length;
  const specificDeficit = SPECIFIC_TOTAL - specificPool.length;

  if (portDeficit > 0 || mathDeficit > 0 || specificDeficit > 0) {
    const allExisting = [...portPool, ...mathPool, ...specificPool];
    const existingStatements = new Set(allExisting.map((q) => normalizeText(q.statement)));

    if (portDeficit > 0 && portSubject) {
      const portTopics = await prisma.topic.findMany({ where: { subjectId: portSubject.id }, include: { subject: true } });
      await refillStock(portTopics, portDeficit, existingStatements);
      portPool = await prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, include: { topic: { include: { subject: true } } } });
    }

    if (mathDeficit > 0 && mathSubject) {
      const mathTopics = await prisma.topic.findMany({ where: { subjectId: mathSubject.id }, include: { subject: true } });
      await refillStock(mathTopics, mathDeficit, existingStatements);
      mathPool = await prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, include: { topic: { include: { subject: true } } } });
    }

    if (specificDeficit > 0 && specificIds.length) {
      const specTopics = await prisma.topic.findMany({ where: { subjectId: { in: specificIds } }, include: { subject: true } });
      await refillStock(specTopics, specificDeficit, existingStatements);
      specificPool = await prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, include: { topic: { include: { subject: true } } } });
    }
  }

  const portQuestions = shuffle(portPool).slice(0, PORT_TOTAL);
  const mathQuestions = shuffle(mathPool).slice(0, MATH_TOTAL);
  const specificQuestions = shuffle(specificPool).slice(0, SPECIFIC_TOTAL);
  return {
    questions: [...portQuestions, ...mathQuestions, ...specificQuestions],
    distribution: {
      portuguese: portQuestions.length,
      math: mathQuestions.length,
      specific: specificQuestions.length,
    },
    deficits: {
      portuguese: Math.max(0, PORT_TOTAL - portQuestions.length),
      math: Math.max(0, MATH_TOTAL - mathQuestions.length),
      specific: Math.max(0, SPECIFIC_TOTAL - specificQuestions.length),
    },
  };
}

export async function GET() {
  try {
    const { questions, distribution, deficits } = await loadExamQuestions();
    if (questions.length !== EXAM_TOTAL) {
      return NextResponse.json(
        {
          error: "Estoque insuficiente para montar a prova completa de 60 questões.",
          required: { portuguese: PORT_TOTAL, math: MATH_TOTAL, specific: SPECIFIC_TOTAL, total: EXAM_TOTAL },
          available: distribution,
          deficits,
          reason: "Não foi possível suprir todas as questões faltantes via IA no momento. Tente novamente em instantes.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ total: questions.length, questions, distribution });
  } catch (error) {
    console.error("Erro ao carregar simulado:", error);
    return NextResponse.json({ error: "Erro ao gerar ou carregar questões para o simulado." }, { status: 500 });
  }
}


