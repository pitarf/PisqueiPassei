import { describe, expect, it } from "bun:test";
import { normalizeText, validateAiQuestion } from "./question-validator";

const valid = {
  statement: "Em uma situação de gestão de estoques, qual alternativa representa uma prática adequada?",
  optionA: "Manter registros atualizados e revisar os níveis de estoque.",
  optionB: "Ignorar o histórico de consumo.",
  optionC: "Eliminar toda conferência física.",
  optionD: "Registrar movimentações apenas ao final do ano.",
  optionE: "Dispensar critérios de reposição.",
  correctOption: "A",
  explanation: "A alternativa A descreve a prática adequada.",
  difficulty: "MEDIA",
  questionType: "APLICACAO",
  cognitiveLevel: "APLICAR",
};

describe("question validator", () => {
  it("normaliza texto", () => expect(normalizeText(" Gestão Ágil! ")).toBe("gestao agil"));

  it("aceita questão válida e força origem IA", () => {
    const result = validateAiQuestion(valid);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.question.origin).toBe("AI_GENERATED");
      expect(result.question.banca).toBe("IA (perfil Cesgranrio)");
    }
  });

  it("rejeita alternativas duplicadas", () => {
    expect(validateAiQuestion({ ...valid, optionE: valid.optionA }).valid).toBe(false);
  });

  it("rejeita taxonomia pedagógica inválida", () => {
    expect(validateAiQuestion({ ...valid, questionType: "TIPO_INVENTADO" }).valid).toBe(false);
  });

  it("rejeita nível cognitivo inválido", () => {
    expect(validateAiQuestion({ ...valid, cognitiveLevel: "NIVEL_INVENTADO" }).valid).toBe(false);
  });

  it("usa dificuldade solicitada quando a IA não informa uma válida", () => {
    const result = validateAiQuestion({ ...valid, difficulty: "X" }, "FACIL");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.question.difficulty).toBe("FACIL");
  });
});
