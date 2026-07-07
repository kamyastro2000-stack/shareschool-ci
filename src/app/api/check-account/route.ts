import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      exists: !!user,
      isActive: user?.isActive ?? true,
    });
  } catch {
    return NextResponse.json({ exists: false, isActive: false });
  }
}
