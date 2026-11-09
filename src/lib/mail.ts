import nodemailer, { type Transporter } from "nodemailer";
import { escapeHtml } from "@/lib/utils";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends an email. Never throws: a mail failure must not break an order or a sign-up.
 * With no SMTP credentials (local development) the email is printed to the server log.
 */
export async function sendMail({ to, subject, html, replyTo }: MailInput): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    const text = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(`\n[email:dev] to=${to}\n[email:dev] subject=${subject}\n[email:dev] ${text.slice(0, 600)}\n`);
    return true;
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || `Chique Bags <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      replyTo,
    });
    return true;
  } catch (err) {
    console.error("[email] failed to send", subject, "to", to, err);
    return false;
  }
}

export { escapeHtml };
