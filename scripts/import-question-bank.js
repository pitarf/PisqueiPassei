const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ORIGINS = new Set([
  "OFICIAL_TRANSPETRO",
  "OFICIAL_PETROBRAS",
  "OFICIAL_CESGRANRIO",
  "OFICIAL_OUTRA",
  "ADAPTADA",
  "INEDITA_IA",
]);

const DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatório inválido: ${field}`);
  }
  return value.trim();
}

function validateQuestion(item, index) {
  if (!item || typeof item !== "object") throw new Error(`Questão #${index}: registro inválido.`);

  const origin = requireString(item.origin, `#${index}.origin`);
  const difficulty = String(item.difficulty || "MEDIA").toUpperCase();

  if (!ORIGINS.has(origin)) throw new Error(`Questão #${index}: origin inválido: ${origin}`);
  if (!DIFFICULTIES.has(difficulty)) throw new Error(`Questão #${index}: difficulty inválida: ${difficulty}`);

  const options = ["A", "B", "C", "D", "E"].map((letter) =>
    requireString(item[`option${letter}`], `#${index}.option${letter}`)
  );

  if (new Set(options.map(normalize)).size !== 5) {
    throw new Error(`Questão #${index}: alternativas duplicadas.`);
  }

  const correctOption = requireString(item.correctOption, `#${index}.correctOption`).toUpperCase();
  if (!/^[A-E]$/.test(correctOption)) {
    throw new Error(`Questão #${index}: correctOption deve ser A-E.`);
  }

  const statement = requireString(item.statement, `#${index}.statement`);
  const explanation = requireString(item.explanation, `#${index}.explanation`);
  const subject = requireString(item.subject, `#${index}.subject`);
  const topicCode = requireString(item.topicCode, `#${index}.topicCode`);

  return {
    statement,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    optionE: options[4],
    correctOption,
    explanation,
    difficulty,
    origin,
    subject,
    topicCode,
    examYear: item.examYear == null ? null : Number(item.examYear),
    banca: typeof item.banca === "string" && item.banca.trim() ? item.banca.trim() : "Não informado",
    sourceRef: item.sourceRef ? String(item.sourceRef) : null,
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Uso: node scripts/import-question-bank.js <arquivo.json> [--dry-run]");
  }

  const absolutePath = path.resolve(inputPath);
  const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const items = Array.isArray(payload) ? payload : payload.questions;

  if (!Array.isArray(items)) throw new Error("O JSON precisa ser um array ou possuir a propriedade questions[].");

  const validated = items.map((item, index) => validateQuestion(item, index + 1));
  const existing = await prisma.question.findMany({ select: { statement: true } });
  const existingStatements = new Set(existing.map((q) => normalize(q.statement)));

  const report = {
    input: absolutePath,
    total: validated.length,
    ready: 0,
    duplicates: 0,
    created: 0,
    dryRun: process.argv.includes("--dry-run"),
    errors: [],
  };

  const topicCache = new Map();

  for (const question of validated) {
    const key = normalize(question.statement);
    if (existingStatements.has(key)) {
      report.duplicates++;
      continue;
    }

    const cacheKey = `${question.subject}::${question.topicCode}`;
    let topic = topicCache.get(cacheKey);

    if (!topic) {
      const subject = await prisma.subject.findFirst({ where: { name: question.subject } });
      if (!subject) throw new Error(`Matéria não encontrada: ${question.subject}`);

      topic = await prisma.topic.findFirst({
        where: { subjectId: subject.id, code: question.topicCode },
      });
      if (!topic) {
        throw new Error(`Tópico não encontrado: ${question.subject} / ${question.topicCode}`);
      }
      topicCache.set(cacheKey, topic);
    }

    report.ready++;

    if (!report.dryRun) {
      await prisma.question.create({
        data: {
          topicId: topic.id,
          statement: question.statement,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          optionE: question.optionE,
          correctOption: question.correctOption,
          explanation: question.explanation,
          difficulty: question.difficulty,
          origin: question.origin,
          examYear: question.examYear,
          banca: question.banca,
          sourceRef: question.sourceRef,
        },
      });
      existingStatements.add(key);
      report.created++;
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Question bank import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
