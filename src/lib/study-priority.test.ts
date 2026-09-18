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
  it("prioriza revisão vencida", () => {
    const result = calculateStudyPriority({
      ...base,
      nextReviewDate: new Date("2026-09-17T00:00:00Z"),
    }, new Date("2026-09-18T00:00:00Z"));
    expect(result.priority).toBe(61);
    expect(result.reason).toBe("revisão vencida");
  });

  it("prioriza tópico não iniciado e sugere base fácil", () => {
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
  });

  it("sugere média para domínio intermediário e difícil para domínio alto", () => {
    expect(calculateStudyPriority({ ...base, masteryScore: 60 }).suggestedDifficulty).toBe("MEDIA");
    expect(calculateStudyPriority({ ...base, masteryScore: 80 }).suggestedDifficulty).toBe("DIFICIL");
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
