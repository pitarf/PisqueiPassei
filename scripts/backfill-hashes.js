const { PrismaClient } = require("@prisma/client");
const { computeStatementHash } = require("../src/lib/question-validator");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando backfill de statementHash nas questões existentes...");
  const questions = await prisma.question.findMany({
    select: { id: true, statement: true, statementHash: true },
  });

  console.log(`Total de questões encontradas: ${questions.length}`);
  let updated = 0;

  for (const q of questions) {
    const hash = computeStatementHash(q.statement);
    if (q.statementHash !== hash) {
      await prisma.question.update({
        where: { id: q.id },
        data: { statementHash: hash },
      });
      updated++;
    }
  }

  console.log(`Backfill concluído com sucesso. Atualizadas: ${updated}/${questions.length}`);
}

main()
  .catch((err) => {
    console.error("Erro no backfill:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
