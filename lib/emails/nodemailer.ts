import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.warn(
      "Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables. Email sending is currently disabled.",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  return transporter;
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: SendMailOptions): Promise<{
  success: boolean;
  messageId?: string;
  accepted?: any[];
  rejected?: any[];
  error?: string;
}> {
  if (process.env.NODE_ENV !== "production") {
    return {
      success: false,
      error: "Email sending is only available in production environment",
    };
  }

  try {
    const mailTransporter = getTransporter();
    const gmailUser = process.env.GMAIL_USER;

    if (!mailTransporter || !gmailUser) {
      console.warn(
        `[Nodemailer] Cannot send email to ${to}: GMAIL_USER or GMAIL_APP_PASSWORD not set.`,
      );
      return {
        success: false,
        error: "Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables",
      };
    }

    const info = await mailTransporter.sendMail({
      from: `"SBSSU Grievance Portal" <${gmailUser}>`,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error: any) {
    console.error("[Nodemailer] Failed to send email to", to, error);
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}

export async function verifyMailer() {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    return false;
  }
  return mailTransporter.verify();
}
