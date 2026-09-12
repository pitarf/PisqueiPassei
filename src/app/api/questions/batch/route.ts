import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { subjectId, topicId, mode = "normal", count = 10, difficulty = "MEDIA" } = await req.json();
    const safeCount = Math.min(Math.max(Number(count) || 10, 1), 60);
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    let targetTopicIds: string[] = [];
    if (mode === "erros") {
      const weak = await prisma.userTopicProgress.findMany({
        where: { userId: user.id, masteryScore: { lt: 70 } }, orderBy: { masteryScore: "asc" }, take: 5, select: { topicId: true },
      });
      targetTopicIds = weak.map((p) => p.topicId);
      if (!targetTopicIds.length) {
        const fallback = await prisma.topic.findMany({ take: 5, orderBy: { order: "asc" }, select: { id: true } });
        targetTopicIds = fallback.map((t) => t.id);
      }
    } else if (topicId) targetTopicIds = [topicId];
    else if (subjectId) {
      const topics = await prisma.topic.findMany({ where: { subjectId }, select: { id: true } });
      targetTopicIds = topics.map((t) => t.id);
    }

    const existingQuestions = await prisma.question.findMany({
      where: targetTopicIds.length ? { topicId: { in: targetTopicIds } } : {},
      include: { topic: { include: { subject: true } } }, take: safeCount, orderBy: { createdAt: "desc" },
    });
    if (existingQuestions.length >= safeCount) return NextResponse.json({ questions: existingQuestions.slice(0, safeCount) });

    const generatorTopic = targetTopicIds.length
      ? await prisma.topic.findFirst({ where: { id: targetTopicIds[0] }, include: { subject: true } })
      : await prisma.topic.findFirst({ include: { subject: true }, orderBy: { order: "asc" } });
    if (!generatorTopic) return NextResponse.json({ questions: existingQuestions });

    const generated = await generateQuestionBatch(
      generatorTopic.title, generatorTopic.subject.name,
      Math.min(safeCount - existingQuestions.length, 10), difficulty, generatorTopic.officialSource
    );
    const newlyCreated = [];
    for (const q of generated.questions || []) {
      const created = await prisma.question.create({
        data: {
          topicId: generatorTopic.id, statement: q.statement, optionA: q.optionA, optionB: q.optionB,
          optionC: q.optionC, optionD: q.optionD, optionE: q.optionE, correctOption: q.correctOption,
          explanation: q.explanation, difficulty: q.difficulty || "MEDIA", origin: "AI_GENERATED",
          banca: "IA (perfil Cesgranrio)", sourceRef: "Questão inédita gerada por IA com RAG local",
        },
        include: { topic: { include: { subject: true } } },
      });
      newlyCreated.push(created);
    }
    return NextResponse.json({ questions: [...existingQuestions, ...newlyCreated].slice(0, safeCount) });
  } catch (error) {
    console.error("Erro ao gerar/carregar bateria de questões:", error);
    return NextResponse.json({ error: "Não foi possível carregar as questões. Tente novamente." }, { status: 500 });
  }
}
