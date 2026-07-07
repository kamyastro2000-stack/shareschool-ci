import { describe, it, expect } from "vitest";
import { getLevel, getXPProgress, LEVEL_THRESHOLDS } from "../src/lib/xp-client";

describe("getLevel", () => {
  it("returns 1 for 0 XP", () => {
    expect(getLevel(0)).toBe(1);
  });

  it("returns 1 for 50 XP", () => {
    expect(getLevel(50)).toBe(1);
  });

  it("returns 2 for 100 XP (first threshold)", () => {
    expect(getLevel(100)).toBe(2);
  });

  it("returns 3 for 250 XP", () => {
    expect(getLevel(250)).toBe(3);
  });

  it("returns 5 for 800 XP", () => {
    expect(getLevel(800)).toBe(5);
  });

  it("returns last level for huge XP", () => {
    const maxLevel = LEVEL_THRESHOLDS.length;
    expect(getLevel(1_000_000)).toBe(maxLevel);
  });
});

describe("getXPProgress", () => {
  it("returns correct progress for level 1 (0 XP / 100 needed)", () => {
    const p = getXPProgress(0);
    expect(p.current).toBe(0);
    expect(p.next).toBe(100);
    expect(p.progress).toBe(0);
  });

  it("returns correct progress at 50 XP", () => {
    const p = getXPProgress(50);
    expect(p.current).toBe(50);
    expect(p.next).toBe(100);
    expect(p.progress).toBe(0.5);
  });

  it("returns correct progress at 100 XP (level 2, 0/150)", () => {
    const p = getXPProgress(100);
    expect(p.current).toBe(0);
    expect(p.next).toBe(150);
    expect(p.progress).toBe(0);
  });

  it("returns 100% progress at max level", () => {
    const maxTotal = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000;
    const p = getXPProgress(maxTotal);
    expect(p.progress).toBe(1);
  });

  it("progress is always between 0 and 1", () => {
    for (const xp of [0, 50, 100, 300, 1000, 5000, 10000]) {
      const p = getXPProgress(xp);
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(1);
    }
  });
});
