from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

packages = [
    {
        "img": "assets/img/tour-packages/tour-package-1-1.png",
        "alt": "3-Day Tarangire, Manyara and Ngorongoro Safari",
        "title": "3-Day Tarangire, Manyara &amp; Ngorongoro Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%203-Day%20Safari",
        "loc": "Tarangire · Manyara · Ngorongoro",
        "time": "3 Days / 2 Nights",
        "badge": "Private Safari",
        "note": "Mid-range to luxury",
    },
    {
        "img": "assets/img/tour-packages/tour-package-1-2.png",
        "alt": "7-Day Classic Serengeti and Ngorongoro Safari",
        "title": "7-Day Classic Serengeti &amp; Ngorongoro Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%207-Day%20Safari",
        "loc": "Serengeti · Ngorongoro · Tarangire",
        "time": "7 Days / 6 Nights",
        "badge": "Signature Trip",
        "note": "Most popular itinerary",
    },
    {
        "img": "assets/img/tour-packages/tour-package-1-3.png",
        "alt": "Birdwatching Focus Safari",
        "title": "Birdwatching Focus Safari — Northern Circuit",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Birdwatching%20Safari",
        "loc": "Tarangire · Manyara · Ngorongoro",
        "time": "3–5 Days",
        "badge": "Specialist",
        "note": "Guided for birders",
    },
    {
        "img": "assets/img/tour-packages/tour-package-1-1.png",
        "alt": "Professional Photography Safari",
        "title": "Professional Photography Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Photography%20Safari",
        "loc": "Serengeti · Ngorongoro",
        "time": "Custom Duration",
        "badge": "Photography",
        "note": "Golden-hour drives",
    },
    {
        "img": "assets/img/tour-packages/tour-package-1-2.png",
        "alt": "Family-Friendly Northern Circuit Safari",
        "title": "Family-Friendly Northern Circuit Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Family%20Safari",
        "loc": "Northern Circuit",
        "time": "Custom Duration",
        "badge": "Families",
        "note": "Paced for all ages",
    },
    {
        "img": "assets/img/tour-packages/tour-package-1-3.png",
        "alt": "Zanzibar Beach Add-on",
        "title": "Zanzibar Beach Add-on",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Zanzibar%20Add-on",
        "loc": "Zanzibar Archipelago",
        "time": "3–7 Days",
        "badge": "Beach Escape",
        "note": "After the safari",
    },
]


def card_html(p: dict) -> str:
    return f"""                  <div class="swiper-slide">
                    <article class="tour-package-box shoveler-pkg">
                      <div class="tour-package-thumb shoveler-pkg__media">
                        <img
                          src="{p['img']}"
                          alt="{p['alt']}"
                          class="w-100"
                        />
                        <span class="shoveler-pkg__badge">{p['badge']}</span>
                        <span class="shoveler-pkg__duration">{p['time']}</span>
                      </div>
                      <div class="tour-package-content shoveler-pkg__body">
                        <h5 class="title line-clamp-2">
                          <a href="{p['href']}" target="_blank" rel="noopener"
                            >{p['title']}</a
                          >
                        </h5>
                        <p class="shoveler-pkg__loc">
                          <i class="fa-sharp fa-thin fa-location-dot"></i>
                          {p['loc']}
                        </p>
                        <div class="shoveler-pkg__footer">
                          <div class="shoveler-pkg__quote">
                            <span class="shoveler-pkg__label">Custom pricing</span>
                            <strong>{p['note']}</strong>
                          </div>
                          <a href="{p['href']}" class="shoveler-pkg__btn" target="_blank" rel="noopener"
                            >Get a Quote <i class="fa-sharp fa-light fa-arrow-right"></i
                          ></a>
                        </div>
                      </div>
                    </article>
                  </div>"""


slides = "\n".join(card_html(p) for p in packages)
pattern = re.compile(
    r'(<div class="swiper tour-package-slider">\s*<div class="swiper-wrapper">)'
    r"(.*?)"
    r"(</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</section>\s*"
    r"<!--================= Tour Package Area end)",
    re.S,
)

for name in ("index.html", "index-3.html"):
    path = root / name
    text = path.read_text(encoding="utf-8")
    m = pattern.search(text)
    if not m:
        print(f"FAIL {name}")
        continue
    updated = text[: m.start()] + m.group(1) + "\n" + slides + "\n                " + m.group(3) + text[m.end() :]
    path.write_text(updated, encoding="utf-8")
    print(f"updated {name}")
