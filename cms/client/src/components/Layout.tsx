import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

type NavItem = { to: string; label: string; permission?: string; hint?: string };

const EVERYDAY: NavItem[] = [
  { to: "/app", label: "Home", permission: "dashboard:view" },
  { to: "/app/pages", label: "Website pages", permission: "pages:read", hint: "Home, About, Contact…" },
  { to: "/app/posts", label: "Blog posts", permission: "posts:read" },
  { to: "/app/media", label: "Photos & files", permission: "media:manage" },
  { to: "/app/menus", label: "Menu / navigation", permission: "menus:manage" },
  { to: "/app/comments", label: "Comments", permission: "comments:moderate" },
  { to: "/app/forms", label: "Form messages", permission: "forms:manage" },
];

const LOOK: NavItem[] = [
  { to: "/app/settings", label: "Business details", permission: "settings:manage" },
  { to: "/app/theme", label: "Colors & style", permission: "theme:manage" },
  { to: "/app/seo", label: "Google / search", permission: "seo:manage" },
];

const MORE: NavItem[] = [
  { to: "/app/analytics", label: "Visitor stats", permission: "analytics:view" },
  { to: "/app/notifications", label: "Alerts", permission: "notifications:view" },
  { to: "/app/users", label: "Team logins", permission: "users:manage" },
  { to: "/app/backups", label: "Backup website", permission: "backups:manage" },
  { to: "/app/files", label: "All files", permission: "files:manage" },
  { to: "/app/activity", label: "Who changed what", permission: "activity:view" },
  { to: "/app/security", label: "Security", permission: "security:manage" },
  { to: "/app/api-keys", label: "Developer keys", permission: "api:manage" },
  { to: "/app/account", label: "My account" },
];

function NavGroup({
  title,
  items,
  can,
}: {
  title: string;
  items: NavItem[];
  can: (p: string) => boolean;
}) {
  const visible = items.filter((n) => !n.permission || can(n.permission));
  if (!visible.length) return null;
  return (
    <div className="mb-4">
      <div className="px-3 mb-1 text-[0.65rem] uppercase tracking-[0.16em] text-[#9a9588]">
        {title}
      </div>
      <div className="space-y-0.5">
        {visible.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/app"}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-[var(--gold)] text-[#1a1f1a] font-semibold"
                  : "text-[#d9d4c8] hover:bg-white/5"
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    api<{ notifications: { read: boolean }[] }>("/api/admin/notifications")
      .then((d) => setUnread(d.notifications.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Owner",
    ADMIN: "Manager",
    EDITOR: "Editor",
    AUTHOR: "Writer",
    VIEWER: "Viewer",
  };

  return (
    <div className="min-h-screen flex bg-[var(--cream)]">
      <aside className="w-64 shrink-0 bg-[var(--sidebar)] text-[#f3efe6] flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-[0.65rem] tracking-[0.2em] uppercase text-[var(--gold)]">
            Website manager
          </div>
          <div className="font-semibold text-lg leading-tight mt-1">
            Northern Shoveler
          </div>
          <p className="text-xs text-[#9a9588] mt-1">Edit your site easily</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <NavGroup title="Everyday" items={EVERYDAY} can={can} />
          <NavGroup title="Look & details" items={LOOK} can={can} />
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#9a9588] hover:text-white"
          >
            {showMore ? "Hide advanced ▴" : "More tools ▾"}
          </button>
          {showMore && <NavGroup title="Advanced" items={MORE} can={can} />}
        </nav>
        <div className="p-3 border-t border-white/10 text-xs text-[#9a9588]">
          Need help? Change text, photos, or publish — start from Home.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[var(--border)] bg-white/90 backdrop-blur flex items-center gap-3 px-5">
          <form
            className="flex-1 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/app/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a page, blog post, or photo…"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
          </form>
          <button
            type="button"
            onClick={() => navigate("/app/notifications")}
            className="relative text-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-white"
          >
            Alerts
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--gold)] text-[10px] font-bold rounded-full min-w-4 h-4 grid place-items-center px-1">
                {unread}
              </span>
            )}
          </button>
          <div className="hidden sm:block text-sm text-[var(--muted)]">
            Hi, <strong className="text-[var(--ink)]">{user?.name}</strong>
            <span className="text-xs ml-1">({roleLabel[user?.role || ""] || user?.role})</span>
          </div>
          <button
            type="button"
            onClick={() => logout().then(() => navigate("/login"))}
            className="text-sm px-3 py-2 rounded-lg bg-[var(--ink)] text-white font-medium"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-5 md:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
