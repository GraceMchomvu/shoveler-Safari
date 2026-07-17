export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

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
