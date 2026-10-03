import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStudyStreak } from "@/lib/streak";
import { calculateAdaptiveMasteryScore, getDifficultyWeight, evaluateQuestionHistory } from "@/lib/adaptive-engine";

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
        const uqp = await prisma.userQuestionProgress.findUnique({
          where: { userId_questionId: { userId: user.id, questionId } },
        });
        return NextResponse.json({
          success: true,
          duplicate: true,
          isCorrect: existing.isCorrect,
          correctOption: question.correctOption,
          explanation: question.explanation,
          questionStatus: uqp?.status || "EM_CONSOLIDACAO",
          nextReviewAt: uqp?.nextReviewAt || null,
        });
      }
    }

    const roundedTime = Math.round(time);
    const isCorrect = question.correctOption === normalizedOption;
    const studyMinutes = roundedTime > 0 ? Math.max(1, Math.round(roundedTime / 60)) : 0;

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (!key) {
          const recentAttempt = await tx.questionAttempt.findFirst({ where: { userId: user.id, questionId }, orderBy: { createdAt: "desc" }, take: 1 });
          if (recentAttempt && Date.now() - recentAttempt.createdAt.getTime() < 10000 && recentAttempt.chosenOption === normalizedOption) {
            const uqp = await tx.userQuestionProgress.findUnique({
              where: { userId_questionId: { userId: user.id, questionId } },
            });
            return {
              duplicate: true,
              isCorrect: recentAttempt.isCorrect,
              questionStatus: uqp?.status || "EM_CONSOLIDACAO",
              nextReviewAt: uqp?.nextReviewAt || null,
            };
          }
        }
        await tx.questionAttempt.create({ data: { userId: user.id, questionId, chosenOption: normalizedOption, isCorrect, timeSpentSeconds: roundedTime, ...(key ? { idempotencyKey: key } : {}) } });

        // Sincronização atômica do SRS por questão (UserQuestionProgress)
        const allQAttempts = await tx.questionAttempt.findMany({
          where: { userId: user.id, questionId },
          orderBy: { createdAt: "asc" },
        });

        const qHistory = evaluateQuestionHistory(
          questionId,
          allQAttempts.map((a) => ({
            id: a.id,
            questionId: a.questionId,
            topicId: question.topicId,
            isCorrect: a.isCorrect,
            chosenOption: a.chosenOption,
            timeSpentSeconds: a.timeSpentSeconds,
            createdAt: a.createdAt,
            difficulty: (question.difficulty as any) || "MEDIA",
            questionType: question.questionType,
            cognitiveLevel: question.cognitiveLevel,
          })),
          new Date()
        );

        await tx.userQuestionProgress.upsert({
          where: { userId_questionId: { userId: user.id, questionId } },
          update: {
            attemptsCount: qHistory.totalAttempts,
            correctCount: qHistory.totalCorrect,
            errorCount: qHistory.totalErrors,
            consecutiveCorrect: qHistory.consecutiveCorrect,
            consecutiveErrors: qHistory.consecutiveErrors,
            intervalDays: qHistory.currentIntervalDays,
            nextReviewAt: qHistory.nextReviewDate,
            status: qHistory.status,
            lastIsCorrect: qHistory.lastCorrect,
            lastAttemptAt: qHistory.lastAttemptAt,
          },
          create: {
            userId: user.id,
            questionId,
            attemptsCount: qHistory.totalAttempts,
            correctCount: qHistory.totalCorrect,
            errorCount: qHistory.totalErrors,
            consecutiveCorrect: qHistory.consecutiveCorrect,
            consecutiveErrors: qHistory.consecutiveErrors,
            intervalDays: qHistory.currentIntervalDays,
            nextReviewAt: qHistory.nextReviewDate,
            status: qHistory.status,
            lastIsCorrect: qHistory.lastCorrect,
            lastAttemptAt: qHistory.lastAttemptAt,
          },
        });

        // Atualização atômica concorrente de UserTopicProgress via atomic increment
        const progressRecord = await tx.userTopicProgress.upsert({
          where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
          update: {
            totalQuestions: { increment: 1 },
            correctAnswers: { increment: isCorrect ? 1 : 0 },
            ...(studyMinutes > 0 ? { totalTimeMinutes: { increment: studyMinutes } } : {}),
          },
          create: {
            userId: user.id,
            topicId: question.topicId,
            totalQuestions: 1,
            correctAnswers: isCorrect ? 1 : 0,
            totalTimeMinutes: studyMinutes,
          },
        });

        const total = progressRecord.totalQuestions;
        const correct = progressRecord.correctAnswers;
        const mastery = calculateAdaptiveMasteryScore(correct, total, getDifficultyWeight(question.difficulty));

        // Repetição espaçada adaptativa (cadência de referência 1, 3, 7, 14 e 30 dias)
        let nextIntervalDays = 1;
        if (!isCorrect) {
          nextIntervalDays = 1;
        } else {
          const currentInterval = progressRecord.reviewIntervalDays || 1;
          if (currentInterval <= 1) nextIntervalDays = 3;
          else if (currentInterval <= 3) nextIntervalDays = 7;
          else if (currentInterval <= 7) nextIntervalDays = 14;
          else nextIntervalDays = 30;
        }
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

        await tx.userTopicProgress.update({
          where: { id: progressRecord.id },
          data: {
            masteryScore: mastery,
            status: mastery >= 85 ? "DOMINADO" : "EM_ESTUDO",
            lastStudiedAt: new Date(),
            nextReviewDate,
            reviewIntervalDays: nextIntervalDays,
          },
        });
        await updateStudyStreak(tx, user.id, new Date());
        await tx.user.update({ where: { id: user.id }, data: { xp: { increment: isCorrect ? 10 : 2 }, lastStudyDate: new Date() } });
        return { duplicate: false, isCorrect, questionStatus: qHistory.status, nextReviewAt: qHistory.nextReviewDate };
      });
      return NextResponse.json({
        success: true,
        duplicate: result.duplicate,
        isCorrect: result.isCorrect,
        correctOption: question.correctOption,
        explanation: question.explanation,
        questionStatus: result.questionStatus,
        nextReviewAt: result.nextReviewAt,
      });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (key && code === "P2002") {
        const existing = await prisma.questionAttempt.findUnique({ where: { idempotencyKey: key } });
        if (existing && existing.userId === user.id && existing.questionId === questionId) {
          const uqp = await prisma.userQuestionProgress.findUnique({
            where: { userId_questionId: { userId: user.id, questionId } },
          });
          return NextResponse.json({
            success: true,
            duplicate: true,
            isCorrect: existing.isCorrect,
            correctOption: question.correctOption,
            explanation: question.explanation,
            questionStatus: uqp?.status || "EM_CONSOLIDACAO",
            nextReviewAt: uqp?.nextReviewAt || null,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao registrar resposta de questão:", error);
    return NextResponse.json({ error: "Erro interno ao processar resposta." }, { status: 500 });
  }
}
