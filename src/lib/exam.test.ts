import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateSimulation } from "./exam";

describe("evaluateSimulation", () => {
  it("aprova quando supera os mínimos e atinge a meta de estudo", () => {
    const result = evaluateSimulation({ portugueseCorrect: 8, mathCorrect: 7, specificCorrect: 32 });
    assert.equal(result.totalScore, 47);
    assert.equal(result.isEliminated, false);
    assert.equal(result.isAboveTarget, true);
  });

  it("elimina por Conhecimentos Gerais abaixo de 50% (menos de 10 acertos)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 4, mathCorrect: 5, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Conhecimentos Gerais")));
  });

  it("elimina por Conhecimentos Específicos abaixo de 50% (menos de 20 acertos)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 8, mathCorrect: 8, specificCorrect: 19 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Conhecimentos Específicos")));
  });

  it("elimina quando Língua Portuguesa zera", () => {
    const result = evaluateSimulation({ portugueseCorrect: 0, mathCorrect: 10, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Língua Portuguesa")));
  });

  it("elimina quando Matemática zera", () => {
    const result = evaluateSimulation({ portugueseCorrect: 10, mathCorrect: 0, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Matemática")));
  });

  it("não elimina na fronteira mínima (10 gerais e 20 específicos)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 5, mathCorrect: 5, specificCorrect: 20 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 30);
    assert.equal(result.isAboveTarget, false);
  });
});
