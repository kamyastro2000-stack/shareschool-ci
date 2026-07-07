import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { establishmentId: session.user.establishmentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        classe: {
          select: {
            name: true,
            level: { select: { name: true } },
            series: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des utilisateurs" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "userId et role requis" }, { status: 400 });
    }

    if (!["STUDENT", "CLASS_REP", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    return NextResponse.json({ message: "Rôle mis à jour" });
  } catch (error) {
    console.error("Erreur mise à jour rôle:", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}
