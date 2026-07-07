import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const results = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      include: {
        quiz: {
          select: { id: true, title: true, subject: { select: { name: true } } },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erreur résultats:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
