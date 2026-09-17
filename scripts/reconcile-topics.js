const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Migra com segurança absoluta todos os dados relacionados de um tópico de origem para um tópico de destino:
 * - Lessons
 * - Questions (e seus QuestionAttempts)
 * - Flashcards (e seus FlashcardReviews)
 * - StudySessions
 * - UserTopicProgress
 */
async function migrateTopicRelations(sourceTopicId, targetTopicId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Migrar Lessons
    const lessonsMoved = await tx.lesson.updateMany({
      where: { topicId: sourceTopicId },
      data: { topicId: targetTopicId },
    });

    // 2. Migrar Questions
    const questionsMoved = await tx.question.updateMany({
      where: { topicId: sourceTopicId },
      data: { topicId: targetTopicId },
    });

    // 3. Migrar Flashcards
    const flashcardsMoved = await tx.flashcard.updateMany({
      where: { topicId: sourceTopicId },
      data: { topicId: targetTopicId },
    });

    // 4. Migrar StudySessions
    const sessionsMoved = await tx.studySession.updateMany({
      where: { topicId: sourceTopicId },
      data: { topicId: targetTopicId },
    });

    // 5. Migrar UserTopicProgress com integridade (sem violar unique userId_topicId)
    const sourceProgresses = await tx.userTopicProgress.findMany({
      where: { topicId: sourceTopicId },
    });

    for (const sp of sourceProgresses) {
      const targetProgress = await tx.userTopicProgress.findUnique({
        where: { userId_topicId: { userId: sp.userId, topicId: targetTopicId } },
      });

      if (!targetProgress) {
        // Altera para o novo topicId
        await tx.userTopicProgress.update({
          where: { id: sp.id },
          data: { topicId: targetTopicId },
        });
      } else {
        // Funde o progresso de forma cumulativa e segura
        const mergedTotalQuestions = targetProgress.totalQuestions + sp.totalQuestions;
        const mergedCorrectAnswers = targetProgress.correctAnswers + sp.correctAnswers;
        const mergedMasteryScore = mergedTotalQuestions > 0
          ? Math.round((mergedCorrectAnswers / mergedTotalQuestions) * 100)
          : Math.max(targetProgress.masteryScore, sp.masteryScore);

        const mergedStatus = mergedMasteryScore >= 85
          ? "DOMINADO"
          : (targetProgress.status !== "NAO_INICIADO" ? targetProgress.status : sp.status);

        await tx.userTopicProgress.update({
          where: { id: targetProgress.id },
          data: {
            totalQuestions: mergedTotalQuestions,
            correctAnswers: mergedCorrectAnswers,
            masteryScore: mergedMasteryScore,
            status: mergedStatus,
            totalTimeMinutes: targetProgress.totalTimeMinutes + sp.totalTimeMinutes,
            lastStudiedAt: targetProgress.lastStudiedAt || sp.lastStudiedAt,
          },
        });

        // Remove o progresso antigo já fundido
        await tx.userTopicProgress.delete({ where: { id: sp.id } });
      }
    }

    // 6. Após migrar todas as dependências, remove com segurança o tópico antigo
    await tx.topic.delete({ where: { id: sourceTopicId } });

    return {
      lessons: lessonsMoved.count,
      questions: questionsMoved.count,
      flashcards: flashcardsMoved.count,
      sessions: sessionsMoved.count,
      progresses: sourceProgresses.length,
    };
  });
}

async function reconcileTopics() {
  console.log("🔒 [INTEGRIDADE] Iniciando reconciliação segura da taxonomia de tópicos oficiais...");

  const mathSubject = await prisma.subject.findFirst({
    where: { name: "Matemática" },
    include: { topics: true },
  });

  if (!mathSubject) {
    console.error("Matemática não encontrada no banco de dados.");
    return;
  }

  // Identifica códigos residuais 11 e 12 de Matemática
  const topic11 = mathSubject.topics.find((t) => t.code === "11");
  const topic12 = mathSubject.topics.find((t) => t.code === "12");
  const topic9 = mathSubject.topics.find((t) => t.code === "9");
  const topic10 = mathSubject.topics.find((t) => t.code === "10");

  if (topic11 && topic9) {
    console.log(`📦 Migrando dados de Matemática antigo 11 -> novo 9 ("${topic9.title}")...`);
    const res = await migrateTopicRelations(topic11.id, topic9.id);
    console.log(`✅ Migrado tópico 11 -> 9:`, res);
  }

  if (topic12 && topic10) {
    console.log(`📦 Migrando dados de Matemática antigo 12 -> novo 10 ("${topic10.title}")...`);
    const res = await migrateTopicRelations(topic12.id, topic10.id);
    console.log(`✅ Migrado tópico 12 -> 10:`, res);
  }

  const finalCount = await prisma.topic.count();
  console.log(`🎯 Contagem oficial de tópicos no banco: ${finalCount} (Esperado: 47)`);
  if (finalCount !== 47) {
    throw new Error(`DIVERGÊNCIA: banco contém ${finalCount} tópicos, esperado exatamente 47.`);
  }
}

module.exports = { reconcileTopics, migrateTopicRelations };

if (require.main === module) {
  reconcileTopics()
    .catch((e) => {
      console.error("❌ Erro na reconciliação:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
