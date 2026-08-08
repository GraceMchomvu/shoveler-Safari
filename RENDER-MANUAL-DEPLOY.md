# Fix broken admin login (Render + Neon) — one click

## Why login feels broken right now

Live Render is still running **old code**. Evidence:

- `/api/health` returns only `{ ok, service, env }` — new code also returns `dbHost`
- Login does **not** return a `token` (needed when cookies are flaky)
- Password keeps resetting to `AdminPass123` with `mustChangePassword: true`

Neon is fine. The API deploy is stale.

## Do this once (required)

1. Open https://dashboard.render.com/
2. Open service **shoveler-safari**
3. **Manual Deploy** → **Deploy latest commit**
4. Wait until status is **Live** (2–5 min)
5. Confirm health looks like this (has `dbHost`):

   `https://shoveler-safari.onrender.com/api/health`

6. Login: https://www.shovelersafari.com/admin/

### Credentials after a good deploy

Set these in Render → Environment (then redeploy if you change them):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | your Neon Postgres URL |
| `JWT_SECRET` | fixed random string, ≥32 chars (never change casually) |
| `SEED_ADMIN_EMAIL` | `victorkiungai@gmail.com` |
| `SEED_ADMIN_PASSWORD` | pick one strong password and keep it |
| `FORCE_SEED_ADMIN_PASSWORD` | `true` **once** to reset admin, then set back to `false` |

After the first good seed, leave `FORCE_SEED_ADMIN_PASSWORD=false` so restarts do **not** wipe the password.

### Until you deploy

Temporary live password is usually:

- username: `admin`
- password: `AdminPass123`

You may be forced to change it — then a later Render wake can wipe it again until the new boot code is live.

## Optional: auto-deploy later

1. Render → shoveler-safari → Settings → Deploy Hook → copy URL  
2. GitHub → repo Settings → Secrets → `RENDER_DEPLOY_HOOK_URL`  
3. Pushes to `main` under `cms/` will trigger Render

## Optional: less sleeping

GitHub Action **Keep CMS API awake** pings every 10 minutes. Free tier can still sleep; first login may take up to ~60s.
