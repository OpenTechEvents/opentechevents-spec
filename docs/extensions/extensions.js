/* Suggested extensions — renders data/suggested-extensions.json, whose adoption counts are
   written by scripts/scan-extensions.mjs against the real registered feeds. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with every other page: pick a language once

  var UI = {
    en: {
      skip: "Skip to content",
      pill: "Draft 0.x",
      draft: "Fields can still change, be renamed or be dropped.",
      follow: "Follow the discussion",
      navSpec: "How it works",
      navAdopt: "Adopt it",
      navExamples: "Examples",
      navReference: "Reference",
      navDevelopers: "Developers",
      navTools: "Tools",
      navPriorArt: "Prior art",
      navExtensions: "Extensions",
      navMenu: "Menu",
      eyebrow: "Suggested extensions",
      title: "Fields that are not in the core — yet",
      lead: "The schemas do not forbid extra fields, on purpose: you can use any of these today and your document stays valid. Each one has a <strong>recommended shape</strong> so that early adopters converge instead of each inventing their own, and an <strong>adoption count</strong> measured from the registered adopter feeds.",
      promise: "The counts are written by a script that reads the real feeds, never by hand. A field graduates into the core through a normal proposal, once its graduation question has an answer — and using it is what produces that answer.",
      ctaReference: "Field reference",
      ctaRules: "The two kinds of extension",
      footerNote: "Adoption counts are measured from the registered feeds. Draft specification — fields may change.",
      shape: "Recommended shape",
      graduates: "Graduates when",
      feeds: "adopter feeds",
      feedsOne: "adopter feed",
      none: "not seen in any feed yet",
      asOf: "Adoption counts measured on {date}.",
      asOfNever: "Adoption counts have not been measured yet.",
      scopeEvent: "event field",
      scopeFeed: "feed field",
      failed: "The extensions registry could not be loaded.",
    },
    es: {
      skip: "Saltar al contenido",
      pill: "Borrador 0.x",
      draft: "Los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navExamples: "Ejemplos",
      navReference: "Referencia",
      navDevelopers: "Desarrolladores",
      navTools: "Herramientas",
      navPriorArt: "Trabajo previo",
      navExtensions: "Extensiones",
      navMenu: "Menú",
      eyebrow: "Extensiones sugeridas",
      title: "Campos que todavía no están en el core",
      lead: "Los esquemas no prohíben campos extra, a propósito: puedes usar cualquiera de estos hoy y tu documento sigue siendo válido. Cada uno tiene una <strong>forma recomendada</strong> para que quien lo adopte pronto converja en vez de inventarse la suya, y un <strong>recuento de adopción</strong> medido sobre los feeds registrados.",
      promise: "Los recuentos los escribe un script que lee los feeds reales, nunca se editan a mano. Un campo entra en el core por una propuesta normal, en cuanto su pregunta de graduación tiene respuesta — y usarlo es justo lo que produce esa respuesta.",
      ctaReference: "Referencia de campos",
      ctaRules: "Los dos tipos de extensión",
      footerNote: "Los recuentos de adopción se miden sobre los feeds registrados. Especificación en borrador: los campos pueden cambiar.",
      shape: "Forma recomendada",
      graduates: "Se gradúa cuando",
      feeds: "feeds la usan",
      feedsOne: "feed la usa",
      none: "todavía no aparece en ningún feed",
      asOf: "Recuentos de adopción medidos el {date}.",
      asOfNever: "Todavía no se ha medido la adopción.",
      scopeEvent: "campo de evento",
      scopeFeed: "campo de feed",
      failed: "No se ha podido cargar el registro de extensiones.",
    },
  };

  var state = { lang: FALLBACK, model: null };
  var dom = { list: document.getElementById("list"), asOf: document.getElementById("asof") };

  function pickLang() {
    var qs = new URLSearchParams(location.search).get("lang");
    if (qs && SUPPORTED.indexOf(qs) !== -1) return qs;
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || FALLBACK];
    for (var i = 0; i < prefs.length; i++) {
      var base = String(prefs[i]).toLowerCase().split("-")[0];
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
    return FALLBACK;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /**
   * An entry's prose in the reader's language. The registry keeps English in the field itself
   * and other languages under `translations`, the same shape the spec uses for local text — so
   * a newly added entry with no translation yet shows in English instead of showing nothing.
   */
  function text(ext, key) {
    var translated = ext.translations && ext.translations[state.lang];
    return (translated && translated[key]) || ext[key] || "";
  }

  // Registry prose names fields in `backticks` and quotes questions in 'single quotes';
  // only the backticks are markup.
  function inlineCode(value) {
    var frag = document.createDocumentFragment();
    String(value).split(/`([^`]+)`/).forEach(function (part, i) {
      frag.appendChild(i % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return frag;
  }

  function applyUi() {
    var ui = UI[state.lang];
    document.documentElement.lang = state.lang;
    document.title = ui.eyebrow + " — OTE Spec";

    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = ui[node.getAttribute("data-t")];
      // Only our own strings land here, and two of them carry inline <strong>.
      if (value) node.innerHTML = value;
    });
    document.querySelectorAll("[data-t-aria]").forEach(function (node) {
      node.setAttribute("aria-label", ui[node.getAttribute("data-t-aria")]);
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });
  }

  function renderCount(ext, ui) {
    var feeds = ext.observedAdoption ? ext.observedAdoption.feeds : 0;
    if (!feeds) return el("span", "ext-count ext-count-zero", ui.none);
    var wrap = el("span", "ext-count");
    wrap.appendChild(el("strong", null, String(feeds)));
    wrap.appendChild(document.createTextNode(" " + (feeds === 1 ? ui.feedsOne : ui.feeds)));
    return wrap;
  }

  function render() {
    applyUi();
    if (!state.model) return;
    var ui = UI[state.lang];

    dom.list.replaceChildren();
    var measured = null;

    state.model.extensions.forEach(function (ext) {
      if (ext.observedAdoption && ext.observedAdoption.asOf) measured = ext.observedAdoption.asOf;

      var card = el("section", "ext");
      // `speakers[].affiliation` is a path, not a word: the id keeps the dots and brackets out.
      card.id = "ext-" + ext.name.replace(/[^A-Za-z0-9]+/g, "-").replace(/-+$/, "");

      card.appendChild(el("h2", null, ext.name));

      var meta = el("p", "ext-meta");
      meta.appendChild(el("span", "status", ext.status));
      meta.appendChild(document.createTextNode(" · "));
      meta.appendChild(document.createTextNode(ext.scope === "feed" ? ui.scopeFeed : ui.scopeEvent));
      meta.appendChild(document.createTextNode(" · "));
      meta.appendChild(renderCount(ext, ui));
      card.appendChild(meta);

      card.appendChild(el("p", "ext-purpose")).appendChild(inlineCode(text(ext, "purpose")));

      var dl = el("dl");
      dl.appendChild(el("dt", null, ui.shape));
      dl.appendChild(el("dd", "shape")).appendChild(inlineCode(text(ext, "shape")));
      dl.appendChild(el("dt", null, ui.graduates));
      dl.appendChild(el("dd")).appendChild(inlineCode(text(ext, "graduationQuestion")));
      card.appendChild(dl);

      dom.list.appendChild(card);
    });

    dom.asOf.textContent = measured ? ui.asOf.replace("{date}", measured) : ui.asOfNever;
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* private mode */ }
      render();
    });
  });

  state.lang = pickLang();
  applyUi();

  fetch("../data/suggested-extensions.json")
    .then(function (res) { return res.json(); })
    .then(function (model) {
      state.model = model;
      render();
      // A deep link opened before the cards existed still has to land on its field.
      if (location.hash.length > 1) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function (err) {
      console.error("[OTE] failed to load the extensions registry", err);
      dom.list.appendChild(el("p", "ext-failed", UI[state.lang].failed));
    });
})();
