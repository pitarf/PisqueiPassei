const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OFFICIAL_ORIGINS = new Set([
  "OFICIAL_TRANSPETRO",
  "OFICIAL_PETROBRAS",
  "OFICIAL_CESGRANRIO",
  "OFICIAL_OUTRA",
]);

const ALLOWED_DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/\\s+/g, " ")
    .trim();
}

function isOriginal(origin) {
  return origin === "INEDITA_IA" || origin === "AI_GENERATED";
}

async function main() {
  const [questions, topics] = await Promise.all([
    prisma.question.findMany({
      orderBy: { createdAt: "asc" },
      include: { topic: { include: { subject: true } } },
    }),
    prisma.topic.findMany({
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
      include: { subject: true },
    }),
  ]);

  const duplicateMap = new Map();
  const missingProvenance = [];
  const invalid = [];
  const byTopic = new Map();
  const byOrigin = new Map();
  const byDifficulty = new Map();

  for (const q of questions) {
    const key = normalize(q.statement);
    const ids = duplicateMap.get(key) || [];
    ids.push(q.id);
    duplicateMap.set(key, ids);

    byTopic.set(q.topicId, (byTopic.get(q.topicId) || 0) + 1);
    byOrigin.set(q.origin || "SEM_ORIGEM", (byOrigin.get(q.origin || "SEM_ORIGEM") || 0) + 1);
    byDifficulty.set(q.difficulty || "SEM_DIFICULDADE", (byDifficulty.get(q.difficulty || "SEM_DIFICULDADE") || 0) + 1);

    const hasSource = Boolean(q.sourceRef && q.sourceRef.trim());
    const official = OFFICIAL_ORIGINS.has(q.origin);
    const original = isOriginal(q.origin);

    if (!hasSource && (official || original)) {
      missingProvenance.push({
        id: q.id,
        origin: q.origin,
        statement: q.statement.slice(0, 120),
      });
    }

    if (!ALLOWED_DIFFICULTIES.has(q.difficulty)) {
      invalid.push({ id: q.id, field: "difficulty", value: q.difficulty });
    }

    if (!/^[A-E]$/.test(q.correctOption || "")) {
      invalid.push({ id: q.id, field: "correctOption", value: q.correctOption });
    }

    const options = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE].map(normalize);
    if (new Set(options).size !== 5) {
      invalid.push({ id: q.id, field: "options", value: "duplicadas" });
    }
  }

  const duplicates = [...duplicateMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([statement, ids]) => ({ statement, count: ids.length, ids }));

  const missingTopics = topics
    .filter((topic) => !byTopic.has(topic.id))
    .map((topic) => ({
      code: topic.code,
      subject: topic.subject.name,
      title: topic.title,
    }));

  const official = questions.filter((q) => OFFICIAL_ORIGINS.has(q.origin)).length;
  const generated = questions.filter(isOriginal).length;

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      questions: questions.length,
      topics: topics.length,
      topicsWithQuestions: topics.length - missingTopics.length,
      official,
      generated,
      other: questions.length - official - generated,
    },
    byOrigin: Object.fromEntries(byOrigin),
    byDifficulty: Object.fromEntries(byDifficulty),
    duplicateGroups: duplicates.length,
    duplicatedQuestions: duplicates.reduce((sum, group) => sum + group.count, 0),
    missingProvenance: missingProvenance.length,
    invalidRecords: invalid.length,
    emptyTopics: missingTopics.length,
    status:
      duplicates.length === 0 &&
      missingProvenance.length === 0 &&
      invalid.length === 0
        ? "OK"
        : "REVIEW_REQUIRED",
    details: {
      duplicates: duplicates.slice(0, 50),
      missingProvenance: missingProvenance.slice(0, 100),
      invalid: invalid.slice(0, 100),
      emptyTopics: missingTopics,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  if (process.env.STRICT === "1" && report.status !== "OK") {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error("Question bank audit failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
