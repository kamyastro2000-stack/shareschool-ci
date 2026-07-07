import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { awardXP } from "@/lib/xp";
import { sendResourceNotification } from "@/lib/email";
import type { ResourceStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { resourceId, action, comment } = await request.json();

    if (!resourceId || !action) {
      return NextResponse.json(
        { error: "resourceId et action requis" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide. Utilisez APPROVED ou REJECTED" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { author: true },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const canValidate =
      user.role === "ADMIN" ||
      user.role === "TEACHER" ||
      (user.role === "CLASS_REP" && resource.classId === user.classId);

    if (!canValidate) {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions pour valider cette ressource" },
        { status: 403 }
      );
    }

        await prisma.$transaction([
      prisma.resource.update({
        where: { id: resourceId },
        data: { status: action as ResourceStatus },
      }),
      prisma.validation.create({
        data: {
          resourceId,
          validatorId: session.user.id,
          action: action as ResourceStatus,
          comment,
        },
      }),
    ]);

    const xpAction = action === "APPROVED" ? "VALIDATE_APPROVE" : "VALIDATE_REJECT";
    const xpResult = await awardXP(session.user.id, xpAction, `Validation : ${resource.title}`);

    await sendResourceNotification(
      resource.author.email,
      resource.author.firstName,
      resource.title,
      action as "APPROVED" | "REJECTED",
      comment
    );

    return NextResponse.json({
      message: `Ressource ${action === "APPROVED" ? "approuvée" : "rejetée"} avec succès`,
      xp: xpResult,
    });
  } catch (error) {
    console.error("Erreur validation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
