/**
 * Forgot Password — POST /api/forgot-password
 * Body: { email }
 */

import { signJWT, corsHeaders, getKV, generateShortToken } from './_auth.js';

const RESET_TOKEN_TTL = 900;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_TTL = 3600;

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders();
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) return new Response(JSON.stringify({ error: 'A valid email is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) return new Response(JSON.stringify({ error: 'Server auth not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const kv = getKV(env);
    if (!kv) return new Response(JSON.stringify({ error: 'KV storage not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const rateKey = `edge:ratelimit:reset:${email}`;
    const rateRaw = await kv.get(rateKey);
    const rateCount = rateRaw ? parseInt(rateRaw, 10) : 0;
    if (rateCount >= RATE_LIMIT_MAX) return new Response(JSON.stringify({ success: true, message: 'If an account exists for that email, a reset link has been generated.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    let userFound = null;
    let cursor = null;
    do {
      const listOpts = { prefix: 'edge:user:', limit: 1000 };
      if (cursor) listOpts.cursor = cursor;
      const listResp = await kv.list(listOpts);
      for (const key of (listResp.keys || [])) {
        const raw = await kv.get(key.name);
        if (!raw) continue;
        try { const user = JSON.parse(raw); if (user.email && user.email.toLowerCase() === email) { userFound = user; break; } } catch { continue; }
      }
      cursor = listResp.list_complete ? null : listResp.cursor;
    } while (cursor && !userFound);
    if (!userFound) return new Response(JSON.stringify({ success: true, message: 'If an account exists for that email, a reset link has been generated.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    await kv.put(rateKey, String(rateCount + 1), { expirationTtl: RATE_LIMIT_TTL });
    const shortToken = generateShortToken(32);
    const resetJWT = await signJWT({ username: userFound.username, email: userFound.email, purpose: 'password_reset', token: shortToken, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL }, jwtSecret);
    await kv.put(`edge:reset:${shortToken}`, resetJWT, { expirationTtl: RESET_TOKEN_TTL });
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${shortToken}`;
    return new Response(JSON.stringify({ success: true, message: 'Password reset link generated. Use it within 15 minutes.', resetUrl }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: corsHeaders() }); }
