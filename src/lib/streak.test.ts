import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateStreakProgress } from "./streak";

describe("calculateStreakProgress", () => {
  it("inicia sequência de 1 quando não há estudo prévio", () => {
    const result = calculateStreakProgress(null, 0);
    assert.equal(result.nextStreak, 1);
    assert.equal(result.isNewDay, true);
  });

  it("não incrementa sequência se o estudo ocorreu no mesmo dia", () => {
    const now = new Date();
    const result = calculateStreakProgress(now, 5);
    assert.equal(result.nextStreak, 5);
    assert.equal(result.isNewDay, false);
  });

  it("incrementa sequência se o último estudo foi ontem", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = calculateStreakProgress(yesterday, 3);
    assert.equal(result.nextStreak, 4);
    assert.equal(result.isNewDay, true);
  });

  it("reinicia sequência para 1 se houve quebra de mais de um dia", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = calculateStreakProgress(threeDaysAgo, 10);
    assert.equal(result.nextStreak, 1);
    assert.equal(result.isNewDay, true);
  });
});
