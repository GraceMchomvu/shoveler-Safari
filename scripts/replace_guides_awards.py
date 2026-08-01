from pathlib import Path

path = Path(__file__).resolve().parents[1] / "about.html"
text = path.read_text(encoding="utf-8")
start = text.index("      <!--================= Travel-guides start =================-->")
end = text.index("      <!--================= Awards Area end =================-->") + len(
    "      <!--================= Awards Area end =================-->"
)

replacement = """      <!--================= The Shoveler Way =================-->
      <section class="shoveler-way space">
        <div class="container">
          <div class="row">
            <div class="col-lg-8 mx-auto">
              <div class="title-area text-center">
                <span class="sec-subtitle fade-anim" data-direction="top"
                  >How we travel</span
                >
                <h2 class="sec-title fade-anim" data-direction="bottom">
                  The Shoveler way
                </h2>
                <p class="shoveler-way__lead">
                  Private safaris from Arusha — shaped around wildlife, birdlife, and the pace that suits you.
                </p>
              </div>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-md-6 col-xl-3 fade-anim" data-delay="0.25">
              <article class="shoveler-way__card">
                <span class="shoveler-way__num">01</span>
                <h3>Private by design</h3>
                <p>
                  Your vehicle, your schedule. No shared buses — just space to watch, photograph, and stay as long as the moment deserves.
                </p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3 fade-anim" data-delay="0.35">
              <article class="shoveler-way__card">
                <span class="shoveler-way__num">02</span>
                <h3>Local expertise</h3>
                <p>
                  English-speaking guides who know the Northern Circuit tracks, seasons, and where wildlife gathers at each time of day.
                </p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3 fade-anim" data-delay="0.45">
              <article class="shoveler-way__card">
                <span class="shoveler-way__num">03</span>
                <h3>Birdwatching focus</h3>
                <p>
                  From flamingos to forest specialists — itineraries that leave room for serious birding alongside classic game drives.
                </p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3 fade-anim" data-delay="0.55">
              <article class="shoveler-way__card">
                <span class="shoveler-way__num">04</span>
                <h3>Built around you</h3>
                <p>
                  Tell us what you want to see. We craft the route, lodges, and activities — then refine everything before you fly.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
      <!--================= The Shoveler Way end =================-->

      <!--================= What's Included =================-->
      <section class="shoveler-included space">
        <div class="container">
          <div class="row align-items-end g-4 mb-4 mb-lg-5">
            <div class="col-lg-7">
              <div class="title-area text-center text-lg-start mb-0">
                <span class="sec-subtitle fade-anim" data-direction="top"
                  >Before you book</span
                >
                <h2 class="sec-title fade-anim" data-direction="bottom">
                  What’s typically included
                </h2>
              </div>
            </div>
            <div class="col-lg-5">
              <p class="shoveler-included__lead mb-0">
                Clear packages so you know what you’re getting. Exact inclusions are confirmed with your quote — every safari is tailored.
              </p>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.25">
              <div class="shoveler-included__item">
                <figure class="shoveler-included__media">
                  <img src="./assets/img/client/pkg-3day.jpg" alt="Safari vehicle on game drive" />
                </figure>
                <div class="shoveler-included__body">
                  <h3>Private 4×4 &amp; guide</h3>
                  <p>Dedicated safari vehicle with a professional English-speaking guide for your party.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.35">
              <div class="shoveler-included__item">
                <figure class="shoveler-included__media">
                  <img src="./assets/img/client/pkg-7day.jpg" alt="Wildlife viewing in Tanzania" />
                </figure>
                <div class="shoveler-included__body">
                  <h3>Park fees &amp; game drives</h3>
                  <p>National park and conservation fees arranged as listed in your itinerary, plus daily game drives.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.45">
              <div class="shoveler-included__item">
                <figure class="shoveler-included__media">
                  <img src="./assets/img/client/pkg-family.jpg" alt="Safari lodge experience" />
                </figure>
                <div class="shoveler-included__body">
                  <h3>Lodges &amp; meals</h3>
                  <p>Handpicked stays matched to your budget, with meals as specified in your package details.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.55">
              <div class="shoveler-included__item">
                <figure class="shoveler-included__media">
                  <img src="./assets/img/client/pkg-birdwatching.jpg" alt="Birdwatching safari" />
                </figure>
                <div class="shoveler-included__body">
                  <h3>Specialist experiences</h3>
                  <p>Birdwatching, photography pacing, cultural visits, or family-friendly pacing — built into the plan.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.65">
              <div class="shoveler-included__item">
                <figure class="shoveler-included__media">
                  <img src="./assets/img/client/serengeti-dest.jpg" alt="Arusha departure" />
                </figure>
                <div class="shoveler-included__body">
                  <h3>Arusha transfers</h3>
                  <p>Airport or hotel pick-up and drop-off in Arusha when your itinerary includes them.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-4 fade-anim" data-delay="0.75">
              <div class="shoveler-included__item shoveler-included__item--cta">
                <div class="shoveler-included__body">
                  <h3>Ready to plan yours?</h3>
                  <p>Share your dates and interests — we’ll send a tailored outline and quote.</p>
                  <div class="shoveler-included__actions">
                    <a href="contact.html" class="vs-btn style8"><span>Request a quote</span></a>
                    <a
                      href="https://wa.me/255783591810"
                      class="shoveler-included__wa"
                      target="_blank"
                      rel="noopener"
                      >WhatsApp us</a
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!--================= What's Included end =================-->"""

path.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
print("ok", path)
