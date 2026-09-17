import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";
import { validateAiQuestion, normalizeText, VALID_DIFFICULTIES } from "@/lib/question-validator";

const MODES = new Set(["normal", "erros"]);
const MAX_GENERATION_RETRIES = 3;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { subjectId, topicId, mode = "normal", count = 10, difficulty = "MEDIA" } = await req.json();
    if (typeof mode !== "string" || !MODES.has(mode)) {
      return NextResponse.json({ error: "Modo de questões inválido." }, { status: 400 });
    }

    const requestedDifficulty = String(difficulty).toUpperCase();
    const safeDifficulty = VALID_DIFFICULTIES.has(requestedDifficulty) ? requestedDifficulty : "MEDIA";
    const parsedCount = Number(count);
    const safeCount = Number.isFinite(parsedCount) ? Math.min(Math.max(Math.floor(parsedCount), 1), 60) : 10;

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    let targetTopicIds: string[] = [];
    let errorQuestionIds: string[] = [];

    if (mode === "erros") {
      const wrongAttempts = await prisma.questionAttempt.findMany({
        where: { userId: user.id, isCorrect: false },
        orderBy: { createdAt: "desc" },
        select: { questionId: true, question: { select: { topicId: true } } },
        take: 100,
      });
      errorQuestionIds = [...new Set(wrongAttempts.map((attempt) => attempt.questionId))];
      targetTopicIds = [...new Set(wrongAttempts.map((attempt) => attempt.question.topicId))].slice(0, 5);

      if (!targetTopicIds.length) {
        const weak = await prisma.userTopicProgress.findMany({
          where: { userId: user.id, masteryScore: { lt: 70 } },
          orderBy: { masteryScore: "asc" },
          take: 5,
          select: { topicId: true },
        });
        targetTopicIds = weak.map((p) => p.topicId);
      }
      if (!targetTopicIds.length) {
        const fallback = await prisma.topic.findMany({ take: 5, orderBy: { order: "asc" }, select: { id: true } });
        targetTopicIds = fallback.map((t) => t.id);
      }
    } else if (topicId) {
      targetTopicIds = [topicId];
    } else if (subjectId) {
      const topics = await prisma.topic.findMany({ where: { subjectId }, select: { id: true } });
      targetTopicIds = topics.map((t) => t.id);
    }

    const where = targetTopicIds.length ? { topicId: { in: targetTopicIds } } : {};
    const allExisting = await prisma.question.findMany({ where, include: { topic: { include: { subject: true } } } });
    const compatibleExisting = allExisting.filter((q) => q.difficulty === safeDifficulty);
    const errorPool = mode === "erros" ? compatibleExisting.filter((q) => errorQuestionIds.includes(q.id)) : [];
    const pool = mode === "erros" ? errorPool : compatibleExisting;

    if (pool.length >= safeCount) {
      return NextResponse.json({ questions: shuffle(pool).slice(0, safeCount), generated: 0, requestedDifficulty: safeDifficulty });
    }

    const selected = shuffle(pool);
    const existingStatements = new Set(allExisting.map((q) => normalizeText(q.statement)));
    const topics = targetTopicIds.length
      ? await prisma.topic.findMany({ where: { id: { in: targetTopicIds } }, include: { subject: true }, orderBy: { order: "asc" } })
      : await prisma.topic.findMany({ include: { subject: true }, orderBy: { order: "asc" }, take: 1 });

    if (!topics.length) return NextResponse.json({ questions: selected, generated: 0, requestedDifficulty: safeDifficulty });

    let remaining = safeCount - selected.length;
    const created: any[] = [];
    let retryAttempt = 0;

    while (remaining > 0 && retryAttempt < MAX_GENERATION_RETRIES) {
      retryAttempt++;
      const shuffledTopics = shuffle(topics);

      for (const topic of shuffledTopics) {
        if (remaining <= 0) break;
        const requestCount = Math.min(remaining + 2, 10);
        try {
          const generated = await generateQuestionBatch(topic.title, topic.subject.name, requestCount, safeDifficulty, topic.officialSource);
          const rawList = Array.isArray(generated?.questions) ? generated.questions : [];

          for (const rawQ of rawList) {
            if (remaining <= 0) break;
            const validation = validateAiQuestion(rawQ, safeDifficulty);
            if (!validation.valid) continue;

            const q = validation.question;
            const key = normalizeText(q.statement);
            if (existingStatements.has(key)) continue;

            const item = await prisma.question.create({
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
                subtopic: q.subtopic || null,
                verificationStatus: "PENDENTE",
              },
              include: { topic: { include: { subject: true } } },
            });

            created.push(item);
            existingStatements.add(key);
            remaining--;
          }
        } catch (err) {
          console.warn(`[Retry ${retryAttempt}] Falha temporária ao gerar questões para "${topic.title}":`, (err as Error).message);
        }
      }
    }

    return NextResponse.json({
      questions: shuffle([...selected, ...created]).slice(0, safeCount),
      generated: created.length,
      requestedDifficulty: safeDifficulty,
    });
  } catch (error) {
    console.error("Erro ao gerar/carregar bateria de questões:", error);
    return NextResponse.json({ error: "Não foi possível carregar as questões. Tente novamente." }, { status: 500 });
  }
}
