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

  const provenanceGaps = questions
    .filter(q => OFFICIAL_ORIGINS.has(q.origin))
    .filter(q => !q.sourceRef || !q.sourceRef.trim())
    .map(q => ({ id: q.id, statement: q.statement.slice(0, 160) }));

  const metadataGaps = questions
    .filter(q => !q.questionType || !q.cognitiveLevel)
    .map(q => ({
      id: q.id,
      origin: q.origin,
      topic: q.topic.code,
      missing: [
        !q.questionType ? "questionType" : null,
        !q.cognitiveLevel ? "cognitiveLevel" : null,
      ].filter(Boolean),
    }));

  const report = {
    dryRun: DRY,
    totalQuestions: questions.length,
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
