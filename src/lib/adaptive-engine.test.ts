import { describe, expect, test } from "bun:test";
import {
  calculateAdaptiveMasteryScore,
  evaluateTopicDiagnostic,
  determineAdaptiveDifficulty,
  buildStudyNowSession,
  buildErrorReviewSession,
  calculateBankOverview,
  type AttemptRecord,
  type QuestionSummary,
} from "./adaptive-engine";

describe("adaptive-engine - Motor Adaptativo e Diagnóstico Pedagógico", () => {
  test("calculateAdaptiveMasteryScore - regularização bayesiana evita conclusões precipitadas em amostras pequenas", () => {
    // Caso do prompt: Tópico A (2 acertos em 2 questões = 100% bruto)
    const scoreA = calculateAdaptiveMasteryScore(2, 2, 2.0);

    // Tópico B (22 acertos em 30 questões = 73% bruto)
    const scoreB = calculateAdaptiveMasteryScore(22, 30, 2.0);

    // Amostra pequena (2 questões) não deve dar 100%, deve ser moderada (~60%)
    expect(scoreA).toBeLessThanOrEqual(65);
    expect(scoreA).toBeGreaterThanOrEqual(55);

    // Amostra robusta (30 questões com 73%) reflete com confiança o domínio consolidado (~68-72%)
    expect(scoreB).toBeGreaterThan(scoreA);
    expect(scoreB).toBeGreaterThanOrEqual(65);
  });

  test("evaluateTopicDiagnostic - calcula métricas completas e prioriza revisões e erros recentes", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const attempts: AttemptRecord[] = [
      {
        id: "1",
        questionId: "q1",
        topicId: "t1",
        isCorrect: false,
        chosenOption: "B",
        timeSpentSeconds: 45,
        createdAt: new Date("2026-10-01T10:00:00Z"),
        difficulty: "MEDIA",
        questionType: "CONCEITO",
        cognitiveLevel: "COMPREENDER",
      },
      {
        id: "2",
        questionId: "q2",
        topicId: "t1",
        isCorrect: false,
        chosenOption: "A",
        timeSpentSeconds: 50,
        createdAt: new Date("2026-10-01T11:00:00Z"),
        difficulty: "MEDIA",
        questionType: "APLICACAO",
        cognitiveLevel: "APLICAR",
      },
    ];

    const diag = evaluateTopicDiagnostic({
      topicId: "t1",
      topicTitle: "Gestão de Estoques",
      topicCode: "2.2",
      subjectName: "2. Logística e Cadeia de Suprimentos",
      attempts,
      now,
    });

    expect(diag.answeredCount).toBe(2);
    expect(diag.errorCount).toBe(2);
    expect(diag.consecutiveErrorStreak).toBe(2);
    expect(diag.accuracyPercentage).toBe(0);
    expect(diag.suggestedDifficulty).toBe("FACIL");
    expect(diag.sampleConfidence).toBe("BAIXA");
    expect(diag.adaptivePriorityScore).toBeGreaterThan(40);
    expect(diag.difficultyPerformance.MEDIA.total).toBe(2);
  });

  test("determineAdaptiveDifficulty - direciona dificuldade conforme a faixa de domínio", () => {
    expect(determineAdaptiveDifficulty(30, 10)).toBe("FACIL");
    expect(determineAdaptiveDifficulty(60, 15)).toBe("MEDIA");
    expect(determineAdaptiveDifficulty(90, 20)).toBe("DIFICIL");
    // Aluno sem tentativas sempre inicia com FÁCIL
    expect(determineAdaptiveDifficulty(0, 0)).toBe("FACIL");
  });

  test("buildStudyNowSession - monta bateria adaptativa de 10 questões com diversidade e sem duplicidade", () => {
    const diag1 = evaluateTopicDiagnostic({
      topicId: "t1",
      topicTitle: "Concordância Verbal",
      subjectName: "Língua Portuguesa",
      attempts: [],
    });

    const diag2 = evaluateTopicDiagnostic({
      topicId: "t2",
      topicTitle: "Juros Compostos",
      subjectName: "Matemática",
      attempts: [],
    });

    const diag3 = evaluateTopicDiagnostic({
      topicId: "t3",
      topicTitle: "Lei 13.303/2016",
      subjectName: "3. Legislação",
      attempts: [],
    });

    const createQuestions = (topicId: string, count: number): QuestionSummary[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `${topicId}-q${i}`,
        topicId,
        statement: `Enunciado da questão ${i} sobre ${topicId}`,
        statementHash: `hash-${topicId}-${i}`,
        difficulty: "MEDIA",
        topicTitle: `Tema ${topicId}`,
        subjectName: "Disciplina",
      }));

    const questionsByTopic = new Map<string, QuestionSummary[]>([
      ["t1", createQuestions("t1", 20)],
      ["t2", createQuestions("t2", 20)],
      ["t3", createQuestions("t3", 20)],
    ]);

    const session = buildStudyNowSession({
      diagnostics: [diag1, diag2, diag3],
      questionsByTopic,
      userAttempts: [],
      targetCount: 6,
    });

    expect(session.questions.length).toBe(6);
    expect(session.preview.sessionType).toBe("ESTUDAR_AGORA");
    const uniqueHashes = new Set(session.questions.map((q) => q.statementHash));
    expect(uniqueHashes.size).toBe(6);
  });

  test("buildErrorReviewSession - prioriza erros não consolidados e aplica repetição espaçada", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const q1: QuestionSummary = {
      id: "q1",
      topicId: "t1",
      statement: "Questão de erro persistente",
      statementHash: "h1",
      difficulty: "MEDIA",
    };
    const q2: QuestionSummary = {
      id: "q2",
      topicId: "t1",
      statement: "Questão acertada recentemente após erro",
      statementHash: "h2",
      difficulty: "MEDIA",
    };

    const attempts: AttemptRecord[] = [
      // q1 foi errada há 1 hora
      {
        id: "a1",
        questionId: "q1",
        topicId: "t1",
        isCorrect: false,
        chosenOption: "C",
        timeSpentSeconds: 60,
        createdAt: new Date("2026-10-01T11:00:00Z"),
      },
      // q2 foi errada ontem, mas acertada há 10 minutos
      {
        id: "a2",
        questionId: "q2",
        topicId: "t1",
        isCorrect: false,
        chosenOption: "D",
        timeSpentSeconds: 50,
        createdAt: new Date("2026-09-30T10:00:00Z"),
      },
      {
        id: "a3",
        questionId: "q2",
        topicId: "t1",
        isCorrect: true,
        chosenOption: "B",
        timeSpentSeconds: 40,
        createdAt: new Date("2026-10-01T11:50:00Z"),
      },
    ];

    const errorSession = buildErrorReviewSession({
      allQuestions: [q1, q2],
      userAttempts: attempts,
      targetCount: 2,
      now,
    });

    // q1 deve ter precedência máxima (erro recente não consolidado)
    expect(errorSession.questions[0].id).toBe("q1");
  });

  test("calculateBankOverview - calcula visão de acervo 940 questões e métricas individuais", () => {
    const attempts: AttemptRecord[] = [
      {
        id: "1",
        questionId: "q1",
        topicId: "t1",
        isCorrect: true,
        chosenOption: "A",
        timeSpentSeconds: 30,
        createdAt: new Date(),
      },
      {
        id: "2",
        questionId: "q2",
        topicId: "t1",
        isCorrect: false,
        chosenOption: "B",
        timeSpentSeconds: 40,
        createdAt: new Date(),
      },
    ];

    const diag = evaluateTopicDiagnostic({
      topicId: "t1",
      topicTitle: "Ortografia",
      subjectName: "Língua Portuguesa",
      attempts,
    });

    const overview = calculateBankOverview({
      totalBankQuestions: 940,
      userAttempts: attempts,
      topicDiagnostics: [diag],
      targetScore: 47,
    });

    expect(overview.totalAvailable).toBe(940);
    expect(overview.totalAnsweredUnique).toBe(2);
    expect(overview.totalUnseen).toBe(938);
    expect(overview.totalWithPendingError).toBe(1); // q2 teve última tentativa errada
    expect(overview.targetScore).toBe(47);
  });
});
