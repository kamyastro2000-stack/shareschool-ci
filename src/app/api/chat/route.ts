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
        classe: { select: { levelId: true, level: { select: { name: true } } } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      establishmentId: session.user.establishmentId,
    };

    if (user.classe?.levelId) {
      where.OR = [
        { levelId: user.classe.levelId },
        { levelId: null },
      ];
    }

    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        level: { select: { name: true, order: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: [{ levelId: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Erreur chat rooms:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
