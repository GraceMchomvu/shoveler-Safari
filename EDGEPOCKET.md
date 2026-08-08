# EdgePocket — invented free login (no Render)

Login runs on **Cloudflare Pages Functions + KV**.  
No sleep. No wiped disk. No Manual Deploy on Render.

## What it is

```text
Browser → www.shovelersafari.com/admin
                ↓
         Cloudflare Pages (free)
                ↓
     /api/auth/*  +  /api/health  +  /api/admin/dashboard
                ↓
         Cloudflare KV (password hash + sessions)
```

Render is **out of the login path**.

## One-time setup (you — ~5 minutes)

### 1) Create KV

```bash
npx wrangler login
npx wrangler kv namespace create EDGE_KV
```

Copy the namespace **id**.

### 2) Cloudflare Dashboard → Pages → your site → Settings

**Functions → KV namespace bindings**

| Variable name | KV namespace |
|---------------|-------------|
| `EDGE_KV` | the one you created |

**Environment variables (Production secrets)**

| Name | Value |
|------|--------|
| `JWT_SECRET` | long random string (≥32 chars) |
| `SEED_ADMIN_EMAIL` | `victorkiungai@gmail.com` |
| `SEED_ADMIN_PASSWORD` | your real admin password (used once to create the KV user) |
| `EDGE_POCKET` | `1` |

Optional: `LEGACY_CMS_PROXY=1` only if you still want old Render APIs for unfinished modules.

### 3) Deploy

Push to GitHub (Pages auto-deploy) **or** Cloudflare → Deployments → Retry.

### 4) Verify

Open: `https://www.shovelersafari.com/api/health`  
Expect: `"mode":"edge"` and `"dbHost":"cloudflare-kv"`

Login: `https://www.shovelersafari.com/admin/`  
- username: `admin`  
- password: whatever you set in `SEED_ADMIN_PASSWORD` (first boot into KV)

## Reset password later

- Change it in Account UI (change-password), **or**
- Delete KV key `edge:user:admin` and redeploy / login again with `SEED_ADMIN_PASSWORD`

## Honest scope

Works now: **login, session, logout, change-password, health, basic dashboard**.  
Full old CMS modules (pages/posts/media) need to be moved onto EdgePocket/KV next — they no longer depend on Render sleeping.
