const DEFAULT_CMS_API_ORIGIN = "https://shoveler-safari.onrender.com";

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

export async function onRequest(context) {
  let origin = (context.env.CMS_API_ORIGIN || DEFAULT_CMS_API_ORIGIN).replace(/\/$/, "");
  if (/railway\.app/i.test(origin)) {
    origin = DEFAULT_CMS_API_ORIGIN;
  }
  if (!origin) {
    return Response.json(
      {
        error: "CMS API is not connected. Set CMS_API_ORIGIN to https://shoveler-safari.onrender.com",
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
        error: "Could not reach the CMS API on Render.",
        code: "CMS_API_UNREACHABLE",
        origin,
      },
      { status: 502 }
    );
  }
}
