const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

function hashStatement(text) {
  return crypto.createHash("sha256").update(normalize(text)).digest("hex");
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalInt(value, field) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Valor inteiro inválido: ${field}`);
  return parsed;
}

function requiredInt(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Valor inteiro obrigatório inválido: ${field}`);
  return parsed;
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

  const sourceRef = optionalString(item.sourceRef);
  const sourceUrl = optionalString(item.sourceUrl);
  const sourceQuestion = optionalString(item.sourceQuestion);
  const verificationStatus = (optionalString(item.verificationStatus) || "PENDENTE").toUpperCase();
  const questionType = optionalString(item.questionType)?.toUpperCase() || null;
  const cognitiveLevel = optionalString(item.cognitiveLevel)?.toUpperCase() || null;

  if (!["PENDENTE", "VERIFICADA", "REVISAR"].includes(verificationStatus)) {
    throw new Error(`Questão #${index}: verificationStatus inválido: ${verificationStatus}`);
  }

  if (origin.startsWith("OFICIAL_") && !sourceRef && !sourceUrl && !sourceQuestion) {
    throw new Error(`Questão #${index}: questão oficial exige ao menos sourceRef, sourceUrl ou sourceQuestion.`);
  }

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
    examYear: optionalInt(item.examYear, `#${index}.examYear`),
    banca: optionalString(item.banca) || "Não informado",
    sourceRef,
    sourceUrl,
    sourcePage: optionalInt(item.sourcePage, `#${index}.sourcePage`),
    sourceQuestion,
    questionType,
    cognitiveLevel,
    subtopic: optionalString(item.subtopic),
    referenceIdsJson: Array.isArray(item.referenceQuestionIds) ? item.referenceQuestionIds : null,
    verificationStatus,
    questionNumber: optionalString(item.questionNumber),
    notes: optionalString(item.notes),
  };
}

function validateExam(exam) {
  if (!exam) return null;
  return {
    organization: requireString(exam.organization, "exam.organization"),
    processName: requireString(exam.processName, "exam.processName"),
    year: requiredInt(exam.year, "exam.year"),
    role: optionalString(exam.role),
    emphasis: optionalString(exam.emphasis),
    banca: optionalString(exam.banca),
    examCode: optionalString(exam.examCode),
    sourceUrl: optionalString(exam.sourceUrl),
    notes: optionalString(exam.notes),
  };
}

async function resolveTopic(question, cache) {
  const cacheKey = `${question.subject}::${question.topicCode}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const subject = await prisma.subject.findFirst({ where: { name: question.subject } });
  if (!subject) throw new Error(`Matéria não encontrada: ${question.subject}`);

  const topic = await prisma.topic.findFirst({
    where: { subjectId: subject.id, code: question.topicCode },
  });
  if (!topic) throw new Error(`Tópico não encontrado: ${question.subject} / ${question.topicCode}`);

  cache.set(cacheKey, topic);
  return topic;
}

async function resolveHistoricalExam(exam) {
  if (!exam) return null;
  const where = {
    organization: exam.organization,
    processName: exam.processName,
    year: exam.year,
    ...(exam.examCode ? { examCode: exam.examCode } : {}),
  };

  const existing = await prisma.historicalExam.findFirst({ where });
  if (existing) {
    return prisma.historicalExam.update({
      where: { id: existing.id },
      data: {
        role: exam.role,
        emphasis: exam.emphasis,
        banca: exam.banca,
        sourceUrl: exam.sourceUrl,
        notes: exam.notes,
        accessedAt: new Date(),
      },
    });
  }

  return prisma.historicalExam.create({
    data: {
      ...exam,
      accessedAt: new Date(),
    },
  });
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Uso: node scripts/import-question-bank.js <arquivo.json> [--dry-run]");
  }

  const absolutePath = path.resolve(inputPath);
  const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const items = Array.isArray(payload) ? payload : payload.questions;
  const exam = validateExam(Array.isArray(payload) ? null : payload.exam);

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
    historicalCreated: 0,
    historicalUpdated: 0,
    dryRun: process.argv.includes("--dry-run"),
    errors: [],
  };

  const topicCache = new Map();
  let historicalExam = null;

  if (exam && !report.dryRun) {
    const before = await prisma.historicalExam.findFirst({
      where: {
        organization: exam.organization,
        processName: exam.processName,
        year: exam.year,
        ...(exam.examCode ? { examCode: exam.examCode } : {}),
      },
      select: { id: true },
    });
    historicalExam = await resolveHistoricalExam(exam);
    if (before) report.historicalUpdated++;
    else report.historicalCreated++;
  }

  for (const question of validated) {
    const key = normalize(question.statement);
    const duplicate = existingStatements.has(key);
    if (duplicate) report.duplicates++;

    const topic = await resolveTopic(question, topicCache);
    report.ready++;

    if (!report.dryRun) {
      if (!duplicate) {
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
            sourceUrl: question.sourceUrl,
            sourcePage: question.sourcePage,
            sourceQuestion: question.sourceQuestion,
            questionType: question.questionType,
            cognitiveLevel: question.cognitiveLevel,
            subtopic: question.subtopic,
            referenceIdsJson: question.referenceIdsJson,
            verificationStatus: question.verificationStatus,
          },
        });
        existingStatements.add(key);
        report.created++;
      }

      if (historicalExam && question.questionNumber) {
        const historicalBefore = await prisma.historicalQuestion.findUnique({
          where: {
            examId_questionNumber: {
              examId: historicalExam.id,
              questionNumber: question.questionNumber,
            },
          },
          select: { id: true },
        });
        await prisma.historicalQuestion.upsert({
          where: {
            examId_questionNumber: {
              examId: historicalExam.id,
              questionNumber: question.questionNumber,
            },
          },
          create: {
            examId: historicalExam.id,
            questionNumber: question.questionNumber,
            page: question.sourcePage,
            topicId: topic.id,
            questionType: question.questionType,
            cognitiveLevel: question.cognitiveLevel,
            difficulty: question.difficulty,
            statementHash: hashStatement(question.statement),
            verificationStatus: question.verificationStatus,
            notes: question.notes,
          },
          update: {
            page: question.sourcePage,
            topicId: topic.id,
            questionType: question.questionType,
            cognitiveLevel: question.cognitiveLevel,
            difficulty: question.difficulty,
            statementHash: hashStatement(question.statement),
            verificationStatus: question.verificationStatus,
            notes: question.notes,
          },
        });
        if (historicalBefore) report.historicalUpdated++;
        else report.historicalCreated++;
      }
    }
  }

  if (report.dryRun && exam) {
    report.historicalExam = exam;
    report.historicalQuestionRecords = validated.filter(q => q.questionNumber).length;
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Question bank import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
