import { render } from "@react-email/components";
import type { ReactElement } from "react";

import VerificationCodeEmail from "@/emails/verification-code";
import WelcomeEmail from "@/emails/welcome";
import ResourceNotificationEmail from "@/emails/resource-notification";

const MAILTRAP_API_URL = "https://send.api.mailtrap.io/api/send";

const fromEmail = process.env.MAILTRAP_FROM_EMAIL || "noreply@shareschool.ci";
const fromName = "ShareSchool CI";

async function sendComponentEmail(
  to: string,
  subject: string,
  component: ReactElement
): Promise<boolean> {
  const html = await render(component);
  return sendRawEmail(to, subject, html);
}

export async function sendRawEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.MAILTRAP_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL SIMULÉ] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const res = await fetch(MAILTRAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        html,
        category: "notification",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[EMAIL ERREUR] ${subject} -> ${to}:`, err);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`[EMAIL ERREUR] ${subject} -> ${to}:`, e);
    return false;
  }
}

export async function sendVerificationCode(
  to: string,
  code: string,
  firstName: string
): Promise<boolean> {
  return sendComponentEmail(
    to,
    "Code de vérification ShareSchool",
    <VerificationCodeEmail code={code} firstName={firstName} />
  );
}

export async function sendWelcome(
  to: string,
  firstName: string,
  establishmentName: string,
  className: string
): Promise<boolean> {
  return sendComponentEmail(
    to,
    "Bienvenue sur ShareSchool CI !",
    <WelcomeEmail
      firstName={firstName}
      establishmentName={establishmentName}
      className={className}
    />
  );
}

export async function sendResourceNotification(
  to: string,
  firstName: string,
  resourceTitle: string,
  status: "APPROVED" | "REJECTED",
  comment?: string
): Promise<boolean> {
  const subject = `Ressource ${status === "APPROVED" ? "approuvée" : "refusée"} — ${resourceTitle}`;
  return sendComponentEmail(
    to,
    subject,
    <ResourceNotificationEmail
      firstName={firstName}
      resourceTitle={resourceTitle}
      status={status}
      comment={comment}
    />
  );
}
