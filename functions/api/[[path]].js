/**
 * Proxies /api/* to the CMS Node API (free host).
 * CMS_API_ORIGIN Cloudflare secret overrides the default.
 */
const FALLBACK_ORIGIN = "https://informative-club-halifax-decrease.trycloudflare.com";

export async function onRequest(context) {
  let origin = (context.env.CMS_API_ORIGIN || FALLBACK_ORIGIN).replace(/\/$/, "");
  // Drop dead paid Railway host if a stale secret remains
  if (/railway\.app/i.test(origin)) {
    origin = FALLBACK_ORIGIN;
  }
  if (!origin) {
    return Response.json(
      {
        error:
          "CMS API is not connected. Set Cloudflare Pages env CMS_API_ORIGIN to your free host (Render / tunnel).",
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
    // If upstream is an HTML error page, surface a clear API error instead
    const ctype = upstream.headers.get("content-type") || "";
    if (!upstream.ok && ctype.includes("text/html")) {
      return Response.json(
        {
          error: "CMS API host returned an error page. Check CMS_API_ORIGIN.",
          code: "CMS_API_BAD_UPSTREAM",
          status: upstream.status,
          origin,
        },
        { status: 502 }
      );
    }
    return upstream;
  } catch (err) {
    return Response.json(
      {
        error: "Could not reach the CMS API. Check CMS_API_ORIGIN and that the API server is running.",
        code: "CMS_API_UNREACHABLE",
        origin,
      },
      { status: 502 }
    );
  }
}
