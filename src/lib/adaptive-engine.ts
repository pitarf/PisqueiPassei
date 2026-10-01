/**
 * Motor Adaptativo de Estudo e Diagnóstico Pedagógico
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Gerencia diagnóstico por tópico, priorização estatística baseada em evidência,
 * seleção determinística adaptativa sobre o acervo de 940 questões e repetição espaçada por item.
 */

export type DifficultyLevel = "FACIL" | "MEDIA" | "DIFICIL";

export type QuestionStudyStatus = "NUNCA_VISTA" | "PENDENTE" | "REVISAO_DEVIDA" | "EM_CONSOLIDACAO" | "CONSOLIDADA";

export interface QuestionSummary {
  id: string;
  topicId: string;
  statement: string;
  statementHash: string;
  difficulty: DifficultyLevel;
  questionType?: string | null;
  cognitiveLevel?: string | null;
  topicTitle?: string;
  subjectName?: string;
}

export interface AttemptRecord {
  id: string;
  questionId: string;
  topicId: string;
  isCorrect: boolean;
  chosenOption: string;
  timeSpentSeconds: number;
  createdAt: Date;
  difficulty?: DifficultyLevel;
  questionType?: string | null;
  cognitiveLevel?: string | null;
}

export interface SubMetric {
  total: number;
  correct: number;
  percentage: number;
}

export interface TopicDiagnostic {
  topicId: string;
  topicTitle: string;
  topicCode?: string | null;
  subjectName: string;
  answeredCount: number;
  correctCount: number;
  errorCount: number;
  accuracyPercentage: number;
  consecutiveCorrectStreak: number;
  consecutiveErrorStreak: number;
  averageDifficultyScore: number; // 1 = FACIL, 2 = MEDIA, 3 = DIFICIL
  difficultyPerformance: Record<DifficultyLevel, SubMetric>;
  questionTypePerformance: Record<string, SubMetric>;
  cognitiveLevelPerformance: Record<string, SubMetric>;
  lastStudiedAt: Date | null;
  nextReviewDate: Date | null;
  isReviewDue: boolean;
  masteryScore: number; // 0 a 100 ponderado por amostra
  sampleConfidence: "NENHUMA" | "BAIXA" | "MODERADA" | "ALTA";
  adaptivePriorityScore: number;
  priorityReason: string;
  suggestedDifficulty: DifficultyLevel;
}

export interface AdaptiveSessionPreview {
  sessionType: "ESTUDAR_AGORA" | "TREINO_TOPICO" | "TREINO_ERROS";
  totalQuestions: number;
  newQuestionsCount: number;
  reviewQuestionsCount: number;
  expectedDifficulty: DifficultyLevel;
  selectedTopics: Array<{
    topicId: string;
    topicCode?: string | null;
    title: string;
    subjectName: string;
    reason: string;
    suggestedDifficulty: DifficultyLevel;
    questionsCount: number;
  }>;
  explanation: string;
}

export interface BankStatsOverview {
  totalAvailable: number; // 940
  totalAnsweredUnique: number;
  totalUnseen: number;
  totalMastered: number; // masteryScore >= 80
  totalWithPendingError: number;
  totalInReview: number;
  overallMastery: number;
  targetScore: number; // 47
}

export interface QuestionHistoryDetail {
  questionId: string;
  totalAttempts: number;
  totalErrors: number;
  totalCorrect: number;
  lastAttemptAt: Date;
  lastCorrect: boolean;
  consecutiveErrors: number;
  consecutiveCorrect: number;
  status: QuestionStudyStatus;
  currentIntervalDays: number;
  nextReviewDate: Date | null;
  isReviewDue: boolean;
}

/**
 * PRNG Determinístico (Mulberry32) baseado em semente inteira ou string.
 * Garante que a mesma seed e a mesma entrada gerem a mesma seleção de forma reprodutível.
 */
export function createSeededRng(seed: number | string = 1337): () => number {
  let s: number;
  if (typeof seed === "string") {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    s = h >>> 0;
  } else {
    s = Math.floor(Math.abs(seed)) >>> 0;
  }
  if (s === 0) s = 1;

  return function mulberry32() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Embaralha um array de forma determinística utilizando o gerador pseudoaleatório fornecido.
 */
export function seededShuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Converte a dificuldade textual em peso numérico.
 */
export function getDifficultyWeight(difficulty: string | null | undefined): number {
  const norm = String(difficulty || "").toUpperCase();
  if (norm === "FACIL") return 1;
  if (norm === "DIFICIL") return 3;
  return 2; // MEDIA como padrão
}

/**
 * Calcula o Score de Domínio (0 a 100) com regularização bayesiana para evitar
 * distorções em amostras pequenas (ex.: 2 acertos em 2 questões = 60%, e não 100%).
 *
 * Fórmula: smoothedRate = (correct + 4) / (total + 8)
 * diffMultiplier = 0.8 + (avgDiffWeight * 0.1)
 * rawScore = smoothedRate * 100 * diffMultiplier
 * Clamping estrito em [0, 100].
 */
export function calculateAdaptiveMasteryScore(correct: number, total: number, avgDiffWeight = 2): number {
  if (total <= 0) return 0;
  const safeCorrect = Math.max(0, Math.min(total, correct));
  const priorMean = 0.50;
  const priorWeight = 8;
  const smoothedRate = (safeCorrect + priorWeight * priorMean) / (total + priorWeight);

  const difficultyMultiplier = 0.8 + (avgDiffWeight * 0.1);
  const rawScore = smoothedRate * 100 * difficultyMultiplier;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Determina o grau de confiança estatística da amostra do aluno no tópico.
 */
export function getSampleConfidence(total: number): TopicDiagnostic["sampleConfidence"] {
  if (total === 0) return "NENHUMA";
  if (total < 5) return "BAIXA";
  if (total < 15) return "MODERADA";
  return "ALTA";
}

/**
 * Avalia o diagnóstico individual de um tópico com base nas tentativas históricas do usuário.
 */
export function evaluateTopicDiagnostic(params: {
  topicId: string;
  topicTitle: string;
  topicCode?: string | null;
  subjectName: string;
  attempts: AttemptRecord[];
  nextReviewDate?: Date | null;
  lastStudiedAt?: Date | null;
  now?: Date;
}): TopicDiagnostic {
  const { topicId, topicTitle, topicCode, subjectName, attempts, now = new Date() } = params;

  // Ordena tentativas por data ascendente para avaliar sequências históricas
  const sortedAttempts = [...attempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const answeredCount = sortedAttempts.length;
  const correctCount = sortedAttempts.filter((a) => a.isCorrect).length;
  const errorCount = answeredCount - correctCount;
  const accuracyPercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Calcula sequências consecutivas no final da série
  let consecutiveCorrectStreak = 0;
  let consecutiveErrorStreak = 0;
  for (let i = sortedAttempts.length - 1; i >= 0; i--) {
    if (sortedAttempts[i].isCorrect) {
      if (consecutiveErrorStreak === 0) consecutiveCorrectStreak++;
      else break;
    } else {
      if (consecutiveCorrectStreak === 0) consecutiveErrorStreak++;
      else break;
    }
  }

  // Desempenho por dificuldade
  const diffMap: Record<DifficultyLevel, { total: number; correct: number }> = {
    FACIL: { total: 0, correct: 0 },
    MEDIA: { total: 0, correct: 0 },
    DIFICIL: { total: 0, correct: 0 },
  };

  const typeMap: Record<string, { total: number; correct: number }> = {};
  const cogMap: Record<string, { total: number; correct: number }> = {};
  let diffWeightSum = 0;

  for (const a of sortedAttempts) {
    const diff = (a.difficulty || "MEDIA").toUpperCase() as DifficultyLevel;
    const safeDiff: DifficultyLevel = ["FACIL", "MEDIA", "DIFICIL"].includes(diff) ? diff : "MEDIA";
    diffMap[safeDiff].total++;
    if (a.isCorrect) diffMap[safeDiff].correct++;
    diffWeightSum += getDifficultyWeight(safeDiff);

    if (a.questionType) {
      const qType = a.questionType.toUpperCase();
      typeMap[qType] = typeMap[qType] || { total: 0, correct: 0 };
      typeMap[qType].total++;
      if (a.isCorrect) typeMap[qType].correct++;
    }

    if (a.cognitiveLevel) {
      const cLevel = a.cognitiveLevel.toUpperCase();
      cogMap[cLevel] = cogMap[cLevel] || { total: 0, correct: 0 };
      cogMap[cLevel].total++;
      if (a.isCorrect) cogMap[cLevel].correct++;
    }
  }

  const averageDifficultyScore = answeredCount > 0 ? Number((diffWeightSum / answeredCount).toFixed(2)) : 2.0;

  const difficultyPerformance: Record<DifficultyLevel, SubMetric> = {
    FACIL: { total: diffMap.FACIL.total, correct: diffMap.FACIL.correct, percentage: diffMap.FACIL.total > 0 ? Math.round((diffMap.FACIL.correct / diffMap.FACIL.total) * 100) : 0 },
    MEDIA: { total: diffMap.MEDIA.total, correct: diffMap.MEDIA.correct, percentage: diffMap.MEDIA.total > 0 ? Math.round((diffMap.MEDIA.correct / diffMap.MEDIA.total) * 100) : 0 },
    DIFICIL: { total: diffMap.DIFICIL.total, correct: diffMap.DIFICIL.correct, percentage: diffMap.DIFICIL.total > 0 ? Math.round((diffMap.DIFICIL.correct / diffMap.DIFICIL.total) * 100) : 0 },
  };

  const questionTypePerformance: Record<string, SubMetric> = {};
  for (const [k, v] of Object.entries(typeMap)) {
    questionTypePerformance[k] = { total: v.total, correct: v.correct, percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 };
  }

  const cognitiveLevelPerformance: Record<string, SubMetric> = {};
  for (const [k, v] of Object.entries(cogMap)) {
    cognitiveLevelPerformance[k] = { total: v.total, correct: v.correct, percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 };
  }

  const masteryScore = calculateAdaptiveMasteryScore(correctCount, answeredCount, averageDifficultyScore);
  const sampleConfidence = getSampleConfidence(answeredCount);

  const lastAttemptDate = sortedAttempts.length > 0 ? sortedAttempts[sortedAttempts.length - 1].createdAt : null;
  const lastStudiedAt = params.lastStudiedAt || lastAttemptDate;
  const nextReviewDate = params.nextReviewDate || null;
  const isReviewDue = Boolean(nextReviewDate && nextReviewDate.getTime() <= now.getTime());

  // Cálculo da prioridade adaptativa ponderada (evita dominação permanente de um único fator)
  let adaptivePriorityScore = 0;
  let priorityReason = "Manutenção e consolidação de ritmo";

  if (isReviewDue) {
    // 1. Revisão vencida: peso alto mas balanceado
    adaptivePriorityScore += 65;
    priorityReason = "Revisão espaçada vencida (janela ótima de retenção)";
  } else if (answeredCount === 0) {
    // 2. Tópico inédito: prioridade de exploração
    adaptivePriorityScore += 45;
    priorityReason = "Tópico inédito ainda não iniciado";
  } else if (consecutiveErrorStreak >= 2) {
    // 3. Erros consecutivos recentes
    adaptivePriorityScore += 40 + Math.min(25, consecutiveErrorStreak * 5);
    priorityReason = `Erros consecutivos recentes (${consecutiveErrorStreak} erros seguidos)`;
  } else if (masteryScore < 50) {
    // 4. Baixo domínio consolidado
    adaptivePriorityScore += Math.round((50 - masteryScore) * 0.8) + 25;
    priorityReason = "Baixo domínio e retenção insuficiente";
  } else if (accuracyPercentage < 65 && answeredCount >= 5) {
    // 5. Aproveitamento abaixo da meta de segurança
    adaptivePriorityScore += 20;
    priorityReason = "Aproveitamento abaixo da meta de segurança do concurso";
  }

  // Fator de recência para tópicos estudados: tópicos não estudados há muitos dias ganham leve bônus
  if (lastStudiedAt && answeredCount > 0) {
    const daysSinceLastStudy = (now.getTime() - lastStudiedAt.getTime()) / (1000 * 3600 * 24);
    if (daysSinceLastStudy > 7) {
      adaptivePriorityScore += Math.min(15, Math.round((daysSinceLastStudy - 7) * 1.5));
    }
  }

  // Dificuldade recomendada para o momento pedagógico
  let suggestedDifficulty: DifficultyLevel = "MEDIA";
  if (answeredCount === 0 || masteryScore < 50) {
    suggestedDifficulty = "FACIL";
  } else if (masteryScore >= 85) {
    suggestedDifficulty = "DIFICIL";
  } else {
    suggestedDifficulty = "MEDIA";
  }

  return {
    topicId,
    topicTitle,
    topicCode,
    subjectName,
    answeredCount,
    correctCount,
    errorCount,
    accuracyPercentage,
    consecutiveCorrectStreak,
    consecutiveErrorStreak,
    averageDifficultyScore,
    difficultyPerformance,
    questionTypePerformance,
    cognitiveLevelPerformance,
    lastStudiedAt,
    nextReviewDate,
    isReviewDue,
    masteryScore,
    sampleConfidence,
    adaptivePriorityScore,
    priorityReason,
    suggestedDifficulty,
  };
}

/**
 * Seleciona a dificuldade adequada com base no domínio e histórico de tentativas de forma determinística.
 * Aceita rng determinístico opcional para a faixa de transição [70%, 85%].
 */
export function determineAdaptiveDifficulty(
  masteryScore: number,
  attemptsCount: number,
  rng: () => number = Math.random
): DifficultyLevel {
  if (attemptsCount === 0) return "FACIL";
  if (masteryScore < 50) return "FACIL";
  if (masteryScore <= 70) return "MEDIA";
  if (masteryScore <= 85) {
    // 70% a 85%: transição determinística ponderada (60% média, 40% difícil)
    return rng() < 0.6 ? "MEDIA" : "DIFICIL";
  }
  return "DIFICIL";
}

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const TOLERANCE_MS = 60 * 60 * 1000; // 1 hora de tolerância operacional (fuso horário e pequenas variações)

/**
 * Avalia se a sequência de acertos respeitou a cadência mínima de espaçamento temporal para consolidação.
 * Regras estritas:
 * - Se houve erro prévio: exige pelo menos 3 acertos consecutivos após o último erro.
 *   - 1º acerto: >= 1 dia após o último erro;
 *   - 2º acerto: >= 3 dias após o 1º acerto;
 *   - 3º acerto: >= 7 dias após o 2º acerto;
 * - Se nunca houve erro (todas corretas): exige pelo menos 3 acertos espaçados (>= 1d entre 1º e 2º, >= 3d entre 2º e 3º).
 * Qualquer novo erro reinicia completamente o ciclo.
 */
export function validateSrsTemporalCadence(sortedAttempts: AttemptRecord[]): boolean {
  if (sortedAttempts.length < 3) return false;

  // Localiza o índice do último erro no histórico
  let lastErrorIndex = -1;
  for (let i = sortedAttempts.length - 1; i >= 0; i--) {
    if (!sortedAttempts[i].isCorrect) {
      lastErrorIndex = i;
      break;
    }
  }

  // Caso haja histórico prévio de erro
  if (lastErrorIndex !== -1) {
    const correctAfterError = sortedAttempts.slice(lastErrorIndex + 1);
    if (correctAfterError.length < 3) return false;

    const errorAttempt = sortedAttempts[lastErrorIndex];
    const a1 = correctAfterError[0];
    const a2 = correctAfterError[1];
    const a3 = correctAfterError[2];

    const d1 = a1.createdAt.getTime() - errorAttempt.createdAt.getTime();
    const d2 = a2.createdAt.getTime() - a1.createdAt.getTime();
    const d3 = a3.createdAt.getTime() - a2.createdAt.getTime();

    const minD1 = 1 * ONE_DAY_MS - TOLERANCE_MS;
    const minD2 = 3 * ONE_DAY_MS - TOLERANCE_MS;
    const minD3 = 7 * ONE_DAY_MS - TOLERANCE_MS;

    return d1 >= minD1 && d2 >= minD2 && d3 >= minD3;
  }

  // Caso não haja histórico de erro (100% de acertos desde o início)
  const a1 = sortedAttempts[0];
  const a2 = sortedAttempts[1];
  const a3 = sortedAttempts[2];

  const d1 = a2.createdAt.getTime() - a1.createdAt.getTime();
  const d2 = a3.createdAt.getTime() - a2.createdAt.getTime();

  return d1 >= (1 * ONE_DAY_MS - TOLERANCE_MS) && d2 >= (3 * ONE_DAY_MS - TOLERANCE_MS);
}

/**
 * Avalia o histórico acumulado detalhado de uma questão específica a partir de todas as suas tentativas.
 * Aplica consolidação temporal real (1d -> 3d -> 7d) e gerencia os estados:
 * - NUNCA_VISTA: nenhuma tentativa registrada
 * - PENDENTE: último resultado foi erro recente (< 1 dia)
 * - REVISAO_DEVIDA: agendamento de revisão SRS vencido (nextReviewDate <= now)
 * - EM_CONSOLIDACAO: questão acertada, mas ainda sem cumprir a cadência temporal completa de consolidação
 * - CONSOLIDADA: cadência temporal e sequência de acertos estritamente cumpridas
 */
export function evaluateQuestionHistory(
  questionId: string,
  attempts: AttemptRecord[],
  now: Date = new Date()
): QuestionHistoryDetail {
  const sorted = [...attempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const totalAttempts = sorted.length;

  if (totalAttempts === 0) {
    return {
      questionId,
      totalAttempts: 0,
      totalErrors: 0,
      totalCorrect: 0,
      lastAttemptAt: new Date(0),
      lastCorrect: false,
      consecutiveErrors: 0,
      consecutiveCorrect: 0,
      status: "NUNCA_VISTA",
      currentIntervalDays: 0,
      nextReviewDate: null,
      isReviewDue: false,
    };
  }

  let totalErrors = 0;
  let totalCorrect = 0;
  let consecutiveErrors = 0;
  let consecutiveCorrect = 0;
  let currentIntervalDays = 1;

  for (const att of sorted) {
    if (att.isCorrect) {
      totalCorrect++;
      consecutiveErrors = 0;
      consecutiveCorrect++;
      // Progressão formal de SRS: 1 -> 3 -> 7 -> 14 -> 30 dias
      if (consecutiveCorrect === 1) currentIntervalDays = 1;
      else if (consecutiveCorrect === 2) currentIntervalDays = 3;
      else if (consecutiveCorrect === 3) currentIntervalDays = 7;
      else if (consecutiveCorrect === 4) currentIntervalDays = 14;
      else currentIntervalDays = 30;
    } else {
      totalErrors++;
      consecutiveCorrect = 0;
      consecutiveErrors++;
      currentIntervalDays = 1; // Qualquer novo erro reinicia o ciclo
    }
  }

  const lastAttempt = sorted[sorted.length - 1];
  const lastCorrect = lastAttempt.isCorrect;
  const nextReviewDate = new Date(lastAttempt.createdAt.getTime() + currentIntervalDays * ONE_DAY_MS);
  const isReviewDue = nextReviewDate.getTime() <= now.getTime();

  let status: QuestionStudyStatus;
  if (!lastCorrect) {
    // Erro na última tentativa: se a janela de 1 dia já venceu, vira REVISAO_DEVIDA, senão PENDENTE
    status = isReviewDue ? "REVISAO_DEVIDA" : "PENDENTE";
  } else {
    // Acerto na última tentativa: verifica se cumpriu efetivamente a cadência de consolidação temporal
    const isConsolidated = validateSrsTemporalCadence(sorted);
    if (isConsolidated) {
      status = "CONSOLIDADA";
    } else if (isReviewDue) {
      status = "REVISAO_DEVIDA";
    } else {
      status = "EM_CONSOLIDACAO";
    }
  }

  return {
    questionId,
    totalAttempts,
    totalErrors,
    totalCorrect,
    lastAttemptAt: lastAttempt.createdAt,
    lastCorrect,
    consecutiveErrors,
    consecutiveCorrect,
    status,
    currentIntervalDays,
    nextReviewDate,
    isReviewDue,
  };
}

/**
 * Monta a bateria inteligente "ESTUDAR AGORA" (10 questões) distribuídas entre os
 * tópicos de maior urgência pedagógica, evitando duplicidade e variando temas.
 * Utiliza PRNG determinístico se `seed` for especificada.
 */
export function buildStudyNowSession(params: {
  diagnostics: TopicDiagnostic[];
  questionsByTopic: Map<string, QuestionSummary[]>;
  userAttempts: AttemptRecord[];
  targetCount?: number;
  now?: Date;
  seed?: number | string;
}): { questions: QuestionSummary[]; preview: AdaptiveSessionPreview } {
  const { diagnostics, questionsByTopic, userAttempts, targetCount = 10, now = new Date(), seed } = params;
  const rng = seed !== undefined ? createSeededRng(seed) : Math.random;

  // Ordena tópicos pela maior prioridade adaptativa
  const rankedTopics = [...diagnostics].sort((a, b) => b.adaptivePriorityScore - a.adaptivePriorityScore);

  // Mapeia todas as tentativas acumuladas por questão sem descartar histórico
  const attemptsByQuestion = new Map<string, AttemptRecord[]>();
  for (const att of userAttempts) {
    const list = attemptsByQuestion.get(att.questionId) || [];
    list.push(att);
    attemptsByQuestion.set(att.questionId, list);
  }

  const questionHistoryMap = new Map<string, QuestionHistoryDetail>();
  for (const [qId, list] of attemptsByQuestion.entries()) {
    questionHistoryMap.set(qId, evaluateQuestionHistory(qId, list, now));
  }

  const selectedQuestions: QuestionSummary[] = [];
  const selectedTopicStats = new Map<string, { topic: TopicDiagnostic; count: number }>();
  const seenHashes = new Set<string>();

  let newQuestionsCount = 0;
  let reviewQuestionsCount = 0;

  // Itera pelos tópicos prioritários selecionando questões adequadas
  for (const topicDiag of rankedTopics) {
    if (selectedQuestions.length >= targetCount) break;
    const rawTopicPool = questionsByTopic.get(topicDiag.topicId) || [];
    if (rawTopicPool.length === 0) continue;

    // Embaralha o pool do tópico com o RNG seeded para despolarizar escolhas
    const topicPool = seededShuffle(rawTopicPool, rng);

    // Prioridade de seleção no tópico:
    // 1. Questão com revisão pendente ou vencida
    // 2. Questão ainda não respondida no nível de dificuldade sugerido
    // 3. Questão ainda não respondida em outros níveis
    // 4. Questão respondida há mais tempo
    const scoredPool = topicPool.map((q) => {
      const hist = questionHistoryMap.get(q.id);
      let score = 0;

      if (!hist || hist.status === "NUNCA_VISTA") {
        score += 50; // Nunca respondida
        if (q.difficulty === topicDiag.suggestedDifficulty) score += 20;
      } else if (!hist.lastCorrect) {
        score += 85 + Math.min(15, hist.consecutiveErrors * 5); // Erro recente pendente
      } else if (hist.isReviewDue) {
        score += 75; // Revisão espaçada devida
      } else {
        // Já acertada e não vencida: penaliza se recente para não repetir imediatamente
        const hoursSince = (now.getTime() - hist.lastAttemptAt.getTime()) / (1000 * 3600);
        if (hoursSince < 48) score -= 50;
        else score += 10;
      }

      return { question: q, score, isNew: !hist || hist.status === "NUNCA_VISTA" };
    });

    // Ordenação determinística com desempate por statementHash
    scoredPool.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.question.statementHash.localeCompare(b.question.statementHash);
    });

    // Seleciona até 2 questões por tópico para garantir diversidade
    let addedForThisTopic = 0;
    for (const item of scoredPool) {
      if (selectedQuestions.length >= targetCount) break;
      if (addedForThisTopic >= 2) break;
      if (seenHashes.has(item.question.statementHash)) continue;

      selectedQuestions.push(item.question);
      seenHashes.add(item.question.statementHash);
      addedForThisTopic++;

      if (item.isNew) newQuestionsCount++;
      else reviewQuestionsCount++;

      const currentStats = selectedTopicStats.get(topicDiag.topicId) || { topic: topicDiag, count: 0 };
      currentStats.count += 1;
      selectedTopicStats.set(topicDiag.topicId, currentStats);
    }
  }

  // Se faltou preencher o targetCount (por restrição de 2 por tópico), busca nos demais pools
  if (selectedQuestions.length < targetCount) {
    for (const [topicId, pool] of questionsByTopic) {
      if (selectedQuestions.length >= targetCount) break;
      const shuffledPool = seededShuffle(pool, rng);
      for (const q of shuffledPool) {
        if (selectedQuestions.length >= targetCount) break;
        if (seenHashes.has(q.statementHash)) continue;

        selectedQuestions.push(q);
        seenHashes.add(q.statementHash);

        const hist = questionHistoryMap.get(q.id);
        if (!hist || hist.status === "NUNCA_VISTA") newQuestionsCount++;
        else reviewQuestionsCount++;
      }
    }
  }

  const selectedTopicsPreview = Array.from(selectedTopicStats.values()).map(({ topic, count }) => ({
    topicId: topic.topicId,
    topicCode: topic.topicCode,
    title: topic.topicTitle,
    subjectName: topic.subjectName,
    reason: topic.priorityReason,
    suggestedDifficulty: topic.suggestedDifficulty,
    questionsCount: count,
  }));

  const expectedDifficulty: DifficultyLevel =
    selectedTopicsPreview.some((t) => t.suggestedDifficulty === "FACIL")
      ? "FACIL"
      : selectedTopicsPreview.some((t) => t.suggestedDifficulty === "DIFICIL")
      ? "DIFICIL"
      : "MEDIA";

  const preview: AdaptiveSessionPreview = {
    sessionType: "ESTUDAR_AGORA",
    totalQuestions: selectedQuestions.length,
    newQuestionsCount,
    reviewQuestionsCount,
    expectedDifficulty,
    selectedTopics: selectedTopicsPreview,
    explanation: "Sessão adaptativa montada com base nos tópicos que mais exigem atenção no momento, dosando itens novos e revisões.",
  };

  return { questions: selectedQuestions, preview };
}

/**
 * Monta a sessão "Revisar Meus Erros", priorizando erros não consolidados,
 * erros repetidos e aplicando espaçamento quando o aluno já acertou uma vez.
 * Suporta seed determinística para testes e variabilidade reprodutível.
 */
export function buildErrorReviewSession(params: {
  allQuestions: QuestionSummary[];
  userAttempts: AttemptRecord[];
  targetCount?: number;
  now?: Date;
  seed?: number | string;
}): { questions: QuestionSummary[]; preview: AdaptiveSessionPreview } {
  const { allQuestions, userAttempts, targetCount = 10, now = new Date(), seed } = params;
  const rng = seed !== undefined ? createSeededRng(seed) : Math.random;
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

  // Agrupa tentativas por questão
  const attemptsByQuestion = new Map<string, AttemptRecord[]>();
  for (const att of userAttempts) {
    const list = attemptsByQuestion.get(att.questionId) || [];
    list.push(att);
    attemptsByQuestion.set(att.questionId, list);
  }

  // Candidatas: questões que possuem ao menos 1 erro no histórico
  const candidateList: Array<{ question: QuestionSummary; score: number; reason: string; hist: QuestionHistoryDetail }> = [];

  for (const [qId, attList] of attemptsByQuestion.entries()) {
    const q = questionMap.get(qId);
    if (!q) continue;

    const hist = evaluateQuestionHistory(qId, attList, now);
    if (hist.totalErrors === 0) continue; // Nunca errou, não entra na fila de erros

    // Questões já CONSOLIDADAS saem da fila ativa de erros
    if (hist.status === "CONSOLIDADA") continue;

    let score = 0;
    let reason = "Erro anterior pendente de fixação";

    if (hist.status === "PENDENTE" || !hist.lastCorrect) {
      // Erro recente ainda não respondido corretamente
      score += 100 + hist.totalErrors * 10 + hist.consecutiveErrors * 5;
      reason = hist.totalErrors > 1 ? `Erro recorrente (${hist.totalErrors}x) pendente` : "Erro recente pendente";
    } else if (hist.isReviewDue || hist.status === "REVISAO_DEVIDA") {
      // Acertou anteriormente mas a janela SRS de consolidação venceu
      score += 70 + Math.min(25, hist.totalErrors * 5);
      reason = "Janela de repetição espaçada devida para fixação duradoura";
    } else {
      // Acertada recentemente em processo de consolidação mas com revisão futura ainda não devida
      score += 20 + Math.min(10, hist.totalErrors * 2);
      reason = "Em consolidação gradativa (intervalo SRS em andamento)";
    }

    if (q.difficulty === "DIFICIL") score += 10;
    candidateList.push({ question: q, score, reason, hist });
  }

  // Ordenação determinística com critério de desempate estável
  candidateList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.question.statementHash.localeCompare(b.question.statementHash);
  });

  const selected = candidateList.slice(0, targetCount).map((c) => c.question);

  const preview: AdaptiveSessionPreview = {
    sessionType: "TREINO_ERROS",
    totalQuestions: selected.length,
    newQuestionsCount: 0,
    reviewQuestionsCount: selected.length,
    expectedDifficulty: "MEDIA",
    selectedTopics: [],
    explanation: "Fila de treino direcionada exclusivamente aos itens com erro histórico, priorizando pendências e revisões vencidas.",
  };

  return { questions: selected, preview };
}

/**
 * Calcula a visão panorâmica do banco de 940 questões para o dashboard do aluno.
 * Distingue rigorosamente:
 * - totalAvailable (940)
 * - totalAnsweredUnique (itens distintos respondidos)
 * - totalUnseen (itens ainda não vistos)
 * - totalMastered (tópicos com domínio bayesiano >= 80)
 * - totalWithPendingError (itens cujo último resultado foi erro)
 * - totalInReview (tópicos com revisão SRS vencida)
 */
export function calculateBankOverview(params: {
  totalBankQuestions: number; // 940
  userAttempts: AttemptRecord[];
  topicDiagnostics: TopicDiagnostic[];
  targetScore?: number;
}): BankStatsOverview {
  const { totalBankQuestions = 940, userAttempts, topicDiagnostics, targetScore = 47 } = params;

  const attemptedQuestionIds = new Set<string>();
  const lastAttemptMap = new Map<string, { isCorrect: boolean; at: Date }>();

  // Identifica última tentativa de cada questão por data
  const sortedAttempts = [...userAttempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const att of sortedAttempts) {
    attemptedQuestionIds.add(att.questionId);
    lastAttemptMap.set(att.questionId, { isCorrect: att.isCorrect, at: att.createdAt });
  }

  let totalWithPendingError = 0;
  for (const [, item] of lastAttemptMap.entries()) {
    if (!item.isCorrect) totalWithPendingError++;
  }

  const totalAnsweredUnique = attemptedQuestionIds.size;
  const totalUnseen = Math.max(0, totalBankQuestions - totalAnsweredUnique);
  const totalMastered = topicDiagnostics.filter((d) => d.masteryScore >= 80).length;
  const totalInReview = topicDiagnostics.filter((d) => d.isReviewDue).length;

  const overallMastery = topicDiagnostics.length > 0
    ? Math.round(topicDiagnostics.reduce((acc, d) => acc + d.masteryScore, 0) / topicDiagnostics.length)
    : 0;

  return {
    totalAvailable: totalBankQuestions,
    totalAnsweredUnique,
    totalUnseen,
    totalMastered,
    totalWithPendingError,
    totalInReview,
    overallMastery,
    targetScore,
  };
}
