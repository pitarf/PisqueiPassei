import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";

const OPTIONS = new Set(["A", "B", "C", "D", "E"]);
const DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function validQuestion(q: any) {
  const fields = ["optionA", "optionB", "optionC", "optionD", "optionE", "explanation"];
  return q &&
    typeof q.statement === "string" && q.statement.trim().length >= 20 &&
    fields.every((k) => typeof q[k] === "string" && q[k].trim().length > 0) &&
    OPTIONS.has(q.correctOption) &&
    DIFFICULTIES.has(q.difficulty);
}

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
    const requestedDifficulty = String(difficulty).toUpperCase();
    const safeDifficulty = DIFFICULTIES.has(requestedDifficulty) ? requestedDifficulty : "MEDIA";
    const safeCount = Math.min(Math.max(Number(count) || 10, 1), 60);

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    let targetTopicIds: string[] = [];
    if (mode === "erros") {
      const weak = await prisma.userTopicProgress.findMany({
        where: { userId: user.id, masteryScore: { lt: 70 } },
        orderBy: { masteryScore: "asc" },
        take: 5,
        select: { topicId: true },
      });
      targetTopicIds = weak.map((p) => p.topicId);
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
    const allExisting = await prisma.question.findMany({
      where,
      include: { topic: { include: { subject: true } } },
    });

    const compatibleExisting = allExisting.filter((q) => q.difficulty === safeDifficulty);
    const fallbackExisting = safeDifficulty === "MEDIA" ? allExisting : [];
    const pool = compatibleExisting.length >= safeCount ? compatibleExisting : fallbackExisting;
    if (pool.length >= safeCount) {
      return NextResponse.json({ questions: shuffle(pool).slice(0, safeCount), generated: 0 });
    }

    const selected = shuffle(pool);
    const existingStatements = new Set(allExisting.map((q) => normalize(q.statement)));
    const topics = targetTopicIds.length
      ? await prisma.topic.findMany({ where: { id: { in: targetTopicIds } }, include: { subject: true }, orderBy: { order: "asc" } })
      : await prisma.topic.findMany({ include: { subject: true }, orderBy: { order: "asc" }, take: 1 });
    if (!topics.length) return NextResponse.json({ questions: selected });

    let remaining = safeCount - selected.length;
    const created: any[] = [];

    for (const topic of shuffle(topics)) {
      if (remaining <= 0) break;
      const requestCount = Math.min(remaining + 2, 10);
      const generated = await generateQuestionBatch(topic.title, topic.subject.name, requestCount, safeDifficulty, topic.officialSource);
      const batchSeen = new Set<string>();
      const valid = (generated.questions || []).filter(validQuestion).filter((q: any) => {
        const key = normalize(q.statement);
        if (existingStatements.has(key) || batchSeen.has(key)) return false;
        batchSeen.add(key);
        return true;
      });

      for (const q of valid) {
        if (remaining <= 0) break;
        const item = await prisma.question.create({
          data: {
            topicId: topic.id,
            statement: q.statement.trim(),
            optionA: q.optionA.trim(),
            optionB: q.optionB.trim(),
            optionC: q.optionC.trim(),
            optionD: q.optionD.trim(),
            optionE: q.optionE.trim(),
            correctOption: q.correctOption,
            explanation: q.explanation.trim(),
            difficulty: q.difficulty,
            origin: "AI_GENERATED",
            banca: "IA (perfil Cesgranrio)",
            sourceRef: "Questão inédita gerada por IA com RAG local",
          },
          include: { topic: { include: { subject: true } } },
        });
        created.push(item);
        existingStatements.add(normalize(item.statement));
        remaining--;
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
