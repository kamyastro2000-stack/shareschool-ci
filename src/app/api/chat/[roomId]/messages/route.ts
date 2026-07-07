import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { establishmentId: true },
    });

    if (!room || room.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erreur messages:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { roomId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { establishmentId: true, levelId: true },
    });

    if (!room || room.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }

    if (room.levelId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classe: { select: { levelId: true } }, role: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }
      if (user.role !== "ADMIN" && user.role !== "TEACHER" && user.classe?.levelId !== room.levelId) {
        return NextResponse.json({ error: "Vous n'avez pas accès à ce salon" }, { status: 403 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Erreur envoi message:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
