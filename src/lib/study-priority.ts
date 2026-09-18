export type StudyPriorityInput = {
  topicId: string;
  masteryScore: number;
  status?: string | null;
  totalQuestions: number;
  correctAnswers: number;
  nextReviewDate?: Date | null;
  questionCount: number;
  historicalQuestionCount: number;
};

export type StudyPriority = StudyPriorityInput & {
  priority: number;
  reason: string;
  suggestedDifficulty: "FACIL" | "MEDIA" | "DIFICIL";
};

export function calculateStudyPriority(input: StudyPriorityInput, now = new Date()): StudyPriority {
  const mastery = input.masteryScore ?? 0;
  const attempts = input.totalQuestions ?? 0;
  const accuracy = attempts > 0 ? (input.correctAnswers / attempts) * 100 : 0;
  let priority = 0;
  let reason = "cobertura e disponibilidade do banco";

  if (input.nextReviewDate && input.nextReviewDate <= now) {
    priority += 45;
    reason = "revisão vencida";
  }
  if (!input.status || input.status === "NAO_INICIADO") {
    priority += 35;
    if (reason === "cobertura e disponibilidade do banco") reason = "tópico ainda não estudado";
  }
  if (mastery < 70 && input.status && input.status !== "NAO_INICIADO") {
    priority += Math.round((70 - mastery) * 0.8);
    if (reason === "cobertura e disponibilidade do banco") reason = "baixo domínio";
  }
  if (accuracy < 70 && attempts >= 3) {
    priority += 12;
    if (reason === "cobertura e disponibilidade do banco") reason = "baixo aproveitamento nas questões";
  }
  if (input.questionCount === 0) priority += 8;
  if (input.historicalQuestionCount > 0) priority += Math.min(input.historicalQuestionCount, 8);

  const suggestedDifficulty = mastery < 45 ? "FACIL" : mastery < 75 ? "MEDIA" : "DIFICIL";
  return { ...input, priority, reason, suggestedDifficulty };
}

export function rankStudyPriorities(inputs: StudyPriorityInput[], now = new Date()) {
  return inputs
    .map((input) => calculateStudyPriority(input, now))
    .sort((a, b) => b.priority - a.priority);
}


export function getStudyPriorityReason(priority: StudyPriority): string {
  return priority.reason;
}

export function getStudyHref(priority: StudyPriority): string {
  return `/questoes?topicId=${encodeURIComponent(priority.topicId)}&count=10&difficulty=${priority.suggestedDifficulty}`;
}
