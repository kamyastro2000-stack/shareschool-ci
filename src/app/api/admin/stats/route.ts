import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const establishmentId = session.user.establishmentId;

    const [totalUsers, totalResources, pendingResources, roles] = await Promise.all([
      prisma.user.count({ where: { establishmentId } }),
      prisma.resource.count({ where: { establishmentId } }),
      prisma.resource.count({ where: { establishmentId, status: "PENDING" } }),
      prisma.user.groupBy({
        by: ["role"],
        where: { establishmentId },
        _count: true,
      }),
    ]);

    const studentsCount =
      roles.find((r) => r.role === "STUDENT")?._count ?? 0;
    const teachersCount =
      roles.find((r) => r.role === "TEACHER")?._count ?? 0;
    const classRepsCount =
      roles.find((r) => r.role === "CLASS_REP")?._count ?? 0;

    return NextResponse.json({
      totalUsers,
      totalResources,
      pendingResources,
      studentsCount,
      teachersCount,
      classRepsCount,
    });
  } catch (error) {
    console.error("Erreur stats admin:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
