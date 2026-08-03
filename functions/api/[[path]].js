/**
 * Proxies /api/* to the free Render CMS API.
 * CMS_API_ORIGIN Cloudflare secret overrides the default.
 */
const DEFAULT_CMS_API_ORIGIN = "https://shoveler-safari.onrender.com";

export async function onRequest(context) {
  let origin = (context.env.CMS_API_ORIGIN || DEFAULT_CMS_API_ORIGIN).replace(/\/$/, "");
  // Never keep temporary laptop tunnels or old paid hosts
  if (/trycloudflare\.com|railway\.app/i.test(origin)) {
    origin = DEFAULT_CMS_API_ORIGIN;
  }
  if (!origin) {
    return Response.json(
      {
        error:
          "CMS API is not connected. Set Cloudflare Pages env CMS_API_ORIGIN to https://shoveler-safari.onrender.com",
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
