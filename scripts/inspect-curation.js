/**
 * Script de Inspeção e Diagnóstico para a Curadoria dos 470 Itens
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🔍 DIAGNÓSTICO DE CURADORIA - QUESTÕES E SEED");
  console.log("==================================================\n");

  const allQuestions = await prisma.question.findMany({
    include: {
      topic: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total de questões no banco: ${allQuestions.length}`);

  // 1. Identificar questões do seed (AI_GENERATED ou sem metadata)
  const seedQuestions = allQuestions.filter(
    (q) => q.origin === "AI_GENERATED" || !q.questionType || !q.cognitiveLevel
  );
  console.log(`Questões identificadas com perfil de Seed / Sem Metadata: ${seedQuestions.length}`);

  const seedBySubject = {};
  for (const q of seedQuestions) {
    const sName = q.topic.subject.name;
    seedBySubject[sName] = (seedBySubject[sName] || 0) + 1;
  }
  console.log("Distribuição das questões de seed por disciplina:", seedBySubject);

  // 2. Diagnóstico de Administração e Logística
  const adminQuestions = allQuestions.filter(
    (q) => q.topic.subject.name.includes("Administração")
  );
  console.log(`\nQuestões em 1. Noções de Administração e Logística: ${adminQuestions.length}`);
  const adminGabarito = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let adminSeedCount = 0;
  for (const q of adminQuestions) {
    adminGabarito[q.correctOption] = (adminGabarito[q.correctOption] || 0) + 1;
    if (q.origin === "AI_GENERATED" || !q.questionType) adminSeedCount++;
  }
  console.log("Gabarito de Administração:", adminGabarito);
  console.log(`Questões de Administração que vieram do seed: ${adminSeedCount} de ${adminQuestions.length}`);

  // 3. Detalhes dos enunciados de Administração
  console.log("\nAmostra dos enunciados de Administração:");
  adminQuestions.slice(0, 8).forEach((q, idx) => {
    console.log(`[${idx + 1}] ID: ${q.id} | Gabarito: ${q.correctOption} | Origem: ${q.origin} | Tópico: ${q.topic.title}`);
    console.log(`    Enunciado: ${q.statement.slice(0, 90)}...`);
    console.log(`    Opção C: ${q.optionC.slice(0, 70)}...`);
  });

  // 4. Detalhes de Português
  const portQuestions = allQuestions.filter(
    (q) => q.topic.subject.name.includes("Portuguesa")
  );
  console.log(`\nQuestões em Língua Portuguesa: ${portQuestions.length}`);
  let portBoilerplate = 0;
  for (const q of portQuestions) {
    if (q.statement.includes("[Língua Portuguesa") || q.statement.includes("Item")) {
      portBoilerplate++;
      console.log(`  - Português Boilerplate ID: ${q.id} | Tópico: ${q.topic.title} | ${q.statement.slice(0, 80)}`);
    }
  }
  console.log(`Português com boilerplate: ${portBoilerplate}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erro no diagnóstico:", err);
  prisma.$disconnect();
  process.exit(1);
});
