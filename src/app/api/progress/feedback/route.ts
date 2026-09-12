import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextSRS } from "@/lib/srs";

const VALID_FEEDBACK = new Set(["ENTENDI", "REVISAR", "NAO_ENTENDI"]);

export async function POST(req: NextRequest) {
  try {
    const { topicId, feedback } = await req.json();
    if (typeof topicId !== "string" || !topicId.trim() || typeof feedback !== "string" || !VALID_FEEDBACK.has(feedback)) {
      return NextResponse.json({ error: "Tópico ou feedback inválido." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!topic) return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });

    const currentProgress = await prisma.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId } } });
    const srsResult = calculateNextSRS({
      currentIntervalDays: Math.max(1, currentProgress?.reviewIntervalDays || 1),
      currentMasteryScore: Math.max(0, Math.min(100, currentProgress?.masteryScore || 0)),
      feedback: feedback as "NAO_ENTENDI" | "REVISAR" | "ENTENDI",
    });

    const xpEarned = feedback === "ENTENDI" ? 50 : 25;
    const updated = await prisma.$transaction(async (tx) => {
      const progress = await tx.userTopicProgress.upsert({
        where: { userId_topicId: { userId: user.id, topicId } },
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
      await tx.studySession.create({ data: { userId: user.id, topicId, durationMinutes: 15, sessionType: "AULA", xpEarned } });
      await tx.user.update({ where: { id: user.id }, data: { xp: { increment: xpEarned }, lastStudyDate: new Date() } });
      return progress;
    });

    return NextResponse.json({ success: true, progress: updated });
  } catch (error) {
    console.error("Erro ao registrar feedback cognitivo:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar progresso de estudo." }, { status: 500 });
  }
}
