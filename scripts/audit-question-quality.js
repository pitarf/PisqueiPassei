/**
 * Script de Auditoria de Qualidade do Banco de Questões
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 * 
 * Executa auditoria aprofundada de:
 * - Cobertura dos 47 tópicos (CRÍTICO, MUITO BAIXA, BAIXA, ADEQUADA, BOA)
 * - Distribuição de Dificuldade, Origens e Proveniência
 * - Taxonomia Pedagógica (Cognitiva e Tipologia de Questão)
 * - Análise de Alternativas, Gabaritos (A-E) e Viés de Tamanho
 * - Qualidade e Profundidade das Explicações
 * - Questões Históricas vs Inéditas e potenciais alucinações de proveniência
 */

const { PrismaClient } = require("@prisma/client");

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const TOTAL_OFFICIAL_TOPICS = 47;

const prisma = new PrismaClient();

const COVERAGE_THRESHOLDS = {
  CRITICO: { min: 0, max: 0, label: "CRÍTICO (0 questões)" },
  MUITO_BAIXA: { min: 1, max: 4, label: "MUITO BAIXA (1 a 4 questões)" },
  BAIXA: { min: 5, max: 9, label: "BAIXA (5 a 9 questões)" },
  ADEQUADA: { min: 10, max: 19, label: "ADEQUADA (10 a 19 questões)" },
  BOA: { min: 20, max: Infinity, label: "BOA (20+ questões)" },
};

function getCoverageLevel(count) {
  if (count === 0) return "CRITICO";
  if (count <= 4) return "MUITO_BAIXA";
  if (count <= 9) return "BAIXA";
  if (count <= 19) return "ADEQUADA";
  return "BOA";
}

async function auditQuestionQuality() {
  console.log("================================================================================");
  console.log("🔬 AUDITORIA ESTRITA DE QUALIDADE PEDAGÓGICA - TRANSPETRO STUDY 2026.3");
  console.log("================================================================================\n");

  const [subjects, questions, historicalQuestions, historicalExams] = await Promise.all([
    prisma.subject.findMany({
      include: {
        topics: {
          include: {
            questions: true,
            historicalQuestions: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.question.findMany({
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.historicalQuestion.findMany({
      include: {
        exam: true,
        topic: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.historicalExam.findMany({
      include: {
        _count: { select: { questions: true } },
      },
    }),
  ]);

  const allTopics = subjects.flatMap((s) => s.topics);
  const totalTopics = allTopics.length;
  const totalQuestions = questions.length;

  console.log(`📊 Panorama Geral:`);
  console.log(`   - Disciplinas: ${subjects.length} (Oficial: 6)`);
  console.log(`   - Tópicos Catalogados: ${totalTopics} (Oficial: ${TOTAL_OFFICIAL_TOPICS})`);
  console.log(`   - Questões no Banco Ativo: ${totalQuestions}`);
  console.log(`   - Questões no Banco Histórico: ${historicalQuestions.length}`);
  console.log(`   - Provas Históricas Cadastradas: ${historicalExams.length}`);
  console.log("--------------------------------------------------------------------------------\n");

  // 1. ANÁLISE DE COBERTURA POR TÓPICO
  console.log("📌 1. NÍVEL DE COBERTURA DOS 47 TÓPICOS OFICIAIS");
  const coverageBuckets = {
    CRITICO: [],
    MUITO_BAIXA: [],
    BAIXA: [],
    ADEQUADA: [],
    BOA: [],
  };

  const subjectCoverage = subjects.map((sub) => {
    let subQuestions = 0;
    const topicDetails = sub.topics.map((top) => {
      const count = top.questions.length;
      subQuestions += count;
      const level = getCoverageLevel(count);
      coverageBuckets[level].push({
        code: top.code,
        title: top.title,
        subject: sub.name,
        count,
      });
      return { code: top.code, title: top.title, count, level };
    });
    return {
      name: sub.name,
      category: sub.category,
      totalQuestions: subQuestions,
      topicsCount: sub.topics.length,
      topics: topicDetails,
    };
  });

  console.log(`   • CRÍTICO (0 questões): ${coverageBuckets.CRITICO.length} tópicos (${((coverageBuckets.CRITICO.length / totalTopics) * 100).toFixed(1)}%)`);
  console.log(`   • MUITO BAIXA (1-4 questões): ${coverageBuckets.MUITO_BAIXA.length} tópicos (${((coverageBuckets.MUITO_BAIXA.length / totalTopics) * 100).toFixed(1)}%)`);
  console.log(`   • BAIXA (5-9 questões): ${coverageBuckets.BAIXA.length} tópicos (${((coverageBuckets.BAIXA.length / totalTopics) * 100).toFixed(1)}%)`);
  console.log(`   • ADEQUADA (10-19 questões): ${coverageBuckets.ADEQUADA.length} tópicos (${((coverageBuckets.ADEQUADA.length / totalTopics) * 100).toFixed(1)}%)`);
  console.log(`   • BOA (20+ questões): ${coverageBuckets.BOA.length} tópicos (${((coverageBuckets.BOA.length / totalTopics) * 100).toFixed(1)}%)\n`);

  console.log("   Detalhe de Tópicos Críticos (sem nenhuma questão):");
  coverageBuckets.CRITICO.forEach((t) => {
    console.log(`     ❌ [${t.subject}] (${t.code}) ${t.title}`);
  });

  console.log("\n--------------------------------------------------------------------------------");

  // 2. DISTRIBUIÇÃO PEDAGÓGICA E ORIGENS
  console.log("🧠 2. DIMENSÕES PEDAGÓGICAS E ORIGEM DAS QUESTÕES ATIVAS");

  const diffCounts = {};
  const originCounts = {};
  const cogCounts = {};
  const typeCounts = {};
  const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const verificationCounts = {};

  let missingMetadataCount = 0;
  let boilerplatePatternCount = 0;
  const identicalOptionsAcrossQuestions = new Map();

  for (const q of questions) {
    diffCounts[q.difficulty || "SEM_DIFICULDADE"] = (diffCounts[q.difficulty || "SEM_DIFICULDADE"] || 0) + 1;
    originCounts[q.origin || "SEM_ORIGEM"] = (originCounts[q.origin || "SEM_ORIGEM"] || 0) + 1;
    cogCounts[q.cognitiveLevel || "NÃO_INFORMADO"] = (cogCounts[q.cognitiveLevel || "NÃO_INFORMADO"] || 0) + 1;
    typeCounts[q.questionType || "NÃO_INFORMADO"] = (typeCounts[q.questionType || "NÃO_INFORMADO"] || 0) + 1;
    verificationCounts[q.verificationStatus || "SEM_STATUS"] = (verificationCounts[q.verificationStatus || "SEM_STATUS"] || 0) + 1;

    if (answerCounts[q.correctOption] !== undefined) {
      answerCounts[q.correctOption]++;
    }

    if (!q.questionType || !q.cognitiveLevel) {
      missingMetadataCount++;
    }

    // Identificar boilerplate sintético de seed
    if (
      q.statement.includes("avalie o procedimento de número") ||
      q.statement.includes("aplicada ao texto da questão") ||
      q.statement.includes("Uma equipe logística necessita calcular")
    ) {
      boilerplatePatternCount++;
    }

    const optCKey = normalizeText(q.optionC);
    identicalOptionsAcrossQuestions.set(optCKey, (identicalOptionsAcrossQuestions.get(optCKey) || 0) + 1);
  }

  console.log(`   • Dificuldade:`, diffCounts);
  console.log(`   • Origem Declarada:`, originCounts);
  console.log(`   • Nível Cognitivo:`, cogCounts);
  console.log(`   • Tipo de Questão:`, typeCounts);
  console.log(`   • Status de Verificação:`, verificationCounts);
  console.log(`   • Metadados Pedagógicos Faltantes (questionType/cognitiveLevel): ${missingMetadataCount}/${totalQuestions}`);
  console.log(`   • Enunciados com Template/Boilerplate Genérico: ${boilerplatePatternCount}/${totalQuestions}`);

  console.log("\n--------------------------------------------------------------------------------");

  // 3. ANOMALIAS DE ALTERNATIVAS, GABARITOS E EXTENSÃO
  console.log("⚖️  3. ANÁLISE DE GABARITOS, DISTRIBUIÇÃO E EXTENSÃO DAS ALTERNATIVAS");
  console.log(`   • Distribuição de Gabaritos:`);
  for (const [letter, cnt] of Object.entries(answerCounts)) {
    const pct = ((cnt / (totalQuestions || 1)) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(pct / 3));
    console.log(`     [${letter}]: ${cnt.toString().padStart(2)} (${pct.padStart(5)}%) ${bar}`);
  }

  // Análise de viés de comprimento de alternativas e tamanho de explicação
  let longCorrectOptionCount = 0;
  let shortExplanationCount = 0;
  let explanationLengths = [];
  let optionLengthDisparityCount = 0;

  for (const q of questions) {
    const options = [
      { letter: "A", len: q.optionA.length },
      { letter: "B", len: q.optionB.length },
      { letter: "C", len: q.optionC.length },
      { letter: "D", len: q.optionD.length },
      { letter: "E", len: q.optionE.length },
    ];
    const correctOpt = options.find((o) => o.letter === q.correctOption);
    const otherOpts = options.filter((o) => o.letter !== q.correctOption);
    const avgOther = otherOpts.reduce((sum, o) => sum + o.len, 0) / otherOpts.length;

    // Viés onde a correta é 50%+ maior que a média das incorretas
    if (correctOpt && correctOpt.len > avgOther * 1.5 && correctOpt.len - avgOther > 30) {
      longCorrectOptionCount++;
    }

    const maxLen = Math.max(...options.map((o) => o.len));
    const minLen = Math.min(...options.map((o) => o.len));
    if (maxLen > minLen * 3 && maxLen - minLen > 50) {
      optionLengthDisparityCount++;
    }

    const explLen = (q.explanation || "").trim().length;
    explanationLengths.push(explLen);
    if (explLen < 60) {
      shortExplanationCount++;
    }
  }

  const avgExplLen = explanationLengths.length
    ? (explanationLengths.reduce((a, b) => a + b, 0) / explanationLengths.length).toFixed(1)
    : 0;

  console.log(`\n   • Viés da Alternativa Mais Longa (tamanho induz resposta): ${longCorrectOptionCount} ocorrências`);
  console.log(`   • Disparidade Extrema de Tamanho entre Opções: ${optionLengthDisparityCount} questões`);
  console.log(`   • Comprimento Médio de Explicações: ${avgExplLen} caracteres`);
  console.log(`   • Explicações Curtas/Superficiais (< 60 caracteres): ${shortExplanationCount} questões`);

  console.log("\n--------------------------------------------------------------------------------");

  // 4. AUDITORIA HISTÓRICA E PROVENIÊNCIA
  console.log("📜 4. BANCO HISTÓRICO E PROVENIÊNCIA");
  console.log(`   • Questões de Concursos Oficiais Anteriores cadastradas: ${historicalQuestions.length}`);
  historicalQuestions.forEach((hq) => {
    console.log(`     - [${hq.exam.organization} ${hq.exam.year} • Questão ${hq.questionNumber}] Tópico: ${hq.topic ? hq.topic.title : "Sem Tópico"} | Status: ${hq.verificationStatus}`);
  });

  const suspiciousOfficialClaims = questions.filter((q) => {
    return (
      q.origin.startsWith("OFICIAL") &&
      !q.sourceUrl &&
      !q.sourceQuestion
    );
  });
  console.log(`   • Questões com alegação oficial sem URL/Número de prova histórico: ${suspiciousOfficialClaims.length}`);

  console.log("\n================================================================================");
  console.log("📋 SÍNTESE DIAGNÓSTICA PARA O PROJETO TRANSPETRO 2026.3");
  console.log("================================================================================");
  console.log(`1. Total de questões ativas no acervo pedagógico: ${totalQuestions}.`);
  console.log(`2. Cobertura: ${coverageBuckets.CRITICO.length} tópicos em nível CRÍTICO (0 questões).`);
  console.log(`3. Cobertura adequada (>= 10 questões): ${coverageBuckets.ADEQUADA.length + coverageBuckets.BOA.length} de ${totalTopics} tópicos.`);
  console.log(`4. Distribuição de gabarito A-E: A (${((answerCounts.A / totalQuestions) * 100).toFixed(1)}%), B (${((answerCounts.B / totalQuestions) * 100).toFixed(1)}%), C (${((answerCounts.C / totalQuestions) * 100).toFixed(1)}%), D (${((answerCounts.D / totalQuestions) * 100).toFixed(1)}%), E (${((answerCounts.E / totalQuestions) * 100).toFixed(1)}%).`);
  console.log(`5. Questões com metadados pedagógicos completos (questionType/cognitiveLevel): ${totalQuestions - missingMetadataCount}/${totalQuestions}.`);
  console.log("================================================================================\n");

  return {
    totalQuestions,
    totalTopics,
    coverageBuckets,
    subjectCoverage,
    diffCounts,
    originCounts,
    cogCounts,
    typeCounts,
    answerCounts,
    missingMetadataCount,
    boilerplatePatternCount,
    historicalCount: historicalQuestions.length,
    historicalExamsCount: historicalExams.length,
  };
}

if (require.main === module) {
  auditQuestionQuality()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error("Erro na auditoria:", err);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { auditQuestionQuality };
