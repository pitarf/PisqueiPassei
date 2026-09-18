import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStudyStreak } from "@/lib/streak";

const USER_EMAIL = "rafael@estudos.transpetro";
const MAX_TIME_SECONDS = 86400;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export async function POST(req: NextRequest) {
  try {
    const { questionId, chosenOption, timeSpentSeconds = 0, idempotencyKey } = await req.json();
    const validOption = typeof chosenOption === "string" && /^[A-Ea-e]$/.test(chosenOption.trim());
    const time = Number(timeSpentSeconds);
    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    const normalizedOption = validOption ? chosenOption.trim().toUpperCase() : "";
    if (typeof questionId !== "string" || !questionId.trim() || !validOption) return NextResponse.json({ error: "Questão e alternativa A-E são obrigatórias." }, { status: 400 });
    if (!Number.isFinite(time) || time < 0 || time > MAX_TIME_SECONDS) return NextResponse.json({ error: "Tempo de resposta inválido." }, { status: 400 });
    if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) return NextResponse.json({ error: "Chave de idempotência inválida." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { topic: true } });
    if (!question) return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });

    if (key) {
      const existing = await prisma.questionAttempt.findUnique({ where: { idempotencyKey: key } });
      if (existing) {
        if (existing.userId !== user.id || existing.questionId !== questionId) return NextResponse.json({ error: "Chave de idempotência já utilizada em outra resposta." }, { status: 409 });
        return NextResponse.json({ success: true, duplicate: true, isCorrect: existing.isCorrect, correctOption: question.correctOption, explanation: question.explanation });
      }
    }

    const roundedTime = Math.round(time);
    const isCorrect = question.correctOption === normalizedOption;
    const studyMinutes = roundedTime > 0 ? Math.max(1, Math.round(roundedTime / 60)) : 0;

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (!key) {
          const recentAttempt = await tx.questionAttempt.findFirst({ where: { userId: user.id, questionId }, orderBy: { createdAt: "desc" }, take: 1 });
          if (recentAttempt && Date.now() - recentAttempt.createdAt.getTime() < 10000 && recentAttempt.chosenOption === normalizedOption) return { duplicate: true, isCorrect: recentAttempt.isCorrect };
        }
        await tx.questionAttempt.create({ data: { userId: user.id, questionId, chosenOption: normalizedOption, isCorrect, timeSpentSeconds: roundedTime, ...(key ? { idempotencyKey: key } : {}) } });
        const progress = await tx.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId: question.topicId } } });
        const total = (progress?.totalQuestions || 0) + 1;
        const correct = (progress?.correctAnswers || 0) + (isCorrect ? 1 : 0);
        const mastery = Math.round((correct / total) * 100);
        await tx.userTopicProgress.upsert({
          where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
          update: { totalQuestions: total, correctAnswers: correct, masteryScore: mastery, status: mastery >= 85 ? "DOMINADO" : "EM_ESTUDO", lastStudiedAt: new Date(), ...(studyMinutes > 0 ? { totalTimeMinutes: { increment: studyMinutes } } : {}) },
          create: { userId: user.id, topicId: question.topicId, totalQuestions: 1, correctAnswers: isCorrect ? 1 : 0, masteryScore: isCorrect ? 100 : 0, status: "EM_ESTUDO", lastStudiedAt: new Date(), totalTimeMinutes: studyMinutes },
        });
        await updateStudyStreak(tx, user.id, new Date());
        await tx.user.update({ where: { id: user.id }, data: { xp: { increment: isCorrect ? 10 : 2 }, lastStudyDate: new Date() } });
        return { duplicate: false, isCorrect };
      });
      return NextResponse.json({ success: true, duplicate: result.duplicate, isCorrect: result.isCorrect, correctOption: question.correctOption, explanation: question.explanation });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (key && code === "P2002") {
        const existing = await prisma.questionAttempt.findUnique({ where: { idempotencyKey: key } });
        if (existing && existing.userId === user.id && existing.questionId === questionId) return NextResponse.json({ success: true, duplicate: true, isCorrect: existing.isCorrect, correctOption: question.correctOption, explanation: question.explanation });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao registrar resposta de questão:", error);
    return NextResponse.json({ error: "Erro interno ao processar resposta." }, { status: 500 });
  }
}
