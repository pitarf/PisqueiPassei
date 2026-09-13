import { describe, expect, it } from "vitest";
import { calculateNextSRS } from "./srs";

describe("calculateNextSRS", () => {
  it("avança o intervalo ao entender", () => {
    const result = calculateNextSRS({ currentIntervalDays: 1, currentMasteryScore: 40, feedback: "ENTENDI" });
    expect(result.nextIntervalDays).toBe(3);
    expect(result.newMasteryScore).toBe(55);
    expect(result.newStatus).toBe("EM_ESTUDO");
  });

  it("coloca revisão curta quando não entendeu", () => {
    const result = calculateNextSRS({ currentIntervalDays: 15, currentMasteryScore: 50, feedback: "NAO_ENTENDI" });
    expect(result.nextIntervalDays).toBe(1);
    expect(result.newMasteryScore).toBe(35);
  });

  it("marca tópico como em revisão", () => {
    const result = calculateNextSRS({ currentIntervalDays: 3, currentMasteryScore: 60, feedback: "REVISAR" });
    expect(result.nextIntervalDays).toBe(5);
    expect(result.newMasteryScore).toBe(65);
    expect(result.newStatus).toBe("EM_REVISAO");
  });

  it("limita domínio a 100", () => {
    const result = calculateNextSRS({ currentIntervalDays: 30, currentMasteryScore: 95, feedback: "ENTENDI", accuracyPercentage: 90 });
    expect(result.newMasteryScore).toBe(100);
    expect(result.newStatus).toBe("DOMINADO");
  });
});
