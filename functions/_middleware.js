const DEFAULT_CMS_API_ORIGIN = "https://shoveler-safari.onrender.com";

async function proxyToCms(context) {
  let origin = (context.env.CMS_API_ORIGIN || DEFAULT_CMS_API_ORIGIN).replace(/\/$/, "");
  if (/trycloudflare\.com|railway\.app/i.test(origin)) {
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
    const ctype = upstream.headers.get("content-type") || "";
    if (!upstream.ok && ctype.includes("text/html")) {
      return Response.json(
        {
          error: "CMS API host returned an error page. Check Render service status.",
          code: "CMS_API_BAD_UPSTREAM",
          status: upstream.status,
          origin,
        },
        { status: 502 }
      );
    }
    return upstream;
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

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const { pathname, search } = url;
  const host = url.hostname.toLowerCase();

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return proxyToCms(context);
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
