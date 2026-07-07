import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject et html sont requis" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxx") {
      console.log("EMAIL SIMULÉ:", { to, subject });
      return NextResponse.json({
        message: "Email simulé (clé API non configurée)",
        to,
        subject,
      });
    }

    const from = process.env.RESEND_FROM || "noreply@shareschool.ci";

    const { data, error } = await resend.emails.send({
      from: `ShareSchool CI <${from}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return NextResponse.json({ error: "Erreur d'envoi d'email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Email envoyé", id: data?.id });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
