import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" }, select: { id: true, question: true, options: true, order: true } },
        subject: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz || quiz.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Erreur chargement quiz:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { title, description, subjectId, isGeneralCulture, timeLimit, difficulty, questions } = await request.json();

    const existing = await prisma.quiz.findUnique({ where: { id } });
    if (!existing || existing.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description,
          subjectId: subjectId || null,
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
      });
    });

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Erreur modification quiz:", error);
    return NextResponse.json({ error: "Erreur modification" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz || quiz.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
    }

    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ message: "Quiz supprimé" });
  } catch (error) {
    console.error("Erreur suppression quiz:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
