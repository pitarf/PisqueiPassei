const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'rafael@estudos.transpetro' } });
  const topic = await prisma.topic.findFirst();
  let question = await prisma.question.findFirst();
  let created = false;
  if (!question) {
    question = await prisma.question.create({
      data: {
        topicId: topic.id,
        statement: 'Questao teste de auditoria de concorrencia e idempotencia Cesgranrio',
        optionA: 'Opcao A',
        optionB: 'Opcao B',
        optionC: 'Opcao C',
        optionD: 'Opcao D',
        optionE: 'Opcao E',
        correctOption: 'A',
        explanation: 'Explicacao teste',
        difficulty: 'MEDIA',
        origin: 'AI_GENERATED',
        banca: 'Cesgranrio'
      }
    });
    created = true;
  }

  const testKey = 'audit-test-key-' + Date.now();
  console.log('Testando requisicoes concorrentes com a mesma key:', testKey);

  const payload = JSON.stringify({
    questionId: question.id,
    chosenOption: 'A',
    timeSpentSeconds: 45,
    idempotencyKey: testKey
  });

  const [res1, res2] = await Promise.all([
    fetch('http://localhost:3000/api/questions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }),
    fetch('http://localhost:3000/api/questions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    })
  ]);

  const data1 = await res1.json();
  const data2 = await res2.json();

  console.log('Resposta 1 status:', res1.status, data1);
  console.log('Resposta 2 status:', res2.status, data2);

  // Limpeza
  await prisma.questionAttempt.deleteMany({ where: { idempotencyKey: testKey } });
  if (created) {
    await prisma.question.delete({ where: { id: question.id } });
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
