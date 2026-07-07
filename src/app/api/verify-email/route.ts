import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendVerificationCode, sendWelcome } from "@/lib/email";

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

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerified: new Date(),
        verificationCode: null,
        verificationCodeExpires: null,
      },
      include: {
        establishment: true,
        classe: true,
      },
    });

    await sendWelcome(
      email,
      updated.firstName,
      updated.establishment.name,
      updated.classe?.name || "—"
    );

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

    const emailSent = await sendVerificationCode(email, code, user.firstName);

    return NextResponse.json({ message: "Code envoyé", devCode: process.env.NODE_ENV !== "production" ? code : undefined, emailSent });
  } catch (error) {
    console.error("Erreur renvoi code:", error);
    return NextResponse.json({ error: "Erreur lors du renvoi" }, { status: 500 });
  }
}
