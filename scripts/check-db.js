require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

let computeStatementHash;
let OFFICIAL_TAXONOMY, TOTAL_OFFICIAL_TOPICS;

try {
  const validator = require("../src/lib/question-validator");
  computeStatementHash = validator.computeStatementHash;
} catch (e) {
  computeStatementHash = (statement) => {
    const normalized = (statement || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return crypto.createHash("sha256").update(normalized).digest("hex");
  };
}

try {
  const tax = require("../src/lib/taxonomy");
  OFFICIAL_TAXONOMY = tax.OFFICIAL_TAXONOMY;
  TOTAL_OFFICIAL_TOPICS = tax.TOTAL_OFFICIAL_TOPICS;
} catch (e) {
  TOTAL_OFFICIAL_TOPICS = 47;
  OFFICIAL_TAXONOMY = [
    { name: "Língua Portuguesa" },
    { name: "Matemática" },
    { name: "1. Noções de Administração e Logística" },
    { name: "2. Logística e Cadeia de Suprimentos" },
    { name: "3. Legislação" },
    { name: "4. Noções de Contabilidade e Informática" },
  ];
}

const prisma = new PrismaClient();

const EXPECTED_SUBJECT_COUNT = 6;
const EXPECTED_TOPIC_COUNT = TOTAL_OFFICIAL_TOPICS || 47;

const EXPECTED_DISTRIBUTION = {
  portuguese: 10,
  math: 10,
  specific: 40,
  total: 60,
};

async function main() {
  console.log("==================================================");
  console.log("🔍 AUDITORIA ESTRITA DE BANCO DE DADOS - TRANSPETRO STUDY");
  console.log("==================================================\n");

  let hasErrors = false;

  // 1. Disciplinas e Tópicos Oficiais
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
  console.log(`📚 Disciplinas cadastradas: ${subjects.length} (Meta Oficial: ${EXPECTED_SUBJECT_COUNT})`);
  console.log(`📑 Total de tópicos no banco: ${totalTopics} (Meta Oficial: ${EXPECTED_TOPIC_COUNT})`);

  if (subjects.length !== EXPECTED_SUBJECT_COUNT) {
    console.error(`❌ ERRO: Quantidade de disciplinas inválida! Esperado ${EXPECTED_SUBJECT_COUNT}, encontrado ${subjects.length}`);
    hasErrors = true;
  }

  if (totalTopics !== EXPECTED_TOPIC_COUNT) {
    console.error(`❌ ERRO: Quantidade de tópicos inválida! Esperado ${EXPECTED_TOPIC_COUNT}, encontrado ${totalTopics}`);
    hasErrors = true;
  }

  // Validar correspondência exata com o manifesto da taxonomia oficial
  const subjectNameSet = new Set(subjects.map((s) => s.name));
  for (const officialSubject of OFFICIAL_TAXONOMY) {
    if (!subjectNameSet.has(officialSubject.name)) {
      console.error(`❌ ERRO: Disciplina oficial ausente no banco: "${officialSubject.name}"`);
      hasErrors = true;
    }
  }

  let topicsWithoutQuestions = [];
  let topicsWithoutLessons = [];
  let topicsWithoutFlashcards = [];

  console.log("\n--- Detalhamento por Disciplina ---");
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
    topicsWithoutQuestions.slice(0, 5).forEach((t) => console.log(`   * ${t}`));
    if (topicsWithoutQuestions.length > 5) console.log(`   * ... e mais ${topicsWithoutQuestions.length - 5} tópicos`);
  }
  console.log(`- Tópicos sem aulas: ${topicsWithoutLessons.length}`);
  console.log(`- Tópicos sem flashcards: ${topicsWithoutFlashcards.length}`);

  // 2. Verificação de Tópicos Órfãos (sem Subject válido associado)
  const allDbTopics = await prisma.topic.findMany({ select: { id: true, subjectId: true } });
  const allSubjectIds = new Set(subjects.map((s) => s.id));
  const orphanTopics = allDbTopics.filter((t) => !allSubjectIds.has(t.subjectId));
  console.log(`- Tópicos órfãos (sem Subject associado): ${orphanTopics.length}`);
  if (orphanTopics.length > 0) {
    console.error(`❌ ERRO: Foram encontrados ${orphanTopics.length} tópicos órfãos sem disciplina válida!`);
    hasErrors = true;
  }

  // 3. Verificação de Integridade das Questões
  const allQuestions = await prisma.question.findMany({
    select: {
      id: true,
      statement: true,
      statementHash: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      optionE: true,
      correctOption: true,
      explanation: true,
      topicId: true,
      topic: {
        select: {
          id: true,
          subjectId: true,
          subject: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const totalQuestions = allQuestions.length;
  console.log("\n--- Integridade e Qualidade das Questões ---");
  console.log(`Total de Questões: ${totalQuestions}`);

  let questionsWithEmptyHash = [];
  let questionsWithDivergentHash = [];
  let questionsWithDuplicateOptions = [];
  let questionsWithInvalidAnswer = [];
  let questionsWithoutExplanation = [];
  let orphanQuestions = [];
  const topicHashDuplicates = new Map(); // topicId -> Map(hash -> count)

  const validAnswers = ["A", "B", "C", "D", "E"];

  for (const q of allQuestions) {
    // Validação de questão órfã
    if (!q.topicId || !q.topic) {
      orphanQuestions.push(q.id);
    }

    // Validação de statementHash vazio
    if (!q.statementHash || q.statementHash.trim() === "") {
      questionsWithEmptyHash.push(q.id);
    } else {
      // Validação de divergência do hash determinístico centralizado
      const expectedHash = computeStatementHash(q.statement);
      if (q.statementHash !== expectedHash) {
        questionsWithDivergentHash.push({
          id: q.id,
          stored: q.statementHash,
          computed: expectedHash,
        });
      }
    }

    // Duplicidades por topicId + statementHash
    if (q.topicId && q.statementHash) {
      if (!topicHashDuplicates.has(q.topicId)) {
        topicHashDuplicates.set(q.topicId, new Map());
      }
      const hashMap = topicHashDuplicates.get(q.topicId);
      hashMap.set(q.statementHash, (hashMap.get(q.statementHash) || 0) + 1);
    }

    // Opções duplicadas
    const rawOpts = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE];
    const opts = rawOpts.map((o) => String(o || "").trim().toLowerCase());
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
  }

  // Contabilizar duplicatas de statementHash por tópico
  let duplicateHashCount = 0;
  for (const [, hashMap] of topicHashDuplicates.entries()) {
    for (const [, count] of hashMap.entries()) {
      if (count > 1) duplicateHashCount += count - 1;
    }
  }

  console.log(`- Questões órfãs (sem topicId ou tópico inexistente): ${orphanQuestions.length}`);
  console.log(`- Questões com statementHash vazio: ${questionsWithEmptyHash.length}`);
  console.log(`- Questões com statementHash divergente do determinístico: ${questionsWithDivergentHash.length}`);
  console.log(`- Duplicidades por statementHash dentro de cada tópico: ${duplicateHashCount}`);
  console.log(`- Questões com opções idênticas internas: ${questionsWithDuplicateOptions.length}`);
  console.log(`- Questões com gabarito fora de A-E: ${questionsWithInvalidAnswer.length}`);
  console.log(`- Questões sem justificativa/explicação: ${questionsWithoutExplanation.length}`);

  if (orphanQuestions.length > 0) {
    console.error(`❌ ERRO: Encontradas ${orphanQuestions.length} questões órfãs!`);
    hasErrors = true;
  }
  if (questionsWithEmptyHash.length > 0) {
    console.error(`❌ ERRO: Encontradas ${questionsWithEmptyHash.length} questões com statementHash vazio!`);
    hasErrors = true;
  }
  if (questionsWithDivergentHash.length > 0) {
    console.error(`❌ ERRO: Encontradas ${questionsWithDivergentHash.length} questões com hash divergente do cálculo determinístico!`);
    hasErrors = true;
  }
  if (duplicateHashCount > 0) {
    console.error(`❌ ERRO: Encontradas ${duplicateHashCount} duplicidades de (topicId, statementHash)!`);
    hasErrors = true;
  }
  if (questionsWithInvalidAnswer.length > 0) {
    console.error(`❌ ERRO: Questões com gabarito inválido: ${questionsWithInvalidAnswer.length}`);
    hasErrors = true;
  }
  if (questionsWithDuplicateOptions.length > 0) {
    console.error(`❌ ERRO: Questões com opções idênticas internas: ${questionsWithDuplicateOptions.length}`);
    hasErrors = true;
  }
  if (questionsWithoutExplanation.length > 0) {
    console.error(`❌ ERRO: Questões sem justificativa/explicação: ${questionsWithoutExplanation.length}`);
    hasErrors = true;
  }

  // 4. Integridade Relacional de Conteúdo
  const topicIdSet = new Set(allDbTopics.map((t) => t.id));
  const questionIdSet = new Set(allQuestions.map((q) => q.id));

  const allLessons = await prisma.lesson.findMany({ select: { id: true, topicId: true } });
  const orphanLessons = allLessons.filter((l) => !topicIdSet.has(l.topicId)).length;

  const allFlashcards = await prisma.flashcard.findMany({ select: { id: true, topicId: true } });
  const orphanFlashcards = allFlashcards.filter((f) => !topicIdSet.has(f.topicId)).length;

  const allProgress = await prisma.userTopicProgress.findMany({ select: { id: true, topicId: true } });
  const orphanProgress = allProgress.filter((p) => !topicIdSet.has(p.topicId)).length;

  console.log("\n--- Integridade Relacional de Conteúdo ---");
  console.log(`- Aulas órfãs: ${orphanLessons}`);
  console.log(`- Flashcards órfãos: ${orphanFlashcards}`);
  console.log(`- Progresso de tópico órfão: ${orphanProgress}`);

  if (orphanLessons > 0 || orphanFlashcards > 0 || orphanProgress > 0) {
    console.error("❌ ERRO: Inconsistências relacionais detectadas em aulas, flashcards ou progresso!");
    hasErrors = true;
  }

  // 5. Simulações, Tentativas e Idempotência
  const totalSimulations = await prisma.simulation.count();
  const allAttempts = await prisma.questionAttempt.findMany({ select: { id: true, questionId: true, idempotencyKey: true } });
  const orphanAttempts = allAttempts.filter((a) => !questionIdSet.has(a.questionId)).length;
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

  console.log("\n--- Simulações, Tentativas e Idempotência ---");
  console.log(`- Total de simulados registrados: ${totalSimulations}`);
  console.log(`- Tentativas de questões órfãs: ${orphanAttempts}`);
  console.log(`- Chaves de idempotência repetidas indevidamente: ${duplicateKeys}`);

  if (orphanAttempts > 0) {
    console.error(`❌ ERRO: Tentativas de questões órfãs detectadas: ${orphanAttempts}`);
    hasErrors = true;
  }
  if (duplicateKeys > 0) {
    console.error(`❌ ERRO: Chaves de idempotência repetidas indevidamente: ${duplicateKeys}`);
    hasErrors = true;
  }

  // 6. Validação da Distribuição para Simulado Completo (10 Port, 10 Mat, 40 Espec = 60 questões)
  const portQuestions = allQuestions.filter(
    (q) => q.topic?.subject?.name === "Língua Portuguesa"
  );
  const mathQuestions = allQuestions.filter(
    (q) => q.topic?.subject?.name === "Matemática"
  );
  const specQuestions = allQuestions.filter(
    (q) => q.topic?.subject?.category === "ESPECIFICO"
  );

  console.log("\n--- Distribuição do Banco para Simulado (10 Port / 10 Mat / 40 Espec) ---");
  console.log(`- Língua Portuguesa: ${portQuestions.length} questões (Mínimo requerido: ${EXPECTED_DISTRIBUTION.portuguese})`);
  console.log(`- Matemática: ${mathQuestions.length} questões (Mínimo requerido: ${EXPECTED_DISTRIBUTION.math})`);
  console.log(`- Conhecimentos Específicos: ${specQuestions.length} questões (Mínimo requerido: ${EXPECTED_DISTRIBUTION.specific})`);
  console.log(`- Total no acervo: ${totalQuestions} questões (Mínimo requerido: ${EXPECTED_DISTRIBUTION.total})`);

  if (portQuestions.length < EXPECTED_DISTRIBUTION.portuguese) {
    console.error(`❌ ERRO: Déficit em Língua Portuguesa para simulado! Esperado ao menos ${EXPECTED_DISTRIBUTION.portuguese}, encontrado ${portQuestions.length}`);
    hasErrors = true;
  }
  if (mathQuestions.length < EXPECTED_DISTRIBUTION.math) {
    console.error(`❌ ERRO: Déficit em Matemática para simulado! Esperado ao menos ${EXPECTED_DISTRIBUTION.math}, encontrado ${mathQuestions.length}`);
    hasErrors = true;
  }
  if (specQuestions.length < EXPECTED_DISTRIBUTION.specific) {
    console.error(`❌ ERRO: Déficit em Conhecimentos Específicos para simulado! Esperado ao menos ${EXPECTED_DISTRIBUTION.specific}, encontrado ${specQuestions.length}`);
    hasErrors = true;
  }

  console.log("\n==================================================");
  if (hasErrors) {
    console.error("❌ AUDITORIA FALHOU: O banco de dados apresenta inconsistências críticas!");
    console.log("==================================================");
    process.exit(1);
  } else {
    console.log("✅ TODAS AS VERIFICAÇÕES DE INTEGRIDADE E TAXONOMIA FORAM APROVADAS!");
    console.log("==================================================");
  }
}

main()
  .catch((e) => {
    console.error("Erro fatal na auditoria do banco:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
