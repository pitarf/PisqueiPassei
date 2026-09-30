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
  origin: "INEDITA_IA";
  sourceRef: string;
  banca: "IA (perfil Cesgranrio)";
  questionType: string;
  cognitiveLevel: string;
  subtopic: string;
  verificationStatus: string;
}

export const VALID_OPTIONS = new Set(["A", "B", "C", "D", "E"]);
export const VALID_DIFFICULTIES = new Set(["FACIL", "MEDIA", "DIFICIL"]);
export const VALID_QUESTION_TYPES = new Set([
  "CONCEITO",
  "APLICACAO",
  "CALCULO",
  "INTERPRETACAO",
  "CASO_PRATICO",
  "COMPARACAO",
  "EXCECAO",
  "PROCEDIMENTO",
]);
export const VALID_COGNITIVE_LEVELS = new Set([
  "CONHECER",
  "COMPREENDER",
  "APLICAR",
  "ANALISAR",
  "AVALIAR",
]);

import { createHash } from "crypto";

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeStatementHash(statement: string): string {
  return createHash("sha256").update(normalizeText(statement)).digest("hex");
}

const FORBIDDEN_OFFICIAL_PATTERNS = [
  /aplicada pela (fundacao |fundação )?cesgranrio/i,
  /prova oficial da cesgranrio/i,
  /concurso oficial transpetro \d{4}/i,
  /gabarito oficial cesgranrio/i,
  /caderno de questoes oficial/i,
];

/**
 * Valida minuciosamente um objeto de questão retornada pela IA:
 * - Enunciado não vazio e com tamanho plausível (mínimo 20 caracteres)
 * - 5 alternativas A, B, C, D, E completas, não vazias e com tamanho mínimo
 * - Nenhuma alternativa duplicada entre si dentro da mesma questão
 * - Rejeita alternativas com tamanhos absurdamente discrepantes (outliers grotescos onde a correta tem o triplo de caracteres das demais)
 * - Rejeita alucinações que declarem ser questão oficial aplicada em concurso anterior
 * - Gabarito estritamente entre A, B, C, D, E
 * - Justificativa / explicação substantiva
 * - Atribuição explícita de proveniência como INEDITA_IA e IA (perfil Cesgranrio), nunca afirmando ser Cesgranrio oficial
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
    if (val.trim().length < 2) {
      return { valid: false, reason: `Alternativa ${optKey} é excessivamente curta (mínimo 2 caracteres).` };
    }
  }

  if (typeof q.explanation !== "string" || q.explanation.trim().length < 10) {
    return { valid: false, reason: "Explicação/justificativa ausente ou muito curta (mínimo 10 caracteres)." };
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

  // Previne outliers grotescos onde a correta tem o triplo de caracteres das demais
  const optLetters = ["A", "B", "C", "D", "E"] as const;
  const correctKey = correct as "A" | "B" | "C" | "D" | "E";
  const lengths: Record<"A" | "B" | "C" | "D" | "E", number> = {
    A: (q.optionA as string).trim().length,
    B: (q.optionB as string).trim().length,
    C: (q.optionC as string).trim().length,
    D: (q.optionD as string).trim().length,
    E: (q.optionE as string).trim().length,
  };
  const correctLen = lengths[correctKey];
  const distractorLens = optLetters
    .filter((k) => k !== correctKey)
    .map((k) => lengths[k]);
  const avgDistractorLen = distractorLens.reduce((sum, l) => sum + l, 0) / distractorLens.length;
  const maxDistractorLen = Math.max(...distractorLens);

  if (
    avgDistractorLen > 0 &&
    (correctLen >= 3 * avgDistractorLen || correctLen >= 3 * maxDistractorLen) &&
    correctLen - avgDistractorLen >= 30
  ) {
    return {
      valid: false,
      reason: "Alternativa correta com tamanho absurdamente discrepante das demais (outlier que induz gabarito pelo tamanho).",
    };
  }

  // Rejeita tentativas de atribuir autoria ou aplicação a concurso real/Cesgranrio oficial
  const statementLower = (q.statement as string).toLowerCase();
  const explanationLower = (q.explanation as string).toLowerCase();
  for (const pattern of FORBIDDEN_OFFICIAL_PATTERNS) {
    if (pattern.test(statementLower) || pattern.test(explanationLower)) {
      return {
        valid: false,
        reason: "A questão contém afirmação indevida de aplicação em concurso real ou gabarito oficial da banca.",
      };
    }
  }

  const normalizedQuestionType =
    typeof q.questionType === "string" && q.questionType.trim()
      ? q.questionType.trim().toUpperCase()
      : "APLICACAO";
  const normalizedCognitiveLevel =
    typeof q.cognitiveLevel === "string" && q.cognitiveLevel.trim()
      ? q.cognitiveLevel.trim().toUpperCase()
      : "APLICAR";

  if (!VALID_QUESTION_TYPES.has(normalizedQuestionType)) return { valid: false, reason: "Tipo de questão inválido." };
  if (!VALID_COGNITIVE_LEVELS.has(normalizedCognitiveLevel)) return { valid: false, reason: "Nível cognitivo inválido." };

  const normalizedDiff =
    typeof q.difficulty === "string" && VALID_DIFFICULTIES.has(q.difficulty.toUpperCase())
      ? (q.difficulty.toUpperCase() as "FACIL" | "MEDIA" | "DIFICIL")
      : VALID_DIFFICULTIES.has(expectedDifficulty.toUpperCase())
        ? (expectedDifficulty.toUpperCase() as "FACIL" | "MEDIA" | "DIFICIL")
        : "MEDIA";

  const explicitNote = "Questão inédita em estilo compatível com o perfil da banca.";
  let finalSourceRef = explicitNote;
  if (typeof q.sourceRef === "string" && q.sourceRef.trim()) {
    const rawRef = q.sourceRef.trim();
    finalSourceRef = rawRef.includes(explicitNote) ? rawRef : `${explicitNote} ${rawRef}`;
  }

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
      origin: "INEDITA_IA",
      banca: "IA (perfil Cesgranrio)",
      sourceRef: finalSourceRef,
      questionType: normalizedQuestionType,
      cognitiveLevel: normalizedCognitiveLevel,
      subtopic: typeof q.subtopic === "string" && q.subtopic.trim() ? q.subtopic.trim() : "",
      verificationStatus: "PENDENTE",
    },
  };
}
