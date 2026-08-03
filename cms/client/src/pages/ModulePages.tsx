import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/Toast";
import PhotoPicker from "../components/PhotoPicker";
import { uploadManyFromComputer } from "../lib/upload";
import {
  Btn,
  Card,
  Empty,
  Field,
  PageHeader,
  StatusBadge,
  Table,
  Tip,
  inputClass,
} from "../components/ui";

export function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [alt, setAlt] = useState("");
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = () =>
    api<{ media: any[] }>(`/api/admin/media?q=${encodeURIComponent(q)}`).then((d) =>
      setMedia(d.media)
    );
  useEffect(() => {
    load();
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    try {
      await uploadManyFromComputer(files, alt || undefined);
      setAlt("");
      toast(files.length > 1 ? "Photos uploaded from your computer" : "Photo uploaded from your computer");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <PageHeader
        title="Photos & files"
        subtitle="Upload safari photos from your computer. Then copy the link into a page or blog post."
      />
      <Tip>
        <strong>Easiest way:</strong> Click <em>Choose from computer</em>, pick your photos (JPG, PNG, WebP), then use <em>Copy link</em> when you need them on a page.
      </Tip>
      <Card
        className={`mb-4 border-dashed ${drag ? "border-[var(--gold)] bg-[#fff8e8]" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) await uploadFiles(e.dataTransfer.files);
        }}
      >
        <div
          className="text-center py-8 px-4 rounded-lg cursor-pointer hover:bg-[var(--cream)]/50 transition-colors"
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
        >
          <p className="font-semibold text-lg">Upload photos from your computer</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Click anywhere here, or drag and drop photos into this box
          </p>
          <div
            className="mt-5 flex flex-wrap justify-center gap-3 items-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Field label="Short description (optional)">
              <input
                className={inputClass + " min-w-[220px]"}
                placeholder="e.g. Lions in Serengeti"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </Field>
            <label className="inline-flex">
              <span className="sr-only">Choose photos from computer</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.mp4,.doc,.docx"
                multiple
                className="block w-full max-w-xs text-sm text-[var(--muted)]
                  file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--gold)] file:text-[#1a1f1a]
                  hover:file:brightness-95 cursor-pointer"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files?.length) uploadFiles(e.target.files);
                }}
              />
            </label>
            <Btn disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Choose from computer"}
            </Btn>
          </div>
          {uploading && (
            <p className="text-sm text-[var(--gold)] mt-3 font-medium">Uploading from your computer…</p>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            className={inputClass}
            placeholder="Search your photos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Btn variant="ghost" onClick={load}>
            Search
          </Btn>
        </div>
      </Card>
      {media.length === 0 ? (
        <Empty title="No photos yet" body="Upload your first safari photo to get started." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {media.map((m) => (
            <Card key={m.id}>
              {m.mimeType?.startsWith("image/") ? (
                <img
                  src={m.url}
                  alt={m.altText || m.originalName}
                  className="h-36 w-full object-cover rounded-lg"
                />
              ) : (
                <div className="h-36 grid place-items-center bg-[var(--cream)] rounded-lg text-xs px-2 text-center">
                  {m.originalName}
                </div>
              )}
              <div className="text-sm mt-2 font-medium truncate">{m.originalName}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Btn
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(m.url);
                    toast("Link copied — paste it into a page or post");
                  }}
                >
                  Copy link
                </Btn>
                <Btn
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Delete this file?")) return;
                    await api(`/api/admin/media/${m.id}`, { method: "DELETE" });
                    toast("Deleted");
                    load();
                  }}
                >
                  Delete
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenusPage() {
  const [location, setLocation] = useState("header");
  const [items, setItems] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api<{ pages: any[] }>("/api/admin/pages").then((d) => setPages(d.pages)).catch(() => undefined);
  }, []);

  useEffect(() => {
    api<{ menus: any[] }>("/api/admin/menus").then((d) => {
      const menu = d.menus.find((m) => m.location === location);
      setItems(
        (menu?.items || []).map((it: any, i: number) => ({
          key: it.id || String(i),
          label: it.label,
          url: it.url || "",
          parentKey: null,
          sortOrder: it.sortOrder,
        }))
      );
    });
  }, [location]);

  const locLabel: Record<string, string> = {
    header: "Top menu",
    footer: "Footer menu",
    mobile: "Phone menu",
  };

  return (
    <div>
      <PageHeader
        title="Menu / navigation"
        subtitle="These are the links visitors click at the top of your website."
      />
      <Tip>
        Change the <strong>name</strong> visitors see, pick a page, then click <strong>Save menu</strong>.
      </Tip>
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {(["header", "footer", "mobile"] as const).map((loc) => (
            <Btn
              key={loc}
              variant={location === loc ? "primary" : "ghost"}
              onClick={() => setLocation(loc)}
            >
              {locLabel[loc]}
            </Btn>
          ))}
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end p-3 rounded-lg bg-[var(--cream)]/50"
            >
              <Field label="Link name">
                <input
                  className={inputClass}
                  value={item.label}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, label: e.target.value };
                    setItems(next);
                  }}
                />
              </Field>
              <Field label="Goes to">
                <select
                  className={inputClass}
                  value={item.url}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...item, url: e.target.value };
                    setItems(next);
                  }}
                >
                  <option value="/">Home</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.slug === "home" ? "/" : `/${p.slug}.html`}>
                      {p.title}
                    </option>
                  ))}
                  <option value="__custom">Custom link…</option>
                </select>
              </Field>
              {item.url === "__custom" ||
              (!pages.some((p) => (p.slug === "home" ? "/" : `/${p.slug}.html`) === item.url) &&
                item.url !== "/") ? (
                <Field label="Custom address">
                  <input
                    className={inputClass}
                    value={item.url === "__custom" ? "" : item.url}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, url: e.target.value };
                      setItems(next);
                    }}
                  />
                </Field>
              ) : (
                <div />
              )}
              <div className="flex gap-2 pb-1">
                <Btn
                  variant="ghost"
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...items];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    setItems(next);
                  }}
                >
                  ↑
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    if (idx >= items.length - 1) return;
                    const next = [...items];
                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                    setItems(next);
                  }}
                >
                  ↓
                </Btn>
                <Btn variant="danger" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  Remove
                </Btn>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Btn
            variant="ghost"
            onClick={() =>
              setItems([
                ...items,
                {
                  key: crypto.randomUUID(),
                  label: "New link",
                  url: "/",
                  parentKey: null,
                  sortOrder: items.length,
                },
              ])
            }
          >
            Add menu link
          </Btn>
          <Btn
            variant="success"
            onClick={async () => {
              await api(`/api/admin/menus/${location}`, {
                method: "PUT",
                body: JSON.stringify({
                  items: items.map((it, i) => ({ ...it, sortOrder: i })),
                }),
              });
              toast("Menu saved");
            }}
          >
            Save menu
          </Btn>
        </div>
      </Card>
    </div>
  );
}

export function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  useEffect(() => {
    api<{ forms: any[] }>("/api/admin/forms").then((d) => setForms(d.forms));
  }, []);
  return (
    <div>
      <PageHeader
        title="Forms"
        subtitle="Contact, booking, newsletter forms"
        actions={
          <Btn
            onClick={async () => {
              const name = prompt("Form name");
              if (!name) return;
              await api("/api/admin/forms", {
                method: "POST",
                body: JSON.stringify({
                  name,
                  fields: [
                    { id: "name", type: "text", label: "Name", required: true },
                    { id: "email", type: "email", label: "Email", required: true },
                  ],
                }),
              });
              const d = await api<{ forms: any[] }>("/api/admin/forms");
              setForms(d.forms);
            }}
          >
            New form
          </Btn>
        }
      />
      <Table
        headers={["Name", "Slug", "Submissions", "Actions"]}
        rows={forms.map((f) => [
          f.name,
          f.slug,
          f._count?.submissions ?? 0,
          <Link key={f.id} to={`/app/forms/${f.id}`} className="underline">
            Open
          </Link>,
        ])}
      />
    </div>
  );
}

export function FormDetailPage() {
  const { id } = useParams();
  const [subs, setSubs] = useState<any[]>([]);
  useEffect(() => {
    if (!id) return;
    api<{ submissions: any[] }>(`/api/admin/forms/${id}/submissions`).then((d) =>
      setSubs(d.submissions)
    );
  }, [id]);
  return (
    <div>
      <PageHeader title="Form submissions" />
      <Table
        headers={["When", "Spam", "Data"]}
        rows={subs.map((s) => [
          new Date(s.createdAt).toLocaleString(),
          s.spam ? "yes" : "no",
          <pre key={s.id} className="text-xs whitespace-pre-wrap">
            {JSON.stringify(s.data, null, 2)}
          </pre>,
        ])}
      />
    </div>
  );
}

export function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const { toast } = useToast();
  const load = () => api<{ comments: any[] }>("/api/admin/comments").then((d) => setComments(d.comments));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <PageHeader
        title="Comments"
        subtitle="When someone writes on a blog post, approve it here before it shows publicly."
      />
      <Tip>
        Click <strong>Approve</strong> to show a comment on the website, or <strong>Remove</strong> if it is spam.
      </Tip>
      <Table
        headers={["From", "On post", "Status", "Message", ""]}
        empty={<Empty title="No comments waiting" body="New blog comments will appear here." />}
        rows={comments.map((c) => [
          c.authorName,
          c.post?.title,
          <StatusBadge key={`${c.id}-s`} status={c.status} />,
          c.body,
          <div key={c.id} className="flex flex-wrap gap-2 justify-end">
            <Btn
              variant="success"
              onClick={async () => {
                await api(`/api/admin/comments/${c.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: "APPROVED" }),
                });
                toast("Comment approved");
                load();
              }}
            >
              Approve
            </Btn>
            <Btn
              variant="ghost"
              onClick={async () => {
                const body = prompt("Write a short reply");
                if (!body) return;
                await api(`/api/admin/comments/${c.id}/reply`, {
                  method: "POST",
                  body: JSON.stringify({ body }),
                });
                toast("Reply posted");
                load();
              }}
            >
              Reply
            </Btn>
            <Btn
              variant="danger"
              onClick={async () => {
                if (!confirm("Remove this comment?")) return;
                await api(`/api/admin/comments/${c.id}`, { method: "DELETE" });
                toast("Comment removed");
                load();
              }}
            >
              Remove
            </Btn>
          </div>,
        ])}
      />
    </div>
  );
}

export function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const load = () => api<{ users: any[] }>("/api/admin/users").then((d) => setUsers(d.users));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Roles: Super Admin, Admin, Editor, Author, Viewer"
        actions={
          <Btn
            onClick={async () => {
              const username = prompt("Username (for login, e.g. editor1)");
              const email = prompt("Email (for password resets)");
              const name = prompt("Name");
              const password =
                prompt("Temporary password (min 10, include upper, lower, number)") || "";
              if (!password || password.length < 10) {
                toast("Password must be at least 10 characters", "err");
                return;
              }
              const role = prompt("Role (ADMIN|EDITOR|AUTHOR|VIEWER)", "EDITOR") || "EDITOR";
              if (!email || !name || !username) return;
              await api("/api/admin/users", {
                method: "POST",
                body: JSON.stringify({ email, username, name, password, role }),
              });
              load();
            }}
          >
            Add user
          </Btn>
        }
      />
      <Table
        headers={["Name", "Username", "Email", "Role", "Active", "2FA", "Actions"]}
        rows={users.map((u) => [
          u.name,
          u.username || "—",
          u.email,
          u.role,
          u.active ? "yes" : "no",
          u.twoFactorEnabled ? "on" : "off",
          <div key={u.id} className="flex gap-2">
            <button
              className="underline"
              onClick={async () => {
                await api(`/api/admin/users/${u.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ active: !u.active }),
                });
                load();
              }}
            >
              Toggle
            </button>
          </div>,
        ])}
      />
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const { toast } = useToast();
  useEffect(() => {
    api<{ settings: any }>("/api/admin/settings").then((d) => setSettings(d.settings));
  }, []);
  return (
    <div>
      <PageHeader
        title="Business details"
        subtitle="Your company name, phone, email, and address shown on the website."
      />
      <Tip>Update these whenever your phone number or email changes.</Tip>
      <Card>
        <form
          className="grid md:grid-cols-2 gap-3 max-w-3xl"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
            toast("Business details saved");
          }}
        >
          {[
            ["siteTitle", "Business / website name", "Shown in the browser tab"],
            ["contactEmail", "Email for customers", ""],
            ["phone", "WhatsApp / phone number", ""],
            ["address", "Office address", "e.g. Arusha, Tanzania"],
            ["timezone", "Timezone", "Africa/Dar_es_Salaam"],
            ["language", "Language", "en"],
            ["siteUrl", "Website address", "https://www.shovelersafari.com"],
          ].map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint}>
              <input
                className={inputClass}
                value={settings[key] || ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Logo" hint="Upload from your computer, or paste a photo link">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <PhotoPicker
                label="Upload logo from computer"
                onUploaded={([url]) => {
                  setSettings((s: any) => ({ ...s, logo: url }));
                  toast("Logo uploaded");
                }}
                onError={(msg) => toast(msg, "err")}
              />
            </div>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo preview"
                className="mb-2 h-16 object-contain rounded border border-[var(--border)] bg-white p-2"
              />
            ) : null}
            <input
              className={inputClass}
              value={settings.logo || ""}
              onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
              placeholder="/uploads/logo.png"
            />
          </Field>
          <div className="md:col-span-2">
            <Btn type="submit" variant="success">
              Save business details
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ThemePage() {
  const [theme, setTheme] = useState<any>({});
  useEffect(() => {
    api<{ theme: any }>("/api/admin/theme").then((d) => setTheme(d.theme));
  }, []);
  return (
    <div>
      <PageHeader
        title="Colors & style"
        subtitle="Change your brand colors and fonts. Preview updates on the right."
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api("/api/admin/theme", { method: "PUT", body: JSON.stringify(theme) });
              alert("Theme saved");
            }}
            className="space-y-3"
          >
            {[
              ["primaryColor", "Primary color"],
              ["secondaryColor", "Secondary color"],
              ["backgroundColor", "Background"],
              ["fontHeading", "Heading font"],
              ["fontBody", "Body font"],
              ["buttonStyle", "Button style"],
              ["headerStyle", "Header"],
              ["footerStyle", "Footer"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={inputClass}
                  value={theme[key] || ""}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                />
              </Field>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!theme.darkMode}
                onChange={(e) => setTheme({ ...theme, darkMode: e.target.checked })}
              />
              Dark mode
            </label>
            <Btn type="submit">Save theme</Btn>
          </form>
        </Card>
        <Card>
          <div
            className="rounded-lg p-6 min-h-64"
            style={{
              background: theme.backgroundColor || "#f7f4ef",
              color: theme.secondaryColor || "#1a1f1a",
              fontFamily: theme.fontBody,
            }}
          >
            <h2 style={{ fontFamily: theme.fontHeading, color: theme.primaryColor }}>
              Preview headline
            </h2>
            <p className="mt-2 text-sm">Safari journeys across Tanzania.</p>
            <button
              className="mt-4 px-3 py-1.5 rounded text-sm"
              style={{ background: theme.primaryColor, color: "#1a1f1a" }}
            >
              Request a Quote
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SeoPage() {
  const [robotsTxt, setRobotsTxt] = useState("");
  const [bridgeMsg, setBridgeMsg] = useState("");
  useEffect(() => {
    api<{ robotsTxt: string }>("/api/admin/seo/site").then((d) => setRobotsTxt(d.robotsTxt));
  }, []);
  return (
    <div>
      <PageHeader
        title="Search & publishing"
        subtitle="Control what Google sees, then push updates to your live website folder."
      />
      <Card>
        <Field label="robots.txt">
          <textarea
            className={inputClass + " min-h-40 font-mono text-xs"}
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={async () => {
              await api("/api/admin/seo/site", {
                method: "PUT",
                body: JSON.stringify({ robotsTxt }),
              });
              setBridgeMsg("Saved robots.txt.");
            }}
          >
            Save robots.txt
          </Btn>
          <Btn
            variant="ghost"
            onClick={async () => {
              await api("/api/admin/seo/regenerate-sitemap", { method: "POST" });
              setBridgeMsg("Sitemap updated and copied to the website folder.");
            }}
          >
            Update sitemap
          </Btn>
          <Btn
            variant="ghost"
            onClick={async () => {
              const res = await api<{ message: string }>("/api/admin/publish/bridge", {
                method: "POST",
              });
              setBridgeMsg(res.message);
            }}
          >
            Publish to website
          </Btn>
        </div>
        {bridgeMsg && <p className="text-sm text-green-800 mt-3">{bridgeMsg}</p>}
      </Card>
    </div>
  );
}

export function AnalyticsPage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  useEffect(() => {
    api<{ snapshots: any[] }>("/api/admin/analytics").then((d) => setSnapshots(d.snapshots));
  }, []);
  const latest = snapshots[snapshots.length - 1];
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Mock metrics (connect GA/Plausible later in Settings)"
      />
      {latest && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card>
            <div className="text-sm text-[var(--muted)]">Visitors</div>
            <div className="text-2xl font-semibold">{latest.visitors}</div>
          </Card>
          <Card>
            <div className="text-sm text-[var(--muted)]">Page views</div>
            <div className="text-2xl font-semibold">{latest.pageViews}</div>
          </Card>
          <Card>
            <div className="text-sm text-[var(--muted)]">Bounce rate</div>
            <div className="text-2xl font-semibold">{latest.bounceRate.toFixed?.(1) ?? latest.bounceRate}%</div>
          </Card>
          <Card>
            <div className="text-sm text-[var(--muted)]">Avg session</div>
            <div className="text-2xl font-semibold">{latest.avgSessionSec}s</div>
          </Card>
        </div>
      )}
      <Card>
        <h3 className="font-semibold mb-2">Last 14 days</h3>
        <Table
          headers={["Date", "Visitors", "Views", "Bounce"]}
          rows={snapshots.map((s) => [
            new Date(s.date).toLocaleDateString(),
            s.visitors,
            s.pageViews,
            `${Number(s.bounceRate).toFixed(1)}%`,
          ])}
        />
        {latest && (
          <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Devices</h4>
              <pre className="text-xs bg-[var(--cream)] p-2 rounded">
                {JSON.stringify(latest.devices, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-1">Countries</h4>
              <pre className="text-xs bg-[var(--cream)] p-2 rounded">
                {JSON.stringify(latest.countries, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-1">Top pages / Referrals</h4>
              <pre className="text-xs bg-[var(--cream)] p-2 rounded">
                {JSON.stringify({ top: latest.topPages, ref: latest.referrals }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => {
    api<{ files: any[] }>("/api/admin/files").then((d) => setFiles(d.files));
  }, []);
  return (
    <div>
      <PageHeader title="File Manager" subtitle="PDFs, images, videos, documents" />
      <Table
        headers={["Name", "Type", "Size", "URL"]}
        rows={files.map((f) => [
          f.originalName,
          f.mimeType,
          `${Math.round(f.size / 1024)} KB`,
          <a key={f.id} href={f.url} className="underline" target="_blank" rel="noreferrer">
            Open
          </a>,
        ])}
      />
    </div>
  );
}

export function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const { toast } = useToast();
  const load = () => api<{ backups: any[] }>("/api/admin/backups").then((d) => setBackups(d.backups));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <PageHeader
        title="Backup website"
        subtitle="Save a copy of your content. Download it to keep safe on your computer."
        actions={
          <Btn
            variant="success"
            onClick={async () => {
              await api("/api/admin/backups", { method: "POST" });
              toast("Backup ready — click Download");
              load();
            }}
          >
            Make a backup now
          </Btn>
        }
      />
      <Table
        headers={["File", "Size", "When", "Download"]}
        rows={backups.map((b) => [
          b.filename,
          `${Math.round(b.size / 1024)} KB`,
          new Date(b.createdAt).toLocaleString(),
          <a
            key={b.id}
            className="underline"
            href={`/api/admin/backups/${b.id}/download`}
          >
            Download
          </a>,
        ])}
      />
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api<{ notifications: any[] }>("/api/admin/notifications").then((d) => setItems(d.notifications));
  }, []);
  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <Btn
            variant="ghost"
            onClick={async () => {
              await api("/api/admin/notifications/read-all", { method: "POST" });
              const d = await api<{ notifications: any[] }>("/api/admin/notifications");
              setItems(d.notifications);
            }}
          >
            Mark all read
          </Btn>
        }
      />
      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-70" : ""}>
            <div className="font-medium">{n.title}</div>
            <div className="text-sm text-[var(--muted)]">{n.body}</div>
            <div className="text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  async function run(query = q) {
    const d = await api<{ results: any[] }>(`/api/admin/search?q=${encodeURIComponent(query)}`);
    setResults(d.results);
  }
  useEffect(() => {
    if (params.get("q")) run(params.get("q") || "");
  }, []);
  return (
    <div>
      <PageHeader title="Search" subtitle="Pages, posts, media, users, forms" />
      <Card className="mb-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn type="submit">Search</Btn>
        </form>
      </Card>
      <Table
        headers={["Type", "Title", "Open"]}
        rows={results.map((r) => [
          r.type,
          r.title,
          <Link key={r.id} to={r.link} className="underline">
            Open
          </Link>,
        ])}
      />
    </div>
  );
}

export function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    api<{ logs: any[] }>("/api/admin/activity").then((d) => setLogs(d.logs));
  }, []);
  return (
    <div>
      <PageHeader title="Activity Logs" />
      <Table
        headers={["When", "User", "Action", "Entity"]}
        rows={logs.map((l) => [
          new Date(l.createdAt).toLocaleString(),
          l.user?.name || "—",
          l.action,
          `${l.entity || ""} ${l.entityId || ""}`,
        ])}
      />
    </div>
  );
}

export function SecurityPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api("/api/admin/security").then(setData);
  }, []);
  if (!data) return <p>Loading…</p>;
  return (
    <div>
      <PageHeader title="Security" subtitle="HTTPS, CSRF, rate limits, 2FA overview" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <ul className="text-sm space-y-2">
            <li>HTTPS assumed in production</li>
            <li>CSRF: {data.csrf}</li>
            <li>Rate limit: {data.rateLimit}</li>
            <li>Users with 2FA: {data.usersWith2fa}</li>
            <li>Active sessions: {data.activeSessions}</li>
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Recent logins</h3>
          <ul className="text-sm space-y-1">
            {data.recentLogins?.map((l: any) => (
              <li key={l.id}>
                {l.user?.email} · {new Date(l.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [secret, setSecret] = useState("");
  const load = () => api<{ keys: any[] }>("/api/admin/api-keys").then((d) => setKeys(d.keys));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <PageHeader
        title="REST API Keys"
        subtitle="Public API at /api/v1 — send header X-API-Key"
        actions={
          <Btn
            onClick={async () => {
              const name = prompt("Key name") || "App key";
              const d = await api<{ secret: string }>("/api/admin/api-keys", {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              setSecret(d.secret);
              load();
            }}
          >
            Create key
          </Btn>
        }
      />
      {secret && (
        <Card className="mb-4 border-[var(--gold)]">
          <p className="text-sm">Copy this secret now — it won’t be shown again:</p>
          <code className="text-xs break-all">{secret}</code>
        </Card>
      )}
      <Table
        headers={["Name", "Prefix", "Active", "Created", "Actions"]}
        rows={keys.map((k) => [
          k.name,
          k.prefix,
          k.active ? "yes" : "no",
          new Date(k.createdAt).toLocaleDateString(),
          <button
            key={k.id}
            className="underline text-red-700"
            onClick={async () => {
              await api(`/api/admin/api-keys/${k.id}`, { method: "DELETE" });
              load();
            }}
          >
            Revoke
          </button>,
        ])}
      />
      <Card className="mt-4 text-sm">
        <p className="font-medium mb-1">Public endpoints</p>
        <pre className="text-xs bg-[var(--cream)] p-3 rounded overflow-auto">{`GET /api/v1/pages
GET /api/v1/posts
GET /api/v1/menus/:location
GET /api/v1/settings
POST /api/v1/forms/:slug/submit`}</pre>
      </Card>
    </div>
  );
}

export function AccountPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [username, setUsername] = useState(user?.username || "");
  const [sessions, setSessions] = useState<any[]>([]);
  const [qr, setQr] = useState("");
  const [totp, setTotp] = useState("");

  useEffect(() => {
    api<{ sessions: any[] }>("/api/auth/sessions").then((d) => setSessions(d.sessions));
  }, []);

  useEffect(() => {
    setPhone(user?.phone || "");
    setUsername(user?.username || "");
  }, [user?.phone, user?.username]);

  return (
    <div>
      <PageHeader
        title="Account"
        subtitle={`${user?.username || user?.email} · Change password, 2FA, sessions`}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Login username</h3>
          <p className="text-sm text-[var(--muted)] mb-3">
            Sign in with this username. Your email stays for password resets only.
          </p>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api("/api/auth/profile", {
                method: "PATCH",
                body: JSON.stringify({
                  username: username.trim() || null,
                  phone: phone.trim() || null,
                }),
              });
              toast("Profile saved");
              refresh();
            }}
          >
            <Field label="Username" hint="Letters, numbers, . _ - (example: admin)">
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </Field>
            <Field label="Phone (WhatsApp)" hint="Include country code, e.g. +255783591810">
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255…"
              />
            </Field>
            <p className="text-xs text-[var(--muted)]">Recovery email: {user?.email}</p>
            <Btn type="submit">Save profile</Btn>
          </form>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Change password</h3>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api("/api/auth/change-password", {
                method: "POST",
                body: JSON.stringify({ currentPassword, newPassword }),
              });
              setCurrent("");
              setNew("");
              alert("Password updated");
              refresh();
            }}
          >
            <Field label="Current password">
              <input
                type="password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
            <Field
              label="New password"
              hint="At least 10 characters with upper case, lower case, and a number"
            >
              <input
                type="password"
                className={inputClass}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
              />
            </Field>
            <Btn type="submit">Update</Btn>
          </form>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Two-factor authentication</h3>
          <p className="text-sm text-[var(--muted)] mb-3">
            Status: {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn
              variant="ghost"
              onClick={async () => {
                const d = await api<{ qr: string }>("/api/auth/2fa/setup", { method: "POST" });
                setQr(d.qr);
              }}
            >
              Setup 2FA
            </Btn>
          </div>
          {qr && (
            <div className="space-y-2">
              <img src={qr} alt="2FA QR" className="w-40 h-40" />
              <Field label="Confirm code">
                <input className={inputClass} value={totp} onChange={(e) => setTotp(e.target.value)} />
              </Field>
              <Btn
                onClick={async () => {
                  await api("/api/auth/2fa/enable", {
                    method: "POST",
                    body: JSON.stringify({ totp }),
                  });
                  refresh();
                  alert("2FA enabled");
                }}
              >
                Enable
              </Btn>
            </div>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Sessions</h3>
          <Table
            headers={["Created", "IP", "Current", "Revoke"]}
            rows={sessions.map((s) => [
              new Date(s.createdAt).toLocaleString(),
              s.ip || "—",
              s.current ? "yes" : "",
              <button
                key={s.id}
                className="underline"
                onClick={async () => {
                  await api(`/api/auth/sessions/${s.id}`, { method: "DELETE" });
                  const d = await api<{ sessions: any[] }>("/api/auth/sessions");
                  setSessions(d.sessions);
                }}
              >
                Revoke
              </button>,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
