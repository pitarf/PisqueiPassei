import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateNextSRS } from "./srs";

describe("calculateNextSRS", () => {
  it("avança o intervalo ao entender", () => {
    const result = calculateNextSRS({ currentIntervalDays: 1, currentMasteryScore: 40, feedback: "ENTENDI" });
    assert.equal(result.nextIntervalDays, 3);
    assert.equal(result.newMasteryScore, 55);
    assert.equal(result.newStatus, "EM_ESTUDO");
  });

  it("reduz intervalo para 1 dia quando não entendeu", () => {
    const result = calculateNextSRS({ currentIntervalDays: 15, currentMasteryScore: 50, feedback: "NAO_ENTENDI" });
    assert.equal(result.nextIntervalDays, 1);
    assert.equal(result.newMasteryScore, 35);
  });

  it("marca tópico como em revisão ao pedir revisão", () => {
    const result = calculateNextSRS({ currentIntervalDays: 3, currentMasteryScore: 60, feedback: "REVISAR" });
    assert.equal(result.nextIntervalDays, 5);
    assert.equal(result.newMasteryScore, 65);
    assert.equal(result.newStatus, "EM_REVISAO");
  });

  it("limita pontuação de domínio a 100", () => {
    const result = calculateNextSRS({ currentIntervalDays: 30, currentMasteryScore: 95, feedback: "ENTENDI", accuracyPercentage: 90 });
    assert.equal(result.newMasteryScore, 100);
    assert.equal(result.newStatus, "DOMINADO");
  });
});
