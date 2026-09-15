import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextSRS } from "@/lib/srs";

const VALID_FEEDBACK = new Set(["ENTENDI", "REVISAR", "NAO_ENTENDI"]);
const MAX_STUDY_MINUTES = 180;
const DUPLICATE_WINDOW_MS = 10_000;

type FeedbackValue = "NAO_ENTENDI" | "REVISAR" | "ENTENDI";

export async function POST(req: NextRequest) {
  try {
    const { topicId, feedback, durationMinutes } = await req.json();
    if (
      typeof topicId !== "string" ||
      !topicId.trim() ||
      typeof feedback !== "string" ||
      !VALID_FEEDBACK.has(feedback)
    ) {
      return NextResponse.json({ error: "Tópico ou feedback inválido." }, { status: 400 });
    }

    const duration = durationMinutes === undefined ? 0 : Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 0 || duration > MAX_STUDY_MINUTES) {
      return NextResponse.json({ error: "Duração de estudo inválida." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!topic) return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });

    const studyMinutes = duration > 0 ? Math.max(1, Math.round(duration)) : 0;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Protege contra clique duplo/reenvio automático da mesma ação.
      if (studyMinutes > 0) {
        const recentSession = await tx.studySession.findFirst({
          where: {
            userId: user.id,
            topicId,
            sessionType: "AULA",
            durationMinutes: studyMinutes,
            createdAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
          },
          orderBy: { createdAt: "desc" },
        });

        if (recentSession) {
          const existingProgress = await tx.userTopicProgress.findUnique({
            where: { userId_topicId: { userId: user.id, topicId } },
          });
          return { progress: existingProgress, duplicate: true };
        }
      }

      const currentProgress = await tx.userTopicProgress.findUnique({
        where: { userId_topicId: { userId: user.id, topicId } },
      });
      const srsResult = calculateNextSRS({
        currentIntervalDays: Math.max(1, currentProgress?.reviewIntervalDays || 1),
        currentMasteryScore: Math.max(0, Math.min(100, currentProgress?.masteryScore || 0)),
        feedback: feedback as FeedbackValue,
      });
      const xpEarned = feedback === "ENTENDI" ? 50 : 25;

      const progress = await tx.userTopicProgress.upsert({
        where: { userId_topicId: { userId: user.id, topicId } },
        update: {
          status: srsResult.newStatus,
          masteryScore: srsResult.newMasteryScore,
          reviewIntervalDays: srsResult.nextIntervalDays,
          nextReviewDate: srsResult.nextReviewDate,
          lastStudiedAt: now,
          ...(studyMinutes > 0 ? { totalTimeMinutes: { increment: studyMinutes } } : {}),
        },
        create: {
          userId: user.id,
          topicId,
          status: srsResult.newStatus,
          masteryScore: srsResult.newMasteryScore,
          reviewIntervalDays: srsResult.nextIntervalDays,
          nextReviewDate: srsResult.nextReviewDate,
          lastStudiedAt: now,
          totalTimeMinutes: studyMinutes,
        },
      });

      if (studyMinutes > 0) {
        await tx.studySession.create({
          data: {
            userId: user.id,
            topicId,
            durationMinutes: studyMinutes,
            sessionType: "AULA",
            xpEarned,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpEarned }, lastStudyDate: now },
      });

      return { progress, duplicate: false };
    });

    return NextResponse.json({ success: true, duplicate: result.duplicate, progress: result.progress });
  } catch (error) {
    console.error("Erro ao registrar feedback cognitivo:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar progresso de estudo." }, { status: 500 });
  }
}
