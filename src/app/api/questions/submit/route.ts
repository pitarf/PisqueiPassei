import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { questionId, chosenOption, timeSpentSeconds = 0 } = await req.json();
    const validOption = typeof chosenOption === "string" && /^[A-E]$/.test(chosenOption);
    const time = Number(timeSpentSeconds);
    if (typeof questionId !== "string" || !questionId || !validOption) {
      return NextResponse.json({ error: "Questão e alternativa A-E são obrigatórias." }, { status: 400 });
    }
    if (!Number.isFinite(time) || time < 0 || time > 86400) {
      return NextResponse.json({ error: "Tempo de resposta inválido." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { topic: true } });
    if (!question) return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });

    const isCorrect = question.correctOption === chosenOption;
    const studyMinutes = Math.round(time / 60);

    await prisma.$transaction(async (tx) => {
      await tx.questionAttempt.create({
        data: {
          userId: user.id,
          questionId,
          chosenOption,
          isCorrect,
          timeSpentSeconds: Math.round(time),
        },
      });

      const progress = await tx.userTopicProgress.findUnique({
        where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
      });
      const total = (progress?.totalQuestions || 0) + 1;
      const correct = (progress?.correctAnswers || 0) + (isCorrect ? 1 : 0);
      const mastery = Math.round((correct / total) * 100);

      await tx.userTopicProgress.upsert({
        where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
        update: {
          totalQuestions: total,
          correctAnswers: correct,
          masteryScore: mastery,
          status: mastery >= 85 ? "DOMINADO" : "EM_ESTUDO",
          lastStudiedAt: new Date(),
          ...(studyMinutes > 0 ? { totalTimeMinutes: { increment: studyMinutes } } : {}),
        },
        create: {
          userId: user.id,
          topicId: question.topicId,
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          masteryScore: isCorrect ? 100 : 0,
          status: "EM_ESTUDO",
          lastStudiedAt: new Date(),
          totalTimeMinutes: studyMinutes,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { xp: { increment: isCorrect ? 10 : 2 }, lastStudyDate: new Date() },
      });
    });

    return NextResponse.json({ success: true, isCorrect, correctOption: question.correctOption, explanation: question.explanation });
  } catch (error) {
    console.error("Erro ao registrar resposta de questão:", error);
    return NextResponse.json({ error: "Erro interno ao processar resposta." }, { status: 500 });
  }
}
