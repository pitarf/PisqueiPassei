import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextSRS } from "@/lib/srs";

/**
 * Endpoint para registrar feedback cognitivo da aula:
 * "ENTENDI", "REVISAR", "NAO_ENTENDI"
 * Atualiza o intervalo de repetição espaçada e a pontuação de domínio.
 */
export async function POST(req: NextRequest) {
  try {
    const { topicId, feedback } = await req.json();

    if (!topicId || !feedback) {
      return NextResponse.json(
        { error: "Parâmetros 'topicId' e 'feedback' são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Buscar progresso atual
    const currentProgress = await prisma.userTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId,
        },
      },
    });

    const currentInterval = currentProgress?.reviewIntervalDays || 1;
    const currentScore = currentProgress?.masteryScore || 0;

    const srsResult = calculateNextSRS({
      currentIntervalDays: currentInterval,
      currentMasteryScore: currentScore,
      feedback: feedback as "NAO_ENTENDI" | "REVISAR" | "ENTENDI",
    });

    // Atualizar no banco via transação segura (Diretriz Mestre)
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Atualizar progresso do tópico
      const progress = await tx.userTopicProgress.upsert({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId,
          },
        },
        update: {
          status: srsResult.newStatus,
          masteryScore: srsResult.newMasteryScore,
          reviewIntervalDays: srsResult.nextIntervalDays,
          nextReviewDate: srsResult.nextReviewDate,
          lastStudiedAt: new Date(),
        },
        create: {
          userId: user.id,
          topicId,
          status: srsResult.newStatus,
          masteryScore: srsResult.newMasteryScore,
          reviewIntervalDays: srsResult.nextIntervalDays,
          nextReviewDate: srsResult.nextReviewDate,
          lastStudiedAt: new Date(),
        },
      });

      // 2. Registrar sessão de estudo e conceder XP
      await tx.studySession.create({
        data: {
          userId: user.id,
          topicId,
          durationMinutes: 15,
          sessionType: "AULA",
          xpEarned: feedback === "ENTENDI" ? 50 : 25,
        },
      });

      // 3. Incrementar XP do usuário
      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: feedback === "ENTENDI" ? 50 : 25 },
          lastStudyDate: new Date(),
        },
      });

      return progress;
    });

    return NextResponse.json({ success: true, progress: updated });
  } catch (error) {
    console.error("Erro ao registrar feedback cognitivo:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar progresso de estudo." },
      { status: 500 }
    );
  }
}
