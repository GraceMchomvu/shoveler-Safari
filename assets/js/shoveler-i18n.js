/**
 * Northern Shoveler Adventure — multilingual UI (EN / FR / DE / IT)
 * Loads on every public page. Preference saved in localStorage.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "shoveler_lang";
  var SUPPORTED = ["en", "fr", "de", "it"];

  /** Exact English string → translations. Brand names stay English. */
  var T = {
    // Nav
    Home: { fr: "Accueil", de: "Startseite", it: "Home" },
    About: { fr: "À propos", de: "Über uns", it: "Chi siamo" },
    "About Us": { fr: "À propos", de: "Über uns", it: "Chi siamo" },
    "About us": { fr: "À propos", de: "Über uns", it: "Chi siamo" },
    Destinations: { fr: "Destinations", de: "Reiseziele", it: "Destinazioni" },
    Safaris: { fr: "Safaris", de: "Safaris", it: "Safari" },
    Activities: { fr: "Activités", de: "Aktivitäten", it: "Attività" },
    Blog: { fr: "Blog", de: "Blog", it: "Blog" },
    Contact: { fr: "Contact", de: "Kontakt", it: "Contatti" },
    "Contact Us": { fr: "Nous contacter", de: "Kontakt", it: "Contattaci" },
    FAQ: { fr: "FAQ", de: "FAQ", it: "FAQ" },
    Admin: { fr: "Admin", de: "Admin", it: "Admin" },

    // CTAs
    "Request a Quote": { fr: "Demander un devis", de: "Angebot anfordern", it: "Richiedi un preventivo" },
    "Explore safaris": { fr: "Découvrir les safaris", de: "Safaris entdecken", it: "Esplora i safari" },
    "WhatsApp quote": { fr: "Devis WhatsApp", de: "WhatsApp-Angebot", it: "Preventivo WhatsApp" },
    "Chat on WhatsApp": { fr: "Discuter sur WhatsApp", de: "Per WhatsApp chatten", it: "Chatta su WhatsApp" },
    "View All Destinations": { fr: "Voir toutes les destinations", de: "Alle Reiseziele ansehen", it: "Vedi tutte le destinazioni" },
    "Plan your dream safari": { fr: "Planifiez le safari de vos rêves", de: "Planen Sie Ihren Traumsafari", it: "Pianifica il safari dei tuoi sogni" },
    "Send Request": { fr: "Envoyer la demande", de: "Anfrage senden", it: "Invia richiesta" },
    "Book Now": { fr: "Réserver", de: "Jetzt buchen", it: "Prenota ora" },
    "Learn More": { fr: "En savoir plus", de: "Mehr erfahren", it: "Scopri di più" },
    "Read More": { fr: "Lire la suite", de: "Weiterlesen", it: "Leggi di più" },
    "Get Started": { fr: "Commencer", de: "Loslegen", it: "Inizia" },
    Submit: { fr: "Envoyer", de: "Senden", it: "Invia" },
    Search: { fr: "Rechercher", de: "Suchen", it: "Cerca" },
    "View Details": { fr: "Voir les détails", de: "Details ansehen", it: "Vedi dettagli" },
    "See Details": { fr: "Voir les détails", de: "Details ansehen", it: "Vedi dettagli" },

    // Hero / home
    Adventure: { fr: "Adventure", de: "Adventure", it: "Adventure" },
    "Private journeys across Tanzania": {
      fr: "Voyages privés à travers la Tanzanie",
      de: "Private Reisen durch Tansania",
      it: "Viaggi privati attraverso la Tanzania",
    },
    "Expert-led Northern Circuit safaris from Arusha — wildlife, birdlife, your pace.": {
      fr: "Safaris du Circuit Nord depuis Arusha — faune, oiseaux, à votre rythme.",
      de: "Northern-Circuit-Safaris ab Arusha — Wildlife, Vogelwelt, Ihr Tempo.",
      it: "Safari del Northern Circuit da Arusha — fauna, uccelli, al vostro ritmo.",
    },
    "About NORTHERN SHOVELER ADVENTURE": {
      fr: "À propos de NORTHERN SHOVELER ADVENTURE",
      de: "Über NORTHERN SHOVELER ADVENTURE",
      it: "Su NORTHERN SHOVELER ADVENTURE",
    },
    "Authentic Tanzania Safaris": {
      fr: "Safaris authentiques en Tanzanie",
      de: "Authentische Tansania-Safaris",
      it: "Safari autentici in Tanzania",
    },
    "Signature Tanzania Safaris": {
      fr: "Safaris signature en Tanzanie",
      de: "Signature-Safaris in Tansania",
      it: "Safari signature in Tanzania",
    },
    "Top Destinations": {
      fr: "Meilleures destinations",
      de: "Top-Reiseziele",
      it: "Destinazioni top",
    },
    "Safaris Organised": {
      fr: "Safaris organisés",
      de: "Organisierte Safaris",
      it: "Safari organizzati",
    },
    "Built around you": {
      fr: "Conçu autour de vous",
      de: "Auf Sie zugeschnitten",
      it: "Su misura per voi",
    },
    "Clear, fair quotes": {
      fr: "Devis clairs et justes",
      de: "Klare, faire Angebote",
      it: "Preventivi chiari e onesti",
    },
    "choose us": { fr: "nous choisir", de: "uns wählen", it: "sceglierci" },
    "Why choose us": {
      fr: "Pourquoi nous choisir",
      de: "Warum wir",
      it: "Perché sceglierci",
    },
    "Before you book": {
      fr: "Avant de réserver",
      de: "Vor der Buchung",
      it: "Prima di prenotare",
    },
    "After safari": { fr: "Après le safari", de: "Nach der Safari", it: "Dopo il safari" },
    "After the safari": {
      fr: "Après le safari",
      de: "Nach der Safari",
      it: "Dopo il safari",
    },

    // Form labels
    Adults: { fr: "Adultes", de: "Erwachsene", it: "Adulti" },
    Children: { fr: "Enfants", de: "Kinder", it: "Bambini" },
    "Check in date": { fr: "Date d'arrivée", de: "Anreisedatum", it: "Data di arrivo" },
    "Check out date": { fr: "Date de départ", de: "Abreisedatum", it: "Data di partenza" },
    Name: { fr: "Nom", de: "Name", it: "Nome" },
    "Your Name": { fr: "Votre nom", de: "Ihr Name", it: "Il tuo nome" },
    "Full Name": { fr: "Nom complet", de: "Vollständiger Name", it: "Nome completo" },
    Email: { fr: "E-mail", de: "E-Mail", it: "Email" },
    "Your Email": { fr: "Votre e-mail", de: "Ihre E-Mail", it: "La tua email" },
    Phone: { fr: "Téléphone", de: "Telefon", it: "Telefono" },
    Message: { fr: "Message", de: "Nachricht", it: "Messaggio" },
    "Your Message": { fr: "Votre message", de: "Ihre Nachricht", it: "Il tuo messaggio" },
    Subject: { fr: "Objet", de: "Betreff", it: "Oggetto" },
    Address: { fr: "Adresse", de: "Adresse", it: "Indirizzo" },
    "Address:": { fr: "Adresse :", de: "Adresse:", it: "Indirizzo:" },

    // Destinations / parks (keep place names; translate labels)
    Serengeti: { fr: "Serengeti", de: "Serengeti", it: "Serengeti" },
    Ngorongoro: { fr: "Ngorongoro", de: "Ngorongoro", it: "Ngorongoro" },
    Tarangire: { fr: "Tarangire", de: "Tarangire", it: "Tarangire" },
    "Lake Manyara": { fr: "Lac Manyara", de: "Lake Manyara", it: "Lago Manyara" },
    Zanzibar: { fr: "Zanzibar", de: "Sansibar", it: "Zanzibar" },
    Arusha: { fr: "Arusha", de: "Arusha", it: "Arusha" },

    // Misc UI
    "Days /": { fr: "Jours /", de: "Tage /", it: "Giorni /" },
    Nights: { fr: "Nuits", de: "Nächte", it: "Notti" },
    "All Rights Reserved.": {
      fr: "Tous droits réservés.",
      de: "Alle Rechte vorbehalten.",
      it: "Tutti i diritti riservati.",
    },
    "All Rights Reserved": {
      fr: "Tous droits réservés",
      de: "Alle Rechte vorbehalten",
      it: "Tutti i diritti riservati",
    },
    "Useful Links": { fr: "Liens utiles", de: "Nützliche Links", it: "Link utili" },
    "Quick Links": { fr: "Liens rapides", de: "Schnelllinks", it: "Link rapidi" },
    "Our Services": { fr: "Nos services", de: "Unsere Leistungen", it: "I nostri servizi" },
    Newsletter: { fr: "Newsletter", de: "Newsletter", it: "Newsletter" },
    Subscribe: { fr: "S'abonner", de: "Abonnieren", it: "Iscriviti" },
    "Get In Touch": { fr: "Entrer en contact", de: "Kontakt aufnehmen", it: "Mettiti in contatto" },
    "Send Message": { fr: "Envoyer le message", de: "Nachricht senden", it: "Invia messaggio" },
    "Write a Message": { fr: "Écrire un message", de: "Nachricht schreiben", it: "Scrivi un messaggio" },
    "Drop Us a Line": { fr: "Écrivez-nous", de: "Schreiben Sie uns", it: "Scrivici" },
    "Our Location": { fr: "Notre adresse", de: "Unser Standort", it: "Dove siamo" },
    "Call Us": { fr: "Appelez-nous", de: "Rufen Sie uns an", it: "Chiamaci" },
    "Email Us": { fr: "Écrivez-nous", de: "Mailen Sie uns", it: "Scrivici" },
    "Working Hours": { fr: "Horaires", de: "Öffnungszeiten", it: "Orari" },
    "Popular Tours": { fr: "Circuits populaires", de: "Beliebte Touren", it: "Tour popolari" },
    "Featured Safaris": { fr: "Safaris en vedette", de: "Empfohlene Safaris", it: "Safari in evidenza" },
    "Safari Packages": { fr: "Forfaits safari", de: "Safari-Pakete", it: "Pacchetti safari" },
    Days: { fr: "Jours", de: "Tage", it: "Giorni" },
    from: { fr: "à partir de", de: "ab", it: "da" },
    From: { fr: "À partir de", de: "Ab", it: "Da" },
    "per person": { fr: "par personne", de: "pro Person", it: "a persona" },
    "Per Person": { fr: "Par personne", de: "Pro Person", it: "A persona" },
    "Private safari": { fr: "Safari privé", de: "Private Safari", it: "Safari privato" },
    "Private Safari": { fr: "Safari privé", de: "Private Safari", it: "Safari privato" },
    "Group safari": { fr: "Safari de groupe", de: "Gruppensafari", it: "Safari di gruppo" },
    Testimonials: { fr: "Témoignages", de: "Kundenstimmen", it: "Testimonianze" },
    "What Our Guests Say": {
      fr: "Ce que disent nos clients",
      de: "Was unsere Gäste sagen",
      it: "Cosa dicono i nostri ospiti",
    },
    "Meet Our Team": { fr: "Notre équipe", de: "Unser Team", it: "Il nostro team" },
    "Our Story": { fr: "Notre histoire", de: "Unsere Geschichte", it: "La nostra storia" },
    "Who We Are": { fr: "Qui nous sommes", de: "Wer wir sind", it: "Chi siamo" },
    Gallery: { fr: "Galerie", de: "Galerie", it: "Galleria" },
    "Photo Gallery": { fr: "Galerie photos", de: "Fotogalerie", it: "Galleria foto" },
    Loading: { fr: "Chargement", de: "Laden", it: "Caricamento" },
    Close: { fr: "Fermer", de: "Schließen", it: "Chiudi" },
    Next: { fr: "Suivant", de: "Weiter", it: "Avanti" },
    Previous: { fr: "Précédent", de: "Zurück", it: "Indietro" },
    Menu: { fr: "Menu", de: "Menü", it: "Menu" },
    "Open Menu": { fr: "Ouvrir le menu", de: "Menü öffnen", it: "Apri menu" },
    "Back to Home": { fr: "Retour à l'accueil", de: "Zur Startseite", it: "Torna alla home" },
    "Page Not Found": { fr: "Page introuvable", de: "Seite nicht gefunden", it: "Pagina non trovata" },
    "Frequently Asked Questions": {
      fr: "Questions fréquentes",
      de: "Häufig gestellte Fragen",
      it: "Domande frequenti",
    },
    "Related Posts": { fr: "Articles connexes", de: "Ähnliche Beiträge", it: "Articoli correlati" },
    Comments: { fr: "Commentaires", de: "Kommentare", it: "Commenti" },
    Categories: { fr: "Catégories", de: "Kategorien", it: "Categorie" },
    Tags: { fr: "Tags", de: "Tags", it: "Tag" },
    "Recent Posts": { fr: "Articles récents", de: "Neueste Beiträge", it: "Articoli recenti" },
    "Active Traveller": { fr: "Voyageur actif", de: "Aktiver Reisender", it: "Viaggiatore attivo" },
    "Beach Escape": { fr: "Évasion plage", de: "Strandurlaub", it: "Fuga in spiaggia" },
    Birdwatching: { fr: "Observation des oiseaux", de: "Vogelbeobachtung", it: "Birdwatching" },
    "Birdwatching Focus": {
      fr: "Focus ornithologie",
      de: "Vogelbeobachtung im Fokus",
      it: "Focus birdwatching",
    },
    "Big Five": { fr: "Big Five", de: "Big Five", it: "Big Five" },
    Balloon: { fr: "Montgolfière", de: "Ballonfahrt", it: "Mongolfiera" },
    Beach: { fr: "Plage", de: "Strand", it: "Spiaggia" },
    Language: { fr: "Langue", de: "Sprache", it: "Lingua" },
    English: { fr: "Anglais", de: "Englisch", it: "Inglese" },
    Français: { fr: "Français", de: "Französisch", it: "Francese" },
    Deutsch: { fr: "Allemand", de: "Deutsch", it: "Tedesco" },
    Italiano: { fr: "Italien", de: "Italienisch", it: "Italiano" },
  };

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

  function tr(en, lang) {
    if (!en || lang === "en") return en;
    var row = T[en];
    if (row && row[lang]) return row[lang];
    return en;
  }

  var textOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  function getTextOriginal(node) {
    if (textOriginals) {
      if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
      return textOriginals.get(node);
    }
    return node.nodeValue;
  }

  function translateTree(lang) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        var tag = node.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "CODE") {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.parentElement.closest(".shoveler-lang")) return NodeFilter.FILTER_REJECT;
        var t = node.nodeValue;
        if (!t || !t.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var original = getTextOriginal(node);
      var leading = original.match(/^\s*/)[0];
      var trailing = original.match(/\s*$/)[0];
      var core = original.trim().replace(/\s+/g, " ");
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

    var path = normalizePath();
    var titles = PAGE_TITLES[path];
    if (titles) {
      document.title = titles[lang] || titles.en;
    }

    document.documentElement.lang = lang === "en" ? "en" : lang;
  }

  function injectStyles() {
    if (document.getElementById("shoveler-i18n-css")) return;
    var css = document.createElement("style");
    css.id = "shoveler-i18n-css";
    css.textContent =
      ".shoveler-lang{position:relative;display:inline-flex;align-items:center;z-index:60}" +
      ".shoveler-lang__btn{display:inline-flex;align-items:center;gap:.35rem;border:1px solid rgba(255,255,255,.35);" +
      "background:rgba(15,28,20,.55);color:#f4efe4;border-radius:999px;padding:.35rem .7rem;font:600 .78rem/1 'DM Sans',system-ui,sans-serif;" +
      "cursor:pointer;backdrop-filter:blur(8px);letter-spacing:.02em}" +
      ".shoveler-lang__btn:hover{background:rgba(15,28,20,.75)}" +
      ".shoveler-lang__menu{display:none;position:absolute;top:calc(100% + .4rem);right:0;min-width:9.5rem;" +
      "background:#fffaf2;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);padding:.35rem;list-style:none;margin:0}" +
      ".shoveler-lang.is-open .shoveler-lang__menu{display:block}" +
      ".shoveler-lang__menu button{width:100%;text-align:left;border:0;background:transparent;padding:.55rem .7rem;" +
      "border-radius:8px;font:600 .85rem/1.2 'DM Sans',system-ui,sans-serif;color:#142018;cursor:pointer}" +
      ".shoveler-lang__menu button:hover,.shoveler-lang__menu button[aria-current=true]{background:#e8f0ea;color:#2f6b3a}" +
      ".header-layout2 .shoveler-lang__btn,.shoveler-admin-btn ~ .shoveler-lang .shoveler-lang__btn," +
      ".header .shoveler-lang__btn{border-color:rgba(20,32,24,.18);background:rgba(255,255,255,.88);color:#142018}" +
      "@media (max-width:991px){.shoveler-lang{margin-left:.35rem}}";
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

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    translateTree(lang);
    var root = document.querySelector(".shoveler-lang");
    if (root) {
      root.classList.remove("is-open");
      var cur = labels().find(function (l) {
        return l.code === lang;
      });
      var btn = root.querySelector(".shoveler-lang__btn span");
      if (btn && cur) btn.textContent = cur.short;
      root.querySelectorAll(".shoveler-lang__menu button").forEach(function (b) {
        b.setAttribute("aria-current", b.dataset.lang === lang ? "true" : "false");
      });
    }
    // Keep URL shareable
    try {
      var url = new URL(location.href);
      if (lang === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function mountSwitcher(lang) {
    if (document.querySelector(".shoveler-lang")) return;
    var wrap = document.createElement("div");
    wrap.className = "shoveler-lang";
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
      b.addEventListener("click", function () {
        setLang(l.code);
      });
      li.appendChild(b);
      menu.appendChild(li);
    });

    var toggle = wrap.querySelector(".shoveler-lang__btn");
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      wrap.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });

    var host =
      document.querySelector(".header-btns") ||
      document.querySelector(".header-layout2 .header-right") ||
      document.querySelector(".menu-right") ||
      document.querySelector("header .container .row") ||
      document.querySelector("header");

    var admin = document.querySelector(".shoveler-admin-link, .shoveler-admin-btn");
    if (admin && admin.parentElement) {
      admin.parentElement.insertBefore(wrap, admin.nextSibling);
    } else if (host) {
      host.appendChild(wrap);
    } else {
      wrap.style.position = "fixed";
      wrap.style.top = "1rem";
      wrap.style.right = "1rem";
      document.body.appendChild(wrap);
    }
  }

  function boot() {
    injectStyles();
    var lang = detectLang();
    mountSwitcher(lang);
    // Defer one frame so dynamic widgets settle
    requestAnimationFrame(function () {
      setLang(lang);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.ShovelerI18n = { setLang: setLang, detectLang: detectLang, supported: SUPPORTED };
})();
