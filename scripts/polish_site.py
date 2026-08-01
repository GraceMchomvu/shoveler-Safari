"""Polish Shoveler Safari site: nav, packages, leftovers."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

SIMPLE_NAV = """
              <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="destinations.html">Destinations</a></li>
                <li><a href="trips.html">Safaris</a></li>
                <li><a href="activities.html">Activities</a></li>
                <li><a href="faq.html">FAQ</a></li>
                <li><a href="contact.html">Contact</a></li>
              </ul>
"""

# Replace entire <ul>...</ul> inside .vs-mobile-menu and main-menu blocks is hard;
# instead replace common mega-menu wrappers with flat links via regex on each menu root.

NAV_PATTERN = re.compile(
    r'(<div class="vs-mobile-menu">\s*)<ul>.*?</ul>(\s*</div>)',
    re.DOTALL,
)

STICKY_NAV_PATTERN = re.compile(
    r'(<nav class="main-menu d-none d-lg-block">\s*)<ul>.*?</ul>(\s*</nav>)',
    re.DOTALL,
)

HEADER_NAV_PATTERN = re.compile(
    r'(<nav class="main-menu menu-style1 d-none d-lg-block">\s*)<ul[^>]*>.*?</ul>(\s*</nav>)',
    re.DOTALL,
)

PACKAGES_TRIPS = """
          <div class="row g-4">
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-1.png" alt="3-Day Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Tarangire · Manyara · Ngorongoro</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">3-Day Tarangire, Manyara &amp; Ngorongoro Safari</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>3 Days / 2 Nights</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-2.png" alt="7-Day Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Serengeti · Ngorongoro · Tarangire</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">7-Day Classic Serengeti &amp; Ngorongoro Safari</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>7 Days / 6 Nights</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-3.png" alt="Birdwatching Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Northern Circuit</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">Birdwatching Focus Safari</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>Custom Duration</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-4.png" alt="Photography Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Serengeti · Ngorongoro</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">Professional Photography Safari</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>Custom Duration</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-5.png" alt="Family Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Northern Circuit</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">Family-Friendly Northern Circuit Safari</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>Custom Duration</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-6.png" alt="Zanzibar" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location">
                    <i class="fa-sharp fa-light fa-location-dot"></i>
                    <span>Zanzibar Archipelago</span>
                  </div>
                  <h5 class="title line-clamp-2">
                    <a href="contact.html">Zanzibar Beach Add-on</a>
                  </h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration">
                      <span>3–7 Days</span>
                    </div>
                    <div class="pricing-info fw-medium">
                      <h5 class="new-price">Request Quote</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
"""


def simplify_nav(html: str) -> str:
    html = NAV_PATTERN.sub(r"\1" + SIMPLE_NAV + r"\2", html)
    html = STICKY_NAV_PATTERN.sub(r"\1" + SIMPLE_NAV + r"\2", html)
    html = HEADER_NAV_PATTERN.sub(
        r'\1<ul class="d-flex justify-content-center align-items-center">'
        + SIMPLE_NAV.replace("<ul>", "").replace("</ul>", "")
        + "</ul>"
        + r"\2",
        html,
    )
    # Sticky/header menus that use slightly different wrappers
    html = re.sub(
        r'(<nav class="main-menu[^"]*"[^>]*>\s*)<ul[^>]*>.*?</ul>(\s*</nav>)',
        lambda m: m.group(1)
        + '<ul class="d-flex justify-content-center align-items-center">'
        + "\n                <li><a href=\"index.html\">Home</a></li>\n"
        + "                <li><a href=\"about.html\">About</a></li>\n"
        + "                <li><a href=\"destinations.html\">Destinations</a></li>\n"
        + "                <li><a href=\"trips.html\">Safaris</a></li>\n"
        + "                <li><a href=\"activities.html\">Activities</a></li>\n"
        + "                <li><a href=\"faq.html\">FAQ</a></li>\n"
        + "                <li><a href=\"contact.html\">Contact</a></li>\n"
        + "              </ul>"
        + m.group(2),
        html,
        count=5,
        flags=re.DOTALL,
    )
    return html


def fix_trips(html: str) -> str:
    html = html.replace("Explore Popular package", "Signature Tanzania Safaris")
    html = html.replace("Choose Your Package", "Safari Packages")
    # Replace the package cards grid
    html = re.sub(
        r'(<div class="row g-4">)\s*<div class="col-md-6 col-xl-4">.*?(</div>\s*<div class="text-center mt-60)',
        r"\1" + PACKAGES_TRIPS + r"\2",
        html,
        count=1,
        flags=re.DOTALL,
    )
    return html


def fix_index(html: str) -> str:
    replacements = [
        ("hanoi city", "Arusha"),
        ("Hanoi City", "Arusha"),
        ("Costa rica", "Serengeti"),
        ("costa rica", "Serengeti"),
        ("tanzania city", "Ngorongoro"),
        ("combodia", "Zanzibar"),
        ("Whether want to follow", "Ready for your Northern Circuit safari"),
        ("Discover Organized Adventures", "Authentic Tanzania Safaris"),
        ("Ultimate Travel Hack", "From Arusha"),
        ("exclusive gallery", "Safari Moments"),
        ("Exclusive Gallery", "Safari Moments"),
        ("Pharaohs Nile", "Serengeti Migration"),
        ("South Korea", "Zanzibar"),
        ("advanture", "adventure"),
        ("book now", "Request a Quote"),
        ("Book Now", "Request a Quote"),
    ]
    for a, b in replacements:
        html = html.replace(a, b)

    # Wire request quote form button already has onclick sometimes
    html = html.replace('href="#"', 'href="contact.html"')
    # Don't break empty anchors that are icons - restore location icons carefully
    html = html.replace(
        'href="contact.html" class="icon bg-theme-color',
        'href="destinations.html" class="icon bg-theme-color',
    )
    return html


def fix_destinations(html: str) -> str:
    pairs = [
        ("manila city", "Serengeti National Park"),
        ("Los Angeles", "Tarangire National Park"),
        ("china tours", "Lake Manyara National Park"),
        ("vietnam", "Ngorongoro Crater"),
        ("germany", "Zanzibar"),
        ("cairo tour", "Mount Meru"),
        ("span tour", "Maasai Cultural Visit"),
        ("netherlands", "Hadzabe Cultural Tour"),
        ("turkey", "Lake Manyara"),
        ("Turkey", "Lake Manyara"),
    ]
    for a, b in pairs:
        html = html.replace(a, b)
    return html


def fix_destination_details(html: str) -> str:
    pairs = [
        ("Romantic Sri Lanka Honeymoon Package", "Romantic Tanzania Honeymoon Safari"),
        ("Kathmandu", "Arusha"),
        ("Pokhara", "Serengeti"),
        ("Bus, Airlines", "4x4 Land Cruiser"),
        ("Maldives Travel Experience of the Lifetime", "7-Day Classic Serengeti & Ngorongoro Safari"),
        ("Serengeti, vietnam, Nepal", "Serengeti · Ngorongoro · Tarangire"),
        ("Serengeti, Tarangire, Nepal", "Serengeti · Ngorongoro · Tarangire"),
        ("Pyramids of Giza", "Ngorongoro Crater floor"),
        ("Gaudi Barcelona", "Great Migration plains"),
        ("Tours and Adventures award", "Explore · Discover · Experience"),
    ]
    for a, b in pairs:
        html = html.replace(a, b)
    # Dummy latin-ish paragraphs
    html = re.sub(
        r"Rainbow[^<]{10,120}mites",
        "Experience the Serengeti with expert guides, private Land Cruisers, and carefully chosen lodges across Tanzania's Northern Circuit.",
        html,
    )
    return html


def fix_activities(html: str) -> str:
    pairs = [
        ("helicopter", "Hot Air Balloon Safari"),
        ("Helicopter", "Hot Air Balloon Safari"),
        ("desert ride", "Walking Safari"),
        ("Desert Ride", "Walking Safari"),
        ("forest ride", "Cultural Tours"),
        ("Forest Ride", "Cultural Tours"),
        ("ice skating", "Highlands Hiking"),
        ("Ice Skating", "Highlands Hiking"),
        ("Ice skating", "Highlands Hiking"),
    ]
    for a, b in pairs:
        html = html.replace(a, b)
    return html


def fix_forms(html: str) -> str:
    html = html.replace(
        'action="index.html"\n                class="form-style1 ajax-contact"',
        'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain"\n                class="form-style1"',
    )
    html = html.replace(
        'action="index.html"\r\n                class="form-style1 ajax-contact"',
        'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain"\r\n                class="form-style1"',
    )
    html = html.replace(
        'action="index.html" method="post"',
        'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain"',
    )
    html = html.replace(
        'action="index.html" class="w100"',
        'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain" class="w100"',
    )
    # Hero booking form -> WhatsApp with prefilled message
    html = re.sub(
        r'(class="vs-btn style7 w-100"[^>]*>)\s*Request a Quote\s*</button>',
        r'\1Request a Quote</button>',
        html,
    )
    html = html.replace(
        'onclick="window.location.href=\'contact.html\'"',
        'onclick="window.location.href=\'https://wa.me/255783591810?text=Hello%20SHOVELER%20SAFARI%2C%20I%20would%20like%20a%20safari%20quote.\'"',
    )
    return html


def main() -> None:
    pages = [
        "index.html",
        "index-3.html",
        "about.html",
        "contact.html",
        "faq.html",
        "trips.html",
        "destinations.html",
        "destination-details.html",
        "activities.html",
        "blog.html",
        "blog-details.html",
        "404.html",
    ]
    for name in pages:
        path = BASE / name
        if not path.exists():
            continue
        html = path.read_text(encoding="utf-8")
        html = simplify_nav(html)
        html = fix_forms(html)
        if name in {"index.html", "index-3.html"}:
            html = fix_index(html)
        if name == "trips.html":
            html = fix_trips(html)
        if name == "destinations.html":
            html = fix_destinations(html)
        if name == "destination-details.html":
            html = fix_destination_details(html)
        if name == "activities.html":
            html = fix_activities(html)
        # Global leftover cleanup
        for a, b in [
            ("Maldives Travel Experience of the Lifetime", "7-Day Classic Serengeti & Ngorongoro Safari"),
            ("barcelona city beach hotels of the Lifetime", "3-Day Tarangire, Manyara & Ngorongoro Safari"),
            ("barcelona beach hotels of the Lifetime", "3-Day Tarangire, Manyara & Ngorongoro Safari"),
            ("Page List 1", "Explore"),
            ("Page List 2", "Experiences"),
            ("Page List 3", "Travel"),
            ("Page List 4", "Connect"),
        ]:
            html = html.replace(a, b)
        path.write_text(html, encoding="utf-8")
        print(f"Polished {name}")

    # Keep index-3 synced
    (BASE / "index-3.html").write_text((BASE / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
    print("Synced index-3.html")


if __name__ == "__main__":
    main()
