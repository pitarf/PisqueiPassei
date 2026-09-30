import { describe, expect, it } from "bun:test";
import { normalizeText, validateAiQuestion, computeStatementHash } from "./question-validator";

const valid = {
  statement: "Em uma situação de gestão de estoques sob a ótica da governança e da Lei 13.303/2016, qual alternativa representa uma prática em conformidade com o edital?",
  optionA: "Manter registros atualizados e revisar periodicamente os níveis de ressuprimento.",
  optionB: "Ignorar o histórico de consumo e confiar exclusivamente na intuição dos compradores.",
  optionC: "Eliminar toda conferência física anual dispensando inventários periódicos obrigatórios.",
  optionD: "Registrar movimentações apenas ao final do exercício contábil sem conciliação prévia.",
  optionE: "Dispensar critérios formais de reposição para contratos com fornecedores estratégicos.",
  correctOption: "A",
  explanation: "A alternativa A descreve a boa prática de controle de estoques e rastreabilidade patrimonial compatível com o perfil da banca e a Lei 13.303/2016.",
  difficulty: "MEDIA",
  questionType: "APLICACAO",
  cognitiveLevel: "APLICAR",
  subtopic: "Gestão de Estoques e Governança",
};

describe("question validator - integridade pedagógica e blindagem", () => {
  it("normaliza texto com invariância a diacríticos e caixa alta", () => {
    expect(normalizeText(" Gestão Ágil de Estoques! ")).toBe("gestao agil de estoques");
  });

  it("calcula statementHash determinístico e invariante a acentuação e espaços", () => {
    const hash1 = computeStatementHash("Em uma situação de gestão de estoques...");
    const hash2 = computeStatementHash("  EM UMA SITUAÇÃO DE GESTAO DE ESTOQUES...  ");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it("aceita questão válida e força categoricamente origin INEDITA_IA e banca IA (perfil Cesgranrio)", () => {
    const result = validateAiQuestion({
      ...valid,
      origin: "CESGRANRIO_OFICIAL", // tentativa indevida de passar como oficial
      banca: "Cesgranrio",
      sourceRef: "Simulado 2026.3",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.question.origin).toBe("INEDITA_IA");
      expect(result.question.banca).toBe("IA (perfil Cesgranrio)");
      expect(result.question.sourceRef).toContain("Questão inédita em estilo compatível com o perfil da banca.");
      expect(result.question.sourceRef).toContain("Simulado 2026.3");
    }
  });

  it("rejeita alternativas vazias ou excessivamente curtas", () => {
    expect(validateAiQuestion({ ...valid, optionA: "" }).valid).toBe(false);
    expect(validateAiQuestion({ ...valid, optionB: "   " }).valid).toBe(false);
    expect(validateAiQuestion({ ...valid, optionC: "X" }).valid).toBe(false);
  });

  it("rejeita alternativas duplicadas ou idênticas após normalização", () => {
    expect(validateAiQuestion({ ...valid, optionE: valid.optionA }).valid).toBe(false);
    expect(validateAiQuestion({ ...valid, optionE: "  manter registros atualizados e revisar periodicamente os niveis de ressuprimento.  " }).valid).toBe(false);
  });

  it("rejeita anomalia pedagógica de outlier de tamanho onde a correta tem o triplo de caracteres dos distratores", () => {
    const outlierQuestion = {
      statement: "Acerca do regime licitatório da Lei 13.303/2016 e compras públicas, assinale a opção correta:",
      optionA: "Não se aplica.",
      optionB: "Depende da chefia.",
      optionC: "Exige despacho simples.",
      optionD: "É proibido no órgão.",
      optionE: "A celebração de contratos em empresas estatais exige a observância rigorosa dos princípios da impessoalidade e moralidade administrativa com justificativa técnica e jurídica expressa.",
      correctOption: "E",
      explanation: "A alternativa E detalha os princípios e exigências da Lei 13.303/2016 com rigor normativo.",
      difficulty: "MEDIA",
      questionType: "APLICACAO",
      cognitiveLevel: "APLICAR",
    };

    const result = validateAiQuestion(outlierQuestion);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("tamanho absurdamente discrepante");
    }
  });

  it("aceita alternativas com comprimentos equilibrados sem penalizar extensões legítimas", () => {
    const result = validateAiQuestion(valid);
    expect(result.valid).toBe(true);
  });

  it("rejeita afirmação indevida de que a questão foi aplicada em concurso real ou gabarito oficial", () => {
    const fraudAttempt = {
      ...valid,
      statement: "Questão aplicada pela Fundação Cesgranrio no concurso oficial Transpetro 2023 para suprimento:",
    };
    const result = validateAiQuestion(fraudAttempt);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("afirmação indevida de aplicação em concurso real");
    }
  });

  it("rejeita explicação fraudulenta que alegue prova oficial Cesgranrio", () => {
    const fraudExplanation = {
      ...valid,
      explanation: "Conforme gabarito oficial Cesgranrio publicado na data de realização do certame...",
    };
    const result = validateAiQuestion(fraudExplanation);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("afirmação indevida de aplicação em concurso real");
    }
  });

  it("rejeita enunciado ausente ou muito curto", () => {
    expect(validateAiQuestion({ ...valid, statement: "Curto demais" }).valid).toBe(false);
  });

  it("rejeita gabarito inválido fora do conjunto A-E", () => {
    expect(validateAiQuestion({ ...valid, correctOption: "F" }).valid).toBe(false);
    expect(validateAiQuestion({ ...valid, correctOption: "" }).valid).toBe(false);
  });

  it("rejeita taxonomia pedagógica ou nível cognitivo inválidos", () => {
    expect(validateAiQuestion({ ...valid, questionType: "TIPO_INVENTADO" }).valid).toBe(false);
    expect(validateAiQuestion({ ...valid, cognitiveLevel: "NIVEL_INVENTADO" }).valid).toBe(false);
  });

  it("usa dificuldade solicitada como fallback quando a IA não informa uma válida", () => {
    const result = validateAiQuestion({ ...valid, difficulty: "X" }, "FACIL");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.question.difficulty).toBe("FACIL");
  });
});
