import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { awardXP } from "@/lib/xp";
import type { ResourceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const status = (searchParams.get("status") || "APPROVED") as ResourceStatus;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        establishmentId: true,
        classId: true,
        role: true,
        classe: {
          select: {
            levelId: true,
            level: { select: { name: true, order: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Règle de cloisonnement Terminale : accès croisé total
    const isTerminale = user.classe?.level.name === "Terminale";

    const where: Record<string, unknown> = {
      establishmentId: user.establishmentId,
      status,
    };

    if (status === "PENDING" && user.role === "STUDENT") {
      where.authorId = session.user.id;
    }

    if (!isTerminale) {
      where.classId = user.classId;
    }

    if (user.role !== "ADMIN" && status !== "PENDING") {
      where.OR = [{ classId: user.classId }];
      if (isTerminale) {
        const terminalLevel = await prisma.level.findUnique({
          where: { name: "Terminale" },
        });
        if (terminalLevel) {
          where.OR = [
            { classId: user.classId },
            {
              classe: {
                levelId: terminalLevel.id,
              },
            },
          ];
        }
      }
    }

    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        subject: { select: { id: true, name: true } },
        classe: {
          select: {
            id: true,
            name: true,
            level: { select: { name: true } },
            series: { select: { name: true } },
          },
        },
        validations: {
          include: {
            validator: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Erreur chargement ressources:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des ressources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { title, description, type, fileUrl, subjectId, classId } =
      await request.json();

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: "Le titre et le fichier sont requis" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type: type || "PDF",
        fileUrl,
        status: "PENDING",
        authorId: session.user.id,
        establishmentId: session.user.establishmentId,
        classId: classId || session.user.classId,
        subjectId,
      },
    });

    const xpResult = await awardXP(session.user.id, "UPLOAD_RESOURCE", `Publication : ${title}`);

    return NextResponse.json({ resource, xp: xpResult }, { status: 201 });
  } catch (error) {
    console.error("Erreur création ressource:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la ressource" },
      { status: 500 }
    );
  }
}
