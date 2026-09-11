/**
 * Regras Oficiais de Pontuação e Diagnóstico de Prova Cesgranrio - Transpetro 2026.3
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

/**
 * Avalia o resultado de um simulado completo de 60 questões
 */
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

  // Critérios de eliminação do Edital Cesgranrio:
  if (portugueseCorrect === 0) {
    eliminationReasons.push("Eliminado: Obteve nota ZERO em Língua Portuguesa.");
  }
  if (mathCorrect === 0) {
    eliminationReasons.push("Eliminado: Obteve nota ZERO em Matemática.");
  }
  if (specificCorrect < specificTotal * 0.5) {
    eliminationReasons.push(`Eliminado: Aproveitamento inferior a 50% em Conhecimentos Específicos (${specificCorrect}/${specificTotal}).`);
  }
  if (totalScore < maxScore * 0.5) {
    eliminationReasons.push(`Eliminado: Aproveitamento total inferior a 50% da prova (${totalScore}/${maxScore}).`);
  }

  const isEliminated = eliminationReasons.length > 0;

  // Recomendações personalizadas
  const recommendations: string[] = [];
  if (specificCorrect < 32) {
    recommendations.push("Priorize Conhecimentos Específicos (peso de 40 questões na prova da Ênfase 18).");
  }
  if (mathCorrect < 7) {
    recommendations.push("Intensifique exercícios de Matemática Financeira, Regra de Três e Análise Combinatória.");
  }
  if (portugueseCorrect < 8) {
    recommendations.push("Treine interpretação de texto e mecanismos de coesão textual típicos da Cesgranrio.");
  }
  if (isAboveTarget) {
    recommendations.push("Parabéns! Você ultrapassou a meta de corte de 47/60 pontos. Mantenha as revisões ativas!");
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
