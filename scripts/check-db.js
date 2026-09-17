const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🔍 AUDITORIA COMPLETA DE BANCO DE DADOS - TRANSPETRO STUDY");
  console.log("==================================================\n");

  // 1. Disciplinas e Tópicos
  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          questions: true,
          lessons: true,
          flashcards: true,
          userProgress: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const totalTopics = await prisma.topic.count();
  console.log(`📚 Disciplinas cadastradas: ${subjects.length}`);
  console.log(`📑 Total de tópicos no banco: ${totalTopics} (Meta Oficial: 47)`);
  if (totalTopics === 47) {
    console.log("✅ Taxonomia Oficial Conforme: Exatamente 47 tópicos.\n");
  } else {
    console.log(`⚠️ ALERTA DE TAXONOMIA: O banco possui ${totalTopics} tópicos em vez de 47!\n`);
  }

  let topicsWithoutQuestions = [];
  let topicsWithoutLessons = [];
  let topicsWithoutFlashcards = [];

  console.log("--- Detalhamento por Disciplina ---");
  for (const s of subjects) {
    console.log(`• [${s.category}] ${s.name}: ${s.topics.length} tópicos (Order: ${s.order})`);
    for (const t of s.topics) {
      if (t.questions.length === 0) topicsWithoutQuestions.push(`${s.name} -> ${t.code} ${t.title}`);
      if (t.lessons.length === 0) topicsWithoutLessons.push(`${s.name} -> ${t.code} ${t.title}`);
      if (t.flashcards.length === 0) topicsWithoutFlashcards.push(`${s.name} -> ${t.code} ${t.title}`);
    }
  }

  console.log("\n--- Cobertura de Conteúdo por Tópico ---");
  console.log(`- Tópicos sem questões: ${topicsWithoutQuestions.length}`);
  if (topicsWithoutQuestions.length > 0) {
    topicsWithoutQuestions.slice(0, 5).forEach(t => console.log(`   * ${t}`));
    if (topicsWithoutQuestions.length > 5) console.log(`   * ... e mais ${topicsWithoutQuestions.length - 5} tópicos`);
  }
  console.log(`- Tópicos sem aulas: ${topicsWithoutLessons.length}`);
  console.log(`- Tópicos sem flashcards: ${topicsWithoutFlashcards.length}`);

  // 2. Questões e Distribuição
  const totalQuestions = await prisma.question.count();
  const aiQuestions = await prisma.question.count({ where: { origin: "AI_GENERATED" } });
  const officialQuestions = await prisma.question.count({ where: { origin: { not: "AI_GENERATED" } } });

  console.log("\n--- Distribuição de Questões ---");
  console.log(`Total de Questões: ${totalQuestions}`);
  console.log(`- Oficiais / Banca: ${officialQuestions}`);
  console.log(`- Inéditas (Geradas por IA): ${aiQuestions}`);

  const easyQuestions = await prisma.question.count({ where: { difficulty: { in: ["FACIL", "EASY"] } } });
  const mediumQuestions = await prisma.question.count({ where: { difficulty: { in: ["MEDIA", "MEDIUM"] } } });
  const hardQuestions = await prisma.question.count({ where: { difficulty: { in: ["DIFICIL", "HARD"] } } });
  console.log(`- Dificuldade: Fácil=${easyQuestions}, Médio=${mediumQuestions}, Difícil=${hardQuestions}`);

  // 3. Verificação de Integridade das Questões
  const allQuestions = await prisma.question.findMany({
    select: {
      id: true,
      statement: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      optionE: true,
      correctOption: true,
      explanation: true,
      topicId: true,
    },
  });

  let duplicateStatements = new Map();
  let questionsWithDuplicateOptions = [];
  let questionsWithInvalidAnswer = [];
  let questionsWithoutExplanation = [];
  let orphanQuestions = [];

  const validAnswers = ["A", "B", "C", "D", "E"];

  for (const q of allQuestions) {
    // Duplicadas por enunciado
    const trimmed = q.statement.trim().toLowerCase();
    duplicateStatements.set(trimmed, (duplicateStatements.get(trimmed) || 0) + 1);

    // Opções duplicadas
    const rawOpts = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE];
    const opts = rawOpts.map(o => String(o || "").trim().toLowerCase());
    const uniqueOpts = new Set(opts);
    if (uniqueOpts.size !== opts.length) {
      questionsWithDuplicateOptions.push(q.id);
    }

    // Resposta válida A-E
    if (!validAnswers.includes(q.correctOption)) {
      questionsWithInvalidAnswer.push({ id: q.id, answer: q.correctOption });
    }

    // Sem explicação
    if (!q.explanation || q.explanation.trim() === "") {
      questionsWithoutExplanation.push(q.id);
    }

    // Sem tópico
    if (!q.topicId) {
      orphanQuestions.push(q.id);
    }
  }

  let dupCount = 0;
  for (const count of duplicateStatements.values()) {
    if (count > 1) dupCount += (count - 1);
  }

  console.log("\n--- Integridade e Qualidade das Questões ---");
  console.log(`- Questões com enunciados duplicados: ${dupCount}`);
  console.log(`- Questões com opções idênticas internas: ${questionsWithDuplicateOptions.length}`);
  console.log(`- Questões com gabarito fora de A-E: ${questionsWithInvalidAnswer.length}`);
  console.log(`- Questões sem justificativa/explicação: ${questionsWithoutExplanation.length}`);
  console.log(`- Questões órfãs (sem topicId): ${orphanQuestions.length}`);

  // 4. Integridade de Aulas, Flashcards e Progresso
  const orphanLessons = await prisma.lesson.count({ where: { topic: { is: null } } }).catch(() => 0);
  const orphanFlashcards = await prisma.flashcard.count({ where: { topic: { is: null } } }).catch(() => 0);
  const orphanProgress = await prisma.userTopicProgress.count({ where: { topic: { is: null } } }).catch(() => 0);

  console.log("\n--- Integridade Relacional de Conteúdo ---");
  console.log(`- Aulas órfãs (sem tópico válido): ${orphanLessons}`);
  console.log(`- Flashcards órfãos (sem tópico válido): ${orphanFlashcards}`);
  console.log(`- Progresso de tópico órfão: ${orphanProgress}`);

  // 5. Simulações e Tentativas
  const totalSimulations = await prisma.simulation.count();
  const orphanAttempts = await prisma.questionAttempt.count({ where: { question: { is: null } } }).catch(() => 0);

  console.log("\n--- Simulações e Tentativas ---");
  console.log(`- Total de simulados registrados: ${totalSimulations}`);
  console.log(`- Tentativas de questões órfãs: ${orphanAttempts}`);

  // 6. Idempotência
  const attemptsWithKey = await prisma.questionAttempt.findMany({
    where: { idempotencyKey: { not: null } },
    select: { idempotencyKey: true },
  });
  const keySet = new Set();
  let duplicateKeys = 0;
  for (const a of attemptsWithKey) {
    if (keySet.has(a.idempotencyKey)) {
      duplicateKeys++;
    } else {
      keySet.add(a.idempotencyKey);
    }
  }
  console.log(`- Chaves de idempotência repetidas indevidamente: ${duplicateKeys}`);

  console.log("\n==================================================");
  console.log("🏁 FIM DA AUDITORIA DO BANCO");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Erro na auditoria do banco:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
