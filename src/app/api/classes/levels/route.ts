import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { order: "asc" },
      include: {
        series: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    });
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Erreur chargement niveaux:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des niveaux" },
      { status: 500 }
    );
  }
}
