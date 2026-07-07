export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,
  5000, 6500, 8000, 10000, 12500, 15000, 18000, 21000, 25000, 30000,
];

export function getLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPProgress(totalXP: number): { current: number; next: number; progress: number } {
  const level = getLevel(totalXP);
  const idx = Math.min(level - 1, LEVEL_THRESHOLDS.length - 1);
  const nextIdx = Math.min(level, LEVEL_THRESHOLDS.length - 1);
  const currentThreshold = LEVEL_THRESHOLDS[idx];
  const nextThreshold = LEVEL_THRESHOLDS[nextIdx];
  return {
    current: totalXP - currentThreshold,
    next: nextThreshold - currentThreshold,
    progress: nextThreshold > currentThreshold ? (totalXP - currentThreshold) / (nextThreshold - currentThreshold) : 1,
  };
}
