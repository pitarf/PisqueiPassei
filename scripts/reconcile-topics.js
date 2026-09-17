const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando reconciliação da taxonomia de tópicos oficiais...");

  const mathSubject = await prisma.subject.findFirst({
    where: { name: "Matemática" },
    include: { topics: true },
  });

  if (!mathSubject) {
    console.log("Matemática não encontrada.");
    return;
  }

  const topic11 = mathSubject.topics.find((t) => t.code === "11");
  const topic12 = mathSubject.topics.find((t) => t.code === "12");
  const topic9 = mathSubject.topics.find((t) => t.code === "9");
  const topic10 = mathSubject.topics.find((t) => t.code === "10");

  if (topic11) {
    console.log(`Identificado tópico residual 11 ("${topic11.title}").`);
    // Se houver progresso real (masteryScore > 0 ou status != NAO_INICIADO), migrar para topic9
    if (topic9) {
      const p11 = await prisma.userTopicProgress.findFirst({ where: { topicId: topic11.id } });
      if (p11 && p11.masteryScore > 0) {
        await prisma.userTopicProgress.update({
          where: { userId_topicId: { userId: p11.userId, topicId: topic9.id } },
          data: {
            masteryScore: Math.max(p11.masteryScore, 0),
            status: p11.status !== "NAO_INICIADO" ? p11.status : undefined,
          },
        });
      }
    }
    await prisma.userTopicProgress.deleteMany({ where: { topicId: topic11.id } });
    await prisma.topic.delete({ where: { id: topic11.id } });
    console.log("✅ Tópico 11 removido com sucesso.");
  }

  if (topic12) {
    console.log(`Identificado tópico residual 12 ("${topic12.title}").`);
    if (topic10) {
      const p12 = await prisma.userTopicProgress.findFirst({ where: { topicId: topic12.id } });
      if (p12 && p12.masteryScore > 0) {
        await prisma.userTopicProgress.update({
          where: { userId_topicId: { userId: p12.userId, topicId: topic10.id } },
          data: {
            masteryScore: Math.max(p12.masteryScore, 0),
            status: p12.status !== "NAO_INICIADO" ? p12.status : undefined,
          },
        });
      }
    }
    await prisma.userTopicProgress.deleteMany({ where: { topicId: topic12.id } });
    await prisma.topic.delete({ where: { id: topic12.id } });
    console.log("✅ Tópico 12 removido com sucesso.");
  }

  const finalCount = await prisma.topic.count();
  console.log(`🎯 Contagem final de tópicos no banco: ${finalCount} (Esperado: 47)`);
}

main()
  .catch((e) => {
    console.error("Erro na reconciliação:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
