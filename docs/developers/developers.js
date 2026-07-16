/* Developer docs — static prose (data-t, localised below) plus the ecosystem
   catalogue from data/tools.json re-sliced by category: an integrator asks "what
   reads/writes this data?", not "what's finished?" (that's the landing's cut). */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the rest of the site

  var UI = {
    en: {
      pill: "Draft 0.x",
      draft: "The spec is not stable yet: fields can still change, be renamed or be dropped.",
      follow: "Follow the discussion",
      navSpec: "How it works",
      navAdopt: "Adopt it",
      navReference: "Reference",
      navDevelopers: "Developers",
      navTools: "Tools",
      title: "Build on OTE",
      lead: "A directory, an app, a bot, a newsletter? Everything the project publishes is plain JSON at stable URLs, with an explicit license. Integrate once — every new adopter feeds your tool for free.",
      "urls.title": "The data, at stable URLs",
      "urls.lead": "These URLs are contracts: they survive any reorganisation of the repos. Start with the registry — it's the feed-discovery entry point.",
      "urls.what": "What it is",
      "urls.adopters": "The adopter registry: every community publishing an OTE feed — name, website, feed URL, and its ID in linked community directories. It's what renders the <a href=\"/#adopters\">adopters section</a>, and your entry point to discover feeds. Updated by reviewed PR via the <a href=\"/register/\">registration pipeline</a>, with a daily health check on every feed.",
      "urls.schemas": "The canonical JSON Schemas (these are the <code>$id</code> URLs). Validate anything you ingest or produce with any standard JSON Schema validator.",
      "urls.aggregated": "The <a href=\"https://github.com/OpenTechEvents/opentechevents-data\">aggregated feed</a>: events from every registered source, unified into one OTE feed with per-event provenance and license. Also exported as <a href=\"https://data.opentechevents.org/feed.ics\"><code>feed.ics</code></a>.",
      "urls.npm": "The same schemas as a package, for validating in CI or at build time.",
      "consume.title": "Consuming feeds is three lines",
      "consume.lead": "No SDK, no API key, no rate-limit negotiation: fetch the registry, fetch the feeds. Every feed validates against the published schema, so your parser has exactly one format to care about.",
      "consume.license": "One obligation: <strong>respect the license</strong>. Every feed (and optionally every event) declares one — <code>CC-BY-4.0</code> means attributing the community, and each entry tells you whom.",
      "consume.discovery": "Feeds in the wild announce themselves like RSS does — a <code>&lt;link rel=\"alternate\" type=\"application/ote+json\"&gt;</code> in the community's site — so your crawler can discover feeds that haven't registered yet.",
      "tools.title": "Tools to integrate with — or to claim",
      "tools.lead": "The ecosystem catalogue, sliced by what each piece does with the data. Most of it is proposed and up for grabs: if your integration needs a converter or an SDK that doesn't exist, claiming it in an issue is how it gets prioritised.",
      "tools.ctaConsumer": "List your project as a consumer",
      "tools.ctaPropose": "Propose or claim a tool",
      all: "All",
      status: { working: "Working", wip: "In progress", proposed: "Proposed" },
      linkRepo: "View repository",
      linkIdea: "Discuss the idea",
      footerNote: "Everything on this page is served from this repository — if a URL here breaks, that's a bug.",
    },
    es: {
      pill: "Borrador 0.x",
      draft: "La spec aún no es estable: los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navReference: "Referencia",
      navDevelopers: "Desarrolladores",
      navTools: "Herramientas",
      title: "Construye sobre OTE",
      lead: "¿Un directorio, una app, un bot, una newsletter? Todo lo que publica el proyecto es JSON plano en URLs estables, con licencia explícita. Integra una vez — cada nueva comunidad adoptante alimenta tu herramienta gratis.",
      "urls.title": "Los datos, en URLs estables",
      "urls.lead": "Estas URLs son contratos: sobreviven a cualquier reorganización de los repos. Empieza por el registro — es el punto de entrada para descubrir feeds.",
      "urls.what": "Qué es",
      "urls.adopters": "El registro de adoptantes: cada comunidad que publica un feed OTE — nombre, web, URL del feed y su ID en directorios de comunidades vinculados. Es lo que pinta la <a href=\"/#adopters\">sección de adoptantes</a>, y tu punto de entrada para descubrir feeds. Se actualiza por PR revisado vía el <a href=\"/register/\">pipeline de registro</a>, con chequeo diario de salud de cada feed.",
      "urls.schemas": "Los JSON Schema canónicos (estas son las URLs <code>$id</code>). Valida lo que ingieras o produzcas con cualquier validador JSON Schema estándar.",
      "urls.aggregated": "El <a href=\"https://github.com/OpenTechEvents/opentechevents-data\">feed agregado</a>: eventos de todas las fuentes registradas, unificados en un feed OTE con procedencia y licencia por evento. También exportado como <a href=\"https://data.opentechevents.org/feed.ics\"><code>feed.ics</code></a>.",
      "urls.npm": "Los mismos schemas como paquete, para validar en CI o en build.",
      "consume.title": "Consumir feeds son tres líneas",
      "consume.lead": "Sin SDK, sin API key, sin negociar rate limits: fetch del registro, fetch de los feeds. Todo feed valida contra el schema publicado, así que tu parser tiene exactamente un formato del que preocuparse.",
      "consume.license": "Una obligación: <strong>respeta la licencia</strong>. Cada feed (y opcionalmente cada evento) declara una — <code>CC-BY-4.0</code> implica atribuir a la comunidad, y cada entrada te dice a quién.",
      "consume.discovery": "Los feeds sueltos por la web se anuncian como lo hace RSS — un <code>&lt;link rel=\"alternate\" type=\"application/ote+json\"&gt;</code> en la web de la comunidad — así tu crawler puede descubrir feeds que aún no se han registrado.",
      "tools.title": "Herramientas con las que integrarte — o que reclamar",
      "tools.lead": "El catálogo del ecosistema, cortado por lo que cada pieza hace con los datos. Casi todo está propuesto y libre: si tu integración necesita un conversor o un SDK que no existe, reclamarlo en un issue es lo que lo prioriza.",
      "tools.ctaConsumer": "Lista tu proyecto como consumidor",
      "tools.ctaPropose": "Propón o reclama una herramienta",
      all: "Todas",
      status: { working: "Funciona", wip: "En curso", proposed: "Propuesta" },
      linkRepo: "Ver repositorio",
      linkIdea: "Discutir la idea",
      footerNote: "Todo lo de esta página se sirve desde este repositorio — si una URL de aquí se rompe, es un bug.",
    },
  };

  var state = { lang: FALLBACK, tools: [], category: "all" };

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

  function t(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value[FALLBACK] || "";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function applyDict() {
    var dict = UI[state.lang];
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = dict[node.getAttribute("data-t")];
      // Strings come from this file and may carry inline markup.
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });
    renderCategories();
    renderTools();
  }

  /* ---------- tools by category ---------- */

  // Categories come from the data itself (tools.json `category`), in order of
  // first appearance — a new category in the data shows up here with zero code.
  function categories() {
    var seen = [];
    state.tools.forEach(function (tool) {
      if (!tool.category) return;
      var key = tool.category.en;
      if (!seen.some(function (c) { return c.key === key; })) seen.push({ key: key, label: tool.category });
    });
    return seen;
  }

  function renderCategories() {
    var container = document.getElementById("dev-cats");
    container.replaceChildren();
    var chips = [{ key: "all", label: { en: UI.en.all, es: UI.es.all } }].concat(categories());
    chips.forEach(function (cat) {
      var chip = el("button", "chip" + (state.category === cat.key ? " is-active" : ""), t(cat.label));
      chip.type = "button";
      chip.addEventListener("click", function () {
        state.category = cat.key;
        renderCategories();
        renderTools();
      });
      container.appendChild(chip);
    });
  }

  function renderTools() {
    var dict = UI[state.lang];
    var container = document.getElementById("dev-tools");
    container.replaceChildren();

    state.tools
      .filter(function (tool) {
        return state.category === "all" || (tool.category && tool.category.en === state.category);
      })
      .forEach(function (tool) {
        var card = el("article", "tool");

        var head = el("div", "tool-head");
        head.appendChild(el("h3", null, t(tool.name)));
        head.appendChild(el("span", "badge badge-" + tool.status, dict.status[tool.status] || tool.status));
        card.appendChild(head);

        if (tool.category) card.appendChild(el("span", "tool-cat", t(tool.category)));
        card.appendChild(el("p", null, t(tool.desc)));

        if (tool.url) {
          var link = el("a", "tool-link", dict[tool.status === "proposed" ? "linkIdea" : "linkRepo"]);
          link.href = tool.url;
          link.target = "_blank";
          link.rel = "noopener";
          card.appendChild(link);
        }

        container.appendChild(card);
      });
  }

  /* ---------- boot ---------- */

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* private mode */ }
      applyDict();
    });
  });

  state.lang = pickLang();
  applyDict();

  fetch("../data/tools.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      state.tools = data.tools || [];
      renderCategories();
      renderTools();
    })
    .catch(function (err) { console.error("[OTE] failed to load tools.json", err); });
})();
