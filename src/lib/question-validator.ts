export interface RawAiQuestion {
  statement?: unknown;
  optionA?: unknown;
  optionB?: unknown;
  optionC?: unknown;
  optionD?: unknown;
  optionE?: unknown;
  correctOption?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  origin?: unknown;
  questionType?: unknown;
  cognitiveLevel?: unknown;
  subtopic?: unknown;
  sourceRef?: unknown;
  banca?: unknown;
}

export interface ValidatedQuestion {
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: "A" | "B" | "C" | "D" | "E";
  explanation: string;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  origin: string;
  sourceRef: string;
  banca: string;
  questionType: string;
  cognitiveLevel: string;
  subtopic: string;
}

export const VALID_OPTIONS = new Set(["A", "B", "C", "D", "E"]);
export const VALID_DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Valida minuciosamente um objeto de questão retornada pela IA:
 * - Enunciado não vazio e com tamanho plausível (mínimo 20 caracteres)
 * - 5 alternativas A, B, C, D, E completas e não vazias
 * - Nenhuma alternativa duplicada entre si dentro da mesma questão
 * - Gabarito estritamente entre A, B, C, D, E
 * - Justificativa / explicação obrigatória e substantiva
 * - Atribuição explícita de proveniência como IA (nunca afirmando ser Cesgranrio oficial)
 */
export function validateAiQuestion(
  raw: unknown,
  expectedDifficulty: string = "MEDIA"
): { valid: true; question: ValidatedQuestion } | { valid: false; reason: string } {
  if (!raw || typeof raw !== "object") {
    return { valid: false, reason: "Estrutura da questão não é um objeto válido." };
  }

  const q = raw as RawAiQuestion;

  if (typeof q.statement !== "string" || q.statement.trim().length < 20) {
    return { valid: false, reason: "Enunciado ausente ou muito curto (mínimo 20 caracteres)." };
  }

  const optionKeys = ["optionA", "optionB", "optionC", "optionD", "optionE"] as const;
  for (const optKey of optionKeys) {
    const val = q[optKey];
    if (typeof val !== "string" || val.trim().length === 0) {
      return { valid: false, reason: `Alternativa ${optKey} está vazia ou ausente.` };
    }
  }

  if (typeof q.explanation !== "string" || q.explanation.trim().length < 5) {
    return { valid: false, reason: "Explicação/justificativa ausente ou vazia." };
  }

  const correct = typeof q.correctOption === "string" ? q.correctOption.trim().toUpperCase() : "";
  if (!VALID_OPTIONS.has(correct)) {
    return { valid: false, reason: `Gabarito '${q.correctOption}' é inválido. Esperado A, B, C, D ou E.` };
  }

  // Previne alternativas duplicadas
  const optValues = optionKeys.map((k) => normalizeText(String(q[k])));
  const uniqueOpts = new Set(optValues);
  if (uniqueOpts.size !== optionKeys.length) {
    return { valid: false, reason: "A questão contém opções idênticas/duplicadas." };
  }

  const normalizedDiff = typeof q.difficulty === "string" && VALID_DIFFICULTIES.has(q.difficulty.toUpperCase())
    ? (q.difficulty.toUpperCase() as "FACIL" | "MEDIA" | "DIFICIL")
    : VALID_DIFFICULTIES.has(expectedDifficulty.toUpperCase())
      ? (expectedDifficulty.toUpperCase() as "FACIL" | "MEDIA" | "DIFICIL")
      : "MEDIA";

  return {
    valid: true,
    question: {
      statement: (q.statement as string).trim(),
      optionA: (q.optionA as string).trim(),
      optionB: (q.optionB as string).trim(),
      optionC: (q.optionC as string).trim(),
      optionD: (q.optionD as string).trim(),
      optionE: (q.optionE as string).trim(),
      correctOption: correct as "A" | "B" | "C" | "D" | "E",
      explanation: (q.explanation as string).trim(),
      difficulty: normalizedDiff,
      origin: "AI_GENERATED",
      banca: "IA (perfil Cesgranrio)",
      sourceRef: typeof q.sourceRef === "string" && q.sourceRef.trim() ? q.sourceRef.trim() : "Questão inédita gerada por IA, baseada no perfil de cobrança do edital.",
      questionType: typeof q.questionType === "string" && q.questionType.trim() ? q.questionType.trim() : "APLICACAO",
      cognitiveLevel: typeof q.cognitiveLevel === "string" && q.cognitiveLevel.trim() ? q.cognitiveLevel.trim() : "APLICAR",
      subtopic: typeof q.subtopic === "string" && q.subtopic.trim() ? q.subtopic.trim() : "",
    },
  };
}
