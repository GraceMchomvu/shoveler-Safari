import fs from "fs";
import path from "path";
import { cmsRoot } from "./prisma.js";
import { isProduction } from "./security.js";

export type ResetDelivery = {
  toEmail: string;
  toPhone?: string | null;
  name: string;
  code: string;
  resetUrl: string;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0") && digits.length >= 9) {
    // Tanzania local → E.164 default country
    const cc = (process.env.DEFAULT_PHONE_COUNTRY || "255").replace(/\D/g, "");
    return `+${cc}${digits.slice(1)}`;
  }
  if (/^\d{9,15}$/.test(digits)) return `+${digits}`;
  return digits;
}

/** Simplest free path: https://resend.com — one API key, ~100 emails/day free. */
async function sendResendEmail(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false as const, reason: "RESEND_API_KEY not configured" };

  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    "Northern Shoveler Adventure <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[email/resend] send failed", res.status, errText.slice(0, 300));
    return { ok: false as const, reason: "Resend send failed" };
  }
  return { ok: true as const, channel: "email" as const };
}

async function sendSmtpEmail(to: string, subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST;
  if (!host) return { ok: false as const, reason: "SMTP_HOST not configured" };

  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "Northern Shoveler Adventure <noreply@shovelersafari.com>";

  await transporter.sendMail({ from, to, subject, text, html });
  return { ok: true as const, channel: "email" as const };
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const resend = await sendResendEmail(to, subject, text, html);
  if (resend.ok) return resend;
  if (process.env.SMTP_HOST) {
    return sendSmtpEmail(to, subject, text, html);
  }
  return resend;
}

/** Twilio WhatsApp API */
async function sendTwilioWhatsApp(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  if (!sid || !token || !from) return { ok: false as const, reason: "Twilio WhatsApp not configured" };

  const toWa = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromWa = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: toWa, From: fromWa, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[whatsapp/twilio] send failed", res.status, errText.slice(0, 200));
    return { ok: false as const, reason: "Twilio send failed" };
  }
  return { ok: true as const, channel: "whatsapp" as const };
}

/** Meta WhatsApp Cloud API */
async function sendMetaWhatsApp(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { ok: false as const, reason: "Meta WhatsApp not configured" };

  const toDigits = to.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "text",
      text: { preview_url: true, body },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[whatsapp/meta] send failed", res.status, errText.slice(0, 200));
    return { ok: false as const, reason: "Meta WhatsApp send failed" };
  }
  return { ok: true as const, channel: "whatsapp" as const };
}

async function sendWhatsApp(toPhone: string, body: string) {
  const phone = normalizePhone(toPhone);
  const twilio = await sendTwilioWhatsApp(phone, body);
  if (twilio.ok) return twilio;
  const meta = await sendMetaWhatsApp(phone, body);
  if (meta.ok) return meta;
  return { ok: false as const, reason: twilio.reason || meta.reason || "WhatsApp not configured" };
}

function writeDevDelivery(payload: ResetDelivery & { channels: string[] }) {
  if (isProduction()) return;
  if (process.env.ALLOW_DEV_RESET_FILE !== "true") return;
  const out = path.join(cmsRoot, ".dev-reset-link");
  fs.writeFileSync(
    out,
    [
      `# Dev-only password reset delivery (${new Date().toISOString()})`,
      `email: ${payload.toEmail}`,
      `phone: ${payload.toPhone || "(none)"}`,
      `code: ${payload.code}`,
      `link: ${payload.resetUrl}`,
      `channels: ${payload.channels.join(", ") || "none"}`,
      "",
    ].join("\n"),
    "utf8"
  );
  console.log(`[password-reset] Dev delivery written to ${out} (code/link not logged).`);
}

export async function sendPasswordReset(delivery: ResetDelivery) {
  const subject = "Your Northern Shoveler Adventure password reset code";
  const text = [
    `Hi ${delivery.name},`,
    "",
    `Your verification code is: ${delivery.code}`,
    "",
    `Or open this reset link (expires in 1 hour):`,
    delivery.resetUrl,
    "",
    `If you did not request this, you can ignore this message.`,
    "",
    `— Northern Shoveler Adventure`,
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(delivery.name)},</p>
    <p>Your verification code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${escapeHtml(delivery.code)}</p>
    <p>Or <a href="${escapeHtml(delivery.resetUrl)}">click here to reset your password</a> (expires in 1 hour).</p>
    <p>If you did not request this, ignore this message.</p>
    <p>— Northern Shoveler Adventure</p>
  `;

  const waBody = [
    `Northern Shoveler Adventure`,
    ``,
    `Password reset code: *${delivery.code}*`,
    ``,
    `Or tap to reset: ${delivery.resetUrl}`,
    ``,
    `Expires in 1 hour. If you didn't request this, ignore it.`,
  ].join("\n");

  const channels: string[] = [];
  const results: { channel: string; ok: boolean; reason?: string }[] = [];

  const emailResult = await sendEmail(delivery.toEmail, subject, text, html).catch((err) => {
    console.error("[email] send failed", err instanceof Error ? err.message : err);
    return { ok: false as const, reason: "Email send failed" };
  });
  results.push({ channel: "email", ok: emailResult.ok, reason: emailResult.ok ? undefined : emailResult.reason });
  if (emailResult.ok) channels.push("email");

  if (delivery.toPhone) {
    const waResult = await sendWhatsApp(delivery.toPhone, waBody).catch((err) => {
      console.error("[whatsapp] send failed", err instanceof Error ? err.message : err);
      return { ok: false as const, reason: "WhatsApp send failed" };
    });
    results.push({
      channel: "whatsapp",
      ok: waResult.ok,
      reason: waResult.ok ? undefined : waResult.reason,
    });
    if (waResult.ok) channels.push("whatsapp");
  } else {
    results.push({ channel: "whatsapp", ok: false, reason: "No phone on account" });
  }

  writeDevDelivery({ ...delivery, channels });

  return {
    sent: channels,
    results,
    configured: {
      email: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      whatsapp: Boolean(
        (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) ||
          (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
      ),
    },
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { normalizePhone };
