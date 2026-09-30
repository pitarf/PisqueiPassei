/**
 * Script Gerador de Relatório Executivo de Qualidade do Banco de Questões (JSON e Markdown)
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 */

const fs = require("fs");
const path = require("path");
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

function getCoverageLevel(count) {
  if (count === 0) return "CRITICO";
  if (count <= 4) return "MUITO_BAIXA";
  if (count <= 9) return "BAIXA";
  if (count <= 19) return "ADEQUADA";
  return "BOA";
}

async function generateQualityReport() {
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
          include: { subject: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.historicalQuestion.findMany({
      include: {
        exam: true,
        topic: {
          include: { subject: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.historicalExam.findMany({
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: [{ year: "desc" }, { organization: "asc" }],
    }),
  ]);

  const allTopics = subjects.flatMap((s) => s.topics);
  const totalTopics = allTopics.length;
  const totalQuestions = questions.length;

  const coverageSummary = {
    CRITICO: [],
    MUITO_BAIXA: [],
    BAIXA: [],
    ADEQUADA: [],
    BOA: [],
  };

  const subjectStats = subjects.map((sub) => {
    let qCount = 0;
    const topicDetails = sub.topics.map((top) => {
      const cnt = top.questions.length;
      qCount += cnt;
      const level = getCoverageLevel(cnt);
      coverageSummary[level].push({
        subjectName: sub.name,
        code: top.code,
        title: top.title,
        questionsCount: cnt,
        level,
      });
      return {
        id: top.id,
        code: top.code,
        title: top.title,
        questionsCount: cnt,
        coverageLevel: level,
      };
    });

    return {
      id: sub.id,
      name: sub.name,
      category: sub.category,
      order: sub.order,
      totalQuestions: qCount,
      totalTopics: sub.topics.length,
      topics: topicDetails,
    };
  });

  const diffCounts = {};
  const originCounts = {};
  const cogCounts = {};
  const typeCounts = {};
  const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const verificationCounts = {};

  let longCorrectCount = 0;
  let optionDisparityCount = 0;
  let explanationLengths = [];
  let shortExplCount = 0;

  for (const q of questions) {
    diffCounts[q.difficulty || "SEM_DIFICULDADE"] = (diffCounts[q.difficulty || "SEM_DIFICULDADE"] || 0) + 1;
    originCounts[q.origin || "SEM_ORIGEM"] = (originCounts[q.origin || "SEM_ORIGEM"] || 0) + 1;
    cogCounts[q.cognitiveLevel || "NÃO_INFORMADO"] = (cogCounts[q.cognitiveLevel || "NÃO_INFORMADO"] || 0) + 1;
    typeCounts[q.questionType || "NÃO_INFORMADO"] = (typeCounts[q.questionType || "NÃO_INFORMADO"] || 0) + 1;
    verificationCounts[q.verificationStatus || "SEM_STATUS"] = (verificationCounts[q.verificationStatus || "SEM_STATUS"] || 0) + 1;

    if (answerCounts[q.correctOption] !== undefined) {
      answerCounts[q.correctOption]++;
    }

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

    if (correctOpt && correctOpt.len > avgOther * 1.5 && correctOpt.len - avgOther > 30) {
      longCorrectCount++;
    }

    const maxLen = Math.max(...options.map((o) => o.len));
    const minLen = Math.min(...options.map((o) => o.len));
    if (maxLen > minLen * 3 && maxLen - minLen > 50) {
      optionDisparityCount++;
    }

    const explLen = (q.explanation || "").trim().length;
    explanationLengths.push(explLen);
    if (explLen < 60) shortExplCount++;
  }

  const avgExplLen = explanationLengths.length
    ? Number((explanationLengths.reduce((a, b) => a + b, 0) / explanationLengths.length).toFixed(1))
    : 0;

  const reportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      emphasis: "Ênfase 18 - Suprimento de Bens e Serviços",
      targetScore: 47,
      totalOfficialTopics: TOTAL_OFFICIAL_TOPICS,
      totalSubjects: subjects.length,
      totalActiveQuestions: totalQuestions,
      totalHistoricalQuestions: historicalQuestions.length,
      totalHistoricalExams: historicalExams.length,
    },
    coverage: {
      summary: {
        CRITICO: { count: coverageSummary.CRITICO.length, percent: Number(((coverageSummary.CRITICO.length / totalTopics) * 100).toFixed(1)) },
        MUITO_BAIXA: { count: coverageSummary.MUITO_BAIXA.length, percent: Number(((coverageSummary.MUITO_BAIXA.length / totalTopics) * 100).toFixed(1)) },
        BAIXA: { count: coverageSummary.BAIXA.length, percent: Number(((coverageSummary.BAIXA.length / totalTopics) * 100).toFixed(1)) },
        ADEQUADA: { count: coverageSummary.ADEQUADA.length, percent: Number(((coverageSummary.ADEQUADA.length / totalTopics) * 100).toFixed(1)) },
        BOA: { count: coverageSummary.BOA.length, percent: Number(((coverageSummary.BOA.length / totalTopics) * 100).toFixed(1)) },
      },
      criticalTopicsList: coverageSummary.CRITICO.map((t) => ({
        subject: t.subjectName,
        code: t.code,
        title: t.title,
      })),
      bySubject: subjectStats,
    },
    pedagogicalQuality: {
      difficultyDistribution: diffCounts,
      originDistribution: originCounts,
      cognitiveLevelDistribution: cogCounts,
      questionTypeDistribution: typeCounts,
      verificationDistribution: verificationCounts,
      missingPedagogicalMetadataCount: totalQuestions - (questions.filter((q) => q.questionType && q.cognitiveLevel).length),
      answerDistribution: answerCounts,
      answerPercentages: {
        A: Number(((answerCounts.A / (totalQuestions || 1)) * 100).toFixed(1)),
        B: Number(((answerCounts.B / (totalQuestions || 1)) * 100).toFixed(1)),
        C: Number(((answerCounts.C / (totalQuestions || 1)) * 100).toFixed(1)),
        D: Number(((answerCounts.D / (totalQuestions || 1)) * 100).toFixed(1)),
        E: Number(((answerCounts.E / (totalQuestions || 1)) * 100).toFixed(1)),
      },
      textMetrics: {
        averageExplanationLengthCharacters: avgExplLen,
        shortExplanationCount: shortExplCount,
        longCorrectOptionBiasCount: longCorrectCount,
        optionDisparityCount: optionDisparityCount,
      },
    },
    historicalBank: {
      exams: historicalExams.map((e) => ({
        id: e.id,
        organization: e.organization,
        processName: e.processName,
        year: e.year,
        banca: e.banca,
        questionsCount: e._count.questions,
      })),
      questionsCount: historicalQuestions.length,
      questions: historicalQuestions.map((hq) => ({
        id: hq.id,
        exam: `${hq.exam.organization} ${hq.exam.year}`,
        questionNumber: hq.questionNumber,
        topic: hq.topic ? `[${hq.topic.code}] ${hq.topic.title}` : null,
        cognitiveLevel: hq.cognitiveLevel,
        questionType: hq.questionType,
        verificationStatus: hq.verificationStatus,
      })),
    },
  };

  const outputJsonPath = path.join(__dirname, "../question-bank-quality-report.json");
  fs.writeFileSync(outputJsonPath, JSON.stringify(reportData, null, 2), "utf-8");
  console.log(`✅ Relatório JSON salvo em: ${outputJsonPath}`);

  // Saída resumida formatada em console
  console.log("\n==================================================");
  console.log("📊 RELATÓRIO EXECUTIVO DE QUALIDADE DO BANCO");
  console.log("==================================================");
  console.log(`• Total de Questões: ${totalQuestions}`);
  console.log(`• Tópicos Críticos (0 questões): ${reportData.coverage.summary.CRITICO.count}/${totalTopics} (${reportData.coverage.summary.CRITICO.percent}%)`);
  console.log(`• Tópicos Muito Baixa (1-4 questões): ${reportData.coverage.summary.MUITO_BAIXA.count}/${totalTopics} (${reportData.coverage.summary.MUITO_BAIXA.percent}%)`);
  console.log(`• Tópicos Baixa (5-9 questões): ${reportData.coverage.summary.BAIXA.count}/${totalTopics} (${reportData.coverage.summary.BAIXA.percent}%)`);
  console.log(`• Tópicos Adequada (10-19 questões): ${reportData.coverage.summary.ADEQUADA.count}/${totalTopics} (${reportData.coverage.summary.ADEQUADA.percent}%)`);
  console.log(`• Tópicos Boa (20+ questões): ${reportData.coverage.summary.BOA.count}/${totalTopics} (${reportData.coverage.summary.BOA.percent}%)`);
  console.log(`• Distribuição de Gabaritos: A:${answerCounts.A} B:${answerCounts.B} C:${answerCounts.C} D:${answerCounts.D} E:${answerCounts.E}`);
  console.log("==================================================\n");

  return reportData;
}

if (require.main === module) {
  generateQualityReport()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error("Erro ao gerar relatório:", err);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { generateQualityReport };
