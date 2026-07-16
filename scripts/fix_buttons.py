"""Make every primary-page button/link usable for SHOVELER SAFARI."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
WA = "https://wa.me/255783591810"
WA_QUOTE = f"{WA}?text=Hello%20SHOVELER%20SAFARI%2C%20I%20would%20like%20a%20safari%20quote."
PAGES = [
    "index.html",
    "about.html",
    "trips.html",
    "destinations.html",
    "activities.html",
    "contact.html",
    "faq.html",
    "blog.html",
    "blog-details.html",
    "404.html",
    "index-3.html",
]

USEFUL_LINKS = """
                <div class="row gx-xl-2 g-2">
                  <div class="col-md-6">
                    <div class="footer-links">
                      <ul class="custom-ul">
                        <li>
                          <a href="about.html">
                            <i class="fa-solid fa-angles-right"></i>
                            About Us
                          </a>
                        </li>
                        <li>
                          <a href="destinations.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Destinations
                          </a>
                        </li>
                        <li>
                          <a href="trips.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Safaris
                          </a>
                        </li>
                        <li>
                          <a href="activities.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Activities
                          </a>
                        </li>
                        <li>
                          <a href="faq.html">
                            <i class="fa-solid fa-angles-right"></i>
                            FAQ
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="footer-links">
                      <ul class="custom-ul">
                        <li>
                          <a href="contact.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Contact Us
                          </a>
                        </li>
                        <li>
                          <a href="CONTACT_WA">
                            <i class="fa-solid fa-angles-right"></i>
                            WhatsApp Quote
                          </a>
                        </li>
                        <li>
                          <a href="blog.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Blog
                          </a>
                        </li>
                        <li>
                          <a href="trips.html">
                            <i class="fa-solid fa-angles-right"></i>
                            Request a Safari
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
""".replace("CONTACT_WA", WA_QUOTE)

MAP_IFRAME = """        <iframe
          src="https://www.google.com/maps?q=Arusha%2C%20Tanzania&output=embed"
          height="500"
          style="border: 0"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="SHOVELER SAFARI — Arusha, Tanzania"
        ></iframe>"""

CONTACT_FORM_SCRIPT = """
    <script>
      (function () {
        var form = document.querySelector("form.form-style1");
        if (!form) return;
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var fd = new FormData(form);
          var fname = (fd.get("fname") || "").toString().trim();
          var lname = (fd.get("lname") || "").toString().trim();
          var email = (fd.get("email") || "").toString().trim();
          var phone = (fd.get("phone") || "").toString().trim();
          var message = (fd.get("message") || "").toString().trim();
          var text =
            "Hello SHOVELER SAFARI — quote request%0A%0A" +
            "Name: " + encodeURIComponent(fname + " " + lname) + "%0A" +
            "Email: " + encodeURIComponent(email) + "%0A" +
            "Phone: " + encodeURIComponent(phone) + "%0A%0A" +
            encodeURIComponent(message);
          window.open("https://wa.me/255783591810?text=" + text, "_blank", "noopener");
        });
      })();
    </script>
"""


def replace_useful_links(html: str) -> str:
    pattern = re.compile(
        r'(<h5 class="widgets-title text-white-color text-capitalize">\s*Useful Links\s*</h5>\s*)'
        r'<div class="row gx-xl-2 g-2">.*?</div>\s*</div>\s*</div>\s*</div>',
        re.S,
    )

    def repl(m: re.Match[str]) -> str:
        return m.group(1) + USEFUL_LINKS + "\n              </div>\n            </div>"

    new, n = pattern.subn(repl, html, count=1)
    return new if n else html


def fix_social_hrefs(html: str) -> str:
    # Dead template share / social stubs → WhatsApp
    html = html.replace('href="ht#"', f'href="{WA_QUOTE}"')
    html = re.sub(
        r'href="#"(?=[^>]*>\s*<i class="fa-brands)',
        f'href="{WA_QUOTE}"',
        html,
    )
    # Generic social homepages → contact / WhatsApp
    for bad in (
        "https://www.facebook.com/",
        "https://facebook.com/",
        "https://www.instagram.com/",
        "https://instagram.com/",
        "https://x.com/",
        "https://twitter.com/",
        "https://www.linkedin.com/",
        "https://linkedin.com/",
        "https://www.youtube.com/",
        "https://youtube.com/",
    ):
        html = html.replace(f'href="{bad}"', f'href="{WA_QUOTE}"')
        html = html.replace(f"href='{bad}'", f'href="{WA_QUOTE}"')
    return html


def fix_footer_team(html: str) -> str:
    html = html.replace(
        '<li><a href="activities.html">Team</a></li>',
        '<li><a href="contact.html">Contact</a></li>',
    )
    return html


def fix_scroll_top(html: str) -> str:
    html = re.sub(
        r'<a href="[^"]*" class="scrollToTop scroll-btn"',
        '<a href="#" class="scrollToTop scroll-btn"',
        html,
    )
    return html


def fix_search_forms(html: str) -> str:
    # Popup / sidebar search → trips page (usable) instead of dead #
    html = html.replace(
        '<form action="#" class="search-form">',
        '<form action="trips.html" method="get" class="search-form">',
    )
    html = html.replace(
        '<form class="search-form">',
        '<form action="trips.html" method="get" class="search-form">',
    )
    html = re.sub(
        r'<form([^>]*class="[^"]*search[^"]*"[^>]*)action="#"',
        r'<form\1action="trips.html" method="get"',
        html,
    )
    return html


def fix_newsletter(html: str) -> str:
    # Newsletter mailto is flaky — send people to WhatsApp instead
    html = re.sub(
        r'(<form[^>]*class="[^"]*newsletter[^"]*"[^>]*)action="[^"]*"',
        rf'\1action="{WA_QUOTE}"',
        html,
        flags=re.I,
    )
    html = html.replace(
        'action="mailto:shovelersafari@gmail.com"',
        f'action="{WA_QUOTE}"',
    )
    return html


def fix_blog_shares(html: str) -> str:
    # Share boxes that pointed at contact.html → WhatsApp quote
    html = re.sub(
        r'(<div class="share-box">[\s\S]*?)<a href="contact\.html" target="_blank">',
        rf'\1<a href="{WA_QUOTE}" target="_blank" rel="noopener">',
        html,
    )
    # Global remaining share contact.html inside share-box
    def fix_box(m: re.Match[str]) -> str:
        block = m.group(0)
        block = block.replace('href="contact.html"', f'href="{WA_QUOTE}"')
        return block

    html = re.sub(r'<div class="share-box">[\s\S]*?</div>\s*</div>', fix_box, html)
    return html


def fix_contact_page(html: str, name: str) -> str:
    if name != "contact.html":
        return html

    html = html.replace('name="fname"\n                      type="text"\n                      class="form-control"\n                      placeholder="Last Name*"',
                        'name="lname"\n                      type="text"\n                      class="form-control"\n                      placeholder="Last Name*"')
    # Also handle compact variants
    html = re.sub(
        r'(placeholder="Last Name\*"[^>]*>)',
        lambda m: m.group(0),
        html,
    )
    # Fix duplicate fname on last name field more reliably
    html = re.sub(
        r'(<input\s+name=")fname("\s+type="text"\s+class="form-control"\s+placeholder="Last Name\*")',
        r"\1lname\2",
        html,
    )

    html = html.replace(
        'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain"',
        'action="#" method="post"',
    )

    html = re.sub(
        r'<iframe\s+src="assets/img/client/card-11\.jpg"[\s\S]*?</iframe>',
        MAP_IFRAME,
        html,
    )

    # Social follow: drop vimeo dead icon → WhatsApp, linkedin → email
    html = html.replace(
        '<a href="#"><i class="fa-brands fa-linkedin-in"></i></a>',
        f'<a href="mailto:shovelersafari@gmail.com"><i class="fa-solid fa-envelope"></i></a>',
    )
    html = html.replace(
        '<a href="#"><i class="fa-brands fa-vimeo-v"></i></a>',
        f'<a href="{WA_QUOTE}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a>',
    )

    if "wa.me/255783591810?text=" not in html[-2500:] or "form-style1" in html:
        if CONTACT_FORM_SCRIPT.strip() not in html:
            html = html.replace(
                "</body>",
                CONTACT_FORM_SCRIPT + "\n</body>",
            )
    return html


def fix_instagram_widget_title(html: str) -> str:
    # Instagram widget now opens WhatsApp — label it clearly
    html = re.sub(
        r'(<h5 class="widgets-title text-white-color text-capitalize">)\s*instagram\s*(</h5>)',
        r"\1Safari Moments\2",
        html,
        flags=re.I,
    )
    return html


def fix_index_ctas(html: str, name: str) -> str:
    if name not in ("index.html", "index-3.html"):
        return html
    html = html.replace(">view all service<", ">View all safaris<")
    html = html.replace(">discover more<", ">Plan your safari<")
    # Offer destination cards → destinations page anchors when possible
    html = html.replace(
        '<a href="trips.html">Serengeti National Park</a>',
        '<a href="destinations.html#serengeti">Serengeti National Park</a>',
    )
    html = html.replace(
        '<a href="trips.html">Ngorongoro Crater</a>',
        '<a href="destinations.html#ngorongoro">Ngorongoro Crater</a>',
    )
    html = html.replace(
        '<a href="trips.html">Tarangire & Lake Manyara</a>',
        '<a href="destinations.html#tarangire">Tarangire & Lake Manyara</a>',
    )
    return html


def fix_header_social_hashes(html: str) -> str:
    # trips/destinations header socials still on #
    html = re.sub(
        r'(class="[^"]*header[^"]*"[\s\S]{0,800}?)<a href="#">\s*<i class="fa-brands',
        rf'\1<a href="{WA_QUOTE}" target="_blank" rel="noopener"><i class="fa-brands',
        html,
        count=6,
    )
    return html


def process(path: Path) -> list[str]:
    notes: list[str] = []
    html = path.read_text(encoding="utf-8")
    original = html

    html = replace_useful_links(html)
    html = fix_social_hrefs(html)
    html = fix_footer_team(html)
    html = fix_scroll_top(html)
    html = fix_search_forms(html)
    html = fix_newsletter(html)
    html = fix_blog_shares(html)
    html = fix_instagram_widget_title(html)
    html = fix_index_ctas(html, path.name)
    html = fix_contact_page(html, path.name)
    html = fix_header_social_hashes(html)

    # Any remaining bare href="#" on social icon anchors
    html = re.sub(
        r'<a href="#">(\s*<i class="fa-brands)',
        rf'<a href="{WA_QUOTE}" target="_blank" rel="noopener">\1',
        html,
    )

    if html != original:
        path.write_text(html, encoding="utf-8")
        notes.append(f"updated {path.name}")
    else:
        notes.append(f"unchanged {path.name}")
    return notes


def main() -> None:
    for name in PAGES:
        path = BASE / name
        if not path.exists():
            print(f"missing {name}")
            continue
        for note in process(path):
            print(note)


if __name__ == "__main__":
    main()
