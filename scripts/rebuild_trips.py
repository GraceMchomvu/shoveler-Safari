"""Rebuild trips packages + itineraries; clean leftovers."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

PACKAGES = """
          <div class="row g-4">
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-1.png" alt="3-Day Safari" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Tarangire · Manyara · Ngorongoro</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%203-Day%20Safari" target="_blank" rel="noopener">3-Day Tarangire, Manyara &amp; Ngorongoro Safari</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>3 Days / 2 Nights</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
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
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Serengeti · Ngorongoro · Tarangire</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%207-Day%20Safari" target="_blank" rel="noopener">7-Day Classic Serengeti &amp; Ngorongoro Safari</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>7 Days / 6 Nights</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-3.png" alt="Birdwatching" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Northern Circuit</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%20Birdwatching%20Safari" target="_blank" rel="noopener">Birdwatching Focus Safari</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>Custom Duration</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-xl-4">
              <div class="tour-package-box style-3 bg-white-color">
                <div class="tour-package-thumb">
                  <img src="assets/img/tour-packages/tour-package-3-4.png" alt="Photography" class="w-100" />
                </div>
                <div class="tour-package-content">
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Serengeti · Ngorongoro</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%20Photography%20Safari" target="_blank" rel="noopener">Professional Photography Safari</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>Custom Duration</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
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
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Northern Circuit</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%20Family%20Safari" target="_blank" rel="noopener">Family-Friendly Northern Circuit Safari</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>Custom Duration</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
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
                  <div class="location"><i class="fa-sharp fa-light fa-location-dot"></i><span>Zanzibar Archipelago</span></div>
                  <h5 class="title line-clamp-2"><a href="https://wa.me/255783591810?text=Quote%20for%20Zanzibar%20Add-on" target="_blank" rel="noopener">Zanzibar Beach Add-on</a></h5>
                  <div class="tour-package-footer">
                    <div class="tour-duration"><span>3–7 Days</span></div>
                    <div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="text-center mt-60 btn-trigger btn-bounce">
            <a href="https://wa.me/255783591810" class="vs-btn style4" target="_blank" rel="noopener"><span>Chat on WhatsApp</span></a>
          </div>
"""

ITINERARIES = """
      <section class="space-extra-bottom">
        <div class="container">
          <div class="row mb-4">
            <div class="col-lg-8 mx-auto text-center">
              <span class="sec-subtitle">Sample Itineraries</span>
              <h2 class="sec-title">What Your Safari Can Look Like</h2>
              <p>All trips are private and fully customizable. Park fees, meals, guide, pop-up roof Land Cruiser, and accommodation are included. Request a quote for your dates.</p>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="bg-white-color p-4 h-100" style="border:1px solid #e8e8e8;">
                <h4>3-Day Tarangire, Manyara &amp; Ngorongoro</h4>
                <ul class="mt-3">
                  <li><strong>Day 1:</strong> Arusha pickup → Tarangire National Park (elephants &amp; baobabs) → overnight nearby</li>
                  <li><strong>Day 2:</strong> Lake Manyara game drive (tree-climbing lions &amp; birdlife) → continue to Ngorongoro area</li>
                  <li><strong>Day 3:</strong> Full-day Ngorongoro Crater descent → return to Arusha</li>
                </ul>
                <a class="vs-btn style8 mt-3" href="https://wa.me/255783591810?text=Quote%20for%203-Day%20Safari" target="_blank" rel="noopener">Request 3-Day Quote</a>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="bg-white-color p-4 h-100" style="border:1px solid #e8e8e8;">
                <h4>7-Day Classic Serengeti &amp; Ngorongoro</h4>
                <ul class="mt-3">
                  <li><strong>Day 1:</strong> Arusha → Tarangire National Park</li>
                  <li><strong>Day 2:</strong> Lake Manyara → Ngorongoro Highlands</li>
                  <li><strong>Day 3:</strong> Ngorongoro Crater full day</li>
                  <li><strong>Days 4–6:</strong> Serengeti National Park (migration / Big Five game drives)</li>
                  <li><strong>Day 7:</strong> Morning game drive → return to Arusha</li>
                </ul>
                <a class="vs-btn style8 mt-3" href="https://wa.me/255783591810?text=Quote%20for%207-Day%20Safari" target="_blank" rel="noopener">Request 7-Day Quote</a>
              </div>
            </div>
          </div>
          <div class="row mt-4">
            <div class="col-12">
              <div class="p-4" style="background:#2D4A2B;color:#fff;">
                <h5 class="text-white">Included</h5>
                <p class="mb-2 text-white">Park fees · Meals &amp; bottled water · English-speaking guide · Private 4x4 Land Cruiser · Accommodation as booked · AMREF Flying Doctors cover</p>
                <h5 class="text-white mt-3">Not included</h5>
                <p class="mb-0 text-white">Flights · Visas · Tips · Travel insurance · Alcoholic/soft drinks at lodges · Personal extras</p>
              </div>
            </div>
          </div>
        </div>
      </section>
"""


def rebuild_trips() -> None:
    path = BASE / "trips.html"
    text = path.read_text(encoding="utf-8")
    start = text.find('<div class="row g-4">')
    end = text.find("<!--================= Tour Package Area end")
    if start == -1 or end == -1:
        raise SystemExit("Could not locate trips package section")
    old_section_end = text.find("</section>", start, end)
    if old_section_end == -1:
        raise SystemExit("Could not locate trips section close")
    rebuilt = (
        text[:start]
        + PACKAGES
        + "\n        </div>\n      </section>\n"
        + ITINERARIES
        + "\n      "
        + text[old_section_end + len("</section>") :]
    )
    path.write_text(rebuilt, encoding="utf-8")
    print("trips.html packages + itineraries rebuilt")


def clean_destination_details() -> None:
    path = BASE / "destination-details.html"
    dd = path.read_text(encoding="utf-8")
    dd = dd.replace(
        "See Gaudi's works and Sagrada Família in Barcelona",
        "Witness the Great Migration and Big Five on the Serengeti plains",
    )
    dd = dd.replace(
        "reat Pyramids of Cheops, Chefren, and Mykerinus,\n                          alongside the well",
        "Explore Maasai culture and bird-rich wetlands around Lake Manyara",
    )
    dd = dd.replace(
        "linens share provid disg specialized deep unseen unseen\n                        echngy mites client.",
        "Join SHOVELER SAFARI for a private, expert-led journey across Tanzania's Northern Circuit — tailored to couples, families, and small groups.",
    )
    path.write_text(dd, encoding="utf-8")
    print("destination-details cleaned")


def clean_pricing() -> None:
    for name in [
        "index.html",
        "index-3.html",
        "trips.html",
        "about.html",
        "activities.html",
        "destinations.html",
    ]:
        path = BASE / name
        if not path.exists():
            continue
        t = path.read_text(encoding="utf-8")
        t2 = re.sub(
            r'<div class="pricing-info fw-medium">\s*(?:Quote|From)?\s*<del[^>]*>.*?</del>\s*<h5 class="new-price">.*?</h5>\s*</div>',
            '<div class="pricing-info fw-medium"><h5 class="new-price">Request Quote</h5></div>',
            t,
            flags=re.DOTALL,
        )
        t2 = t2.replace('<del class="text-theme-color fw-semibold">Request Quote</del>', "")
        if t2 != t:
            path.write_text(t2, encoding="utf-8")
            print("pricing cleaned", name)


def main() -> None:
    rebuild_trips()
    clean_destination_details()
    clean_pricing()
    (BASE / "index-3.html").write_text(
        (BASE / "index.html").read_text(encoding="utf-8"), encoding="utf-8"
    )
    print("synced index-3")


if __name__ == "__main__":
    main()
