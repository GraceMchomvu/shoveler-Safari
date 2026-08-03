/**
 * Proxies /api/* to the CMS Node server when CMS_API_ORIGIN is set
 * in Cloudflare Pages environment variables (e.g. https://cms.example.com).
 *
 * Free hosts (Render / temporary Cloudflare tunnel) are supported via CMS_API_ORIGIN.
 */
export async function onRequest(context) {
  const origin = (context.env.CMS_API_ORIGIN || "").replace(/\/$/, "");
  if (!origin) {
    return Response.json(
      {
        error:
          "CMS API is not connected. Set Cloudflare Pages env CMS_API_ORIGIN to your free Node CMS host (e.g. https://shoveler-cms-api.onrender.com).",
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
