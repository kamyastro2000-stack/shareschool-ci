import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const [registered, allClasses] = await Promise.all([
      prisma.classRegistry.findMany({
        where: { establishmentId: session.user.establishmentId },
        include: {
          classe: {
            include: { level: { select: { name: true, order: true } }, series: { select: { name: true } } },
          },
        },
        orderBy: { classe: { level: { order: "asc" } } },
      }),
      prisma.classe.findMany({
        include: { level: { select: { name: true, order: true } }, series: { select: { name: true } } },
        orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
      }),
    ]);

    const registeredIds = new Set(registered.map((r) => r.classId));

    return NextResponse.json({
      registered: registered.map((r) => ({
        id: r.id,
        classId: r.classId,
        name: `${r.classe.level.name}${r.classe.series ? " " + r.classe.series.name : ""} ${r.classe.name}`,
        level: r.classe.level.name,
        isActive: r.isActive,
        createdAt: r.createdAt,
      })),
      available: allClasses
        .filter((c) => !registeredIds.has(c.id))
        .map((c) => ({
          id: c.id,
          name: `${c.level.name}${c.series ? " " + c.series.name : ""} ${c.name}`,
          level: c.level.name,
        })),
    });
  } catch (error) {
    console.error("Erreur registre:", error);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { classId } = await request.json();
    if (!classId) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 });
    }

    const exists = await prisma.classRegistry.findUnique({
      where: {
        establishmentId_classId: {
          establishmentId: session.user.establishmentId,
          classId,
        },
      },
    });

    if (exists) {
      return NextResponse.json({ error: "Cette classe est déjà dans le registre" }, { status: 409 });
    }

    const entry = await prisma.classRegistry.create({
      data: {
        establishmentId: session.user.establishmentId,
        classId,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout registre:", error);
    return NextResponse.json({ error: "Erreur ajout" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { classId } = await request.json();
    if (!classId) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 });
    }

    await prisma.classRegistry.delete({
      where: {
        establishmentId_classId: {
          establishmentId: session.user.establishmentId,
          classId,
        },
      },
    });

    return NextResponse.json({ message: "Classe retirée du registre" });
  } catch (error) {
    console.error("Erreur retrait registre:", error);
    return NextResponse.json({ error: "Erreur retrait" }, { status: 500 });
  }
}
