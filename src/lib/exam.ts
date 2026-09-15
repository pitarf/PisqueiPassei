/**
 * Regras oficiais de pontuação e diagnóstico da prova Transpetro 2026.3
 * Nível Técnico • Ênfase 18: Suprimento de Bens e Serviços
 */

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
  recommendations: string[];
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function evaluateSimulation({
  portugueseCorrect,
  mathCorrect,
  specificCorrect,
  targetScore = 47,
}: {
  portugueseCorrect: number;
  mathCorrect: number;
  specificCorrect: number;
  targetScore?: number;
}): ExamDiagnostic {
  const portugueseTotal = 10;
  const mathTotal = 10;
  const specificTotal = 40;
  const maxScore = 60;

  const port = clampInteger(portugueseCorrect, 0, portugueseTotal);
  const math = clampInteger(mathCorrect, 0, mathTotal);
  const specific = clampInteger(specificCorrect, 0, specificTotal);
  const target = clampInteger(targetScore, 0, maxScore);

  const totalScore = port + math + specific;
  const percentage = (totalScore / maxScore) * 100;
  const pointsToTarget = totalScore - target;
  const isAboveTarget = totalScore >= target;

  const eliminationReasons: string[] = [];

  // Critérios de eliminação: menos de 50% em conhecimentos gerais,
  // menos de 50% em conhecimentos específicos, ou nota zero em Português/Matemática.
  const generalCorrect = port + math;
  const generalTotal = portugueseTotal + mathTotal;

  if (generalCorrect < generalTotal * 0.5) {
    eliminationReasons.push(
      `Eliminado: aproveitamento inferior a 50% em Conhecimentos Gerais (${generalCorrect}/${generalTotal}).`
    );
  }
  if (specific < specificTotal * 0.5) {
    eliminationReasons.push(
      `Eliminado: aproveitamento inferior a 50% em Conhecimentos Específicos (${specific}/${specificTotal}).`
    );
  }
  if (port === 0) {
    eliminationReasons.push("Eliminado: obteve nota ZERO em Língua Portuguesa.");
  }
  if (math === 0) {
    eliminationReasons.push("Eliminado: obteve nota ZERO em Matemática.");
  }

  const isEliminated = eliminationReasons.length > 0;

  const recommendations: string[] = [];
  if (specific < 32) {
    recommendations.push("Priorize Conhecimentos Específicos, que correspondem a 40 das 60 questões.");
  }
  if (math < 7) {
    recommendations.push("Intensifique o treino de Matemática nos tópicos em que apresentou menor desempenho.");
  }
  if (port < 8) {
    recommendations.push("Treine interpretação e os demais tópicos de Língua Portuguesa previstos no edital.");
  }
  if (isAboveTarget && !isEliminated) {
    recommendations.push(`Você atingiu a meta de ${target}/60 e superou os critérios mínimos de eliminação. Mantenha as revisões.`);
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
    recommendations,
  };
}
