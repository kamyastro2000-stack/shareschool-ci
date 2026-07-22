import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [studentsCount, resourcesCount, quizzesCount, establishmentsCount] =
      await Promise.all([
        prisma.user.count({
          where: { role: "STUDENT", isActive: true, emailVerified: { not: null } },
        }),
        prisma.resource.count({ where: { status: "APPROVED" } }),
        prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
        prisma.establishment.count({ where: { isActive: true } }),
      ]);

    return NextResponse.json({
      students: studentsCount,
      resources: resourcesCount,
      quizzes: quizzesCount,
      establishments: establishmentsCount,
    });
  } catch (error) {
    console.error("Erreur stats publiques:", error);
    return NextResponse.json({
      students: 0,
      resources: 0,
      quizzes: 0,
      establishments: 0,
    });
  }
}
