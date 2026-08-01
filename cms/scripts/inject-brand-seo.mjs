import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tripix-html");

const pages = [
  "index.html",
  "about.html",
  "destinations.html",
  "destination-details.html",
  "trips.html",
  "activities.html",
  "faq.html",
  "contact.html",
  "blog.html",
  "blog-details.html",
  "404.html",
];

const MARKER_START = "<!-- brand-seo:start -->";
const MARKER_END = "<!-- brand-seo:end -->";

function titleFor(file, currentTitle) {
  const map = {
    "index.html": "Northern Shoveler Adventure | Tanzania Safari Tours | Arusha",
    "about.html": "Northern Shoveler Adventure | About Us | Tanzania Safaris",
    "destinations.html": "Northern Shoveler Adventure | Destinations | Northern Circuit",
    "destination-details.html": "Northern Shoveler Adventure | Destination Guide | Tanzania",
    "trips.html": "Northern Shoveler Adventure | Safari Packages | Tanzania",
    "activities.html": "Northern Shoveler Adventure | Safari Activities | Tanzania",
    "faq.html": "Northern Shoveler Adventure | FAQ | Tanzania Safaris",
    "contact.html": "Northern Shoveler Adventure | Contact | Arusha Tanzania",
    "blog.html": "Northern Shoveler Adventure | Safari Journal | Blog",
    "blog-details.html":
      "Best Time to Visit the Serengeti | Northern Shoveler Adventure",
    "404.html": "Page Not Found | Northern Shoveler Adventure",
  };
  return map[file] || currentTitle.replace(/NORTHERN SHOVELER ADVENTURE/gi, "Northern Shoveler Adventure");
}

function pathFromCanonical(canonical) {
  try {
    const u = new URL(canonical);
    return u.pathname.endsWith("/") && u.pathname !== "/" ? u.pathname.slice(0, -1) : u.pathname;
  } catch {
    return "/";
  }
}

function buildBlock({ canonical, description, pageTitle, pagePath }) {
  const ogImage = "https://www.shovelersafari.com/assets/img/client/hero-01.jpg";
  const isHome = pagePath === "/" || pagePath === "";
  const orgDescription =
    "Northern Shoveler Adventure — personalized, expert-led safari adventures in Tanzania from Arusha. Serengeti, Ngorongoro, Tarangire, Lake Manyara & Zanzibar.";

  const schema = {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization", "LocalBusiness"],
    "@id": "https://www.shovelersafari.com/#organization",
    name: "Northern Shoveler Adventure",
    alternateName: ["Shoveler Safari", "Northern Shoveler Safari", "NORTHERN SHOVELER ADVENTURE"],
    url: "https://www.shovelersafari.com/",
    logo: "https://www.shovelersafari.com/assets/img/shoveler-logo.png",
    image: ogImage,
    description: orgDescription,
    email: "shovelersafari@gmail.com",
    telephone: "+255783591810",
    address: {
      "@type": "PostalAddress",
      streetAddress: "P.O. Box 66",
      addressLocality: "Arusha",
      addressCountry: "TZ",
    },
    areaServed: {
      "@type": "Country",
      name: "Tanzania",
    },
    sameAs: [
      "https://www.instagram.com/shovelersafari/",
      "https://www.facebook.com/share/1JNNS8g8yz/",
    ],
  };

  if (isHome) {
    schema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": "https://www.shovelersafari.com/",
    };
  }

  const desc = (description || orgDescription)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
  const ogTitle = (pageTitle || "Northern Shoveler Adventure")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

  return `    ${MARKER_START}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Northern Shoveler Adventure" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${ogImage}" />
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2).replace(/^/gm, "    ")}
    </script>
    ${MARKER_END}
`;
}

for (const file of pages) {
  const filePath = path.join(siteRoot, file);
  let html = fs.readFileSync(filePath, "utf8");
  const beforeLen = html.length;

  // Remove previous injection
  html = html.replace(
    new RegExp(`\\s*${MARKER_START}[\\s\\S]*?${MARKER_END}\\s*`, "g"),
    "\n"
  );

  // Title polish
  let pageTitle = titleFor(file, "");
  html = html.replace(/<title>([\s\S]*?)<\/title>/i, (_m, current) => {
    pageTitle = titleFor(file, current.trim());
    return `<title>${pageTitle}</title>`;
  });

  // Prefer sentence-case brand in description if ALL CAPS brand is used
  html = html.replace(
    /content="NORTHERN SHOVELER ADVENTURE/g,
    'content="Northern Shoveler Adventure'
  );

  const canonicalMatch = html.match(
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i
  );
  const canonical = canonicalMatch?.[1] || "https://www.shovelersafari.com/";
  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i
  );
  const description = descMatch?.[1] || "";
  const pagePath = pathFromCanonical(canonical);
  const block = buildBlock({ canonical, description, pageTitle, pagePath });

  if (canonicalMatch) {
    html = html.replace(canonicalMatch[0], `${canonicalMatch[0]}\n${block}`);
  } else {
    html = html.replace("</head>", `${block}</head>`);
  }

  if (html.length < beforeLen * 0.5) {
    console.error(`SKIP ${file}: unexpected shrink`);
    continue;
  }

  fs.writeFileSync(filePath, html);
  console.log(`OK ${file}`);
}

console.log("Brand SEO injected.");
