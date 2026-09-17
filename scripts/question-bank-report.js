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
  const topics = await prisma.topic.findMany({
    include: { subject: true, _count: { select: { questions: true } } },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });

  const questions = await prisma.question.findMany({
    select: { origin: true, difficulty: true, topicId: true },
  });

  const byTopic = new Map();
  const byOrigin = new Map();
  const byDifficulty = new Map();

  for (const q of questions) {
    byTopic.set(q.topicId, (byTopic.get(q.topicId) || 0) + 1);
    byOrigin.set(q.origin || "SEM_ORIGEM", (byOrigin.get(q.origin || "SEM_ORIGEM") || 0) + 1);
    byDifficulty.set(q.difficulty || "SEM_DIFICULDADE", (byDifficulty.get(q.difficulty || "SEM_DIFICULDADE") || 0) + 1);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    totalTopics: topics.length,
    officialQuestions: questions.filter(q => OFFICIAL.has(q.origin)).length,
    generatedQuestions: questions.filter(q => q.origin === "INEDITA_IA" || q.origin === "AI_GENERATED").length,
    byOrigin: Object.fromEntries(byOrigin),
    byDifficulty: Object.fromEntries(byDifficulty),
    coverage: topics.map(t => ({
      code: t.code,
      subject: t.subject.name,
      topic: t.title,
      questions: byTopic.get(t.id) || 0,
    })),
  };

  const empty = report.coverage.filter(t => t.questions === 0);
  const invalidDifficulty = [...byDifficulty.keys()].filter(d => !DIFFICULTIES.has(d));

  console.log(JSON.stringify({
    ...report,
    coveragePercent: topics.length ? Number((((topics.length - empty.length) / topics.length) * 100).toFixed(1)) : 0,
    emptyTopics: empty,
    invalidDifficulties: invalidDifficulty,
  }, null, 2));

  if (process.env.STRICT === "1" && (empty.length || invalidDifficulty.length)) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
