import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const classAverages = await prisma.user.groupBy({
      by: ["classId"],
      where: {
        establishmentId: session.user.establishmentId,
        isActive: true,
        role: { not: "ADMIN" },
        classId: { not: null },
      },
      _avg: { totalXP: true },
      _count: { id: true },
      _sum: { totalXP: true },
    });

    const classDetails = await prisma.classe.findMany({
      where: {
        id: { in: classAverages.map((c) => c.classId!).filter(Boolean) },
      },
      select: {
        id: true,
        name: true,
        level: { select: { name: true, order: true } },
        series: { select: { name: true } },
      },
    });

    const classMap = new Map(classDetails.map((c) => [c.id, c]));

    const classes = classAverages
      .filter((c) => c.classId && classMap.has(c.classId))
      .map((c) => {
        const details = classMap.get(c.classId!)!;
        const avgXP = Math.round(c._avg.totalXP || 0);
        return {
          classId: c.classId!,
          className: details.name,
          levelName: details.level.name,
          seriesName: details.series?.name || null,
          levelOrder: details.level.order,
          avgXP,
          totalXP: c._sum.totalXP || 0,
          studentCount: c._count.id,
        };
      })
      .sort((a, b) => b.avgXP - a.avgXP);

    const userClass = classes.find((c) => c.classId === session.user.classId);

    return NextResponse.json({ classes, userClassRank: userClass ? classes.indexOf(userClass) + 1 : null });
  } catch (error) {
    console.error("Erreur classement classes:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
