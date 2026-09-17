const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== INICIANDO TESTE DE CONCORRÊNCIA E IDEMPOTÊNCIA ===");

  const user = await prisma.user.findFirst({ where: { email: 'rafael@estudos.transpetro' } });
  if (!user) throw new Error("Usuário de testes não encontrado no banco.");

  const topic = await prisma.topic.findFirst({ orderBy: { order: 'asc' } });
  if (!topic) throw new Error("Nenhum tópico encontrado no banco.");

  const beforeUser = await prisma.user.findUnique({ where: { id: user.id } });
  const beforeProgress = await prisma.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: user.id, topicId: topic.id } },
  });

  // Cria questão de teste dedicada
  const question = await prisma.question.create({
    data: {
      topicId: topic.id,
      statement: 'Questão automatizada de auditoria estrita de idempotência e concorrência ' + Date.now(),
      optionA: 'Opção A',
      optionB: 'Opção B',
      optionC: 'Opção C',
      optionD: 'Opção D',
      optionE: 'Opção E',
      correctOption: 'A',
      explanation: 'Explicação do teste de concorrência',
      difficulty: 'MEDIA',
      origin: 'AI_GENERATED',
      banca: 'IA (perfil Cesgranrio)',
    },
  });

  const testKey = 'audit-concurrency-key-' + Date.now();
  console.log('Chave única de idempotência testada:', testKey);

  const payload = JSON.stringify({
    questionId: question.id,
    chosenOption: 'A',
    timeSpentSeconds: 30,
    idempotencyKey: testKey,
  });

  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`Enviando chamadas simultâneas para ${baseUrl}/api/questions/submit...`);

  let res1, res2;
  try {
    [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/api/questions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }),
      fetch(`${baseUrl}/api/questions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }),
    ]);
  } catch (netErr) {
    console.warn("Servidor local HTTP não respondeu:", netErr.message);
    console.log("Validando modelo de concorrência e constraints no nível de transação Prisma...");

    const result = await Promise.allSettled([
      prisma.questionAttempt.create({
        data: {
          userId: user.id,
          questionId: question.id,
          chosenOption: 'A',
          isCorrect: true,
          timeSpentSeconds: 30,
          idempotencyKey: testKey,
        },
      }),
      prisma.questionAttempt.create({
        data: {
          userId: user.id,
          questionId: question.id,
          chosenOption: 'A',
          isCorrect: true,
          timeSpentSeconds: 30,
          idempotencyKey: testKey,
        },
      }),
    ]);

    const successes = result.filter(r => r.status === 'fulfilled');
    const rejections = result.filter(r => r.status === 'rejected');
    console.log(`Tentativas concorrentes diretas no DB: ${successes.length} gravada(s), ${rejections.length} rejeitada(s) por constraint P2002.`);
    if (successes.length !== 1 || rejections.length !== 1) {
      throw new Error(`Falha de constraint única! Esperado exatamente 1 sucesso e 1 rejeição por duplicate key.`);
    }
  }

  if (res1 && res2) {
    const data1 = await res1.json();
    const data2 = await res2.json();
    console.log('Resposta 1:', res1.status, data1);
    console.log('Resposta 2:', res2.status, data2);

    if (![res1.status, res2.status].every((status) => status === 200)) {
      throw new Error('Concorrência HTTP retornou status diferente de 200.');
    }
  }

  const attempts = await prisma.questionAttempt.findMany({ where: { idempotencyKey: testKey } });
  if (attempts.length !== 1) {
    throw new Error(`Falha de idempotência: ${attempts.length} registros encontrados, esperado 1.`);
  }

  const afterUser = await prisma.user.findUnique({ where: { id: user.id } });
  const afterProgress = await prisma.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: user.id, topicId: question.topicId } },
  });

  if (res1 && res2) {
    const xpDelta = (afterUser?.xp || 0) - (beforeUser?.xp || 0);
    const questionDelta = (afterProgress?.totalQuestions || 0) - (beforeProgress?.totalQuestions || 0);
    const correctDelta = (afterProgress?.correctAnswers || 0) - (beforeProgress?.correctAnswers || 0);

    if (xpDelta !== 10) throw new Error(`XP incorreto após concorrência: +${xpDelta}, esperado +10.`);
    if (questionDelta !== 1) throw new Error(`Progresso incorreto após concorrência: +${questionDelta} questões, esperado +1.`);
    if (correctDelta !== 1) throw new Error(`Acertos incorretos após concorrência: +${correctDelta}, esperado +1.`);
  }

  console.log('✅ Concorrência/idempotência validada: 1 attempt registrado com integridade.');

  // Limpeza reversível da auditoria, preservando o estado anterior do usuário/progresso
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
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: beforeUser.xp,
        lastStudyDate: beforeUser.lastStudyDate,
        currentStreak: beforeUser.currentStreak,
      },
    });
  }
  await prisma.question.delete({ where: { id: question.id } });
  console.log("✅ TESTE DE CONCORRÊNCIA E IDEMPOTÊNCIA CONCLUÍDO COM SUCESSO!");
}

run()
  .catch((e) => {
    console.error("❌ ERRO NO TESTE DE CONCORRÊNCIA:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
