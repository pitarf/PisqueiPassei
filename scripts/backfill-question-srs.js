const { PrismaClient } = require("@prisma/client");
const { evaluateQuestionHistory } = require("../src/lib/adaptive-engine");

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🔄 INICIANDO BACKFILL DE SRS POR QUESTÃO (UserQuestionProgress)");
  console.log("==================================================");

  // Busca todas as tentativas de questões agrupadas por usuário e questão
  const attempts = await prisma.questionAttempt.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      question: {
        select: {
          topicId: true,
          difficulty: true,
          questionType: true,
          cognitiveLevel: true,
        },
      },
    },
  });

  console.log(`Total de tentativas de questões registradas no histórico: ${attempts.length}`);

  // Agrupa por `${userId}:::${questionId}`
  const userQuestionMap = new Map();
  for (const att of attempts) {
    const key = `${att.userId}:::${att.questionId}`;
    if (!userQuestionMap.has(key)) {
      userQuestionMap.set(key, []);
    }
    userQuestionMap.get(key).push({
      id: att.id,
      questionId: att.questionId,
      topicId: att.question.topicId,
      isCorrect: att.isCorrect,
      chosenOption: att.chosenOption,
      timeSpentSeconds: att.timeSpentSeconds,
      createdAt: att.createdAt,
      difficulty: att.question.difficulty,
      questionType: att.question.questionType,
      cognitiveLevel: att.question.cognitiveLevel,
    });
  }

  console.log(`Pares únicos (usuário x questão) a processar: ${userQuestionMap.size}`);
  let processed = 0;
  const now = new Date();

  for (const [key, qAttempts] of userQuestionMap.entries()) {
    const [userId, questionId] = key.split(":::");
    const hist = evaluateQuestionHistory(questionId, qAttempts, now);

    await prisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        attemptsCount: hist.totalAttempts,
        correctCount: hist.totalCorrect,
        errorCount: hist.totalErrors,
        consecutiveCorrect: hist.consecutiveCorrect,
        consecutiveErrors: hist.consecutiveErrors,
        intervalDays: hist.currentIntervalDays,
        nextReviewAt: hist.nextReviewDate,
        status: hist.status,
        lastIsCorrect: hist.lastCorrect,
        lastAttemptAt: hist.lastAttemptAt,
      },
      create: {
        userId,
        questionId,
        attemptsCount: hist.totalAttempts,
        correctCount: hist.totalCorrect,
        errorCount: hist.totalErrors,
        consecutiveCorrect: hist.consecutiveCorrect,
        consecutiveErrors: hist.consecutiveErrors,
        intervalDays: hist.currentIntervalDays,
        nextReviewAt: hist.nextReviewDate,
        status: hist.status,
        lastIsCorrect: hist.lastCorrect,
        lastAttemptAt: hist.lastAttemptAt,
      },
    });

    processed++;
  }

  console.log(`✅ Backfill concluído com sucesso! Processados: ${processed} registros.`);
}

main()
  .catch((err) => {
    console.error("❌ Erro durante o backfill de SRS:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
