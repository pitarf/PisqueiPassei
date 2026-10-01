/**
 * Motor Adaptativo de Estudo e Diagnóstico Pedagógico
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Gerencia diagnóstico por tópico, priorização estatística baseada em evidência,
 * seleção adaptativa sobre o acervo de 940 questões e repetição espaçada por item.
 */

export type DifficultyLevel = "FACIL" | "MEDIA" | "DIFICIL";

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
 */
export function calculateAdaptiveMasteryScore(correct: number, total: number, avgDiffWeight = 2): number {
  if (total <= 0) return 0;

  // Prior empírico: 50% de taxa base com peso equivalente a 8 observações
  const priorMean = 0.50;
  const priorWeight = 8;
  const smoothedRate = (correct + priorWeight * priorMean) / (total + priorWeight);

  // Fator de ajuste pela dificuldade média enfrentada (1.0 para média, 0.9 para fácil, 1.1 para difícil)
  const difficultyMultiplier = 0.8 + (avgDiffWeight * 0.1);

  // Escala final limitada a [0, 100]
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

  // Ordena tentativas por data ascendente para avaliar sequências
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

  // Desempenho por tipo de questão e nível cognitivo
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

  // Cálculo da prioridade adaptativa (0 a 100+)
  let adaptivePriorityScore = 0;
  let priorityReason = "Manutenção e consolidação de ritmo";

  if (isReviewDue) {
    adaptivePriorityScore += 65;
    priorityReason = "Revisão espaçada vencida (janela ótima de retenção)";
  } else if (answeredCount === 0) {
    adaptivePriorityScore += 45;
    priorityReason = "Tópico inédito ainda não iniciado";
  } else if (consecutiveErrorStreak >= 2) {
    adaptivePriorityScore += 40 + consecutiveErrorStreak * 5;
    priorityReason = `Erros consecutivos recentes (${consecutiveErrorStreak} erros seguidos)`;
  } else if (masteryScore < 50) {
    adaptivePriorityScore += Math.round((50 - masteryScore) * 0.9) + 25;
    priorityReason = "Baixo domínio e retenção insuficiente";
  } else if (accuracyPercentage < 65 && answeredCount >= 5) {
    adaptivePriorityScore += 20;
    priorityReason = "Aproveitamento abaixo da meta de segurança do concurso";
  }

  // Dificuldade recomendada para o momento do aluno
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
 * Seleciona a dificuldade adequada com base no domínio e histórico de tentativas.
 */
export function determineAdaptiveDifficulty(masteryScore: number, attemptsCount: number): DifficultyLevel {
  if (attemptsCount === 0) return "FACIL";
  if (masteryScore < 50) return "FACIL";
  if (masteryScore <= 70) return "MEDIA";
  if (masteryScore <= 85) {
    // 70% a 85%: sorteio proporcional (60% média, 40% difícil)
    return Math.random() < 0.6 ? "MEDIA" : "DIFICIL";
  }
  return "DIFICIL";
}

/**
 * Monta a bateria inteligente "ESTUDAR AGORA" (10 questões) distribuídas entre os
 * tópicos de maior urgência pedagógica, evitando duplicidade e variando temas.
 */
export function buildStudyNowSession(params: {
  diagnostics: TopicDiagnostic[];
  questionsByTopic: Map<string, QuestionSummary[]>;
  userAttempts: AttemptRecord[];
  targetCount?: number;
}): { questions: QuestionSummary[]; preview: AdaptiveSessionPreview } {
  const { diagnostics, questionsByTopic, userAttempts, targetCount = 10 } = params;

  // Ordena tópicos pela maior prioridade adaptativa
  const rankedTopics = [...diagnostics].sort((a, b) => b.adaptivePriorityScore - a.adaptivePriorityScore);
  const attemptedQuestionMap = new Map<string, { lastCorrect: boolean; lastAt: Date; totalErrors: number }>();

  for (const att of userAttempts) {
    const existing = attemptedQuestionMap.get(att.questionId);
    if (!existing || att.createdAt.getTime() > existing.lastAt.getTime()) {
      attemptedQuestionMap.set(att.questionId, {
        lastCorrect: att.isCorrect,
        lastAt: att.createdAt,
        totalErrors: (existing?.totalErrors || 0) + (att.isCorrect ? 0 : 1),
      });
    }
  }

  const selectedQuestions: QuestionSummary[] = [];
  const selectedTopicStats = new Map<string, { topic: TopicDiagnostic; count: number }>();
  const seenHashes = new Set<string>();

  // Itera pelos tópicos prioritários selecionando questões adequadas
  for (const topicDiag of rankedTopics) {
    if (selectedQuestions.length >= targetCount) break;
    const topicPool = questionsByTopic.get(topicDiag.topicId) || [];
    if (topicPool.length === 0) continue;

    // Prioridade de seleção no tópico:
    // 1. Questão errada pendente de revisão (espaçamento)
    // 2. Questão ainda não respondida no nível de dificuldade sugerido
    // 3. Questão ainda não respondida em outros níveis
    // 4. Questão respondida há mais tempo
    const scoredPool = topicPool.map((q) => {
      const att = attemptedQuestionMap.get(q.id);
      let score = 0;

      if (!att) {
        score += 50; // Nunca respondida
        if (q.difficulty === topicDiag.suggestedDifficulty) score += 20;
      } else if (!att.lastCorrect) {
        score += 80; // Erro recente pendente
      } else {
        // Já acertada: penaliza se recente para não repetir imediatamente
        const hoursSince = (Date.now() - att.lastAt.getTime()) / (1000 * 3600);
        if (hoursSince < 48) score -= 50;
        else score += 10;
      }

      return { question: q, score };
    });

    scoredPool.sort((a, b) => b.score - a.score);

    // Seleciona até 2 questões por tópico para garantir diversidade
    let addedForThisTopic = 0;
    for (const item of scoredPool) {
      if (selectedQuestions.length >= targetCount) break;
      if (addedForThisTopic >= 2) break;
      if (seenHashes.has(item.question.statementHash)) continue;

      selectedQuestions.push(item.question);
      seenHashes.add(item.question.statementHash);
      addedForThisTopic++;

      const currentStats = selectedTopicStats.get(topicDiag.topicId) || { topic: topicDiag, count: 0 };
      currentStats.count += 1;
      selectedTopicStats.set(topicDiag.topicId, currentStats);
    }
  }

  // Se faltou preencher o targetCount (por restrição de tópicos), busca nos demais pools
  if (selectedQuestions.length < targetCount) {
    for (const [topicId, pool] of questionsByTopic) {
      if (selectedQuestions.length >= targetCount) break;
      for (const q of pool) {
        if (selectedQuestions.length >= targetCount) break;
        if (seenHashes.has(q.statementHash)) continue;
        selectedQuestions.push(q);
        seenHashes.add(q.statementHash);
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

  const preview: AdaptiveSessionPreview = {
    sessionType: "ESTUDAR_AGORA",
    totalQuestions: selectedQuestions.length,
    selectedTopics: selectedTopicsPreview,
    explanation: "Sessão adaptativa montada com base nos tópicos que mais exigem atenção no momento.",
  };

  return { questions: selectedQuestions, preview };
}

/**
 * Monta a sessão "Revisar Meus Erros", priorizando erros não consolidados,
 * erros repetidos e aplicando espaçamento quando o aluno já acertou uma vez.
 */
export function buildErrorReviewSession(params: {
  allQuestions: QuestionSummary[];
  userAttempts: AttemptRecord[];
  targetCount?: number;
  now?: Date;
}): { questions: QuestionSummary[]; preview: AdaptiveSessionPreview } {
  const { allQuestions, userAttempts, targetCount = 10, now = new Date() } = params;
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

  // Agrupa tentativas por questão
  const attemptsByQuestion = new Map<string, AttemptRecord[]>();
  for (const att of userAttempts) {
    const list = attemptsByQuestion.get(att.questionId) || [];
    list.push(att);
    attemptsByQuestion.set(att.questionId, list);
  }

  // Candidatas: questões que possuem ao menos 1 erro no histórico
  const candidateList: Array<{ question: QuestionSummary; score: number; reason: string }> = [];

  for (const [qId, attList] of attemptsByQuestion.entries()) {
    const q = questionMap.get(qId);
    if (!q) continue;

    const errorCount = attList.filter((a) => !a.isCorrect).length;
    if (errorCount === 0) continue;

    const sorted = [...attList].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const lastAttempt = sorted[sorted.length - 1];
    const isLastCorrect = lastAttempt.isCorrect;

    let score = 0;
    let reason = "Erro anterior pendente de fixação";

    if (!isLastCorrect) {
      // Última tentativa foi erro: alta urgência de revisão imediata
      score += 100 + errorCount * 10;
      reason = errorCount > 1 ? `Erro repetido (${errorCount}x) não consolidado` : "Erro recente não consolidado";
    } else {
      // Aluno acertou após erro anterior: aplica espaçamento!
      // Não some imediatamente: se passou mais de 2 dias, revisa para consolidação duradoura
      const daysSince = (now.getTime() - lastAttempt.createdAt.getTime()) / (1000 * 3600 * 24);
      if (daysSince >= 2) {
        score += 50 + Math.min(30, Math.round(daysSince * 5));
        reason = "Revisão espaçada de questão anteriormente errada";
      } else {
        score -= 50; // Acertada muito recentemente, aguarda o intervalo de espaçamento
      }
    }

    if (q.difficulty === "DIFICIL") score += 15;
    candidateList.push({ question: q, score, reason });
  }

  candidateList.sort((a, b) => b.score - a.score);
  const selected = candidateList.slice(0, targetCount).map((c) => c.question);

  const preview: AdaptiveSessionPreview = {
    sessionType: "TREINO_ERROS",
    totalQuestions: selected.length,
    selectedTopics: [],
    explanation: "Fila de treino direcionada exclusivamente aos itens com erro histórico e repetição espaçada.",
  };

  return { questions: selected, preview };
}

/**
 * Calcula a visão panorâmica do banco de 940 questões para o dashboard do aluno.
 */
export function calculateBankOverview(params: {
  totalBankQuestions: number; // 940
  userAttempts: AttemptRecord[];
  topicDiagnostics: TopicDiagnostic[];
  targetScore?: number;
}): BankStatsOverview {
  const { totalBankQuestions = 940, userAttempts, topicDiagnostics, targetScore = 47 } = params;

  const attemptedQuestionIds = new Set<string>();
  const questionsWithRecentError = new Set<string>();
  const lastAttemptMap = new Map<string, boolean>();

  // Identifica última tentativa de cada questão
  const sortedAttempts = [...userAttempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const att of sortedAttempts) {
    attemptedQuestionIds.add(att.questionId);
    lastAttemptMap.set(att.questionId, att.isCorrect);
  }

  for (const [qId, isCorrect] of lastAttemptMap.entries()) {
    if (!isCorrect) questionsWithRecentError.add(qId);
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
    totalWithPendingError: questionsWithRecentError.size,
    totalInReview,
    overallMastery,
    targetScore,
  };
}
