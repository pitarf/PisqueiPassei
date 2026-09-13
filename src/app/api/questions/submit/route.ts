import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_EMAIL = "rafael@estudos.transpetro";
const MAX_TIME_SECONDS = 86400;

export async function POST(req: NextRequest) {
  try {
    const { questionId, chosenOption, timeSpentSeconds = 0 } = await req.json();
    const validOption = typeof chosenOption === "string" && /^[A-E]$/.test(chosenOption);
    const time = Number(timeSpentSeconds);

    if (typeof questionId !== "string" || !questionId.trim() || !validOption) {
      return NextResponse.json({ error: "Questão e alternativa A-E são obrigatórias." }, { status: 400 });
    }
    if (!Number.isFinite(time) || time < 0 || time > MAX_TIME_SECONDS) {
      return NextResponse.json({ error: "Tempo de resposta inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { topic: true } });
    if (!question) return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });

    const roundedTime = Math.round(time);
    const isCorrect = question.correctOption === chosenOption;
    const studyMinutes = roundedTime > 0 ? Math.max(1, Math.round(roundedTime / 60)) : 0;

    const result = await prisma.$transaction(async (tx) => {
      const recentAttempt = await tx.questionAttempt.findFirst({
        where: { userId: user.id, questionId },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      // O front-end já bloqueia duplo clique, mas a API também evita que uma repetição
      // imediata de uma mesma resposta gere XP e progresso em dobro.
      if (recentAttempt && Date.now() - recentAttempt.createdAt.getTime() < 10000 && recentAttempt.chosenOption === chosenOption) {
        return { duplicate: true, isCorrect: recentAttempt.isCorrect };
      }

      await tx.questionAttempt.create({
        data: { userId: user.id, questionId, chosenOption, isCorrect, timeSpentSeconds: roundedTime },
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

      return { duplicate: false, isCorrect };
    });

    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      isCorrect: result.isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Erro ao registrar resposta de questão:", error);
    return NextResponse.json({ error: "Erro interno ao processar resposta." }, { status: 500 });
  }
}
