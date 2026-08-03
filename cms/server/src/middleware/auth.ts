import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { can, type Permission } from "../lib/permissions.js";
import { resolveJwtSecret } from "../lib/security.js";

const JWT_SECRET = resolveJwtSecret();

export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  name: string;
  phone: string | null;
  role: Role;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

export function signToken(payload: object, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken<T = { sub: string; sid: string }>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}

const ALLOWED_WHILE_MUST_CHANGE = new Set([
  "GET /api/auth/me",
  "POST /api/auth/logout",
  "POST /api/auth/change-password",
  "PATCH /api/auth/profile",
  "GET /api/auth/sessions",
  "DELETE /api/auth/sessions/:id",
]);

function routeKey(req: Request) {
  // Express mounts strip prefixes; match on originalUrl path without query
  const path = (req.originalUrl || req.url || "").split("?")[0];
  return `${req.method} ${path}`;
}

function isAllowedWhileMustChange(req: Request) {
  const key = routeKey(req);
  if (ALLOWED_WHILE_MUST_CHANGE.has(key)) return true;
  // Parameterized session delete
  if (req.method === "DELETE" && /^\/api\/auth\/sessions\/[^/]+$/.test(key.replace("DELETE ", ""))) {
    return true;
  }
  return false;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.cms_token || bearer(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyToken<{ sub: string; sid: string }>(token);
    const session = await prisma.session.findUnique({
      where: { id: decoded.sid },
      include: { user: true },
    });
    if (!session || session.token !== token || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }
    if (!session.user.active) return res.status(403).json({ error: "Account disabled" });

    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username ?? null,
      name: session.user.name,
      phone: session.user.phone ?? null,
      role: session.user.role,
      mustChangePassword: session.user.mustChangePassword,
      twoFactorEnabled: session.user.twoFactorEnabled,
    };
    req.sessionId = session.id;

    if (req.user.mustChangePassword && !isAllowedWhileMustChange(req)) {
      return res.status(403).json({
        error: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your password before continuing.",
      });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function bearer(req: Request) {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return null;
}

export function requirePermission(...perms: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const ok = perms.some((p) => can(req.user!.role, p));
    if (!ok) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
