import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const establishments = await prisma.establishment.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(establishments);
  } catch (error) {
    console.error("Erreur chargement établissements:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des établissements" },
      { status: 500 }
    );
  }
}
