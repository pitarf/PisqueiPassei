/**
 * Motor de Repetição Espaçada (SRS) e Nível de Domínio
 * Calcula os próximos intervalos de revisão com base na curva do esquecimento
 * e no desempenho prático do estudante.
 */

export interface SRSFeedbackInput {
  currentIntervalDays: number;
  currentMasteryScore: number;
  feedback: "NAO_ENTENDI" | "REVISAR" | "ENTENDI";
  accuracyPercentage?: number;
}

export interface SRSResult {
  nextIntervalDays: number;
  nextReviewDate: Date;
  newMasteryScore: number;
  newStatus: "NAO_INICIADO" | "EM_ESTUDO" | "EM_REVISAO" | "DOMINADO";
}

/**
 * Calcula o próximo agendamento de estudo e atualização de domínio
 */
export function calculateNextSRS({
  currentIntervalDays,
  currentMasteryScore,
  feedback,
  accuracyPercentage,
}: SRSFeedbackInput): SRSResult {
  let nextIntervalDays = 1;
  let masteryDelta = 0;

  switch (feedback) {
    case "NAO_ENTENDI":
      nextIntervalDays = 1;
      masteryDelta = -15;
      break;

    case "REVISAR":
      nextIntervalDays = Math.max(1, Math.round(currentIntervalDays * 1.5));
      masteryDelta = 5;
      break;

    case "ENTENDI":
      if (currentIntervalDays <= 1) {
        nextIntervalDays = 3;
      } else if (currentIntervalDays === 3) {
        nextIntervalDays = 7;
      } else if (currentIntervalDays <= 7) {
        nextIntervalDays = 15;
      } else if (currentIntervalDays <= 15) {
        nextIntervalDays = 30;
      } else {
        nextIntervalDays = 60;
      }
      masteryDelta = 15;
      break;
  }

  // Se houver percentual de acertos de questões, ponderar no cálculo
  if (accuracyPercentage !== undefined) {
    if (accuracyPercentage < 50) {
      nextIntervalDays = 1;
      masteryDelta = Math.min(masteryDelta, -10);
    } else if (accuracyPercentage >= 80) {
      masteryDelta += 10;
    }
  }

  // Manter o domínio entre 0 e 100
  const newMasteryScore = Math.max(0, Math.min(100, currentMasteryScore + masteryDelta));

  // Definir status com base no score e histórico
  let newStatus: "NAO_INICIADO" | "EM_ESTUDO" | "EM_REVISAO" | "DOMINADO" = "EM_ESTUDO";
  if (newMasteryScore >= 85) {
    newStatus = "DOMINADO";
  } else if (newMasteryScore > 0) {
    newStatus = "EM_ESTUDO";
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

  return {
    nextIntervalDays,
    nextReviewDate,
    newMasteryScore,
    newStatus,
  };
}
