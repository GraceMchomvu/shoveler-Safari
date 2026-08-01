import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { can, type Permission } from "../lib/permissions.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
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
      name: session.user.name,
      role: session.user.role,
      mustChangePassword: session.user.mustChangePassword,
      twoFactorEnabled: session.user.twoFactorEnabled,
    };
    req.sessionId = session.id;
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
