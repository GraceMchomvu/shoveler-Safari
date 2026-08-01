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

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    totp: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
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

  res.cookie("cms_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
      name: user.name,
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
  res.clearCookie("cms_token");
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

router.post("/forgot-password", loginLimiter, async (req, res) => {
  const email = z.string().email().parse(req.body.email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return ok to avoid enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    console.log(`[password-reset] ${email} token: ${token}`);
    await notify({
      userId: user.id,
      type: "security",
      title: "Password reset requested",
      body: "A password reset link was generated (check server logs in development).",
    });
  }
  res.json({ ok: true, message: "If that email exists, a reset link was sent." });
});

router.post("/reset-password", async (req, res) => {
  const schema = z.object({
    token: z.string(),
    password: z.string().min(8),
  });
  const data = schema.parse(req.body);
  const record = await prisma.passwordResetToken.findUnique({ where: { token: data.token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
  const hash = await bcrypt.hash(data.password, 10);
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

router.post("/change-password", requireAuth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  });
  const data = schema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
  const hash = await bcrypt.hash(data.newPassword, 10);
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
