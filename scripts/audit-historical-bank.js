const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");

const OFFICIAL_ORIGINS = new Set([
  "OFICIAL_TRANSPETRO",
  "OFICIAL_PETROBRAS",
  "OFICIAL_CESGRANRIO",
  "OFICIAL_OUTRA",
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const questions = await prisma.question.findMany({
    include: { topic: { include: { subject: true } } },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map();
  const candidates = [];

  for (const q of questions) {
    const key = normalize(q.statement);
    const previous = seen.get(key);

    if (previous) {
      candidates.push({
        duplicateId: q.id,
        keepId: previous.id,
        statement: q.statement.slice(0, 160),
      });
    } else {
      seen.set(key, q);
    }
  }

  const historical = await prisma.historicalQuestion.findMany({
    include: { exam: true, topic: { include: { subject: true } } },
    orderBy: { createdAt: "asc" },
  });

  const historicalGaps = historical.map(q => ({
    id: q.id,
    exam: `${q.exam.organization} ${q.exam.year}`,
    questionNumber: q.questionNumber,
    missing: [
      !q.topicId ? "topicId" : null,
      !q.questionType ? "questionType" : null,
      !q.cognitiveLevel ? "cognitiveLevel" : null,
      !q.difficulty ? "difficulty" : null,
      !q.verificationStatus ? "verificationStatus" : null,
    ].filter(Boolean),
  })).filter(item => item.missing.length);

  const report = {
    dryRun: DRY,
    totalQuestions: questions.length,
    totalHistoricalQuestions: historical.length,
    historicalMetadataGaps: historicalGaps.length,
    historicalGaps,
    duplicateGroups: candidates.length,
    provenanceGaps: provenanceGaps.length,
    metadataGaps: metadataGaps.length,
    candidates,
    provenanceGaps,
    metadataGaps,
  };

  console.log(JSON.stringify(report, null, 2));

  if (DRY || !candidates.length) return;

  console.log("Modo de limpeza automática desativado por segurança: duplicidades precisam de revisão semântica antes de apagar dados.");
}

main()
  .catch(error => {
    console.error("Historical bank audit failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
