/**
 * Proxies /api/* to the CMS Node server when CMS_API_ORIGIN is set
 * in Cloudflare Pages environment variables (e.g. https://cms.example.com).
 *
 * If CMS_API_ORIGIN is missing, return a clear JSON error so the admin
 * login does not silently fail with a generic password error.
 */
const DEFAULT_CMS_API_ORIGIN = "https://shoveler-cms-api-production.up.railway.app";

export async function onRequest(context) {
  let origin = (context.env.CMS_API_ORIGIN || DEFAULT_CMS_API_ORIGIN).replace(/\/$/, "");
  // Never keep temporary laptop tunnels in production
  if (/trycloudflare\.com/i.test(origin)) {
    origin = DEFAULT_CMS_API_ORIGIN;
  }
  if (!origin) {
    return Response.json(
      {
        error:
          "CMS API is not connected. Set Cloudflare Pages env CMS_API_ORIGIN to your Node CMS host (e.g. https://cms.yourhost.com).",
        code: "CMS_API_ORIGIN_MISSING",
      },
      { status: 503 }
    );
  }

  const url = new URL(context.request.url);
  const target = `${origin.replace(/\/$/, "")}${url.pathname}${url.search}`;
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
    return await fetch(target, init);
  } catch (err) {
    return Response.json(
      {
        error: "Could not reach the CMS API. Check CMS_API_ORIGIN and that the API server is running.",
        code: "CMS_API_UNREACHABLE",
      },
      { status: 502 }
    );
  }
}
