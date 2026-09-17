import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateSimulation } from "./exam";

describe("evaluateSimulation - Regras Oficiais e Limites", () => {
  it("aprova quando supera os mínimos e atinge a meta de estudo (47/60)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 8, mathCorrect: 7, specificCorrect: 32 });
    assert.equal(result.totalScore, 47);
    assert.equal(result.isEliminated, false);
    assert.equal(result.isAboveTarget, true);
  });

  // Limites Específicas: 19 (elimina), 20 (fronteira mínima passa), 39 (passa), 40 (gabarito passa)
  it("limite 19 específicas: elimina por menos de 50% em específicas", () => {
    const result = evaluateSimulation({ portugueseCorrect: 5, mathCorrect: 5, specificCorrect: 19 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Conhecimentos Específicos")));
  });

  it("limite 20 específicas: não elimina na fronteira mínima de 50% de específicas", () => {
    const result = evaluateSimulation({ portugueseCorrect: 5, mathCorrect: 5, specificCorrect: 20 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 30);
  });

  it("limite 39 específicas: válido e aprovado", () => {
    const result = evaluateSimulation({ portugueseCorrect: 5, mathCorrect: 5, specificCorrect: 39 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 49);
  });

  it("limite 40 específicas: pontuação máxima em específicas", () => {
    const result = evaluateSimulation({ portugueseCorrect: 10, mathCorrect: 10, specificCorrect: 40 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 60);
    assert.equal(result.isAboveTarget, true);
  });

  // Limites Gerais: 9 (elimina), 10 (fronteira mínima passa), 19 (passa), 20 (gabarito passa)
  it("limite 9 gerais (4 port + 5 mat): elimina por menos de 50% no conjunto de gerais", () => {
    const result = evaluateSimulation({ portugueseCorrect: 4, mathCorrect: 5, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Conhecimentos Gerais")));
  });

  it("limite 10 gerais (5 port + 5 mat): não elimina na fronteira de gerais", () => {
    const result = evaluateSimulation({ portugueseCorrect: 5, mathCorrect: 5, specificCorrect: 25 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 35);
  });

  it("limite 19 gerais (9 port + 10 mat): não elimina", () => {
    const result = evaluateSimulation({ portugueseCorrect: 9, mathCorrect: 10, specificCorrect: 25 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 44);
  });

  it("limite 20 gerais (10 port + 10 mat): pontuação máxima em gerais", () => {
    const result = evaluateSimulation({ portugueseCorrect: 10, mathCorrect: 10, specificCorrect: 25 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 45);
  });

  // Limites Português: 0 (elimina), 1 (passa se atingir 10 gerais)
  it("limite 0 Português: elimina imediatamente por zerar Português", () => {
    const result = evaluateSimulation({ portugueseCorrect: 0, mathCorrect: 10, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Língua Portuguesa")));
  });

  it("limite 1 Português: não elimina se o conjunto geral somar >= 10 (ex: 1 port + 9 mat)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 1, mathCorrect: 9, specificCorrect: 20 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 30);
  });

  // Limites Matemática: 0 (elimina), 1 (passa se atingir 10 gerais)
  it("limite 0 Matemática: elimina imediatamente por zerar Matemática", () => {
    const result = evaluateSimulation({ portugueseCorrect: 10, mathCorrect: 0, specificCorrect: 30 });
    assert.equal(result.isEliminated, true);
    assert.ok(result.eliminationReasons.some((r) => r.includes("Matemática")));
  });

  it("limite 1 Matemática: não elimina se o conjunto geral somar >= 10 (ex: 9 port + 1 mat)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 9, mathCorrect: 1, specificCorrect: 20 });
    assert.equal(result.isEliminated, false);
    assert.equal(result.totalScore, 30);
  });

  // Meta de estudo 47 NÃO é critério de eliminação
  it("meta de estudo 47 não é critério de eliminação (ex: 35 acertos é aprovado sem corte)", () => {
    const result = evaluateSimulation({ portugueseCorrect: 6, mathCorrect: 6, specificCorrect: 23 });
    assert.equal(result.totalScore, 35);
    assert.equal(result.isEliminated, false);
    assert.equal(result.isAboveTarget, false);
  });
});
