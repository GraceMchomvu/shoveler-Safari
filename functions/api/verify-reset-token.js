/**
 * Verify Reset Token — GET /api/verify-reset-token?token=<token>
 */

import { verifyJWT, corsHeaders, getKV } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const cors = corsHeaders({ 'Access-Control-Allow-Methods': 'GET, OPTIONS' });
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return new Response(JSON.stringify({ valid: false, error: 'No token provided' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) return new Response(JSON.stringify({ valid: false, error: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const kv = getKV(env);
    if (!kv) return new Response(JSON.stringify({ valid: false, error: 'KV storage not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    const resetKey = `edge:reset:${token}`;
    const resetJWT = await kv.get(resetKey);
    if (!resetJWT) return new Response(JSON.stringify({ valid: false, error: 'This reset link is invalid or has expired. Please request a new one.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    const payload = await verifyJWT(resetJWT, jwtSecret);
    if (!payload || payload.purpose !== 'password_reset' || payload.token !== token) return new Response(JSON.stringify({ valid: false, error: 'This reset link is invalid or has expired.' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    return new Response(JSON.stringify({ valid: true, username: payload.username, email: payload.email ? payload.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined, expires: payload.exp }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: corsHeaders({ 'Access-Control-Allow-Methods': 'GET, OPTIONS' }) }); }
