/**
 * Mapeamento detalhado das 60 questões do seed
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function mapSeed() {
  const seedQs = await prisma.question.findMany({
    where: {
      OR: [
        { origin: "AI_GENERATED" },
        { questionType: null },
        { statement: { contains: "Item" } }
      ]
    },
    include: {
      topic: {
        include: { subject: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Encontradas ${seedQs.length} questões com perfil de seed.`);
  const bySubject = {};
  for (const q of seedQs) {
    const s = q.topic.subject.name;
    if (!bySubject[s]) bySubject[s] = [];
    bySubject[s].push({
      id: q.id,
      topicId: q.topicId,
      topicCode: q.topic.code,
      topicTitle: q.topic.title,
      correctOption: q.correctOption,
      statementSnippet: q.statement.slice(0, 70)
    });
  }

  for (const [sub, list] of Object.entries(bySubject)) {
    console.log(`\n=== ${sub} (${list.length} questões) ===`);
    list.forEach((item, i) => {
      console.log(`  ${i+1}. [${item.topicCode}] ${item.topicTitle} -> ID: ${item.id} (Gab: ${item.correctOption})`);
    });
  }

  await prisma.$disconnect();
}

mapSeed().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
