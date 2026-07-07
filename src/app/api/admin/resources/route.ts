import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import type { Prisma, ResourceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Prisma.ResourceWhereInput = { establishmentId: session.user.establishmentId };
    if (status) where.status = status as ResourceStatus;
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
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
        subject: { select: { id: true, name: true } },
        classe: {
          select: { name: true, level: { select: { name: true } }, series: { select: { name: true } } },
        },
        validations: {
          include: { validator: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Erreur admin ressources:", error);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Ressource non trouvée" }, { status: 404 });
    }

    const fileUrl = resource.fileUrl;
    if (fileUrl?.includes("cloudinary")) {
      const parts = fileUrl.split("/");
      const publicIdWithExt = parts[parts.length - 1];
      const publicId = `shareschool/${publicIdWithExt.replace(/\.[^.]+$/, "")}`;
      try { await cloudinary.uploader.destroy(publicId); } catch { /* ignore */ }
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ message: "Ressource supprimée" });
  } catch (error) {
    console.error("Erreur suppression:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
