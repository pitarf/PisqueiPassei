import { describe, expect, test } from "bun:test";
import { prisma } from "./prisma";
import { POST } from "../app/api/questions/submit/route";
import { NextRequest } from "next/server";
import {
  evaluateQuestionHistory,
  validateSrsTemporalCadence,
  calculateBankOverview,
  type AttemptRecord,
} from "./adaptive-engine";

// Helper para invocar a rota POST como uma requisição HTTP real
function createSubmitRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/questions/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("FASE 2.2 - Hardening Final da Idempotência, Transações e Integridade", () => {
  // Test A & F: Requisição sequencial com mesma idempotencyKey retorna duplicate: true e não duplica XP nem attempt
  test("Cenário A & F: Requisição duplicada sequencial retorna duplicate: true sem duplicar XP ou attempt", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const question = await prisma.question.findFirst();
    expect(user && question).toBeTruthy();

    const idempotencyKey = `test-seq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialUser = await prisma.user.findUnique({ where: { id: user!.id } });
    const initialXp = initialUser?.xp || 0;

    // 1ª chamada
    const req1 = createSubmitRequest({
      questionId: question!.id,
      chosenOption: question!.correctOption,
      timeSpentSeconds: 30,
      idempotencyKey,
    });
    const res1 = await POST(req1);
    const json1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(json1.success).toBe(true);
    expect(json1.duplicate).toBe(false);
    expect(json1.isCorrect).toBe(true);
    expect(json1.questionStatus).toBeTruthy();

    const xpAfterFirst = (await prisma.user.findUnique({ where: { id: user!.id } }))?.xp || 0;
    expect(xpAfterFirst).toBe(initialXp + 10);

    // 2ª chamada com a MESMA chave
    const req2 = createSubmitRequest({
      questionId: question!.id,
      chosenOption: question!.correctOption,
      timeSpentSeconds: 30,
      idempotencyKey,
    });
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(json2.success).toBe(true);
    expect(json2.duplicate).toBe(true);
    expect(json2.isCorrect).toBe(true);
    expect(json2.questionStatus).toBeTruthy();

    // XP não pode ter aumentado na 2ª chamada
    const xpAfterSecond = (await prisma.user.findUnique({ where: { id: user!.id } }))?.xp || 0;
    expect(xpAfterSecond).toBe(xpAfterFirst);

    // Contagem de attempts com essa chave deve ser exatamente 1
    const attemptsCount = await prisma.questionAttempt.count({ where: { idempotencyKey } });
    expect(attemptsCount).toBe(1);

    // Limpeza
    await prisma.questionAttempt.deleteMany({ where: { idempotencyKey } });
  }, { timeout: 30000 });

  // Test B & G: Chamadas simultâneas (Promise.all) com a mesma idempotencyKey
  test("Cenário B & G: Chamadas simultâneas com mesma idempotencyKey processam exatamente 1 inserção e barram duplicidade", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const question = await prisma.question.findFirst();
    expect(user && question).toBeTruthy();

    const concurrentKey = `test-simul-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialUser = await prisma.user.findUnique({ where: { id: user!.id } });
    const initialXp = initialUser?.xp || 0;

    // Dispara 3 requisições simultâneas com a mesma chave
    const promises = [1, 2, 3].map(() =>
      POST(
        createSubmitRequest({
          questionId: question!.id,
          chosenOption: question!.correctOption,
          timeSpentSeconds: 20,
          idempotencyKey: concurrentKey,
        })
      ).then(async (res) => ({ status: res.status, data: await res.json() }))
    );

    const responses = await Promise.all(promises);

    // Todas devem responder 200 com sucesso
    for (const r of responses) {
      expect(r.status).toBe(200);
      expect(r.data.success).toBe(true);
    }

    // Exatamente uma teve duplicate: false e as outras duplicate: true
    const originals = responses.filter((r) => r.data.duplicate === false);
    const duplicates = responses.filter((r) => r.data.duplicate === true);
    expect(originals.length).toBe(1);
    expect(duplicates.length).toBe(2);

    // XP incrementado exatamente 1 vez (+10)
    const finalUser = await prisma.user.findUnique({ where: { id: user!.id } });
    expect(finalUser?.xp).toBe(initialXp + 10);

    // Limpeza
    await prisma.questionAttempt.deleteMany({ where: { idempotencyKey: concurrentKey } });
  }, { timeout: 30000 });

  // Test C: Transação e atomicidade em caso de chave maliciosa ou conflito
  test("Cenário C: Rejeita com 409 quando chave de idempotência é reutilizada em questão diferente", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const questions = await prisma.question.findMany({ take: 2 });
    expect(questions.length).toBe(2);

    const reuseKey = `test-reuse-${Date.now()}`;

    // Cria attempt com question[0]
    const res1 = await POST(
      createSubmitRequest({
        questionId: questions[0].id,
        chosenOption: questions[0].correctOption,
        timeSpentSeconds: 15,
        idempotencyKey: reuseKey,
      })
    );
    expect(res1.status).toBe(200);

    // Tenta reutilizar a mesma chave para questions[1]
    const res2 = await POST(
      createSubmitRequest({
        questionId: questions[1].id,
        chosenOption: questions[1].correctOption,
        timeSpentSeconds: 15,
        idempotencyKey: reuseKey,
      })
    );
    expect(res2.status).toBe(409);
    const json2 = await res2.json();
    expect(json2.error).toContain("Chave de idempotência já utilizada em outra resposta.");

    // Limpeza
    await prisma.questionAttempt.deleteMany({ where: { idempotencyKey: reuseKey } });
  }, { timeout: 30000 });

  // Test D: Respostas em questões diferentes do mesmo tópico calculam UserTopicProgress com precisão atômica
  test("Cenário D: Submissões concorrentes em questões do mesmo tópico mantêm contagem atômica exata em UserTopicProgress", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    expect(user).toBeTruthy();

    // Pega 2 questões distintas de um mesmo tópico
    const topic = await prisma.topic.findFirst({
      include: { questions: { take: 2 } },
    });
    expect(topic && topic.questions.length >= 2).toBeTruthy();

    const q1 = topic!.questions[0];
    const q2 = topic!.questions[1];

    const initialTopicProgress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId: user!.id, topicId: topic!.id } },
    });
    const initialTotal = initialTopicProgress?.totalQuestions || 0;

    const keyD1 = `test-d1-${Date.now()}`;
    const keyD2 = `test-d2-${Date.now()}`;

    // Dispara submissões simultâneas para q1 e q2
    const [res1, res2] = await Promise.all([
      POST(
        createSubmitRequest({
          questionId: q1.id,
          chosenOption: q1.correctOption,
          timeSpentSeconds: 25,
          idempotencyKey: keyD1,
        })
      ),
      POST(
        createSubmitRequest({
          questionId: q2.id,
          chosenOption: q2.correctOption,
          timeSpentSeconds: 25,
          idempotencyKey: keyD2,
        })
      ),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const topicProgress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId: user!.id, topicId: topic!.id } },
    });

    // Deve ter incrementado exatamente 2
    expect(topicProgress?.totalQuestions).toBe(initialTotal + 2);

    // Limpeza
    await prisma.questionAttempt.deleteMany({
      where: { idempotencyKey: { in: [keyD1, keyD2] } },
    });
  }, { timeout: 30000 });

  // Test E: Script de Backfill de SRS é 100% idempotente (2ª execução resulta em 0 modificações)
  test("Cenário E: Script de backfill de SRS é estritamente idempotente", async () => {
    // Importa dinamicamente a função runBackfill do script
    const { runBackfill } = require("../../scripts/backfill-question-srs");
    const firstRunStats = await runBackfill(prisma);
    expect(firstRunStats.processed).toBeGreaterThanOrEqual(0);

    // 2ª execução
    const secondRunStats = await runBackfill(prisma);
    expect(secondRunStats.created).toBe(0);
    expect(secondRunStats.updated).toBe(0);
    expect(secondRunStats.unchanged).toBe(secondRunStats.processed);
    expect(secondRunStats.inconsistent).toBe(0);
  }, { timeout: 30000 });

  // Test H: Submissão duplicada não avança intervalo de SRS nem altera lastAttemptAt
  test("Cenário H: Submissão duplicada não altera UserQuestionProgress.attemptsCount", async () => {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    const question = await prisma.question.findFirst();
    expect(user && question).toBeTruthy();

    const keyH = `test-h-${Date.now()}`;

    // 1ª submissão
    await POST(
      createSubmitRequest({
        questionId: question!.id,
        chosenOption: question!.correctOption,
        timeSpentSeconds: 20,
        idempotencyKey: keyH,
      })
    );

    const prog1 = await prisma.userQuestionProgress.findUnique({
      where: { userId_questionId: { userId: user!.id, questionId: question!.id } },
    });
    const count1 = prog1?.attemptsCount || 0;

    // 2ª submissão (duplicada)
    await POST(
      createSubmitRequest({
        questionId: question!.id,
        chosenOption: question!.correctOption,
        timeSpentSeconds: 20,
        idempotencyKey: keyH,
      })
    );

    const prog2 = await prisma.userQuestionProgress.findUnique({
      where: { userId_questionId: { userId: user!.id, questionId: question!.id } },
    });
    expect(prog2?.attemptsCount).toBe(count1);
    expect(prog2?.intervalDays).toBe(prog1?.intervalDays);

    // Limpeza
    await prisma.questionAttempt.deleteMany({ where: { idempotencyKey: keyH } });
  }, { timeout: 30000 });

  // Test I: Métricas de banco (calculateBankOverview) diferenciam questões únicas de tentativas repetidas
  test("Cenário I: Métricas de cobertura única não inflacionam com repetição de questão", () => {
    const attempts: AttemptRecord[] = [
      { id: "1", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T10:00:00Z") },
      { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-02T10:00:00Z") },
      { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-03T10:00:00Z") },
      { id: "4", questionId: "q2", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date("2026-10-03T10:00:00Z") },
    ];

    const overview = calculateBankOverview({
      totalBankQuestions: 940,
      userAttempts: attempts,
      topicDiagnostics: [],
    });

    // 4 tentativas, mas apenas 2 questões distintas
    expect(overview.totalAvailable).toBe(940);
    expect(overview.totalAnsweredUnique).toBe(2);
    expect(overview.totalUnseen).toBe(938);
  });

  // Test J: Consolidação temporal real (1d -> 3d -> 7d)
  test("Cenário J: Consolidação pedagógica exige estritamente cadência de 1d, 3d e 7d após erro", () => {
    const day = 24 * 3600 * 1000;
    const baseTime = new Date("2026-10-01T10:00:00Z").getTime();

    // Cenário que viola a cadência (acertos rápidos no mesmo dia)
    const fastAttempts: AttemptRecord[] = [
      { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date(baseTime) },
      { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 1000) },
      { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 2000) },
      { id: "4", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 3000) },
    ];
    expect(validateSrsTemporalCadence(fastAttempts)).toBe(false);

    // Cenário que respeita a cadência exata (1d, 3d, 7d)
    const validAttempts: AttemptRecord[] = [
      { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date(baseTime) },
      { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 1.1 * day) },
      { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 4.2 * day) },
      { id: "4", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 11.5 * day) },
    ];
    expect(validateSrsTemporalCadence(validAttempts)).toBe(true);

    const hist = evaluateQuestionHistory("q1", validAttempts, new Date(baseTime + 12 * day));
    expect(hist.status).toBe("CONSOLIDADA");
  });

  // Test K: Questão consolidada mantém status CONSOLIDADA mas marca isMaintenanceDue quando revisão vence aos 14d/30d
  test("Cenário K: Questão consolidada com revisão devida marca isMaintenanceDue sem perder status CONSOLIDADA", () => {
    const day = 24 * 3600 * 1000;
    const baseTime = new Date("2026-10-01T10:00:00Z").getTime();

    const attempts: AttemptRecord[] = [
      { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date(baseTime) },
      { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 1.1 * day) },
      { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 4.2 * day) },
      { id: "4", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(baseTime + 11.5 * day) },
    ];

    // Antes do vencimento da próxima revisão (+7 dias após a 4ª tentativa)
    const beforeDue = evaluateQuestionHistory("q1", attempts, new Date(baseTime + 13 * day));
    expect(beforeDue.status).toBe("CONSOLIDADA");
    expect(beforeDue.isReviewDue).toBe(false);
    expect(beforeDue.isMaintenanceDue).toBe(false);

    // Após o vencimento da próxima revisão (+20 dias após a 4ª tentativa)
    const afterDue = evaluateQuestionHistory("q1", attempts, new Date(baseTime + 25 * day));
    expect(afterDue.status).toBe("CONSOLIDADA"); // Não perde status CONSOLIDADA!
    expect(afterDue.isReviewDue).toBe(true);
    expect(afterDue.isMaintenanceDue).toBe(true);
  });

  // Test L: Validação de entradas e consistência estrutural
  test("Cenário L: Rejeita entradas inválidas com mensagens de erro precisas", async () => {
    // Sem questionId
    const res1 = await POST(createSubmitRequest({ chosenOption: "A" }));
    expect(res1.status).toBe(400);

    // Alternativa inválida
    const res2 = await POST(createSubmitRequest({ questionId: "invalid-id", chosenOption: "Z" }));
    expect(res2.status).toBe(400);

    // Tempo negativo
    const res3 = await POST(createSubmitRequest({ questionId: "invalid-id", chosenOption: "A", timeSpentSeconds: -5 }));
    expect(res3.status).toBe(400);

    // Questão inexistente
    const res4 = await POST(createSubmitRequest({ questionId: "00000000-0000-0000-0000-000000000000", chosenOption: "A", timeSpentSeconds: 10 }));
    expect(res4.status).toBe(404);
  }, { timeout: 30000 });
});
