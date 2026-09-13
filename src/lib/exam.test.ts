import { describe, expect, it } from "vitest";
import { evaluateSimulation } from "./exam";

describe("evaluateSimulation", () => {
  it("aprova quando supera os mínimos e a meta", () => {
    const result = evaluateSimulation({ portugueseCorrect: 8, mathCorrect: 7, specificCorrect: 32 });
    expect(result.totalScore).toBe(47);
    expect(result.isEliminated).toBe(false);
    expect(result.isAboveTarget).toBe(true);
  });

  it("elimina por conhecimento geral abaixo de 50%", () => {
    const result = evaluateSimulation({ portugueseCorrect: 4, mathCorrect: 5, specificCorrect: 30 });
    expect(result.isEliminated).toBe(true);
    expect(result.eliminationReasons[0]).toContain("Conhecimentos Gerais");
  });

  it("elimina por conhecimento específico abaixo de 50%", () => {
    const result = evaluateSimulation({ portugueseCorrect: 8, mathCorrect: 8, specificCorrect: 19 });
    expect(result.isEliminated).toBe(true);
    expect(result.eliminationReasons.some((reason) => reason.includes("Conhecimentos Específicos"))).toBe(true);
  });

  it("elimina quando Português ou Matemática zeram", () => {
    const portuguese = evaluateSimulation({ portugueseCorrect: 0, mathCorrect: 10, specificCorrect: 30 });
    const math = evaluateSimulation({ portugueseCorrect: 10, mathCorrect: 0, specificCorrect: 30 });
    expect(portuguese.isEliminated).toBe(true);
    expect(portuguese.eliminationReasons.some((reason) => reason.includes("Língua Portuguesa"))).toBe(true);
    expect(math.isEliminated).toBe(true);
    expect(math.eliminationReasons.some((reason) => reason.includes("Matemática"))).toBe(true);
  });
});
