const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OFFICIAL = new Set([
  "OFICIAL_TRANSPETRO",
  "OFICIAL_PETROBRAS",
  "OFICIAL_CESGRANRIO",
  "OFICIAL_OUTRA",
]);

const DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);

async function main() {
  const [topics, questions, exams, historicalQuestions] = await Promise.all([
    prisma.topic.findMany({
      include: { subject: true, _count: { select: { questions: true } } },
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.question.findMany({
      select: {
        origin: true,
        difficulty: true,
        topicId: true,
        verificationStatus: true,
        sourceRef: true,
        sourceUrl: true,
        sourceQuestion: true,
      },
    }),
    prisma.historicalExam.findMany({
      select: { id: true, organization: true, processName: true, year: true, emphasis: true, banca: true },
      orderBy: [{ year: "desc" }, { organization: "asc" }],
    }),
    prisma.historicalQuestion.findMany({
      select: { examId: true, topicId: true, difficulty: true, questionType: true, cognitiveLevel: true, verificationStatus: true },
    }),
  ]);

  const byTopic = new Map();
  const byOrigin = new Map();
  const byDifficulty = new Map();
  const byVerification = new Map();

  for (const q of questions) {
    byTopic.set(q.topicId, (byTopic.get(q.topicId) || 0) + 1);
    byOrigin.set(q.origin || "SEM_ORIGEM", (byOrigin.get(q.origin || "SEM_ORIGEM") || 0) + 1);
    byDifficulty.set(q.difficulty || "SEM_DIFICULDADE", (byDifficulty.get(q.difficulty || "SEM_DIFICULDADE") || 0) + 1);
    byVerification.set(q.verificationStatus || "SEM_STATUS", (byVerification.get(q.verificationStatus || "SEM_STATUS") || 0) + 1);
  }

  const examMap = new Map(exams.map(exam => [exam.id, exam]));
  const historicalByExam = new Map();
  const historicalByTopic = new Map();

  for (const q of historicalQuestions) {
    historicalByExam.set(q.examId, (historicalByExam.get(q.examId) || 0) + 1);
    if (q.topicId) historicalByTopic.set(q.topicId, (historicalByTopic.get(q.topicId) || 0) + 1);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    totalTopics: topics.length,
    officialQuestions: questions.filter(q => OFFICIAL.has(q.origin)).length,
    generatedQuestions: questions.filter(q => q.origin === "INEDITA_IA" || q.origin === "AI_GENERATED").length,
    byOrigin: Object.fromEntries(byOrigin),
    byDifficulty: Object.fromEntries(byDifficulty),
    byVerification: Object.fromEntries(byVerification),
    historical: {
      exams: exams.map(exam => ({
        ...exam,
        questions: historicalByExam.get(exam.id) || 0,
      })),
      totalQuestions: historicalQuestions.length,
      byTopic: Object.fromEntries(historicalByTopic),
      byVerification: Object.fromEntries(
        historicalQuestions.reduce((map, q) => {
          const key = q.verificationStatus || "SEM_STATUS";
          map.set(key, (map.get(key) || 0) + 1);
          return map;
        }, new Map())
      ),
      byQuestionType: Object.fromEntries(
        historicalQuestions.reduce((map, q) => {
          const key = q.questionType || "SEM_TIPO";
          map.set(key, (map.get(key) || 0) + 1);
          return map;
        }, new Map())
      ),
      byCognitiveLevel: Object.fromEntries(
        historicalQuestions.reduce((map, q) => {
          const key = q.cognitiveLevel || "SEM_NIVEL";
          map.set(key, (map.get(key) || 0) + 1);
          return map;
        }, new Map())
      ),
    },
    coverage: topics.map(t => ({
      code: t.code,
      subject: t.subject.name,
      topic: t.title,
      questions: byTopic.get(t.id) || 0,
      historicalQuestions: historicalByTopic.get(t.id) || 0,
    })),
  };

  const empty = report.coverage.filter(t => t.questions === 0);
  const invalidDifficulty = [...byDifficulty.keys()].filter(d => !DIFFICULTIES.has(d));
  const unverifiedOfficial = questions.filter(q =>
    OFFICIAL.has(q.origin) && !q.sourceRef && !q.sourceUrl && !q.sourceQuestion
  );

  console.log(JSON.stringify({
    ...report,
    coveragePercent: topics.length ? Number((((topics.length - empty.length) / topics.length) * 100).toFixed(1)) : 0,
    emptyTopics: empty,
    invalidDifficulties: invalidDifficulty,
    unverifiedOfficialQuestions: unverifiedOfficial.length,
  }, null, 2));

  if (process.env.STRICT === "1" && (empty.length || invalidDifficulty.length || unverifiedOfficial.length)) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
