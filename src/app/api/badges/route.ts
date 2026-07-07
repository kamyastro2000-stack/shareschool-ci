import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const allBadges = await prisma.badge.findMany({ orderBy: { name: "asc" } });
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeId: true, earnedAt: true },
    });

    const ownedMap = new Map(userBadges.map((b) => [b.badgeId, b.earnedAt]));

    const badges = allBadges.map((badge) => ({
      ...badge,
      earned: ownedMap.has(badge.id),
      earnedAt: ownedMap.get(badge.id) || null,
    }));

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Erreur badges:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
