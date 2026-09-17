const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.topic.count();
  console.log("=== DB AUDIT ===");
  console.log("Total topics in DB:", count);
  const subjects = await prisma.subject.findMany({
    include: { topics: true },
    orderBy: { order: "asc" },
  });
  console.log("Total subjects in DB:", subjects.length);
  for (const s of subjects) {
    console.log(`- ${s.name} (order: ${s.order}): ${s.topics.length} tópicos`);
    if (s.name === "Matemática") {
      s.topics.forEach(t => console.log(`   code: "${t.code}", id: "${t.id}", title: "${t.title}"`));
    }
  }

  const math11 = await prisma.topic.findFirst({ where: { code: "11" }, include: { lessons: true, questions: true, flashcards: true, userProgress: true } });
  const math12 = await prisma.topic.findFirst({ where: { code: "12" }, include: { lessons: true, questions: true, flashcards: true, userProgress: true } });
  console.log("Topic 11 relations:", {
    lessons: math11?.lessons.length,
    questions: math11?.questions.length,
    flashcards: math11?.flashcards.length,
    userProgress: math11?.userProgress.length,
  });
  console.log("Topic 12 relations:", {
    lessons: math12?.lessons.length,
    questions: math12?.questions.length,
    flashcards: math12?.flashcards.length,
    userProgress: math12?.userProgress.length,
  });

  const questionCount = await prisma.question.count();
  console.log("Total questions in DB:", questionCount);

  const flashcardCount = await prisma.flashcard.count();
  console.log("Total flashcards in DB:", flashcardCount);

  const progressCount = await prisma.userTopicProgress.count();
  console.log("Total user topic progress rows:", progressCount);

  const simulations = await prisma.simulation.count();
  console.log("Total simulations in DB:", simulations);
}

main().finally(() => prisma.$disconnect());
