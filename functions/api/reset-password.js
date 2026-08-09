/**
 * Reset Password — POST /api/reset-password
 * Body: { token, newPassword }
 */

import { verifyJWT, hashPassword, validatePasswordStrength, corsHeaders, getKV } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders();
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const body = await request.json();
    const { token, newPassword } = body;
    if (!token || !newPassword) return new Response(JSON.stringify({ error: 'Reset token and new password are required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) return new Response(JSON.stringify({ error: 'Server auth not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const kv = getKV(env);
    if (!kv) return new Response(JSON.stringify({ error: 'KV storage not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const resetKey = `edge:reset:${token}`;
    const resetJWT = await kv.get(resetKey);
    if (!resetJWT) return new Response(JSON.stringify({ error: 'Invalid or expired reset token. Please request a new reset link.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const payload = await verifyJWT(resetJWT, jwtSecret);
    if (!payload || payload.purpose !== 'password_reset' || payload.token !== token) return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const username = payload.username;
    if (!username) return new Response(JSON.stringify({ error: 'Invalid reset token' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return new Response(JSON.stringify({ error: strengthError }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const candidateKeys = [`edge:user:${username}`, 'edge:user:admin'];
    let userKey = null;
    let userRaw = null;
    for (const key of candidateKeys) {
      userRaw = await kv.get(key);
      if (userRaw) { userKey = key; break; }
    }
    if (!userRaw || !userKey) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...cors } });
    let user;
    try { user = JSON.parse(userRaw); } catch { return new Response(JSON.stringify({ error: 'Corrupted user record' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }); }
    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date().toISOString();
    await kv.put(userKey, JSON.stringify(user));
    await kv.delete(resetKey);
    return new Response(JSON.stringify({ success: true, message: 'Password reset successfully. You can now log in with your new password.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: corsHeaders() }); }
