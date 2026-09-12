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

  const totalScore = portugueseCorrect + mathCorrect + specificCorrect;
  const percentage = (totalScore / maxScore) * 100;
  const pointsToTarget = totalScore - targetScore;
  const isAboveTarget = totalScore >= targetScore;

  const eliminationReasons: string[] = [];

  // Critérios de eliminação: menos de 50% em conhecimentos gerais,
  // menos de 50% em conhecimentos específicos, ou nota zero em Português/Matemática.
  const generalCorrect = portugueseCorrect + mathCorrect;
  const generalTotal = portugueseTotal + mathTotal;

  if (generalCorrect < generalTotal * 0.5) {
    eliminationReasons.push(
      `Eliminado: aproveitamento inferior a 50% em Conhecimentos Gerais (${generalCorrect}/${generalTotal}).`
    );
  }
  if (specificCorrect < specificTotal * 0.5) {
    eliminationReasons.push(
      `Eliminado: aproveitamento inferior a 50% em Conhecimentos Específicos (${specificCorrect}/${specificTotal}).`
    );
  }
  if (portugueseCorrect === 0) {
    eliminationReasons.push("Eliminado: obteve nota ZERO em Língua Portuguesa.");
  }
  if (mathCorrect === 0) {
    eliminationReasons.push("Eliminado: obteve nota ZERO em Matemática.");
  }

  const isEliminated = eliminationReasons.length > 0;

  const recommendations: string[] = [];
  if (specificCorrect < 32) {
    recommendations.push("Priorize Conhecimentos Específicos, que correspondem a 40 das 60 questões.");
  }
  if (mathCorrect < 7) {
    recommendations.push("Intensifique o treino de Matemática nos tópicos em que apresentou menor desempenho.");
  }
  if (portugueseCorrect < 8) {
    recommendations.push("Treine interpretação e os demais tópicos de Língua Portuguesa previstos no edital.");
  }
  if (isAboveTarget && !isEliminated) {
    recommendations.push("Você atingiu a meta de 47/60 e superou os critérios mínimos de eliminação. Mantenha as revisões.");
  }

  return {
    totalScore,
    maxScore,
    percentage,
    targetScore,
    pointsToTarget,
    isAboveTarget,
    isEliminated,
    eliminationReasons,
    breakdown: {
      portugueseScore: portugueseCorrect,
      portugueseTotal,
      mathScore: mathCorrect,
      mathTotal,
      specificScore: specificCorrect,
      specificTotal,
    },
    recommendations,
  };
}
