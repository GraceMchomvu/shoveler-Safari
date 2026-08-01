export async function onRequest(context) {
  const url = new URL(context.request.url);
  const { pathname, search } = url;
  const host = url.hostname.toLowerCase();

  // Canonical host: www
  if (host === "shovelersafari.com") {
    return Response.redirect(
      `https://www.shovelersafari.com${pathname}${search}`,
      301
    );
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
