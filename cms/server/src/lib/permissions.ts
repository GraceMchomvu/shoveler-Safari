import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "users:manage"
  | "pages:read"
  | "pages:write"
  | "pages:publish"
  | "posts:read"
  | "posts:write"
  | "posts:publish"
  | "media:manage"
  | "menus:manage"
  | "settings:manage"
  | "theme:manage"
  | "seo:manage"
  | "forms:manage"
  | "analytics:view"
  | "files:manage"
  | "backups:manage"
  | "notifications:view"
  | "comments:moderate"
  | "search:use"
  | "activity:view"
  | "security:manage"
  | "api:manage";

const ALL: Permission[] = [
  "dashboard:view",
  "users:manage",
  "pages:read",
  "pages:write",
  "pages:publish",
  "posts:read",
  "posts:write",
  "posts:publish",
  "media:manage",
  "menus:manage",
  "settings:manage",
  "theme:manage",
  "seo:manage",
  "forms:manage",
  "analytics:view",
  "files:manage",
  "backups:manage",
  "notifications:view",
  "comments:moderate",
  "search:use",
  "activity:view",
  "security:manage",
  "api:manage",
];

const ROLE_PERMS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,
  EDITOR: [
    "dashboard:view",
    "pages:read",
    "pages:write",
    "pages:publish",
    "posts:read",
    "posts:write",
    "posts:publish",
    "media:manage",
    "menus:manage",
    "seo:manage",
    "forms:manage",
    "comments:moderate",
    "notifications:view",
    "search:use",
    "activity:view",
    "analytics:view",
  ],
  AUTHOR: [
    "dashboard:view",
    "posts:read",
    "posts:write",
    "media:manage",
    "comments:moderate",
    "notifications:view",
    "search:use",
  ],
  VIEWER: [
    "dashboard:view",
    "pages:read",
    "posts:read",
    "analytics:view",
    "notifications:view",
    "search:use",
    "activity:view",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLE_PERMS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  if (role === "SUPER_ADMIN") return ALL;
  return ROLE_PERMS[role] ?? [];
}
