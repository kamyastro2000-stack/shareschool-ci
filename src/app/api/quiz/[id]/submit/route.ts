import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { awardXP } from "@/lib/xp";

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
    const { answers, attemptId } = await request.json();

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!quiz || quiz.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
    }

    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== session.user.id || attempt.quizId !== quizId) {
      return NextResponse.json({ error: "Tentative invalide" }, { status: 400 });
    }
    if (attempt.completedAt) {
      return NextResponse.json({ error: "Quiz déjà soumis" }, { status: 400 });
    }

    if (quiz.timeLimit) {
      const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
      if (elapsed > quiz.timeLimit * 60 + 5) {
        return NextResponse.json({ error: "Temps écoulé" }, { status: 400 });
      }
    }

    let score = 0;
    const parsedAnswers: number[] = typeof answers === "string" ? JSON.parse(answers) : answers;

    quiz.questions.forEach((q, i) => {
      if (parsedAnswers[i] === q.correct) score++;
    });

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        maxScore: quiz.questions.length,
        answers: JSON.stringify(parsedAnswers),
        completedAt: new Date(),
      },
    });

    const isPerfect = score === quiz.questions.length;
    const actionType = isPerfect ? "QUIZ_PERFECT_BASE" : "QUIZ_COMPLETE_BASE";
    const xpResult = await awardXP(
      session.user.id,
      actionType,
      `Quiz : ${quiz.title} (${score}/${quiz.questions.length})`,
      quiz.difficulty
    );

    return NextResponse.json({
      score,
      maxScore: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      xp: xpResult,
    });
  } catch (error) {
    console.error("Erreur soumission quiz:", error);
    return NextResponse.json({ error: "Erreur soumission" }, { status: 500 });
  }
}
