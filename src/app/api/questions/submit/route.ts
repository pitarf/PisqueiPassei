import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para registrar uma resposta de questão individual
 */
export async function POST(req: NextRequest) {
  try {
    const { questionId, chosenOption, timeSpentSeconds = 0 } = await req.json();

    if (!questionId || !chosenOption) {
      return NextResponse.json(
        { error: "Parâmetros 'questionId' e 'chosenOption' são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { topic: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });
    }

    const isCorrect = question.correctOption === chosenOption;

    // Transação para persistir tentativa e recalcular métricas (Diretriz Mestre)
    await prisma.$transaction(async (tx) => {
      // 1. Criar registro de tentativa
      await tx.questionAttempt.create({
        data: {
          userId: user.id,
          questionId,
          chosenOption,
          isCorrect,
          timeSpentSeconds,
        },
      });

      // 2. Atualizar contadores no progresso do tópico
      const progress = await tx.userTopicProgress.findUnique({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId: question.topicId,
          },
        },
      });

      const newTotal = (progress?.totalQuestions || 0) + 1;
      const newCorrect = (progress?.correctAnswers || 0) + (isCorrect ? 1 : 0);
      const newScore = Math.round((newCorrect / newTotal) * 100);

      await tx.userTopicProgress.upsert({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId: question.topicId,
          },
        },
        update: {
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          masteryScore: newScore,
          status: newScore >= 85 ? "DOMINADO" : "EM_ESTUDO",
          lastStudiedAt: new Date(),
        },
        create: {
          userId: user.id,
          topicId: question.topicId,
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          masteryScore: isCorrect ? 100 : 0,
          status: "EM_ESTUDO",
          lastStudiedAt: new Date(),
        },
      });

      // 3. Conceder XP (10 XP por acerto, 2 XP por tentativa)
      const earnedXp = isCorrect ? 10 : 2;
      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: earnedXp },
          lastStudyDate: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Erro ao registrar resposta de questão:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar resposta." },
      { status: 500 }
    );
  }
}
