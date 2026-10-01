/**
 * Regras oficiais de pontuação e diagnóstico da prova Transpetro 2026.3
 * Nível Técnico • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Avalia critérios eliminatórios oficiais, cálculo da meta 47/60 e metas por disciplina,
 * e gera o plano pedagógico "Seu próximo estudo" com base no desempenho.
 */

export interface TopicPerformanceItem {
  topicId: string;
  title: string;
  code?: string | null;
  subject: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface NextStudyPlanItem {
  order: number;
  topicId: string;
  title: string;
  code?: string | null;
  subject: string;
  reason: string;
}

export interface ExamDiagnostic {
  totalScore: number;
  maxScore: number;
  percentage: number;
  targetScore: number;
  pointsToTarget: number;
  isAboveTarget: boolean;
  isEliminated: boolean;
  eliminationReasons: string[];
  breakdown: {
    portugueseScore: number;
    portugueseTotal: number;
    mathScore: number;
    mathTotal: number;
    specificScore: number;
    specificTotal: number;
  };
  targetComparison: {
    overall: { score: number; target: number; met: boolean };
    specific: { score: number; target: number; met: boolean };
    portuguese: { score: number; target: number; met: boolean };
    math: { score: number; target: number; met: boolean };
  };
  unansweredCount: number;
  errorsCount: number;
  difficultyBreakdown?: Record<string, { correct: number; total: number; percentage: number }>;
  cognitiveBreakdown?: Record<string, { correct: number; total: number; percentage: number }>;
  topicBreakdown?: TopicPerformanceItem[];
  nextStudyPlan?: NextStudyPlanItem[];
  recommendations: string[];
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function evaluateSimulation(params: {
  portugueseCorrect: number;
  mathCorrect: number;
  specificCorrect: number;
  targetScore?: number;
  unansweredCount?: number;
  difficultyStats?: Record<string, { correct: number; total: number }>;
  cognitiveStats?: Record<string, { correct: number; total: number }>;
  topicStats?: Array<{ topicId: string; title: string; code?: string | null; subject: string; correct: number; total: number }>;
}): ExamDiagnostic {
  const {
    portugueseCorrect,
    mathCorrect,
    specificCorrect,
    targetScore = 47,
    unansweredCount = 0,
    difficultyStats,
    cognitiveStats,
    topicStats,
  } = params;

  const portugueseTotal = 10;
  const mathTotal = 10;
  const specificTotal = 40;
  const maxScore = 60;

  const port = clampInteger(portugueseCorrect, 0, portugueseTotal);
  const math = clampInteger(mathCorrect, 0, mathTotal);
  const specific = clampInteger(specificCorrect, 0, specificTotal);
  const target = clampInteger(targetScore, 0, maxScore);

  const totalScore = port + math + specific;
  const percentage = Number(((totalScore / maxScore) * 100).toFixed(1));
  const pointsToTarget = totalScore - target;
  const isAboveTarget = totalScore >= target;
  const eliminationReasons: string[] = [];
  const generalCorrect = port + math;
  const generalTotal = portugueseTotal + mathTotal;

  // Critérios de eliminação oficiais da banca Cesgranrio
  if (generalCorrect < generalTotal * 0.5) {
    eliminationReasons.push(`Eliminado: aproveitamento inferior a 50% em Conhecimentos Gerais (${generalCorrect}/${generalTotal}).`);
  }
  if (specific < specificTotal * 0.5) {
    eliminationReasons.push(`Eliminado: aproveitamento inferior a 50% em Conhecimentos Específicos (${specific}/${specificTotal}).`);
  }
  if (port === 0) eliminationReasons.push("Eliminado: obteve nota ZERO em Língua Portuguesa.");
  if (math === 0) eliminationReasons.push("Eliminado: obteve nota ZERO em Matemática.");

  const isEliminated = eliminationReasons.length > 0;
  const errorsCount = maxScore - totalScore - unansweredCount;

  // Comparativo com a meta de 47/60 e submetas recomendadas
  const targetComparison = {
    overall: { score: totalScore, target, met: totalScore >= target },
    specific: { score: specific, target: 32, met: specific >= 32 },
    portuguese: { score: port, target: 8, met: port >= 8 },
    math: { score: math, target: 7, met: math >= 7 },
  };

  const recommendations: string[] = [];
  if (specific < 32) recommendations.push("Priorize Conhecimentos Específicos, que correspondem a 40 das 60 questões.");
  if (math < 7) recommendations.push("Intensifique o treino de Matemática nos tópicos em que apresentou menor desempenho.");
  if (port < 8) recommendations.push("Treine interpretação e os demais tópicos de Língua Portuguesa previstos no edital.");
  if (isAboveTarget && !isEliminated) recommendations.push(`Você atingiu a meta de ${target}/60 e superou os critérios mínimos de eliminação. Mantenha as revisões.`);

  // Desempenho por dificuldade
  let difficultyBreakdown: Record<string, { correct: number; total: number; percentage: number }> | undefined;
  if (difficultyStats) {
    difficultyBreakdown = {};
    for (const [k, v] of Object.entries(difficultyStats)) {
      difficultyBreakdown[k] = {
        correct: v.correct,
        total: v.total,
        percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      };
    }
  }

  // Desempenho por tipo cognitivo
  let cognitiveBreakdown: Record<string, { correct: number; total: number; percentage: number }> | undefined;
  if (cognitiveStats) {
    cognitiveBreakdown = {};
    for (const [k, v] of Object.entries(cognitiveStats)) {
      cognitiveBreakdown[k] = {
        correct: v.correct,
        total: v.total,
        percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      };
    }
  }

  // Desempenho por tópico e plano de estudo pós-simulado
  let topicBreakdown: TopicPerformanceItem[] | undefined;
  let nextStudyPlan: NextStudyPlanItem[] | undefined;

  if (topicStats && topicStats.length > 0) {
    topicBreakdown = topicStats.map((t) => ({
      topicId: t.topicId,
      title: t.title,
      code: t.code,
      subject: t.subject,
      correct: t.correct,
      total: t.total,
      percentage: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    }));

    // Prioriza tópicos com maior número de erros ou menor percentual
    const vulnerableTopics = [...topicBreakdown]
      .filter((t) => t.correct < t.total)
      .sort((a, b) => {
        const errorDiff = (b.total - b.correct) - (a.total - a.correct);
        if (errorDiff !== 0) return errorDiff;
        return a.percentage - b.percentage;
      })
      .slice(0, 4);

    nextStudyPlan = vulnerableTopics.map((t, index) => {
      const errCount = t.total - t.correct;
      return {
        order: index + 1,
        topicId: t.topicId,
        title: t.title,
        code: t.code,
        subject: t.subject,
        reason: `${errCount} erro(s) no simulado (${t.percentage}% de acerto). Foco recomendado na próxima sessão.`,
      };
    });
  }

  return {
    totalScore,
    maxScore,
    percentage,
    targetScore: target,
    pointsToTarget,
    isAboveTarget,
    isEliminated,
    eliminationReasons,
    breakdown: {
      portugueseScore: port,
      portugueseTotal,
      mathScore: math,
      mathTotal,
      specificScore: specific,
      specificTotal,
    },
    targetComparison,
    unansweredCount,
    errorsCount,
    difficultyBreakdown,
    cognitiveBreakdown,
    topicBreakdown,
    nextStudyPlan,
    recommendations,
  };
}
