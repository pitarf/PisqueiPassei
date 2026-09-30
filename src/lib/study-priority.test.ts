import { describe, expect, it } from "bun:test";
import { calculateStudyPriority, rankStudyPriorities } from "./study-priority";

const base = {
  topicId: "topic-1",
  masteryScore: 50,
  status: "EM_ESTUDO",
  totalQuestions: 10,
  correctAnswers: 5,
  nextReviewDate: null,
  questionCount: 20,
  historicalQuestionCount: 0,
};

describe("study priority", () => {
  it("prioriza revisão vencida com urgência máxima", () => {
    const result = calculateStudyPriority({
      ...base,
      nextReviewDate: new Date("2026-09-17T00:00:00Z"),
    }, new Date("2026-09-18T00:00:00Z"));
    // 60 (revisão vencida) + 16 (baixo domínio 50 -> (70-50)*0.8 = 16) + 12 (acerto 50% < 70% com 10 questões >= 3) = 88
    expect(result.priority).toBe(88);
    expect(result.reason).toBe("revisão vencida");
    expect(result.pedagogicalFocus).toBe("REVISAO_PRIORITARIA");
  });

  it("prioriza tópico não iniciado e sugere base fácil com foco conceitual", () => {
    const result = calculateStudyPriority({
      ...base,
      masteryScore: 0,
      status: "NAO_INICIADO",
      totalQuestions: 0,
      correctAnswers: 0,
    });
    expect(result.priority).toBe(35);
    expect(result.reason).toBe("tópico ainda não estudado");
    expect(result.suggestedDifficulty).toBe("FACIL");
    expect(result.pedagogicalFocus).toBe("CONCEITO_INICIAL");
    expect(result.suggestedQuestionType).toBe("CONCEITO");
    expect(result.actionGuidance).toContain("conceitos fundamentais");
  });

  it("direciona baixa proficiência (<50%) para consolidação de base com feedback imediato", () => {
    const result = calculateStudyPriority({
      ...base,
      masteryScore: 35,
      status: "EM_ESTUDO",
      totalQuestions: 6,
      correctAnswers: 2,
    });
    expect(result.suggestedDifficulty).toBe("FACIL");
    expect(result.pedagogicalFocus).toBe("CONSOLIDACAO_BASE");
    expect(result.suggestedQuestionType).toBe("CONCEITO");
    expect(result.actionGuidance).toContain("feedback imediato");
  });

  it("direciona domínio intermediário (50% a 79%) para questões de aplicação média", () => {
    const result = calculateStudyPriority({
      ...base,
      masteryScore: 65,
      status: "EM_ESTUDO",
    });
    expect(result.suggestedDifficulty).toBe("MEDIA");
    expect(result.pedagogicalFocus).toBe("TREINO_INTERMEDIARIO");
    expect(result.suggestedQuestionType).toBe("APLICACAO");
  });

  it("direciona domínio avançado (>=80%) para itens difíceis e casos práticos desafiadores", () => {
    const result = calculateStudyPriority({
      ...base,
      masteryScore: 85,
      status: "DOMINADO",
    });
    expect(result.suggestedDifficulty).toBe("DIFICIL");
    expect(result.pedagogicalFocus).toBe("APROFUNDAMENTO_DESAFIO");
    expect(result.suggestedQuestionType).toBe("CASO_PRATICO");
    expect(result.actionGuidance).toContain("casos práticos");
  });

  it("ordena por prioridade sem alterar a entrada", () => {
    const inputs = [
      { ...base, topicId: "low", masteryScore: 90, status: "DOMINADO" },
      { ...base, topicId: "high", masteryScore: 20, status: "EM_ESTUDO" },
    ];
    const result = rankStudyPriorities(inputs);
    expect(result[0].topicId).toBe("high");
    expect(inputs[0].topicId).toBe("low");
  });
});
