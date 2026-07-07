import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        classId: true,
        establishmentId: true,
        classe: {
          select: {
            levelId: true,
            seriesId: true,
            level: { select: { name: true, order: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const levelOrder = user.classe?.level.order ?? 0;
    const isFirstCycle = levelOrder <= 3; // 6ème(0) à 3ème(3)

    const subjects = await prisma.subject.findMany({
      where: {
        establishmentId: user.establishmentId,
        isFirstCycle,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Erreur chargement matières:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des matières" },
      { status: 500 }
    );
  }
}
