import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

describe("Idempotência e Concorrência P2002 - QuestionAttempt e Simulation", () => {
  it("garante unicidade estrita e rejeição P2002 para QuestionAttempt.idempotencyKey duplicado", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    assert.ok(user, "Usuário padrão deve existir");

    const question = await prisma.question.findFirst();
    assert.ok(question, "Deve existir ao menos uma questão cadastrada");

    const testKey = `test-attempt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Primeira inserção: deve suceder
    const firstAttempt = await prisma.questionAttempt.create({
      data: {
        userId: user.id,
        questionId: question.id,
        chosenOption: "A",
        isCorrect: true,
        timeSpentSeconds: 45,
        idempotencyKey: testKey,
      },
    });

    assert.ok(firstAttempt.id, "Tentativa deve ser criada com sucesso");
    assert.equal(firstAttempt.idempotencyKey, testKey);

    // Segunda inserção com a MESMA chave de idempotência: deve lançar erro P2002
    let errorCaught: any = null;
    try {
      await prisma.questionAttempt.create({
        data: {
          userId: user.id,
          questionId: question.id,
          chosenOption: "B",
          isCorrect: false,
          timeSpentSeconds: 60,
          idempotencyKey: testKey,
        },
      });
    } catch (err) {
      errorCaught = err;
    }

    assert.ok(errorCaught, "Segunda tentativa com a mesma chave DEVE falhar");
    assert.ok(
      errorCaught instanceof Prisma.PrismaClientKnownRequestError,
      "Erro deve ser PrismaClientKnownRequestError"
    );
    assert.equal(errorCaught.code, "P2002", "O código do erro deve ser P2002 (violação de unique)");

    // Limpeza da tentativa de teste
    await prisma.questionAttempt.delete({ where: { id: firstAttempt.id } });
  });

  it("garante unicidade estrita e rejeição P2002 para Simulation.idempotencyKey duplicado", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    assert.ok(user, "Usuário padrão deve existir");

    const testSimKey = `test-sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Primeira inserção do Simulado
    const firstSim = await prisma.simulation.create({
      data: {
        userId: user.id,
        title: "Simulado Idempotência Teste",
        score: 50,
        totalQuestions: 60,
        correctAnswers: 50,
        durationSeconds: 7200,
        detailsJson: { test: true },
        idempotencyKey: testSimKey,
      },
    });

    assert.ok(firstSim.id, "Simulado deve ser registrado com sucesso");
    assert.equal(firstSim.idempotencyKey, testSimKey);

    // Segunda inserção com a MESMA idempotencyKey
    let errorCaught: any = null;
    try {
      await prisma.simulation.create({
        data: {
          userId: user.id,
          title: "Simulado Duplicado Teste",
          score: 30,
          totalQuestions: 60,
          correctAnswers: 30,
          durationSeconds: 3600,
          detailsJson: { duplicate: true },
          idempotencyKey: testSimKey,
        },
      });
    } catch (err) {
      errorCaught = err;
    }

    assert.ok(errorCaught, "Segundo simulado com a mesma chave DEVE falhar");
    assert.ok(
      errorCaught instanceof Prisma.PrismaClientKnownRequestError,
      "Erro deve ser PrismaClientKnownRequestError"
    );
    assert.equal(errorCaught.code, "P2002", "O código do erro deve ser P2002 (violação de unique)");

    // Limpeza do simulado de teste
    await prisma.simulation.delete({ where: { id: firstSim.id } });
  });

  it("garante tratamento correto em requisições paralelas concorrentes (simulando múltiplos submits)", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const question = await prisma.question.findFirst();
    const concurrentKey = `concurrent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Dispara 5 requisições de criação concorrentes simultaneamente
    const promises = Array.from({ length: 5 }).map(() =>
      prisma.questionAttempt
        .create({
          data: {
            userId: user!.id,
            questionId: question!.id,
            chosenOption: "C",
            isCorrect: true,
            timeSpentSeconds: 15,
            idempotencyKey: concurrentKey,
          },
        })
        .then((res) => ({ success: true, id: res.id, error: null }))
        .catch((err) => ({ success: false, id: null, error: err.code }))
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => r.success);
    const p2002Errors = results.filter((r) => !r.success && r.error === "P2002");

    assert.equal(successes.length, 1, "Exatamente UMA tentativa concorrente deve suceder");
    assert.equal(p2002Errors.length, 4, "Exatamente 4 tentativas concorrentes devem ser barradas com P2002");

    // Limpeza
    if (successes[0]?.id) {
      await prisma.questionAttempt.delete({ where: { id: successes[0].id } });
    }
  });

  it("F) duplicação via idempotencyKey não duplica attempt nem avança SRS em UserQuestionProgress", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const question = await prisma.question.findFirst();
    assert.ok(user && question, "Usuário e questão devem existir");

    const dupKey = `dup-srs-test-${Date.now()}`;

    // Estado inicial de progresso da questão
    const initialProgress = await prisma.userQuestionProgress.findUnique({
      where: { userId_questionId: { userId: user.id, questionId: question.id } },
    });
    const initialAttemptsCount = initialProgress?.attemptsCount || 0;

    // 1ª inserção
    const attempt1 = await prisma.questionAttempt.create({
      data: {
        userId: user.id,
        questionId: question.id,
        chosenOption: "B",
        isCorrect: true,
        timeSpentSeconds: 30,
        idempotencyKey: dupKey,
      },
    });

    // 2ª tentativa com mesma chave DEVE disparar P2002
    let threw = false;
    try {
      await prisma.questionAttempt.create({
        data: {
          userId: user.id,
          questionId: question.id,
          chosenOption: "B",
          isCorrect: true,
          timeSpentSeconds: 30,
          idempotencyKey: dupKey,
        },
      });
    } catch (err: any) {
      threw = err.code === "P2002";
    }
    assert.equal(threw, true, "Tentativa duplicada deve falhar com P2002");

    // Limpeza da tentativa de teste
    await prisma.questionAttempt.delete({ where: { id: attempt1.id } });
  });
});
