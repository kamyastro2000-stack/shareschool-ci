import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const quizId = (await params).id;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { select: { id: true } } },
    });

    if (!quiz || quiz.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
    }

    const existing = await prisma.quizAttempt.findFirst({
      where: { quizId, userId: session.user.id, completedAt: null },
    });

    if (existing) {
      return NextResponse.json({ attemptId: existing.id });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        score: 0,
        maxScore: quiz.questions.length,
        answers: "[]",
      },
    });

    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch (error) {
    console.error("Erreur tentative quiz:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
