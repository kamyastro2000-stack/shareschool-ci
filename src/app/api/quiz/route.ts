import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdminOrTeacher = ["ADMIN", "TEACHER"].includes(session.user.role);
    const where: Prisma.QuizWhereInput = { establishmentId: session.user.establishmentId };

    if (!isAdminOrTeacher) {
      where.OR = [
        { isGeneralCulture: true },
        { subjectId: { not: null } },
      ];
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        _count: { select: { questions: true, attempts: true } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Erreur quiz:", error);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { title, description, subjectId, isGeneralCulture, timeLimit, difficulty, questions } = await request.json();

    if (!title || !questions?.length) {
      return NextResponse.json({ error: "Titre et questions requis" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        subjectId: subjectId || null,
        establishmentId: session.user.establishmentId,
        createdById: session.user.id,
        isGeneralCulture: isGeneralCulture || false,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        difficulty: difficulty || "EASY",
        questions: {
          create: questions.map((q: { question: string; options: string[]; correct: number }, i: number) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correct: q.correct,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Erreur création quiz:", error);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
