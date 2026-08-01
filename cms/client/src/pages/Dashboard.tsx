import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Btn, Card, PageHeader, Tip } from "../components/ui";

type Dash = {
  stats: {
    pages: number;
    posts: number;
    media: number;
    users: number;
    pendingComments: number;
    formSubmissions: number;
    visitors: number;
  };
  recent: Array<{
    id: string;
    action: string;
    entity?: string;
    createdAt: string;
    user?: { name: string };
  }>;
};

const ACTIONS = [
  {
    to: "/app/pages",
    title: "Edit a website page",
    body: "Change Home, About, Contact, Safaris, and more.",
    cta: "Open pages",
  },
  {
    to: "/app/posts/new",
    title: "Write a blog post",
    body: "Share safari tips or news with guests.",
    cta: "Write post",
  },
  {
    to: "/app/media",
    title: "Add photos",
    body: "Upload safari images to use on your site.",
    cta: "Upload photos",
  },
  {
    to: "/app/menus",
    title: "Change the menu",
    body: "Update the links visitors see at the top.",
    cta: "Edit menu",
  },
  {
    to: "/app/settings",
    title: "Update phone or email",
    body: "Keep your contact details up to date.",
    cta: "Business details",
  },
  {
    to: "/app/comments",
    title: "Approve comments",
    body: "Review messages left on blog posts.",
    cta: "Review comments",
  },
];

function friendlyAction(action: string, entity?: string) {
  const map: Record<string, string> = {
    login: "signed in",
    logout: "signed out",
    create: "created",
    update: "updated",
    publish: "published",
    delete: "deleted",
    upload: "uploaded",
    backup: "made a backup",
    change_password: "changed password",
  };
  const e: Record<string, string> = {
    page: "a page",
    post: "a blog post",
    media: "a photo/file",
    user: "a team login",
    menu: "the menu",
    settings: "business details",
    backup: "the website",
  };
  return `${map[action] || action}${entity ? ` ${e[entity] || entity}` : ""}`;
}

export default function Dashboard() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>("/api/admin/dashboard").then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <p className="text-[var(--muted)]">Loading your website overview…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Welcome"
        subtitle="This is your website control panel. Pick what you want to do — no coding needed."
      />

      <Tip>
        <strong>Tip:</strong> Most days you only need <em>Website pages</em>, <em>Blog posts</em>, and{" "}
        <em>Photos & files</em>. Click <strong>Publish</strong> when you want changes to go live.
      </Tip>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
        {ACTIONS.map((a) => (
          <Card key={a.to} className="flex flex-col">
            <h3 className="font-semibold text-base">{a.title}</h3>
            <p className="text-sm text-[var(--muted)] mt-1 flex-1">{a.body}</p>
            <Link to={a.to} className="mt-4">
              <Btn className="w-full">{a.cta}</Btn>
            </Link>
          </Card>
        ))}
      </div>

      <h2 className="font-semibold text-lg mb-3">At a glance</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {[
          ["Website pages", data.stats.pages, "/app/pages"],
          ["Blog posts", data.stats.posts, "/app/posts"],
          ["Photos & files", data.stats.media, "/app/media"],
          ["Recent visitors", data.stats.visitors, "/app/analytics"],
          ["Comments to review", data.stats.pendingComments, "/app/comments"],
          ["Form messages", data.stats.formSubmissions, "/app/forms"],
        ].map(([label, value, to]) => (
          <Link key={label as string} to={to as string}>
            <Card className="hover:border-[var(--gold)] transition">
              <div className="text-sm text-[var(--muted)]">{label}</div>
              <div className="text-3xl font-semibold mt-1">{value}</div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold mb-3">Recent activity</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing yet — changes will show up here.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.recent.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0"
              >
                <span>
                  <strong>{r.user?.name || "System"}</strong> {friendlyAction(r.action, r.entity)}
                </span>
                <span className="text-[var(--muted)] whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
