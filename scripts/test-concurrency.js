const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'rafael@estudos.transpetro' } });
  if (!user) throw new Error('Usuário de auditoria não encontrado.');

  const topic = await prisma.topic.findFirst({ orderBy: { order: 'asc' } });
  if (!topic) throw new Error('Nenhum tópico disponível para auditoria.');

  let question = await prisma.question.findFirst({ where: { topicId: topic.id } });
  let created = false;
  if (!question) {
    question = await prisma.question.create({
      data: {
        topicId: topic.id,
        statement: 'Questão teste de auditoria de concorrência e idempotência Cesgranrio',
        optionA: 'Opção A',
        optionB: 'Opção B',
        optionC: 'Opção C',
        optionD: 'Opção D',
        optionE: 'Opção E',
        correctOption: 'A',
        explanation: 'Explicação teste',
        difficulty: 'MEDIA',
        origin: 'AI_GENERATED',
        banca: 'IA (perfil Cesgranrio)',
      },
    });
    created = true;
  }

  const beforeUser = await prisma.user.findUnique({ where: { id: user.id } });
  const beforeProgress = await prisma.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId: question.topicId } } });
  const testKey = 'audit-test-key-' + Date.now();
  console.log('Testando duas requisições concorrentes com a mesma key:', testKey);

  const payload = JSON.stringify({
    questionId: question.id,
    chosenOption: 'A',
    timeSpentSeconds: 45,
    idempotencyKey: testKey,
  });

  const [res1, res2] = await Promise.all([
    fetch('http://localhost:3000/api/questions/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
    fetch('http://localhost:3000/api/questions/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
  ]);

  const data1 = await res1.json();
  const data2 = await res2.json();
  console.log('Resposta 1:', res1.status, data1);
  console.log('Resposta 2:', res2.status, data2);

  if (![res1.status, res2.status].every((status) => status === 200)) throw new Error('Concorrência retornou status diferente de 200.');
  if (![data1, data2].filter((data) => data.duplicate === false).length !== 1) throw new Error('Esperava exatamente uma resposta efetivamente processada.');
  if (![data1, data2].filter((data) => data.duplicate === true).length !== 1) throw new Error('Esperava exatamente uma resposta duplicada/idempotente.');

  const attempts = await prisma.questionAttempt.findMany({ where: { idempotencyKey: testKey } });
  if (attempts.length !== 1) throw new Error(`Falha de idempotência: ${attempts.length} registros encontrados, esperado 1.`);

  const afterUser = await prisma.user.findUnique({ where: { id: user.id } });
  const afterProgress = await prisma.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId: question.topicId } } });
  const xpDelta = (afterUser?.xp || 0) - (beforeUser?.xp || 0);
  const questionDelta = (afterProgress?.totalQuestions || 0) - (beforeProgress?.totalQuestions || 0);
  const correctDelta = (afterProgress?.correctAnswers || 0) - (beforeProgress?.correctAnswers || 0);

  if (xpDelta !== 10) throw new Error(`XP incorreto após concorrência: +${xpDelta}, esperado +10.`);
  if (questionDelta !== 1) throw new Error(`Progresso incorreto após concorrência: +${questionDelta} questões, esperado +1.`);
  if (correctDelta !== 1) throw new Error(`Acertos incorretos após concorrência: +${correctDelta}, esperado +1.`);

  console.log('✅ Concorrência/idempotência validada: 1 attempt, +10 XP e +1 questão/+1 acerto.');

  // Limpeza reversível da auditoria, preservando o estado anterior do usuário/progresso.
  await prisma.questionAttempt.deleteMany({ where: { idempotencyKey: testKey } });
  if (beforeProgress) {
    await prisma.userTopicProgress.update({
      where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
      data: {
        totalQuestions: beforeProgress.totalQuestions,
        correctAnswers: beforeProgress.correctAnswers,
        masteryScore: beforeProgress.masteryScore,
        status: beforeProgress.status,
        lastStudiedAt: beforeProgress.lastStudiedAt,
        totalTimeMinutes: beforeProgress.totalTimeMinutes,
      },
    });
  } else {
    await prisma.userTopicProgress.deleteMany({ where: { userId: user.id, topicId: question.topicId } });
  }
  if (beforeUser) {
    await prisma.user.update({ where: { id: user.id }, data: { xp: beforeUser.xp, lastStudyDate: beforeUser.lastStudyDate, currentStreak: beforeUser.currentStreak } });
  }
  if (created) await prisma.question.delete({ where: { id: question.id } });
}

run().catch((error) => {
  console.error('❌ Auditoria de concorrência falhou:', error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
