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

export type PedagogicalFocus =
  | "CONCEITO_INICIAL"
  | "CONSOLIDACAO_BASE"
  | "TREINO_INTERMEDIARIO"
  | "APROFUNDAMENTO_DESAFIO"
  | "REVISAO_PRIORITARIA";

export type StudyPriority = StudyPriorityInput & {
  priority: number;
  reason: string;
  suggestedDifficulty: "FACIL" | "MEDIA" | "DIFICIL";
  pedagogicalFocus: PedagogicalFocus;
  suggestedQuestionType: "CONCEITO" | "APLICACAO" | "CASO_PRATICO";
  actionGuidance: string;
};

export function calculateStudyPriority(input: StudyPriorityInput, now = new Date()): StudyPriority {
  const mastery = input.masteryScore ?? 0;
  const attempts = input.totalQuestions ?? 0;
  const accuracy = attempts > 0 ? (input.correctAnswers / attempts) * 100 : 0;
  let priority = 0;
  let reason = "cobertura e disponibilidade do banco";

  const isUnstarted = !input.status || input.status === "NAO_INICIADO" || attempts === 0;
  const isOverdue = Boolean(input.nextReviewDate && input.nextReviewDate <= now);

  if (isOverdue) {
    // Revisão vencida tem a mais alta prioridade relativa
    priority += 60;
    reason = "revisão vencida";
  }

  if (isUnstarted) {
    priority += 35;
    if (reason === "cobertura e disponibilidade do banco") reason = "tópico ainda não estudado";
  }

  // Baixa proficiência (< 70%) ganha pontuação proporcional
  if (mastery < 70 && !isUnstarted) {
    priority += Math.round((70 - mastery) * 0.8);
    if (reason === "cobertura e disponibilidade do banco") reason = "baixo domínio";
  }

  // Baixo aproveitamento com amostra mínima
  if (accuracy < 70 && attempts >= 3) {
    priority += 12;
    if (reason === "cobertura e disponibilidade do banco") reason = "baixo aproveitamento nas questões";
  }

  if (input.questionCount === 0) priority += 8;
  if (input.historicalQuestionCount > 0) priority += Math.min(input.historicalQuestionCount, 8);

  // Calibração pedagógica de dificuldade e direcionamento:
  // - Não iniciado ou baixa proficiência (<50%): questões fáceis, base conceitual e consolidação com feedback imediato
  // - Intermediário (50% a 79%): questões médias de aplicação
  // - Domínio avançado (>=80%): questões difíceis e casos práticos desafiadores
  let suggestedDifficulty: "FACIL" | "MEDIA" | "DIFICIL" = "MEDIA";
  let pedagogicalFocus: PedagogicalFocus = "TREINO_INTERMEDIARIO";
  let suggestedQuestionType: "CONCEITO" | "APLICACAO" | "CASO_PRATICO" = "APLICACAO";
  let actionGuidance = "Pratique questões de aplicação para manter a retenção.";

  if (isOverdue) {
    pedagogicalFocus = "REVISAO_PRIORITARIA";
    actionGuidance = "Revisão espaçada prioritária: resolva itens para reativar a memória ativa.";
    suggestedDifficulty = mastery < 50 ? "FACIL" : mastery >= 80 ? "DIFICIL" : "MEDIA";
    suggestedQuestionType = mastery >= 80 ? "CASO_PRATICO" : mastery < 50 ? "CONCEITO" : "APLICACAO";
  } else if (isUnstarted) {
    suggestedDifficulty = "FACIL";
    pedagogicalFocus = "CONCEITO_INICIAL";
    suggestedQuestionType = "CONCEITO";
    actionGuidance = "Inicie pelos conceitos fundamentais com questões simples para construir modelo mental.";
  } else if (mastery < 50) {
    suggestedDifficulty = "FACIL";
    pedagogicalFocus = "CONSOLIDACAO_BASE";
    suggestedQuestionType = "CONCEITO";
    actionGuidance = "Consolidação de base com feedback imediato em questões diretas.";
  } else if (mastery >= 80) {
    suggestedDifficulty = "DIFICIL";
    pedagogicalFocus = "APROFUNDAMENTO_DESAFIO";
    suggestedQuestionType = "CASO_PRATICO";
    actionGuidance = "Aprofundamento com casos práticos e pegadinhas avançadas da banca.";
  }

  return {
    ...input,
    priority,
    reason,
    suggestedDifficulty,
    pedagogicalFocus,
    suggestedQuestionType,
    actionGuidance,
  };
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
