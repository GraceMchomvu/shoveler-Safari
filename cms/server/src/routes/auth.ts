import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logActivity, notify } from "../lib/activity.js";
import { permissionsFor } from "../lib/permissions.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { sendPasswordReset, normalizePhone } from "../lib/notify-channels.js";
import {
  clearCookieOptions,
  cookieOptions,
  isStrongPassword,
  PASSWORD_MIN,
  passwordSchemaMessage,
} from "../lib/security.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Try again later." },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset attempts. Try again later." },
});

const passwordField = z
  .string()
  .min(PASSWORD_MIN)
  .refine(isStrongPassword, { message: passwordSchemaMessage() });

router.post("/login", loginLimiter, async (req, res) => {
  const schema = z.object({
    // Accept username OR email (legacy clients may still send "email")
    login: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1),
    totp: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  const loginId = (parsed.data?.login || parsed.data?.username || parsed.data?.email || "").trim();
  if (!parsed.success || !loginId) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  const key = loginId.toLowerCase();
  const password = String(parsed.data.password || "").trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: key }, { username: key }],
    },
  });
  if (!user || !user.active) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  if (user.twoFactorEnabled) {
    if (!parsed.data.totp || !user.twoFactorSecret) {
      return res.status(401).json({ error: "2FA_REQUIRED" });
    }
    const valid = authenticator.verify({ token: parsed.data.totp, secret: user.twoFactorSecret });
    if (!valid) return res.status(401).json({ error: "Invalid 2FA code" });
  }

  const session = await prisma.session.create({
    data: {
      token: "pending",
      userId: user.id,
      userAgent: req.headers["user-agent"]?.slice(0, 255),
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const token = signToken({ sub: user.id, sid: session.id });
  await prisma.session.update({ where: { id: session.id }, data: { token } });

  res.cookie("cms_token", token, cookieOptions());

  await logActivity({
    userId: user.id,
    action: "login",
    entity: "user",
    entityId: user.id,
    ip: req.ip,
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      twoFactorEnabled: user.twoFactorEnabled,
      permissions: permissionsFor(user.role),
    },
  });
});

router.post("/logout", requireAuth, async (req, res) => {
  if (req.sessionId) {
    await prisma.session.delete({ where: { id: req.sessionId } }).catch(() => undefined);
  }
  res.clearCookie("cms_token", clearCookieOptions());
  await logActivity({ userId: req.user!.id, action: "logout", entity: "user", entityId: req.user!.id });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      ...req.user,
      permissions: permissionsFor(req.user!.role),
    },
  });
});

router.post("/forgot-password", forgotLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  const generic = {
    ok: true,
    message:
      "If that account exists, we sent a verification code and reset link by email and WhatsApp (when a phone number is on file).",
  };
  if (!parsed.success) return res.json(generic);

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return ok to avoid enumeration
  if (user && user.active) {
    const token = crypto.randomBytes(32).toString("hex");
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 10);

    // Invalidate previous unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.passwordResetToken.create({
      data: {
        token,
        codeHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();
    const resetUrl = `${clientOrigin.replace(/\/$/, "")}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const delivery = await sendPasswordReset({
      toEmail: user.email,
      toPhone: user.phone,
      name: user.name,
      code,
      resetUrl,
    });

    await notify({
      userId: user.id,
      type: "security",
      title: "Password reset requested",
      body:
        delivery.sent.length > 0
          ? `Reset instructions sent via ${delivery.sent.join(" + ")}.`
          : "Reset requested, but email/WhatsApp are not configured yet. Ask a Super Admin to set SMTP / WhatsApp env vars.",
    });

    if (!delivery.sent.length) {
      console.log(
        `[password-reset] user ${user.id}: no channels delivered (configure SMTP and/or WhatsApp). Dev tip: ALLOW_DEV_RESET_FILE=true`
      );
    }
  }

  res.json(generic);
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  const schema = z
    .object({
      token: z.string().min(20).optional(),
      email: z.string().email().optional(),
      code: z.string().regex(/^\d{6}$/).optional(),
      password: passwordField,
    })
    .refine((d) => Boolean(d.token) || (d.email && d.code), {
      message: "Provide the reset link token, or your email plus the 6-digit code",
    });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
  }
  const data = parsed.data;

  let record =
    data.token
      ? await prisma.passwordResetToken.findUnique({ where: { token: data.token } })
      : null;

  if (!record && data.email && data.code) {
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired code" });
    const candidates = await prisma.passwordResetToken.findMany({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    for (const c of candidates) {
      if (c.attempts >= 8) continue;
      await prisma.passwordResetToken.update({
        where: { id: c.id },
        data: { attempts: { increment: 1 } },
      });
      if (c.codeHash && (await bcrypt.compare(data.code, c.codeHash))) {
        record = c;
        break;
      }
    }
    if (!record) return res.status(400).json({ error: "Invalid or expired code" });
  }

  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const hash = await bcrypt.hash(data.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  res.json({ ok: true });
});

const usernameField = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username: letters, numbers, . _ - only")
  .transform((v) => v.toLowerCase());

router.patch("/profile", requireAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(120).optional(),
    username: usernameField.nullable().optional(),
    phone: z
      .string()
      .max(32)
      .nullable()
      .optional()
      .transform((v) => {
        if (v === null || v === undefined || v.trim() === "") return null;
        return normalizePhone(v.trim());
      }),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid profile" });
  }
  if (parsed.data.username) {
    const taken = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: req.user!.id } },
    });
    if (taken) return res.status(400).json({ error: "That username is already taken" });
  }
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
    },
  });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      twoFactorEnabled: user.twoFactorEnabled,
      permissions: permissionsFor(user.role),
    },
  });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: passwordField,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || passwordSchemaMessage() });
  }
  const data = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
  if (data.currentPassword === data.newPassword) {
    return res.status(400).json({ error: "New password must be different from the current password" });
  }
  const hash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  await logActivity({ userId: user.id, action: "change_password", entity: "user", entityId: user.id });
  res.json({ ok: true });
});

router.get("/sessions", requireAuth, async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ip: true,
      createdAt: true,
      expiresAt: true,
    },
  });
  res.json({
    sessions: sessions.map((s) => ({
      ...s,
      current: s.id === req.sessionId,
    })),
  });
});

router.delete("/sessions/:id", requireAuth, async (req, res) => {
  await prisma.session.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ ok: true });
});

router.post("/2fa/setup", requireAuth, async (req, res) => {
  const secret = authenticator.generateSecret();
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });
  const otpauth = authenticator.keyuri(req.user!.email, "ShovelerCMS", secret);
  const qr = await QRCode.toDataURL(otpauth);
  res.json({ secret, qr });
});

router.post("/2fa/enable", requireAuth, async (req, res) => {
  const totp = z.string().parse(req.body.totp);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!user.twoFactorSecret) return res.status(400).json({ error: "Run setup first" });
  const valid = authenticator.verify({ token: totp, secret: user.twoFactorSecret });
  if (!valid) return res.status(400).json({ error: "Invalid code" });
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  res.json({ ok: true });
});

router.post("/2fa/disable", requireAuth, async (req, res) => {
  const schema = z.object({ password: z.string(), totp: z.string() });
  const data = schema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid password" });
  if (user.twoFactorSecret) {
    const valid = authenticator.verify({ token: data.totp, secret: user.twoFactorSecret });
    if (!valid) return res.status(400).json({ error: "Invalid code" });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  res.json({ ok: true });
});

export default router;
