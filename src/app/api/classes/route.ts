import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const levelId = searchParams.get("levelId");
    const seriesId = searchParams.get("seriesId");

    if (!levelId) {
      return NextResponse.json({ error: "levelId requis" }, { status: 400 });
    }

    const where: Prisma.ClasseWhereInput = { levelId };
    if (seriesId) where.seriesId = seriesId;

    const classes = await prisma.classe.findMany({
      where,
      select: { id: true, name: true, levelId: true, seriesId: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Erreur chargement classes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des classes" },
      { status: 500 }
    );
  }
}
