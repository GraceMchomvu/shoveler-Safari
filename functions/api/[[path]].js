/**
 * Proxies /api/* to the CMS Node server when CMS_API_ORIGIN is set
 * in Cloudflare Pages environment variables (e.g. https://cms.example.com).
 * If unset, the request continues normally (no proxy).
 */
export async function onRequest(context) {
  const origin = context.env.CMS_API_ORIGIN;
  if (!origin) {
    return context.next();
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

  return fetch(target, init);
}
