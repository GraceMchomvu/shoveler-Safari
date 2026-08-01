import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import RichEditor from "../components/RichEditor";
import PhotoPicker from "../components/PhotoPicker";
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

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string;
  scheduledAt?: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PagesList() {
  const [pages, setPages] = useState<Page[]>([]);
  const { toast } = useToast();
  const load = () => api<{ pages: Page[] }>("/api/admin/pages").then((d) => setPages(d.pages));
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Website pages"
        subtitle="These are the main pages on your website. Click Edit to change the text."
        actions={
          <Link to="/app/pages/new">
            <Btn>Add new page</Btn>
          </Link>
        }
      />
      <Tip>
        Open <strong>Home</strong>, <strong>About</strong>, or <strong>Contact</strong> to update what visitors see.
        Use <strong>Publish on website</strong> so guests can see your changes.
      </Tip>
      <Table
        headers={["Page name", "Status", ""]}
        empty={
          <Empty
            title="No pages yet"
            body="Add your first page to get started."
            action={
              <Link to="/app/pages/new">
                <Btn>Add page</Btn>
              </Link>
            }
          />
        }
        rows={pages.map((p) => [
          <div key={`${p.id}-t`}>
            <div className="font-semibold">{p.title}</div>
            <div className="text-xs text-[var(--muted)]">/{p.slug}</div>
          </div>,
          <StatusBadge key={`${p.id}-s`} status={p.status} />,
          <div key={`${p.id}-a`} className="flex flex-wrap gap-2 justify-end">
            <Link to={`/app/pages/${p.id}`}>
              <Btn>Edit</Btn>
            </Link>
            <Btn
              variant="ghost"
              onClick={async () => {
                await api(`/api/admin/pages/${p.id}/duplicate`, { method: "POST" });
                toast("Page copied as a draft");
                load();
              }}
            >
              Copy
            </Btn>
            <Btn
              variant="danger"
              onClick={async () => {
                if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
                await api(`/api/admin/pages/${p.id}`, { method: "DELETE" });
                toast("Page deleted");
                load();
              }}
            >
              Delete
            </Btn>
          </div>,
        ])}
      />
    </div>
  );
}

export function PageEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [form, setForm] = useState<Partial<Page>>({
    title: "",
    slug: "",
    content: "<p></p>",
    status: "DRAFT",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  useEffect(() => {
    if (!isNew && id) {
      api<{ page: Page }>(`/api/admin/pages/${id}`).then((d) => setForm(d.page));
    }
  }, [id, isNew]);

  async function save(status?: string) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title || "page"),
        status: status || form.status || "DRAFT",
      };
      if (isNew) {
        const data = await api<{ page: Page }>("/api/admin/pages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast(status === "PUBLISHED" ? "Page is live on your website!" : "Draft saved");
        navigate(`/app/pages/${data.page.id}`);
      } else {
        await api(`/api/admin/pages/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setForm((f) => ({ ...f, status: payload.status }));
        toast(status === "PUBLISHED" ? "Page is live on your website!" : "Changes saved");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Add a page" : `Edit: ${form.title || "Page"}`}
        subtitle="Write like a normal document. Then save a draft or publish."
        actions={
          <>
            <Btn variant="ghost" disabled={saving} onClick={() => save("DRAFT")}>
              Save draft
            </Btn>
            <Btn variant="success" disabled={saving} onClick={() => save("PUBLISHED")}>
              Publish on website
            </Btn>
          </>
        }
      />
      {form.status && (
        <div className="mb-4">
          <StatusBadge status={form.status} />
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card>
          <Field label="Page title" hint="Example: About Us, Safari Packages, Contact">
            <input
              className={inputClass}
              value={form.title || ""}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: isNew || !f.slug ? slugify(title) : f.slug,
                }));
              }}
            />
          </Field>
          <Field label="Page content" hint="Use the buttons above the box for bold, headings, and lists.">
            <RichEditor
              value={form.content || ""}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="Start typing your page text…"
            />
          </Field>
        </Card>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-2">Quick tips</h3>
            <ul className="text-sm text-[var(--muted)] space-y-2 list-disc pl-4">
              <li>Write your text first.</li>
              <li>Click <strong>Publish on website</strong> when ready.</li>
              <li>Draft means only you can see it here.</li>
            </ul>
          </Card>
          <Card>
            <button
              type="button"
              className="font-semibold text-sm w-full text-left"
              onClick={() => setShowSeo((v) => !v)}
            >
              Google search settings {showSeo ? "▴" : "▾"}
            </button>
            {showSeo && (
              <div className="mt-3">
                <Field label="Short link name" hint="Usually filled automatically from the title">
                  <input
                    className={inputClass}
                    value={form.slug || ""}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </Field>
                <Field label="Search title" hint="Shown in Google results">
                  <input
                    className={inputClass}
                    value={form.metaTitle || ""}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  />
                </Field>
                <Field label="Search description">
                  <textarea
                    className={inputClass}
                    value={form.metaDescription || ""}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </Card>
          <Btn className="w-full" disabled={saving} onClick={() => save()}>
            Save changes
          </Btn>
          <Link to="/app/pages" className="block text-center text-sm underline text-[var(--muted)]">
            Back to all pages
          </Link>
        </div>
      </div>
    </div>
  );
}

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  commentsEnabled?: boolean;
};

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { toast } = useToast();
  const load = () => api<{ posts: Post[] }>("/api/admin/posts").then((d) => setPosts(d.posts));
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Blog posts"
        subtitle="Stories and tips for your guests. Write a post, then publish when ready."
        actions={
          <Link to="/app/posts/new">
            <Btn>Write a post</Btn>
          </Link>
        }
      />
      <Table
        headers={["Post", "Status", ""]}
        empty={
          <Empty
            title="No blog posts yet"
            body="Share safari tips, wildlife news, or travel advice."
            action={
              <Link to="/app/posts/new">
                <Btn>Write first post</Btn>
              </Link>
            }
          />
        }
        rows={posts.map((p) => [
          <div key={`${p.id}-t`}>
            <div className="font-semibold">{p.title}</div>
            <div className="text-xs text-[var(--muted)]">{p.excerpt || p.slug}</div>
          </div>,
          <StatusBadge key={`${p.id}-s`} status={p.status} />,
          <div key={`${p.id}-a`} className="flex gap-2 justify-end">
            <Link to={`/app/posts/${p.id}`}>
              <Btn>Edit</Btn>
            </Link>
            <Btn
              variant="danger"
              onClick={async () => {
                if (!confirm(`Delete “${p.title}”?`)) return;
                await api(`/api/admin/posts/${p.id}`, { method: "DELETE" });
                toast("Post deleted");
                load();
              }}
            >
              Delete
            </Btn>
          </div>,
        ])}
      />
    </div>
  );
}

export function PostEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Post>>({
    title: "",
    slug: "",
    content: "<p></p>",
    status: "DRAFT",
    commentsEnabled: true,
    featuredImage: "",
    excerpt: "",
  });

  useEffect(() => {
    if (!isNew && id) {
      api<{ post: Post }>(`/api/admin/posts/${id}`).then((d) => setForm(d.post));
    }
  }, [id, isNew]);

  async function save(status?: string) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title || "post"),
        status: status || form.status || "DRAFT",
      };
      if (isNew) {
        const data = await api<{ post: Post }>("/api/admin/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast(status === "PUBLISHED" ? "Post is live!" : "Draft saved");
        navigate(`/app/posts/${data.post.id}`);
      } else {
        await api(`/api/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setForm((f) => ({ ...f, status: payload.status }));
        toast(status === "PUBLISHED" ? "Post is live!" : "Changes saved");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Write a blog post" : `Edit post`}
        subtitle="Tell your story, add a photo link if you like, then publish."
        actions={
          <>
            <Btn variant="ghost" disabled={saving} onClick={() => save("DRAFT")}>
              Save draft
            </Btn>
            <Btn variant="success" disabled={saving} onClick={() => save("PUBLISHED")}>
              Publish on website
            </Btn>
          </>
        }
      />
      {form.status && (
        <div className="mb-4">
          <StatusBadge status={form.status} />
        </div>
      )}
      <Card className="max-w-3xl">
        <Field label="Post title">
          <input
            className={inputClass}
            value={form.title || ""}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                slug: isNew || !f.slug ? slugify(title) : f.slug,
              }));
            }}
          />
        </Field>
        <Field label="Short summary" hint="One or two sentences shown in the blog list">
          <textarea
            className={inputClass}
            value={form.excerpt || ""}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </Field>
        <Field
          label="Cover photo"
          hint="Upload a photo from your computer, or paste a link from Photos & files"
        >
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <PhotoPicker
              label="Upload from computer"
              onUploaded={([url]) => {
                setForm((f) => ({ ...f, featuredImage: url }));
                toast("Cover photo uploaded");
              }}
              onError={(msg) => toast(msg, "err")}
            />
          </div>
          {form.featuredImage ? (
            <img
              src={form.featuredImage}
              alt="Cover preview"
              className="mb-2 h-36 w-full max-w-md object-cover rounded-lg border border-[var(--border)]"
            />
          ) : null}
          <input
            className={inputClass}
            placeholder="/uploads/your-photo.jpg"
            value={form.featuredImage || ""}
            onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
          />
        </Field>
        <Field label="Post content">
          <RichEditor
            value={form.content || ""}
            onChange={(html) => setForm((f) => ({ ...f, content: html }))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={form.commentsEnabled !== false}
            onChange={(e) => setForm({ ...form, commentsEnabled: e.target.checked })}
          />
          Allow people to leave comments
        </label>
        <div className="flex gap-2">
          <Btn disabled={saving} onClick={() => save()}>
            Save
          </Btn>
          <Link to="/app/posts">
            <Btn variant="ghost">Back to posts</Btn>
          </Link>
        </div>
      </Card>
    </div>
  );
}
