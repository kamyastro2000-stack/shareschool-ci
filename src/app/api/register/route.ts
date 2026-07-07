import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { sendVerificationCode } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. R\u00e9essayez dans une minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, establishmentSlug, classId, classRepCode } = parsed.data;

    const establishment = await prisma.establishment.findUnique({
      where: { slug: establishmentSlug },
    });

    if (!establishment) {
      return NextResponse.json(
        { error: "Etablissement non trouv\u00e9" },
        { status: 404 }
      );
    }

    const registryEntry = await prisma.classRegistry.findUnique({
      where: {
        establishmentId_classId: {
          establishmentId: establishment.id,
          classId,
        },
      },
    });

    if (!registryEntry || !registryEntry.isActive) {
      return NextResponse.json(
        {
          error:
            "Cette classe n'est pas enregistr\u00e9e dans votre \u00e9tablissement. Veuillez contacter l'administration.",
        },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe d\u00e9j\u00e0" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let role: string = "STUDENT";

    if (classRepCode) {
      const classe = await prisma.classe.findUnique({
        where: { id: classId },
        include: { level: true },
      });
      if (classe?.name === classRepCode) {
        role = "CLASS_REP";
      }
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as Role,
        establishmentId: establishment.id,
        classId,
        classRepCode: classRepCode || null,
        isActive: false,
        verificationCode,
        verificationCodeExpires,
      },
    });

    const emailSent = await sendVerificationCode(email, verificationCode, firstName);

    return NextResponse.json(
      {
        message: "Compte cr\u00e9\u00e9 ! V\u00e9rifiez votre email pour activer votre compte.",
        requiresVerification: true,
        email,
        devCode: process.env.NODE_ENV !== "production" ? verificationCode : undefined,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
