# Production always-on (PC can be off)

## Stack
- Website: Cloudflare Pages → www.shovelersafari.com
- CMS API: Render free → https://shoveler-safari.onrender.com
- Database: Neon free Postgres (permanent) — passwords & content persist

## Render Environment (required)
Set these on the Render web service, then Manual Deploy:

DATABASE_URL=postgresql://neondb_owner:npg_B8MQlfP2vSwc@ep-cold-fog-ay7d1318-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=16721ed6c057db74221bf93025f647bb655c037073c64724dc43edb998f747f98c465e977e05c302f99f422b69205f8f
NODE_ENV=production
CLIENT_ORIGIN=https://www.shovelersafari.com
SITE_ORIGIN=https://www.shovelersafari.com
COOKIE_SECURE=true
TRUST_PROXY=1
SEED_ADMIN_EMAIL=victorkiungai@gmail.com
SEED_ADMIN_PASSWORD=AdminPass123
SEED_ADMIN_PHONE=+255783591810

## Claim Neon (do once — keeps DB forever on free plan)
https://neon.new/database/8ad36383-bdef-4981-9794-8b628c045c05

## After deploy
1. Sync customer GitHub fork from GraceMchomvu/shoveler-Safari
2. Render → Manual Deploy latest
3. Login https://www.shovelersafari.com/admin/
   - username: admin
   - password: AdminPass123
4. Change password once — it will stick

## Do not
- Do not use SQLite on Render free (disk is wiped when the service sleeps)
- Do not set FORCE_ADMIN_RESET=1 in production unless intentionally resetting admin
