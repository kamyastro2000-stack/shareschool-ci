import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId et action requis" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (action === "activate") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          emailVerified: new Date(),
          verificationCode: null,
          verificationCodeExpires: null,
        },
      });
      return NextResponse.json({ message: "Compte activé" });
    }

    if (action === "resend_verification") {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: { verificationCode: code, verificationCodeExpires: expires },
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM || "noreply@shareschool.ci";

      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_xxxxx") {
        await resend.emails.send({
          from: `ShareSchool CI <${from}>`,
          to: [target.email],
          subject: "Code de vérification ShareSchool",
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.1)"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1e3a5f,#2d5a8e);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-weight:bold;font-size:20px">SC</div><h1 style="color:white;font-size:20px;text-align:center;margin-bottom:8px">Code de vérification</h1><p style="color:rgba(255,255,255,0.6);text-align:center;font-size:14px;margin-bottom:24px">Utilisez ce code pour activer votre compte ShareSchool</p><div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;text-align:center"><span style="font-size:36px;font-weight:bold;color:white;letter-spacing:8px;font-family:monospace">${code}</span></div><p style="color:rgba(255,255,255,0.4);text-align:center;font-size:12px;margin-top:24px">Ce code expirera dans 15 minutes.</p></div>`,
        });
      } else {
        console.log("EMAIL SIMULÉ - Code:", code);
      }

      return NextResponse.json({ message: "Code renvoyé" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur admin users:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.establishmentId !== session.user.establishmentId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Impossible de supprimer un administrateur" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
