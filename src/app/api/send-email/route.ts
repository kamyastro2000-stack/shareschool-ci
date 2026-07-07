import { NextResponse } from "next/server";
import { sendRawEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject et html sont requis" },
        { status: 400 }
      );
    }

    const sent = await sendRawEmail(to, subject, html);

    if (!sent) {
      return NextResponse.json(
        { error: "Erreur d'envoi d'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Email envoyé" });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
