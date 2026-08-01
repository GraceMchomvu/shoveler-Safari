import { prisma } from "./prisma.js";

export async function logActivity(opts: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: unknown;
  ip?: string;
}) {
  await prisma.activityLog.create({
    data: {
      userId: opts.userId ?? null,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
      ip: opts.ip,
    },
  });
}

export async function notify(opts: {
  userId?: string | null;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: opts.userId ?? null,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });
}
