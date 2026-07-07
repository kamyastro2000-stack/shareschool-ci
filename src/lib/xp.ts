import { prisma } from "./prisma";

const XP_VALUES: Record<string, number> = {
  UPLOAD_RESOURCE: 15,
  VALIDATE_APPROVE: 10,
  VALIDATE_REJECT: 2,
  QUIZ_COMPLETE_BASE: 20,
  QUIZ_PERFECT_BASE: 50,
  LOGIN_STREAK: 5,
};

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  EASY: 1,
  MEDIUM: 1.5,
  HARD: 2,
  LEGENDARY: 3,
};

const LEVEL_THRESHOLDS = [
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
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)];
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)];
  return {
    current: totalXP - currentThreshold,
    next: nextThreshold - currentThreshold,
    progress: (totalXP - currentThreshold) / (nextThreshold - currentThreshold),
  };
}

export async function awardXP(userId: string, action: string, description?: string, difficulty?: string): Promise<{ totalXP: number; level: number; newBadges: string[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true, level: true, role: true },
  });

  if (!user) return { totalXP: 0, level: 1, newBadges: [] };
  if (user.role === "TEACHER" || user.role === "ADMIN") return { totalXP: user.totalXP, level: user.level, newBadges: [] };

  const basePoints = XP_VALUES[action] || 5;
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty || ""] || 1;
  const points = Math.round(basePoints * multiplier);

  await prisma.xPTransaction.create({
    data: { userId, points, action, description },
  });

  const newTotal = user.totalXP + points;
  const newLevel = getLevel(newTotal);

  await prisma.user.update({
    where: { id: userId },
    data: { totalXP: newTotal, level: newLevel },
  });

  const newBadges = await checkAndAwardBadges(userId, action, newTotal);

  return { totalXP: newTotal, level: newLevel, newBadges };
}

async function checkAndAwardBadges(userId: string, action: string, totalXP: number): Promise<string[]> {
  const badges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const owned = new Set(userBadges.map((b) => b.badgeId));
  const earned: string[] = [];

  for (const badge of badges) {
    if (owned.has(badge.id)) continue;

    let earned_this = false;
    switch (badge.criteria) {
      case "FIRST_UPLOAD":
        if (action === "UPLOAD_RESOURCE") {
          const count = await prisma.resource.count({ where: { authorId: userId } });
          if (count === 1) earned_this = true;
        }
        break;
      case "FIRST_VALIDATION":
        if (action === "VALIDATE_APPROVE" || action === "VALIDATE_REJECT") {
          const count = await prisma.validation.count({ where: { validatorId: userId } });
          if (count === 1) earned_this = true;
        }
        break;
      case "FIRST_QUIZ":
        if (action === "QUIZ_COMPLETE" || action === "QUIZ_PERFECT") {
          const count = await prisma.quizAttempt.count({ where: { userId, completedAt: { not: null } } });
          if (count === 1) earned_this = true;
        }
        break;
      case "PERFECT_QUIZ":
        if (action === "QUIZ_PERFECT") earned_this = true;
        break;
      case "XP_100":
        if (totalXP >= 100) earned_this = true;
        break;
      case "XP_500":
        if (totalXP >= 500) earned_this = true;
        break;
      case "XP_1000":
        if (totalXP >= 1000) earned_this = true;
        break;
      case "LEVEL_5":
        if (getLevel(totalXP) >= 5) earned_this = true;
        break;
      case "LEVEL_10":
        if (getLevel(totalXP) >= 10) earned_this = true;
        break;
      case "CONTRIBUTOR":
        if (badge.criteria === "CONTRIBUTOR") {
          const resCount = await prisma.resource.count({ where: { authorId: userId, status: "APPROVED" } });
          if (resCount >= 5) earned_this = true;
        }
        break;
      case "UPLOAD_10":
        if (badge.criteria === "UPLOAD_10") {
          const count = await prisma.resource.count({ where: { authorId: userId } });
          if (count >= 10) earned_this = true;
        }
        break;
    }

    if (earned_this) {
      if (badge.xpReward > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { totalXP: { increment: badge.xpReward } },
        });
        await prisma.xPTransaction.create({
          data: { userId, points: badge.xpReward, action: "BADGE_REWARD", description: `Badge: ${badge.name}` },
        });
      }
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      earned.push(badge.name);
    }
  }

  return earned;
}
