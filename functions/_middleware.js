import { handleEdgePocket, isEdgePocketPath } from "./_lib/edge-pocket.js";

const DEFAULT_CMS_API_ORIGIN = "https://shoveler-safari.onrender.com";

/** Forward upstream Set-Cookie as first-party cookies for www (strip Domain=). */
function rewriteSetCookieHeaders(upstream) {
  let raw = [];
  try {
    if (typeof upstream.headers.getSetCookie === "function") {
      raw = [...upstream.headers.getSetCookie()];
    }
  } catch (_) {
    /* ignore */
  }
  if (!raw.length) {
    const single = upstream.headers.get("set-cookie");
    if (single) raw.push(single);
  }
  return raw.map((c) =>
    c
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p && !/^domain=/i.test(p))
      .join("; ")
  );
}

async function proxyToCms(context) {
  let origin = (context.env.CMS_API_ORIGIN || DEFAULT_CMS_API_ORIGIN).replace(/\/$/, "");
  if (/railway\.app/i.test(origin)) {
    origin = DEFAULT_CMS_API_ORIGIN;
  }
  if (!origin) {
    return Response.json(
      {
        error: "Legacy CMS API origin missing. EdgePocket handles login without it.",
        code: "CMS_API_ORIGIN_MISSING",
      },
      { status: 503 }
    );
  }

  const url = new URL(context.request.url);
  const target = `${origin}${url.pathname}${url.search}`;
  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  try {
    const upstream = await fetch(target, init);
    const ctype = upstream.headers.get("content-type") || "";
    if (!upstream.ok && ctype.includes("text/html")) {
      return Response.json(
        {
          error: "CMS API host returned an error page.",
          code: "CMS_API_BAD_UPSTREAM",
          status: upstream.status,
          origin,
        },
        { status: 502 }
      );
    }

    const outHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === "set-cookie") return;
      if (["content-encoding", "content-length", "transfer-encoding"].includes(k)) return;
      outHeaders.append(key, value);
    });
    for (const cookie of rewriteSetCookieHeaders(upstream)) {
      outHeaders.append("set-cookie", cookie);
    }
    outHeaders.set("x-cms-proxy-origin", origin);

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch {
    return Response.json(
      {
        error: "Could not reach the legacy CMS API.",
        code: "CMS_API_UNREACHABLE",
        origin,
      },
      { status: 502 }
    );
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const { pathname, search } = url;
  const host = url.hostname.toLowerCase();

  // EdgePocket (default ON): login/session/health never touch Render
  const edgeOn = String(context.env.EDGE_POCKET || "1") !== "0";
  if (edgeOn && isEdgePocketPath(pathname)) {
    try {
      const edgeRes = await handleEdgePocket(context);
      if (edgeRes) return edgeRes;
    } catch (err) {
      return Response.json(
        {
          error: err instanceof Error ? err.message : "EdgePocket error",
          code: "EDGE_POCKET_ERROR",
        },
        { status: 500 }
      );
    }
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    // Optional legacy Render proxy for old CMS modules (can be disabled)
    if (String(context.env.LEGACY_CMS_PROXY || "0") === "1") {
      return proxyToCms(context);
    }
    return Response.json(
      {
        error:
          "This admin action is not on EdgePocket yet. Login/dashboard work without Render. Set LEGACY_CMS_PROXY=1 only if you still need the old API.",
        code: "EDGE_POCKET_ONLY",
        path: pathname,
      },
      { status: 501 }
    );
  }

  if (host === "shovelersafari.com") {
    return Response.redirect(`https://www.shovelersafari.com${pathname}${search}`, 301);
  }

  if (
    pathname === "/google66cda86dcd52e983.html" ||
    pathname === "/google66cda86dcd52e983"
  ) {
    return new Response("google-site-verification: google66cda86dcd52e983.html", {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  }

  return context.next();
}
