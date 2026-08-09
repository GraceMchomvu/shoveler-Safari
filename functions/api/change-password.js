/**
 * Change Password — POST /api/change-password
 * Body: { currentPassword, newPassword }
 */

import { verifyPassword, hashPassword, verifyJWT, validatePasswordStrength, corsHeaders, getKV } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders();
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } });
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) return new Response(JSON.stringify({ error: 'Server auth not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } });
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return new Response(JSON.stringify({ error: 'Current password and new password are required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return new Response(JSON.stringify({ error: strengthError }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const kv = getKV(env);
    if (!kv) return new Response(JSON.stringify({ error: 'KV storage not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const username = payload.username || payload.sub;
    if (!username) return new Response(JSON.stringify({ error: 'Invalid session token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } });
    // EdgePocket stores the admin at edge:user:admin (id may be edge-admin)
    const candidateKeys = [
      `edge:user:${username}`,
      'edge:user:admin',
      username === 'edge-admin' ? 'edge:user:admin' : null,
    ].filter(Boolean);
    let userKey = null;
    let userRaw = null;
    for (const key of candidateKeys) {
      userRaw = await kv.get(key);
      if (userRaw) { userKey = key; break; }
    }
    if (!userRaw || !userKey) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...cors } });
    let user;
    try { user = JSON.parse(userRaw); } catch { return new Response(JSON.stringify({ error: 'Corrupted user record' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }); }
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) return new Response(JSON.stringify({ error: 'Current password is incorrect' }), { status: 403, headers: { 'Content-Type': 'application/json', ...cors } });
    const isSame = await verifyPassword(newPassword, user.passwordHash);
    if (isSame) return new Response(JSON.stringify({ error: 'New password must be different from current password' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date().toISOString();
    await kv.put(userKey, JSON.stringify(user));
    return new Response(JSON.stringify({ success: true, message: 'Password changed successfully. Please log in again with your new password.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: corsHeaders() }); }
