import { describe, expect, test } from "bun:test";
import {
  calculateAdaptiveMasteryScore,
  evaluateTopicDiagnostic,
  determineAdaptiveDifficulty,
  buildStudyNowSession,
  buildErrorReviewSession,
  calculateBankOverview,
  evaluateQuestionHistory,
  createSeededRng,
  seededShuffle,
  type AttemptRecord,
  type QuestionSummary,
} from "./adaptive-engine";

describe("adaptive-engine - Motor Adaptativo e Diagnóstico Pedagógico", () => {
  // 1. REVISÃO DO SCORE DE DOMÍNIO
  describe("Score de Domínio Bayesiano", () => {
    test("regularização bayesiana evita conclusões precipitadas em amostras pequenas", () => {
      // Tópico A (2 acertos em 2 questões = 100% bruto)
      const scoreA = calculateAdaptiveMasteryScore(2, 2, 2.0);

      // Tópico B (22 acertos em 30 questões = 73% bruto)
      const scoreB = calculateAdaptiveMasteryScore(22, 30, 2.0);

      // Amostra pequena (2 questões) não deve inflar para 100%, deve ser moderada (~60%)
      expect(scoreA).toBeLessThanOrEqual(65);
      expect(scoreA).toBeGreaterThanOrEqual(55);

      // Amostra robusta (30 questões com 73%) reflete com confiança o domínio consolidado (~68-72%)
      expect(scoreB).toBeGreaterThan(scoreA);
      expect(scoreB).toBeGreaterThanOrEqual(65);
    });

    test("comportamento em tópico nunca estudado retorna 0 sem divisão por zero", () => {
      expect(calculateAdaptiveMasteryScore(0, 0, 2.0)).toBe(0);
      expect(calculateAdaptiveMasteryScore(-1, 0, 2.0)).toBe(0);
    });

    test("influência da dificuldade eleva moderadamente o peso sem romper limites [0, 100]", () => {
      const easyScore = calculateAdaptiveMasteryScore(8, 10, 1.0);
      const mediumScore = calculateAdaptiveMasteryScore(8, 10, 2.0);
      const hardScore = calculateAdaptiveMasteryScore(8, 10, 3.0);

      expect(easyScore).toBeLessThan(mediumScore);
      expect(mediumScore).toBeLessThan(hardScore);

      // Limites estritos
      expect(calculateAdaptiveMasteryScore(100, 100, 3.0)).toBeLessThanOrEqual(100);
      expect(calculateAdaptiveMasteryScore(0, 100, 1.0)).toBeGreaterThanOrEqual(0);
    });

    test("consistência após erros sucessivos e estabilização", () => {
      // 0 acertos em 10 tentativas
      const poorScore = calculateAdaptiveMasteryScore(0, 10, 2.0);
      expect(poorScore).toBeLessThan(30);

      // 10 acertos em 20 tentativas (50% bruto)
      const balancedScore = calculateAdaptiveMasteryScore(10, 20, 2.0);
      expect(balancedScore).toBe(50);
    });
  });

  // 2. HISTÓRICO DE ERROS E ESTADOS DE RETENÇÃO
  describe("Histórico de Questões e Estados SRS (evaluateQuestionHistory)", () => {
    const baseDate = new Date("2026-10-01T10:00:00Z");

    test("1. Uma questão errada uma vez -> PENDENTE", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: baseDate },
      ];
      const hist = evaluateQuestionHistory("q1", attempts, baseDate);
      expect(hist.totalAttempts).toBe(1);
      expect(hist.totalErrors).toBe(1);
      expect(hist.totalCorrect).toBe(0);
      expect(hist.lastCorrect).toBe(false);
      expect(hist.consecutiveErrors).toBe(1);
      expect(hist.status).toBe("PENDENTE");
    });

    test("2. Uma questão errada três vezes -> PENDENTE com 3 erros acumulados", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T10:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "B", timeSpentSeconds: 35, createdAt: new Date("2026-10-02T10:00:00Z") },
        { id: "3", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "C", timeSpentSeconds: 40, createdAt: new Date("2026-10-03T10:00:00Z") },
      ];
      const hist = evaluateQuestionHistory("q1", attempts, new Date("2026-10-03T11:00:00Z"));
      expect(hist.totalAttempts).toBe(3);
      expect(hist.totalErrors).toBe(3);
      expect(hist.consecutiveErrors).toBe(3);
      expect(hist.status).toBe("PENDENTE");
    });

    test("3. Uma questão errada e posteriormente acertada -> EM_CONSOLIDACAO com histórico de erro preservado", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T10:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 25, createdAt: new Date("2026-10-02T10:00:00Z") },
      ];
      const hist = evaluateQuestionHistory("q1", attempts, new Date("2026-10-02T12:00:00Z"));
      expect(hist.totalAttempts).toBe(2);
      expect(hist.totalErrors).toBe(1);
      expect(hist.totalCorrect).toBe(1);
      expect(hist.lastCorrect).toBe(true);
      expect(hist.consecutiveCorrect).toBe(1);
      // Não pode sumir como se nunca tivesse sido errada
      expect(hist.status).toBe("EM_CONSOLIDACAO");
    });

    test("4. Uma questão acertada e posteriormente errada -> PENDENTE com reinício de cadência", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 20, createdAt: new Date("2026-10-01T10:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date("2026-10-02T10:00:00Z") },
      ];
      const hist = evaluateQuestionHistory("q1", attempts, new Date("2026-10-02T12:00:00Z"));
      expect(hist.lastCorrect).toBe(false);
      expect(hist.consecutiveErrors).toBe(1);
      expect(hist.consecutiveCorrect).toBe(0);
      expect(hist.status).toBe("PENDENTE");
      expect(hist.currentIntervalDays).toBe(1);
    });

    test("5. Várias tentativas em datas diferentes calculam ordem cronológica rigorosa", () => {
      const attempts: AttemptRecord[] = [
        // Ordem propositadamente invertida no array de entrada
        { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 25, createdAt: new Date("2026-10-05T10:00:00Z") },
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T10:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "B", timeSpentSeconds: 35, createdAt: new Date("2026-10-03T10:00:00Z") },
      ];
      const hist = evaluateQuestionHistory("q1", attempts, new Date("2026-10-05T11:00:00Z"));
      expect(hist.totalAttempts).toBe(3);
      expect(hist.totalErrors).toBe(2);
      expect(hist.lastCorrect).toBe(true);
      expect(hist.consecutiveCorrect).toBe(1);
      expect(hist.lastAttemptAt.getTime()).toBe(new Date("2026-10-05T10:00:00Z").getTime());
    });

    test("6. Questão com revisão vencida -> REVISAO_DEVIDA", () => {
      const lastAt = new Date("2026-10-01T10:00:00Z");
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: lastAt },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 25, createdAt: new Date("2026-10-02T10:00:00Z") },
      ];
      // 3 dias depois, com intervalo de 1 dia -> revisão devida
      const now = new Date("2026-10-05T10:00:00Z");
      const hist = evaluateQuestionHistory("q1", attempts, now);
      expect(hist.isReviewDue).toBe(true);
      expect(hist.status).toBe("REVISAO_DEVIDA");
    });

    test("7. Questão consolidada após sucessivos acertos com cadência temporal -> CONSOLIDADA", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-09-20T10:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 20, createdAt: new Date("2026-09-22T10:00:00Z") }, // +2 dias (>= 1d)
        { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 22, createdAt: new Date("2026-09-26T10:00:00Z") }, // +4 dias (>= 3d)
        { id: "4", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 18, createdAt: new Date("2026-10-04T10:00:00Z") }, // +8 dias (>= 7d)
      ];
      const hist = evaluateQuestionHistory("q1", attempts, new Date("2026-10-04T12:00:00Z"));
      expect(hist.consecutiveCorrect).toBe(3);
      expect(hist.status).toBe("CONSOLIDADA");
      expect(hist.currentIntervalDays).toBeGreaterThanOrEqual(7);
    });
  });

  // 3. DETERMINISMO E PRNG SEEDED
  describe("Determinismo e Seleção com Seed", () => {
    test("createSeededRng gera a mesma sequência com a mesma seed", () => {
      const rng1 = createSeededRng("seed-transpetro-1");
      const rng2 = createSeededRng("seed-transpetro-1");
      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];
      expect(seq1).toEqual(seq2);
    });

    test("createSeededRng gera sequências distintas para seeds diferentes", () => {
      const rng1 = createSeededRng("seed-alpha");
      const rng2 = createSeededRng("seed-beta");
      expect(rng1()).not.toBe(rng2());
    });

    test("seededShuffle produz embaralhamento determinístico idêntico", () => {
      const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuf1 = seededShuffle(list, createSeededRng(42));
      const shuf2 = seededShuffle(list, createSeededRng(42));
      expect(shuf1).toEqual(shuf2);

      const shuf3 = seededShuffle(list, createSeededRng(99));
      expect(shuf1).not.toEqual(shuf3);
    });

    test("determineAdaptiveDifficulty usa determinação consistente com seed", () => {
      // Faixa de 75%: se rng < 0.6 => MEDIA, senão DIFICIL
      const diff1 = determineAdaptiveDifficulty(75, 10, () => 0.2);
      const diff2 = determineAdaptiveDifficulty(75, 10, () => 0.8);
      expect(diff1).toBe("MEDIA");
      expect(diff2).toBe("DIFICIL");
    });
  });

  // 4. MOTOR DE PRIORIZAÇÃO MULTIFATORIAL
  describe("Motor de Priorização de Tópicos", () => {
    const now = new Date("2026-10-01T12:00:00Z");

    test("compara cenários concorrentes (Revisão Vencida vs Domínio Baixo vs Tópico Inédito)", () => {
      // Tópico A: domínio baixo (<50%), revisão não vencida
      const diagA = evaluateTopicDiagnostic({
        topicId: "tA",
        topicTitle: "Tópico A",
        subjectName: "Geral",
        attempts: [
          { id: "1", questionId: "q1", topicId: "tA", isCorrect: false, chosenOption: "B", timeSpentSeconds: 30, createdAt: now },
          { id: "2", questionId: "q2", topicId: "tA", isCorrect: false, chosenOption: "C", timeSpentSeconds: 30, createdAt: now },
        ],
        nextReviewDate: new Date("2026-10-05T00:00:00Z"), // futuro
        now,
      });

      // Tópico B: domínio médio, revisão vencida
      const diagB = evaluateTopicDiagnostic({
        topicId: "tB",
        topicTitle: "Tópico B",
        subjectName: "Geral",
        attempts: [
          { id: "3", questionId: "q3", topicId: "tB", isCorrect: true, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-09-20T00:00:00Z") },
          { id: "4", questionId: "q4", topicId: "tB", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date("2026-09-22T00:00:00Z") },
        ],
        nextReviewDate: new Date("2026-09-25T00:00:00Z"), // vencida!
        now,
      });

      // Tópico C: nunca estudado
      const diagC = evaluateTopicDiagnostic({
        topicId: "tC",
        topicTitle: "Tópico C",
        subjectName: "Geral",
        attempts: [],
        now,
      });

      // Revisão vencida deve superar tópico inédito
      expect(diagB.adaptivePriorityScore).toBeGreaterThan(diagC.adaptivePriorityScore);
      expect(diagB.isReviewDue).toBe(true);
      expect(diagC.answeredCount).toBe(0);
      expect(diagC.adaptivePriorityScore).toBeGreaterThanOrEqual(45);
    });
  });

  // 5. SESSÃO ESTUDAR AGORA COM METADADOS
  describe("buildStudyNowSession", () => {
    test("monta sessão com contagem de novas, revisões e sem repetições por hash com seed", () => {
      const diag = evaluateTopicDiagnostic({
        topicId: "t1",
        topicTitle: "Português Geral",
        subjectName: "Língua Portuguesa",
        attempts: [],
      });

      const questions: QuestionSummary[] = Array.from({ length: 20 }, (_, i) => ({
        id: `q-${i}`,
        topicId: "t1",
        statement: `Enunciado ${i}`,
        statementHash: `hash-${i}`,
        difficulty: "MEDIA",
      }));

      const questionsByTopic = new Map([["t1", questions]]);

      const session1 = buildStudyNowSession({
        diagnostics: [diag],
        questionsByTopic,
        userAttempts: [],
        targetCount: 10,
        seed: 777,
      });

      const session2 = buildStudyNowSession({
        diagnostics: [diag],
        questionsByTopic,
        userAttempts: [],
        targetCount: 10,
        seed: 777,
      });

      expect(session1.questions.length).toBe(10);
      // Determinismo com a mesma seed
      expect(session1.questions.map((q) => q.id)).toEqual(session2.questions.map((q) => q.id));
      expect(session1.preview.newQuestionsCount).toBe(10);
      expect(session1.preview.reviewQuestionsCount).toBe(0);
    });
  });

  // 6. FILA REVISAR MEUS ERROS
  describe("buildErrorReviewSession", () => {
    test("exclui questões consolidadas da fila ativa de erros", () => {
      const q1: QuestionSummary = { id: "q1", topicId: "t1", statement: "Q1", statementHash: "h1", difficulty: "MEDIA" };
      const q2: QuestionSummary = { id: "q2", topicId: "t1", statement: "Q2", statementHash: "h2", difficulty: "MEDIA" };

      const userAttempts: AttemptRecord[] = [
        // q1: erro antigo e 3 acertos seguidos -> consolidada
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-09-01T00:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date("2026-09-05T00:00:00Z") },
        { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "C", timeSpentSeconds: 30, createdAt: new Date("2026-09-10T00:00:00Z") },
        { id: "4", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "D", timeSpentSeconds: 30, createdAt: new Date("2026-09-18T00:00:00Z") },
        // q2: erro recente não consolidado
        { id: "5", questionId: "q2", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T00:00:00Z") },
      ];

      const errorSession = buildErrorReviewSession({
        allQuestions: [q1, q2],
        userAttempts,
        targetCount: 10,
        now: new Date("2026-10-01T12:00:00Z"),
      });

      // q1 consolidada não deve estar na fila de erros ativa
      expect(errorSession.questions.map((q) => q.id)).toContain("q2");
      expect(errorSession.questions.map((q) => q.id)).not.toContain("q1");
    });
  });

  // 7. DASHBOARD E OVERVIEW DO ACERVO DE 940 QUESTÕES
  describe("calculateBankOverview", () => {
    test("não conta tentativas repetidas como questões distintas", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T00:00:00Z") },
        { id: "2", questionId: "q1", topicId: "t1", isCorrect: false, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T01:00:00Z") },
        { id: "3", questionId: "q1", topicId: "t1", isCorrect: true, chosenOption: "C", timeSpentSeconds: 30, createdAt: new Date("2026-10-01T02:00:00Z") },
      ];

      const overview = calculateBankOverview({
        totalBankQuestions: 940,
        userAttempts: attempts,
        topicDiagnostics: [],
        targetScore: 47,
      });

      expect(overview.totalAvailable).toBe(940);
      expect(overview.totalAnsweredUnique).toBe(1);
      expect(overview.totalUnseen).toBe(939);
      // Última tentativa de q1 foi acerto, portanto pending errors = 0
      expect(overview.totalWithPendingError).toBe(0);
    });
  });

  // 8. FASE 2.1 - FECHAMENTO DEFINITIVO DO SRS E CONSOLIDAÇÃO TEMPORAL
  describe("Fase 2.1 - Validação Estrita de Consolidação Temporal e SRS", () => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const t0 = new Date("2026-10-01T10:00:00Z");

    test("A) erro -> acerto imediato -> acerto imediato -> acerto imediato => NÃO consolidar", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "qA", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qA", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 60 * 1000) }, // +1 min
        { id: "3", questionId: "qA", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 120 * 1000) }, // +2 min
        { id: "4", questionId: "qA", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 300 * 1000) }, // +5 min
      ];
      const hist = evaluateQuestionHistory("qA", attempts, new Date(t0.getTime() + 400 * 1000));
      expect(hist.status).not.toBe("CONSOLIDADA");
      expect(hist.status).toBe("EM_CONSOLIDACAO");
    });

    test("B) erro -> acerto em +1 dia -> acerto em +3 dias -> acerto em +7 dias => consolidar", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "qB", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qB", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 1 * ONE_DAY) },
        { id: "3", questionId: "qB", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 4 * ONE_DAY) },
        { id: "4", questionId: "qB", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 11 * ONE_DAY) },
      ];
      const hist = evaluateQuestionHistory("qB", attempts, new Date(t0.getTime() + 11 * ONE_DAY + 3600 * 1000));
      expect(hist.consecutiveCorrect).toBe(3);
      expect(hist.status).toBe("CONSOLIDADA");
    });

    test("C) erro após qualquer ponto => reiniciar ciclo", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "qC", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qC", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 1 * ONE_DAY) },
        { id: "3", questionId: "qC", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 4 * ONE_DAY) },
        { id: "4", questionId: "qC", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 11 * ONE_DAY) },
        // Erro posterior após consolidação
        { id: "5", questionId: "qC", topicId: "t1", isCorrect: false, chosenOption: "D", timeSpentSeconds: 35, createdAt: new Date(t0.getTime() + 20 * ONE_DAY) },
      ];
      const hist = evaluateQuestionHistory("qC", attempts, new Date(t0.getTime() + 20 * ONE_DAY + 3600 * 1000));
      expect(hist.consecutiveCorrect).toBe(0);
      expect(hist.consecutiveErrors).toBe(1);
      expect(hist.currentIntervalDays).toBe(1);
      expect(hist.status).toBe("PENDENTE");
    });

    test("D) revisão vencida => REVISAO_DEVIDA", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "qD", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qD", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 1 * ONE_DAY) },
      ];
      // 1 acerto pós-erro agenda revisão para t0 + 2 dias. Avaliando em t0 + 5 dias:
      const hist = evaluateQuestionHistory("qD", attempts, new Date(t0.getTime() + 5 * ONE_DAY));
      expect(hist.isReviewDue).toBe(true);
      expect(hist.status).toBe("REVISAO_DEVIDA");
    });

    test("E) questão consolidada => não aparecer em 'Revisar Meus Erros'", () => {
      const qConsolidada: QuestionSummary = { id: "qConsolidada", topicId: "t1", statement: "Enunciado Consolidado", statementHash: "hCons", difficulty: "MEDIA" };
      const qPendente: QuestionSummary = { id: "qPendente", topicId: "t1", statement: "Enunciado Pendente", statementHash: "hPend", difficulty: "MEDIA" };

      const attempts: AttemptRecord[] = [
        // qConsolidada: cumpriu a cadência 1d -> 3d -> 7d
        { id: "1", questionId: "qConsolidada", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qConsolidada", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 1 * ONE_DAY) },
        { id: "3", questionId: "qConsolidada", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 4 * ONE_DAY) },
        { id: "4", questionId: "qConsolidada", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 11 * ONE_DAY) },
        // qPendente: erro recente
        { id: "5", questionId: "qPendente", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 25, createdAt: new Date(t0.getTime() + 11 * ONE_DAY) },
      ];

      const session = buildErrorReviewSession({
        allQuestions: [qConsolidada, qPendente],
        userAttempts: attempts,
        targetCount: 5,
        now: new Date(t0.getTime() + 11 * ONE_DAY + 3600 * 1000),
      });

      expect(session.questions.map((q) => q.id)).toContain("qPendente");
      expect(session.questions.map((q) => q.id)).not.toContain("qConsolidada");
    });

    test("G) ordenação cronológica embaralhada => resultado idêntico", () => {
      const att1: AttemptRecord = { id: "1", questionId: "qG", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 };
      const att2: AttemptRecord = { id: "2", questionId: "qG", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 1 * ONE_DAY) };
      const att3: AttemptRecord = { id: "3", questionId: "qG", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 4 * ONE_DAY) };
      const att4: AttemptRecord = { id: "4", questionId: "qG", topicId: "t1", isCorrect: true, chosenOption: "B", timeSpentSeconds: 20, createdAt: new Date(t0.getTime() + 11 * ONE_DAY) };

      const orderedList = [att1, att2, att3, att4];
      const shuffledList = [att3, att1, att4, att2];

      const histOrdered = evaluateQuestionHistory("qG", orderedList, new Date(t0.getTime() + 12 * ONE_DAY));
      const histShuffled = evaluateQuestionHistory("qG", shuffledList, new Date(t0.getTime() + 12 * ONE_DAY));

      expect(histOrdered).toEqual(histShuffled);
      expect(histShuffled.status).toBe("CONSOLIDADA");
    });

    test("H) mesma seed => mesma seleção", () => {
      const qPool: QuestionSummary[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `qH_${i}`,
        topicId: "t1",
        statement: `Enunciado H ${i}`,
        statementHash: `hashH_${i}`,
        difficulty: i % 2 === 0 ? "MEDIA" : "FACIL",
      }));

      const rng1 = createSeededRng("seed-h-1234");
      const rng2 = createSeededRng("seed-h-1234");

      const shuf1 = seededShuffle(qPool, rng1);
      const shuf2 = seededShuffle(qPool, rng2);

      expect(shuf1.map((q) => q.id)).toEqual(shuf2.map((q) => q.id));
    });

    test("I) tentativas repetidas => não alterar contagem de questões únicas do dashboard", () => {
      const attempts: AttemptRecord[] = [
        { id: "1", questionId: "qI", topicId: "t1", isCorrect: false, chosenOption: "A", timeSpentSeconds: 30, createdAt: t0 },
        { id: "2", questionId: "qI", topicId: "t1", isCorrect: false, chosenOption: "B", timeSpentSeconds: 30, createdAt: new Date(t0.getTime() + 60 * 1000) },
        { id: "3", questionId: "qI", topicId: "t1", isCorrect: true, chosenOption: "C", timeSpentSeconds: 30, createdAt: new Date(t0.getTime() + 120 * 1000) },
        { id: "4", questionId: "qI", topicId: "t1", isCorrect: true, chosenOption: "C", timeSpentSeconds: 30, createdAt: new Date(t0.getTime() + 180 * 1000) },
      ];

      const overview = calculateBankOverview({
        totalBankQuestions: 940,
        userAttempts: attempts,
        topicDiagnostics: [],
        targetScore: 47,
      });

      expect(overview.totalAvailable).toBe(940);
      expect(overview.totalAnsweredUnique).toBe(1);
      expect(overview.totalUnseen).toBe(939);
    });
  });
});
