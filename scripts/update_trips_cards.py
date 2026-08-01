from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
path = root / "trips.html"

packages = [
    {
        "img": "assets/img/tour-packages/tour-package-3-1.png",
        "alt": "3-Day Safari",
        "title": "3-Day Tarangire, Manyara &amp; Ngorongoro Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%203-Day%20Safari",
        "loc": "Tarangire · Manyara · Ngorongoro",
        "time": "3 Days / 2 Nights",
        "badge": "Private Safari",
        "note": "Mid-range to luxury",
    },
    {
        "img": "assets/img/tour-packages/tour-package-3-2.png",
        "alt": "7-Day Safari",
        "title": "7-Day Classic Serengeti &amp; Ngorongoro Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%207-Day%20Safari",
        "loc": "Serengeti · Ngorongoro · Tarangire",
        "time": "7 Days / 6 Nights",
        "badge": "Signature Trip",
        "note": "Most popular itinerary",
    },
    {
        "img": "assets/img/tour-packages/tour-package-3-3.png",
        "alt": "Birdwatching",
        "title": "Birdwatching Focus Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Birdwatching%20Safari",
        "loc": "Northern Circuit",
        "time": "Custom Duration",
        "badge": "Specialist",
        "note": "Guided for birders",
    },
    {
        "img": "assets/img/tour-packages/tour-package-3-4.png",
        "alt": "Photography",
        "title": "Professional Photography Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Photography%20Safari",
        "loc": "Serengeti · Ngorongoro",
        "time": "Custom Duration",
        "badge": "Photography",
        "note": "Golden-hour drives",
    },
    {
        "img": "assets/img/tour-packages/tour-package-3-5.png",
        "alt": "Family Safari",
        "title": "Family-Friendly Northern Circuit Safari",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Family%20Safari",
        "loc": "Northern Circuit",
        "time": "Custom Duration",
        "badge": "Families",
        "note": "Paced for all ages",
    },
    {
        "img": "assets/img/tour-packages/tour-package-3-6.png",
        "alt": "Zanzibar",
        "title": "Zanzibar Beach Add-on",
        "href": "https://wa.me/255783591810?text=Quote%20for%20Zanzibar%20Add-on",
        "loc": "Zanzibar Archipelago",
        "time": "3–7 Days",
        "badge": "Beach Escape",
        "note": "After the safari",
    },
]


def card(p: dict) -> str:
    return f"""            <div class="col-md-6 col-xl-4">
              <article class="tour-package-box style-3 shoveler-pkg">
                <div class="tour-package-thumb shoveler-pkg__media">
                  <img src="{p['img']}" alt="{p['alt']}" class="w-100" />
                  <span class="shoveler-pkg__badge">{p['badge']}</span>
                  <span class="shoveler-pkg__duration">{p['time']}</span>
                </div>
                <div class="tour-package-content shoveler-pkg__body">
                  <h5 class="title line-clamp-2"><a href="{p['href']}" target="_blank" rel="noopener">{p['title']}</a></h5>
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


grid = "\n".join(card(p) for p in packages)
text = path.read_text(encoding="utf-8")
pattern = re.compile(
    r'(<div class="row g-4">)\s*'
    r"(.*?)"
    r'(</div>\s*<div class="text-center mt-60 btn-trigger btn-bounce">)',
    re.S,
)
m = pattern.search(text)
if not m:
    raise SystemExit("FAIL trips pattern")
updated = text[: m.start()] + m.group(1) + "\n" + grid + "\n          " + m.group(3) + text[m.end() :]
path.write_text(updated, encoding="utf-8")
print("updated trips.html")
