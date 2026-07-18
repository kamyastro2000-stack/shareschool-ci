import { Resend } from "resend";
import type { ReactElement } from "react";

import VerificationCodeEmail from "@/emails/verification-code";
import WelcomeEmail from "@/emails/welcome";
import ResourceNotificationEmail from "@/emails/resource-notification";

const resend = new Resend(process.env.RESEND_API_KEY || "");

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const fromName = "ShareSchool CI";

async function sendEmail(
  to: string,
  subject: string,
  content: { html: string } | { react: ReactElement },
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL SIMULÉ] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      ...content,
    });

    if (error) {
      console.error(`[EMAIL ERREUR] ${subject} -> ${to}:`, error);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`[EMAIL ERREUR] ${subject} -> ${to}:`, e);
    return false;
  }
}

export async function sendRawEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  return sendEmail(to, subject, { html });
}

export async function sendVerificationCode(
  to: string,
  code: string,
  firstName: string
): Promise<boolean> {
  return sendEmail(to, "Code de vérification ShareSchool", {
    react: <VerificationCodeEmail code={code} firstName={firstName} />,
  });
}

export async function sendWelcome(
  to: string,
  firstName: string,
  establishmentName: string,
  className: string
): Promise<boolean> {
  return sendEmail(to, "Bienvenue sur ShareSchool CI !", {
    react: (
      <WelcomeEmail
        firstName={firstName}
        establishmentName={establishmentName}
        className={className}
      />
    ),
  });
}

export async function sendResourceNotification(
  to: string,
  firstName: string,
  resourceTitle: string,
  status: "APPROVED" | "REJECTED",
  comment?: string
): Promise<boolean> {
  const subject = `Ressource ${status === "APPROVED" ? "approuvée" : "refusée"} — ${resourceTitle}`;
  return sendEmail(to, subject, {
    react: (
      <ResourceNotificationEmail
        firstName={firstName}
        resourceTitle={resourceTitle}
        status={status}
        comment={comment}
      />
    ),
  });
}
