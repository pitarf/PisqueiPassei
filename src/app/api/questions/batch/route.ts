import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";

const OPTIONS = new Set(["A", "B", "C", "D", "E"]);
function validQuestion(q: any) {
  return q && typeof q.statement === "string" && q.statement.trim().length >= 20 &&
    ["optionA", "optionB", "optionC", "optionD", "optionE", "explanation"].every((k) => typeof q[k] === "string" && q[k].trim().length > 0) &&
    OPTIONS.has(q.correctOption);
}
function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }

export async function POST(req: NextRequest) {
  try {
    const { subjectId, topicId, mode = "normal", count = 10, difficulty = "MEDIA" } = await req.json();
    const safeCount = Math.min(Math.max(Number(count) || 10, 1), 60);
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    let targetTopicIds: string[] = [];
    if (mode === "erros") {
      const weak = await prisma.userTopicProgress.findMany({ where: { userId: user.id, masteryScore: { lt: 70 } }, orderBy: { masteryScore: "asc" }, take: 5, select: { topicId: true } });
      targetTopicIds = weak.map((p) => p.topicId);
      if (!targetTopicIds.length) {
        const fallback = await prisma.topic.findMany({ take: 5, orderBy: { order: "asc" }, select: { id: true } });
        targetTopicIds = fallback.map((t) => t.id);
      }
    } else if (topicId) targetTopicIds = [topicId];
    else if (subjectId) {
      const topics = await prisma.topic.findMany({ where: { subjectId }, orderBy: { order: "asc" }, select: { id: true } });
      targetTopicIds = topics.map((t) => t.id);
    }

    const where = targetTopicIds.length ? { topicId: { in: targetTopicIds } } : {};
    const existingQuestions = await prisma.question.findMany({ where, include: { topic: { include: { subject: true } } }, orderBy: { createdAt: "desc" }, take: safeCount });
    if (existingQuestions.length >= safeCount) return NextResponse.json({ questions: shuffle(existingQuestions).slice(0, safeCount) });

    const topics = targetTopicIds.length
      ? await prisma.topic.findMany({ where: { id: { in: targetTopicIds } }, include: { subject: true }, orderBy: { order: "asc" } })
      : await prisma.topic.findMany({ include: { subject: true }, orderBy: { order: "asc" }, take: 1 });
    if (!topics.length) return NextResponse.json({ questions: existingQuestions });

    const created: any[] = [];
    let remaining = safeCount - existingQuestions.length;
    for (let i = 0; i < topics.length && remaining > 0; i++) {
      const topic = topics[i];
      const generated = await generateQuestionBatch(topic.title, topic.subject.name, Math.min(remaining, 10), difficulty, topic.officialSource);
      const valid = (generated.questions || []).filter(validQuestion);
      for (const q of valid.slice(0, remaining)) {
        const item = await prisma.question.create({
          data: {
            topicId: topic.id, statement: q.statement.trim(), optionA: q.optionA.trim(), optionB: q.optionB.trim(), optionC: q.optionC.trim(), optionD: q.optionD.trim(), optionE: q.optionE.trim(), correctOption: q.correctOption, explanation: q.explanation.trim(), difficulty: q.difficulty || difficulty || "MEDIA", origin: "AI_GENERATED", banca: "IA (perfil Cesgranrio)", sourceRef: "Questão inédita gerada por IA com RAG local",
          }, include: { topic: { include: { subject: true } } },
        });
        created.push(item);
        remaining--;
      }
    }
    return NextResponse.json({ questions: shuffle([...existingQuestions, ...created]).slice(0, safeCount), generated: created.length });
  } catch (error) {
    console.error("Erro ao gerar/carregar bateria de questões:", error);
    return NextResponse.json({ error: "Não foi possível carregar as questões. Tente novamente." }, { status: 500 });
  }
}
