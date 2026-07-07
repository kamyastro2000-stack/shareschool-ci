import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const leaders = await prisma.user.findMany({
      where: {
        establishmentId: session.user.establishmentId,
        isActive: true,
        role: { notIn: ["ADMIN", "TEACHER"] },
      },
      orderBy: { totalXP: "desc" },
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalXP: true,
        level: true,
        role: true,
        classe: {
          select: {
            name: true,
            level: { select: { name: true } },
            series: { select: { name: true } },
          },
        },
        _count: { select: { badges: true } },
      },
    });

    const userRank = leaders.findIndex((u) => u.id === session.user.id) + 1;

    return NextResponse.json({ leaders, userRank: userRank || null });
  } catch (error) {
    console.error("Erreur classement:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
