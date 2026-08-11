/**
 * Northern Shoveler Adventure — multilingual UI (EN / FR / DE / IT)
 * Loads after shoveler-i18n-dict.js. Preference saved in localStorage.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "shoveler_lang";
  var SUPPORTED = ["en", "fr", "de", "it"];

  var BASE = {
    Home: { fr: "Accueil", de: "Startseite", it: "Home" },
    About: { fr: "À propos", de: "Über uns", it: "Chi siamo" },
    "About Us": { fr: "À propos", de: "Über uns", it: "Chi siamo" },
    Destinations: { fr: "Destinations", de: "Reiseziele", it: "Destinazioni" },
    Safaris: { fr: "Safaris", de: "Safaris", it: "Safari" },
    Activities: { fr: "Activités", de: "Aktivitäten", it: "Attività" },
    Blog: { fr: "Blog", de: "Blog", it: "Blog" },
    Contact: { fr: "Contact", de: "Kontakt", it: "Contatti" },
    FAQ: { fr: "FAQ", de: "FAQ", it: "FAQ" },
    Admin: { fr: "Admin", de: "Admin", it: "Admin" },
    Language: { fr: "Langue", de: "Sprache", it: "Lingua" },
    Search: { fr: "Rechercher", de: "Suchen", it: "Cerca" },
    "Open menu": { fr: "Ouvrir le menu", de: "Menü öffnen", it: "Apri menu" },
    "Request a Quote": { fr: "Demander un devis", de: "Angebot anfordern", it: "Richiedi un preventivo" },
  };

  var T = Object.assign({}, BASE, window.SHOVELER_I18N_DICT || {});
  var KEYS_BY_LEN = Object.keys(T).sort(function (a, b) {
    return b.length - a.length;
  });

  var PAGE_TITLES = {
    "/": {
      en: "Northern Shoveler Adventure | Tanzania Safari Tours | Arusha",
      fr: "Northern Shoveler Adventure | Safaris en Tanzanie | Arusha",
      de: "Northern Shoveler Adventure | Tansania-Safaris | Arusha",
      it: "Northern Shoveler Adventure | Safari in Tanzania | Arusha",
    },
    "/about": {
      en: "About Us | Northern Shoveler Adventure",
      fr: "À propos | Northern Shoveler Adventure",
      de: "Über uns | Northern Shoveler Adventure",
      it: "Chi siamo | Northern Shoveler Adventure",
    },
    "/contact": {
      en: "Contact | Northern Shoveler Adventure",
      fr: "Contact | Northern Shoveler Adventure",
      de: "Kontakt | Northern Shoveler Adventure",
      it: "Contatti | Northern Shoveler Adventure",
    },
    "/trips": {
      en: "Safaris | Northern Shoveler Adventure",
      fr: "Safaris | Northern Shoveler Adventure",
      de: "Safaris | Northern Shoveler Adventure",
      it: "Safari | Northern Shoveler Adventure",
    },
    "/destinations": {
      en: "Destinations | Northern Shoveler Adventure",
      fr: "Destinations | Northern Shoveler Adventure",
      de: "Reiseziele | Northern Shoveler Adventure",
      it: "Destinazioni | Northern Shoveler Adventure",
    },
    "/faq": {
      en: "FAQ | Northern Shoveler Adventure",
      fr: "FAQ | Northern Shoveler Adventure",
      de: "FAQ | Northern Shoveler Adventure",
      it: "FAQ | Northern Shoveler Adventure",
    },
    "/activities": {
      en: "Activities | Northern Shoveler Adventure",
      fr: "Activités | Northern Shoveler Adventure",
      de: "Aktivitäten | Northern Shoveler Adventure",
      it: "Attività | Northern Shoveler Adventure",
    },
    "/blog": {
      en: "Blog | Northern Shoveler Adventure",
      fr: "Blog | Northern Shoveler Adventure",
      de: "Blog | Northern Shoveler Adventure",
      it: "Blog | Northern Shoveler Adventure",
    },
  };

  var textOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var elOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  function normalizePath() {
    var p = location.pathname.replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
    if (p === "/index") p = "/";
    return p;
  }

  function detectLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && SUPPORTED.indexOf(q) !== -1) return q;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;
    return "en";
  }

  function collapse(s) {
    return String(s || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tr(en, lang) {
    if (!en || lang === "en") return en;
    var row = T[en];
    if (row && row[lang]) return row[lang];
    return en;
  }

  function getTextOriginal(node) {
    if (textOriginals) {
      if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
      return textOriginals.get(node);
    }
    return node.nodeValue;
  }

  function translateTextNodes(lang) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        var tag = node.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "CODE" || tag === "SVG") {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.parentElement.closest(".shoveler-lang, .logo, .header-logo img")) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var original = getTextOriginal(node);
      var leading = original.match(/^\s*/)[0];
      var trailing = original.match(/\s*$/)[0];
      var core = collapse(original);
      if (lang === "en") {
        node.nodeValue = original;
        return;
      }
      var translated = tr(core, lang);
      if (translated === core) translated = tr(original.trim(), lang);
      if (translated !== core && translated !== original.trim()) {
        node.nodeValue = leading + translated + trailing;
      } else {
        node.nodeValue = original;
      }
    });
  }

  /** Translate leaf-ish blocks whose full text matches a dictionary key (long paragraphs). */
  function translateBlocks(lang) {
    var els = document.body.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,li,label,button,a,span,td,th,figcaption,blockquote,dt,dd"
    );
    Array.prototype.forEach.call(els, function (el) {
      if (el.closest(".shoveler-lang, script, style, .logo")) return;
      // Skip containers that have nested interactive/block structure beyond BR/I/STRONG/etc.
      var childEls = el.children;
      for (var i = 0; i < childEls.length; i++) {
        var ct = childEls[i].tagName;
        if (ct !== "BR" && ct !== "I" && ct !== "B" && ct !== "STRONG" && ct !== "EM" && ct !== "SPAN" && ct !== "SMALL" && ct !== "SVG" && ct !== "PATH") {
          return;
        }
        // Don't rewrite anchors that wrap complex spans with their own dict keys — text nodes handle them
        if (el.tagName === "A" && childEls.length) return;
        if (el.tagName === "SPAN" && childEls.length) return;
      }

      if (elOriginals && !elOriginals.has(el)) {
        elOriginals.set(el, el.innerHTML);
      }
      var originalHtml = elOriginals ? elOriginals.get(el) : el.innerHTML;
      var core = collapse(el.textContent);
      if (!core || core.length < 2) return;

      if (lang === "en") {
        el.innerHTML = originalHtml;
        return;
      }

      var translated = tr(core, lang);
      if (translated !== core) {
        // Preserve simple emphasis wrappers if original was plain-ish
        if (!/[<>]/.test(originalHtml.replace(/<br\s*\/?>/gi, ""))) {
          el.textContent = translated;
        } else if (el.children.length === 0) {
          el.textContent = translated;
        }
      }
    });
  }

  function translateAttrs(lang) {
    document.querySelectorAll("[placeholder]").forEach(function (el) {
      if (!el.dataset.i18nPh) el.dataset.i18nPh = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", lang === "en" ? el.dataset.i18nPh : tr(el.dataset.i18nPh, lang));
    });
    document.querySelectorAll("[title]").forEach(function (el) {
      if (el.closest(".shoveler-lang")) return;
      if (!el.dataset.i18nTitle) el.dataset.i18nTitle = el.getAttribute("title") || "";
      var src = el.dataset.i18nTitle;
      el.setAttribute("title", lang === "en" ? src : tr(src, lang) || src);
    });
    document.querySelectorAll("[aria-label]").forEach(function (el) {
      if (el.closest(".shoveler-lang")) return;
      if (!el.dataset.i18nAria) el.dataset.i18nAria = el.getAttribute("aria-label") || "";
      var src = el.dataset.i18nAria;
      el.setAttribute("aria-label", lang === "en" ? src : tr(src, lang) || src);
    });
    document.querySelectorAll("img[alt]").forEach(function (el) {
      if (!el.dataset.i18nAlt) el.dataset.i18nAlt = el.getAttribute("alt") || "";
      var src = el.dataset.i18nAlt;
      // Keep brand alts; translate descriptive ones when present in dict
      var out = lang === "en" ? src : tr(src, lang);
      el.setAttribute("alt", out);
    });
  }

  function translateTree(lang) {
    translateTextNodes(lang);
    translateBlocks(lang);
    translateAttrs(lang);

    var path = normalizePath();
    var titles = PAGE_TITLES[path];
    if (titles) document.title = titles[lang] || titles.en;
    document.documentElement.lang = lang === "en" ? "en" : lang;
  }

  function injectStyles() {
    if (document.getElementById("shoveler-i18n-css")) return;
    var css = document.createElement("style");
    css.id = "shoveler-i18n-css";
    css.textContent =
      ".shoveler-lang{position:relative;display:inline-flex;align-items:center;z-index:40;flex-shrink:0}" +
      ".shoveler-lang--beside-logo{margin-left:1.75rem}" +
      "@media (min-width:992px){.shoveler-lang--beside-logo{margin-left:2.25rem}}" +
      ".header-logo .shoveler-lang{align-self:center}" +
      ".shoveler-nav-brand{display:flex!important;align-items:center!important;gap:.65rem}" +
      ".shoveler-lang__btn{display:inline-flex;align-items:center;gap:.4rem;border:1px solid rgba(20,32,24,.16);" +
      "background:#fff;color:#142018;border-radius:999px;padding:.4rem .75rem;font:700 .78rem/1 'DM Sans',system-ui,sans-serif;" +
      "cursor:pointer;letter-spacing:.03em;box-shadow:0 1px 4px rgba(0,0,0,.08);-webkit-tap-highlight-color:transparent}" +
      ".shoveler-lang__btn:hover{background:#e8f0ea;border-color:#2f6b3a}" +
      ".shoveler-lang__menu{display:none;position:absolute;top:calc(100% + .4rem);left:0;min-width:10rem;" +
      "background:#fffaf2;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.22);padding:.35rem;list-style:none;margin:0;z-index:100}" +
      ".shoveler-lang.is-open .shoveler-lang__menu{display:block}" +
      ".shoveler-lang__menu button{width:100%;text-align:left;border:0;background:transparent;padding:.55rem .7rem;" +
      "border-radius:8px;font:600 .85rem/1.2 'DM Sans',system-ui,sans-serif;color:#142018;cursor:pointer}" +
      ".shoveler-lang__menu button:hover,.shoveler-lang__menu button[aria-current=true]{background:#e8f0ea;color:#2f6b3a}" +
      ".shoveler-lang--drawer{display:flex;width:100%;justify-content:center;margin:0 0 1rem;position:relative}" +
      ".shoveler-lang--drawer .shoveler-lang__menu{left:50%;right:auto;transform:translateX(-50%)}" +
      ".shoveler-lang-row{display:flex;gap:.45rem;justify-content:center;flex-wrap:wrap;margin:0 0 1.1rem;padding:0 .25rem}" +
      ".shoveler-lang-row button{border:1px solid rgba(20,32,24,.16);background:#fff;color:#142018;border-radius:999px;" +
      "padding:.55rem .85rem;font:700 .8rem/1 'DM Sans',system-ui,sans-serif;cursor:pointer;min-width:3rem}" +
      ".shoveler-lang-row button[aria-current=true],.shoveler-lang-row button:hover{background:#2f6b3a;color:#fff;border-color:#2f6b3a}" +
      "@media (max-width:991px){" +
      ".shoveler-lang--beside-logo{margin-left:.7rem!important;margin-right:auto!important}" +
      ".vs-header .header-logo{overflow:visible!important}" +
      ".shoveler-lang__btn{padding:.42rem .7rem;font-size:.75rem;min-height:2.4rem}" +
      ".shoveler-nav-brand .shoveler-lang{margin-left:.55rem}" +
      "}";
    document.head.appendChild(css);
  }

  function labels() {
    return [
      { code: "en", label: "English", short: "EN" },
      { code: "fr", label: "Français", short: "FR" },
      { code: "de", label: "Deutsch", short: "DE" },
      { code: "it", label: "Italiano", short: "IT" },
    ];
  }

  function syncSwitcherUI(lang) {
    var cur = labels().find(function (l) {
      return l.code === lang;
    });
    document.querySelectorAll(".shoveler-lang").forEach(function (root) {
      root.classList.remove("is-open");
      var btn = root.querySelector(".shoveler-lang__btn span");
      if (btn && cur) btn.textContent = cur.short;
      var toggle = root.querySelector(".shoveler-lang__btn");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      root.querySelectorAll(".shoveler-lang__menu button").forEach(function (b) {
        b.setAttribute("aria-current", b.dataset.lang === lang ? "true" : "false");
      });
    });
    document.querySelectorAll(".shoveler-lang-row button").forEach(function (b) {
      b.setAttribute("aria-current", b.dataset.lang === lang ? "true" : "false");
    });
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    translateTree(lang);
    syncSwitcherUI(lang);
    try {
      var url = new URL(location.href);
      if (lang === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function buildSwitcher(lang, extraClass) {
    var wrap = document.createElement("div");
    wrap.className = "shoveler-lang " + (extraClass || "");
    wrap.setAttribute("data-i18n-skip", "1");

    var cur = labels().find(function (l) {
      return l.code === lang;
    });
    wrap.innerHTML =
      '<button type="button" class="shoveler-lang__btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Language">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9s1.3-6.2 3.8-9z" stroke="currentColor" stroke-width="1.4"/></svg>' +
      "<span>" +
      (cur ? cur.short : "EN") +
      "</span></button>" +
      '<ul class="shoveler-lang__menu" role="listbox"></ul>';

    var menu = wrap.querySelector(".shoveler-lang__menu");
    labels().forEach(function (l) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.lang = l.code;
      b.textContent = l.label;
      b.setAttribute("aria-current", l.code === lang ? "true" : "false");
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        setLang(l.code);
      });
      li.appendChild(b);
      menu.appendChild(li);
    });

    var toggle = wrap.querySelector(".shoveler-lang__btn");
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      document.querySelectorAll(".shoveler-lang.is-open").forEach(function (other) {
        if (other !== wrap) other.classList.remove("is-open");
      });
      var open = wrap.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return wrap;
  }

  function buildLangRow(lang) {
    var row = document.createElement("div");
    row.className = "shoveler-lang-row";
    row.setAttribute("data-i18n-skip", "1");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Language");
    labels().forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.lang = l.code;
      b.textContent = l.short;
      b.setAttribute("aria-current", l.code === lang ? "true" : "false");
      b.addEventListener("click", function () {
        setLang(l.code);
      });
      row.appendChild(b);
    });
    return row;
  }

  function mountSwitcher(lang) {
    // 1) Main header — beside logo (desktop + mobile top bar)
    var headerLogo = document.querySelector(
      "main .sticky-wrapper .header-logo, main .header-bottom .header-logo, .vs-header .header-logo"
    );
    if (headerLogo && !headerLogo.querySelector(".shoveler-lang")) {
      var wrap = buildSwitcher(lang, "shoveler-lang--beside-logo");
      var mobileActions = headerLogo.querySelector(".shoveler-nav-mobile-actions");
      var logoAnchor = headerLogo.querySelector(":scope > a, a");
      if (mobileActions) headerLogo.insertBefore(wrap, mobileActions);
      else if (logoAnchor) logoAnchor.insertAdjacentElement("afterend", wrap);
      else headerLogo.appendChild(wrap);
    }

    // 2) Sticky #navbars brand (mobile after scroll / home sticky)
    var stickyBrand = document.querySelector("#navbars .shoveler-nav-brand");
    if (stickyBrand && !stickyBrand.querySelector(".shoveler-lang")) {
      stickyBrand.appendChild(buildSwitcher(lang, "shoveler-lang--navbars"));
    }

    // 3) Mobile slide-out drawer — big EN/FR/DE/IT taps under logo
    var drawerMenu = document.querySelector(".vs-menu-wrapper .vs-mobile-menu");
    var mobileLogo = document.querySelector(".vs-menu-wrapper .mobile-logo");
    if (drawerMenu && !document.querySelector(".shoveler-lang-row")) {
      var row = buildLangRow(lang);
      if (mobileLogo && mobileLogo.nextSibling) {
        mobileLogo.parentNode.insertBefore(row, mobileLogo.nextSibling);
      } else if (drawerMenu.parentNode) {
        drawerMenu.parentNode.insertBefore(row, drawerMenu);
      } else {
        drawerMenu.insertBefore(row, drawerMenu.firstChild);
      }
    }

    document.addEventListener(
      "click",
      function () {
        document.querySelectorAll(".shoveler-lang.is-open").forEach(function (root) {
          root.classList.remove("is-open");
          var t = root.querySelector(".shoveler-lang__btn");
          if (t) t.setAttribute("aria-expanded", "false");
        });
      },
      true
    );
  }

  function boot() {
    injectStyles();
    var lang = detectLang();
    mountSwitcher(lang);
    requestAnimationFrame(function () {
      setLang(lang);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.ShovelerI18n = {
    setLang: setLang,
    detectLang: detectLang,
    supported: SUPPORTED,
    dictSize: KEYS_BY_LEN.length,
  };
})();
