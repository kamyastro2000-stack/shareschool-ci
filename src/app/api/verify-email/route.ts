import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ message: "Compte déjà activé" });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return NextResponse.json({ error: "Aucun code de vérification trouvé" }, { status: 400 });
    }

    if (new Date() > user.verificationCodeExpires) {
      return NextResponse.json({ error: "Code expiré. Demandez un nouveau code." }, { status: 410 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerified: new Date(),
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return NextResponse.json({ message: "Email vérifié avec succès" });
  } catch (error) {
    console.error("Erreur vérification:", error);
    return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (user.isActive) {
      return NextResponse.json({ message: "Compte déjà activé" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpires: expires },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM || "noreply@shareschool.ci";
    let emailSent = false;

    try {
      const { error } = await resend.emails.send({
        from: `ShareSchool CI <${from}>`,
        to: [email],
        subject: "Code de vérification ShareSchool",
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.1)"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1e3a5f,#2d5a8e);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-weight:bold;font-size:20px">SC</div><h1 style="color:white;font-size:20px;text-align:center;margin-bottom:8px">Vérification de votre email</h1><p style="color:rgba(255,255,255,0.6);text-align:center;font-size:14px;margin-bottom:24px">Utilisez ce code pour activer votre compte ShareSchool</p><div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;text-align:center"><span style="font-size:36px;font-weight:bold;color:white;letter-spacing:8px;font-family:monospace">${code}</span></div><p style="color:rgba(255,255,255,0.4);text-align:center;font-size:12px;margin-top:24px">Ce code expirera dans 15 minutes.</p></div>`,
      });
      if (error) throw error;
      emailSent = true;
    } catch (e) {
      console.error("Erreur envoi email (le code est dans les logs ci-dessus):", e);
    }

    return NextResponse.json({ message: "Code envoyé", devCode: process.env.NODE_ENV !== "production" ? code : undefined, emailSent });
  } catch (error) {
    console.error("Erreur renvoi code:", error);
    return NextResponse.json({ error: "Erreur lors du renvoi" }, { status: 500 });
  }
}
