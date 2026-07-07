import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import type { Role } from "@prisma/client";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429 }
      );
    }

    const { firstName, lastName, email, password, establishmentSlug, classId, classRepCode } =
      await request.json();

    if (!firstName || !lastName || !email || !password || !establishmentSlug || !classId) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caracteres" },
        { status: 400 }
      );
    }

    const establishment = await prisma.establishment.findUnique({
      where: { slug: establishmentSlug },
    });

    if (!establishment) {
      return NextResponse.json(
        { error: "Etablissement non trouve" },
        { status: 404 }
      );
    }

    // Verifier que la classe est dans le registre de l'etablissement
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
            "Cette classe n'est pas enregistree dans votre etablissement. Veuillez contacter l'administration.",
        },
        { status: 403 }
      );
    }

    // Verifier si l'email existe deja
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe deja" },
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

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM || "noreply@shareschool.ci";
    let emailSent = false;

    try {
      const { error } = await resend.emails.send({
        from: `ShareSchool CI <${from}>`,
        to: [email],
        subject: "Code de verification ShareSchool",
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.1)"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1e3a5f,#2d5a8e);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-weight:bold;font-size:20px">SC</div><h1 style="color:white;font-size:20px;text-align:center;margin-bottom:8px">Bienvenue sur ShareSchool</h1><p style="color:rgba(255,255,255,0.6);text-align:center;font-size:14px;margin-bottom:24px">Utilisez ce code pour activer votre compte</p><div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;text-align:center"><span style="font-size:36px;font-weight:bold;color:white;letter-spacing:8px;font-family:monospace">${verificationCode}</span></div><p style="color:rgba(255,255,255,0.4);text-align:center;font-size:12px;margin-top:24px">Ce code expirera dans 15 minutes.</p></div>`,
      });
      if (error) throw error;
      emailSent = true;
    } catch (e) {
      console.error("Erreur envoi email (le code est dans les logs ci-dessus):", e);
    }

    return NextResponse.json(
      {
        message: "Compte cree ! Verifiez votre email pour activer votre compte.",
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