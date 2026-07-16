from pathlib import Path

HERO = r'''      <!--================= Hero Area Start =================-->
      <section class="z-index-common overflow-clip shoveler-hero" aria-label="SHOVELER SAFARI hero">
        <div class="swiper shoveler-hero__slider">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <img src="assets/img/client/hero-01.jpg" alt="Wildlife safari with SHOVELER SAFARI" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-02.jpg" alt="Tanzania landscape with SHOVELER SAFARI" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-03.jpg" alt="Northern Circuit safari experience" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-04.jpg" alt="Private game drive in Tanzania" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-05.jpg" alt="Big Five wildlife encounter" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-06.jpg" alt="Golden hour on safari" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-07.jpg" alt="Birdlife and open plains" />
            </div>
            <div class="swiper-slide">
              <img src="assets/img/client/hero-08.jpg" alt="Explore Tanzania with SHOVELER SAFARI" />
            </div>
          </div>
        </div>

        <div class="shoveler-hero__veil" aria-hidden="true"></div>

        <div class="shoveler-hero__stage">
          <div class="shoveler-hero__copy">
            <p class="shoveler-hero__brand">SHOVELER</p>
            <p class="shoveler-hero__mark">SAFARI</p>
            <h1 class="shoveler-hero__headline">Private journeys across Tanzania</h1>
            <p class="shoveler-hero__lede">
              Expert-led Northern Circuit safaris from Arusha — wildlife, birdlife, your pace.
            </p>
            <div class="shoveler-hero__cta">
              <a href="#hero-quote" class="shoveler-hero__btn">Request a Quote</a>
              <a href="trips.html" class="shoveler-hero__link">View safaris</a>
            </div>
          </div>

          <div class="shoveler-hero__meta" aria-hidden="true">
            <div class="shoveler-hero__fraction">
              <span class="shoveler-hero__current">01</span>
              <span class="shoveler-hero__sep">/</span>
              <span class="shoveler-hero__total">08</span>
            </div>
            <div class="shoveler-hero__progress">
              <span class="shoveler-hero__progress-bar"></span>
            </div>
          </div>
        </div>

        <form
          id="hero-quote"
          class="shoveler-hero__rail"
          action="https://wa.me/255783591810"
          method="get"
        >
          <div class="shoveler-hero__rail-label">
            <span>Plan your safari</span>
            <strong>Request a quote</strong>
          </div>
          <div class="shoveler-hero__fields">
            <label class="shoveler-hero__field">
              <span>Destination</span>
              <input
                type="text"
                name="destination"
                id="hero-destination"
                placeholder="Serengeti, Ngorongoro…"
                autocomplete="off"
              />
            </label>
            <label class="shoveler-hero__field">
              <span>Travelers</span>
              <select name="travelers" id="hero-travelers">
                <option value="2">2 adults</option>
                <option value="1">1 adult</option>
                <option value="3">3 adults</option>
                <option value="4">4 adults</option>
                <option value="family">Family</option>
              </select>
            </label>
            <label class="shoveler-hero__field">
              <span>Travel dates</span>
              <input
                type="text"
                name="dates"
                id="hero-dates"
                class="datepicker"
                placeholder="Select dates"
                autocomplete="off"
              />
            </label>
          </div>
          <button type="submit" class="shoveler-hero__rail-btn">
            Request a Quote
          </button>
        </form>
      </section>
      <!--================= Hero Area End =================-->'''

SCRIPT = r'''    <script>
      (function () {
        var el = document.querySelector(".shoveler-hero__slider");
        if (!el || typeof Swiper === "undefined") return;

        var current = document.querySelector(".shoveler-hero__current");
        var bar = document.querySelector(".shoveler-hero__progress-bar");
        var totalSlides = el.querySelectorAll(".swiper-slide").length;

        function pad(n) {
          return String(n).padStart(2, "0");
        }

        function setProgress(swiper) {
          var idx = (swiper.realIndex || 0) + 1;
          if (current) current.textContent = pad(idx);
          if (bar) {
            bar.style.transform = "scaleX(" + idx / totalSlides + ")";
          }
        }

        var swiper = new Swiper(el, {
          effect: "fade",
          fadeEffect: { crossFade: true },
          loop: true,
          speed: 1600,
          autoplay: {
            delay: 5200,
            disableOnInteraction: false,
          },
          allowTouchMove: true,
          on: {
            init: setProgress,
            slideChange: setProgress,
          },
        });

        var form = document.getElementById("hero-quote");
        if (form) {
          form.addEventListener("submit", function (e) {
            e.preventDefault();
            var dest = (document.getElementById("hero-destination") || {}).value || "";
            var travelers = (document.getElementById("hero-travelers") || {}).value || "";
            var dates = (document.getElementById("hero-dates") || {}).value || "";
            var msg =
              "Hello SHOVELER SAFARI, I would like a safari quote." +
              (dest ? " Destination: " + dest + "." : "") +
              (travelers ? " Travelers: " + travelers + "." : "") +
              (dates ? " Dates: " + dates + "." : "");
            window.open(
              "https://wa.me/255783591810?text=" + encodeURIComponent(msg),
              "_blank",
              "noopener"
            );
          });
        }
      })();
    </script>'''

OLD_SCRIPT_START = "    <script>\n      (function () {\n        var el = document.querySelector(\".shoveler-hero__slider\");"

def replace_hero(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    start = text.index("      <!--================= Hero Area Start =================-->")
    end = text.index("      <!--================= Hero Area End =================-->") + len(
        "      <!--================= Hero Area End =================-->"
    )
    text = text[:start] + HERO + text[end:]

    # Replace existing shoveler hero swiper script block
    s = text.index(OLD_SCRIPT_START)
    # find closing of that IIFE script
    e = text.index("</script>", s) + len("</script>")
    text = text[:s] + SCRIPT + text[e:]
    path.write_text(text, encoding="utf-8")
    print("updated", path.name)


root = Path(__file__).resolve().parents[1]
for name in ("index.html", "index-3.html"):
    replace_hero(root / name)
