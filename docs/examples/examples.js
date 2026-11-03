/* Practical examples — renders data/examples.json, built from the validated example documents. */
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
      eyebrow: "Practical examples · OTE Spec {version}",
      title: "One example per real case",
      lead: "The reference tells you what each field is. This page shows you whole documents: what a small meetup looks like, what changes when it repeats every month, and what to do with a study jam spread over three non-consecutive Saturdays. Copy any of them.",
      promise: "Every document here is read straight from the repository and validated in CI against the JSON Schemas. If one stopped validating, the build would fail — so what you copy is what the validator accepts.",
      ctaReference: "Field reference",
      ctaRules: "Rules a validator can't check",
      filterLabel: "Filter examples by case",
      all: "All",
      legendCore: "OTE field",
      legendExt: "Prefixed field: someone else's vocabulary, never OTE's",
      why: "Why it looks like this",
      fields: "Fields in the reference",
      copy: "Copy",
      copied: "Copied",
      copyFailed: "Press ⌘/Ctrl+C",
      viewRepo: "View on GitHub",
      anchorLabel: "Link to this example",
      kindEvent: "single event",
      kindFeed: "feed",
      noMatch: "No example covers that case yet.",
      showAll: "Show all",
      missingTitle: "Your case isn't here",
      missingBody: "Then it's a gap in the examples, or a gap in the spec — and both are worth an issue. Describe how your community runs the event and what you couldn't express; a real case is what moves this spec forward.",
      missingCta: "Ask for an example",
      missingCta2: "All examples on GitHub",
      validate: "Validate your own document before opening the issue: <code>npm install &amp;&amp; npm run validate -- my-feed.json</code>",
      footerNote: "Every example is validated in CI. Draft specification — fields may change.",
    },
    es: {
      skip: "Ir al contenido",
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
      eyebrow: "Ejemplos prácticos · OTE Spec {version}",
      title: "Un ejemplo por cada caso real",
      lead: "La referencia te dice qué es cada campo. Esta página te enseña documentos enteros: cómo se ve un meetup pequeño, qué cambia cuando se repite todos los meses, y qué hacer con un study jam repartido en tres sábados no consecutivos. Cópialos.",
      promise: "Cada documento se lee tal cual del repositorio y se valida en CI contra los JSON Schema. Si alguno dejara de validar, el build fallaría — así que lo que copias es lo que el validador acepta.",
      ctaReference: "Referencia de campos",
      ctaRules: "Reglas que un validador no ve",
      filterLabel: "Filtrar ejemplos por caso",
      all: "Todos",
      legendCore: "Campo de OTE",
      legendExt: "Campo con prefijo: vocabulario de otro proyecto, nunca de OTE",
      why: "Por qué es así",
      fields: "Campos en la referencia",
      copy: "Copiar",
      copied: "Copiado",
      copyFailed: "Pulsa ⌘/Ctrl+C",
      viewRepo: "Ver en GitHub",
      anchorLabel: "Enlace a este ejemplo",
      kindEvent: "evento suelto",
      kindFeed: "feed",
      noMatch: "Todavía no hay ningún ejemplo de ese caso.",
      showAll: "Ver todos",
      missingTitle: "Tu caso no está aquí",
      missingBody: "Entonces falta un ejemplo, o falta algo en la spec — y las dos cosas merecen un issue. Cuenta cómo celebra tu comunidad el evento y qué no has podido expresar: un caso real es lo que hace avanzar esta especificación.",
      missingCta: "Pedir un ejemplo",
      missingCta2: "Todos los ejemplos en GitHub",
      validate: "Valida tu documento antes de abrir el issue: <code>npm install &amp;&amp; npm run validate -- mi-feed.json</code>",
      footerNote: "Todos los ejemplos se validan en CI. Especificación en borrador: los campos pueden cambiar.",
    },
  };

  var state = { lang: FALLBACK, model: null, filter: "all" };

  var dom = {
    list: document.getElementById("ex-list"),
    filters: document.getElementById("ex-filters"),
    empty: document.getElementById("ex-empty"),
    reset: document.getElementById("ex-reset"),
  };

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

  function t(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value[FALLBACK] || "";
  }

  // Catalogue prose names fields in `backticks`; nothing else in it is markup.
  function inlineCode(text) {
    var frag = document.createDocumentFragment();
    text.split(/`([^`]+)`/).forEach(function (part, i) {
      frag.appendChild(i % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return frag;
  }

  /* ---------- rendering ---------- */

  /**
   * The spec version these examples are built from, as the "v0.5" form used in paths and prose,
   * read from the data rather than written here. Hardcoding it is how this page came to announce
   * v0.4 in its eyebrow and link v0.3's README from the same screen.
   */
  function specLabel() {
    var version = state.model && state.model.specVersion;
    return version ? "v" + version.split(".").slice(0, 2).join(".") : "";
  }

  function applyUi() {
    var ui = UI[state.lang];
    var version = specLabel();
    var withVersion = function (value) {
      return version ? value.replace(/\{version\}/g, version) : value.replace(/ \{version\}/g, "");
    };
    document.documentElement.lang = state.lang;
    document.title = ui.title + " — OTE Spec";

    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = ui[node.getAttribute("data-t")];
      // Only our own strings land here, and a couple of them carry inline <code>.
      if (value) node.innerHTML = withVersion(value);
    });
    if (version) {
      document.querySelectorAll("[data-v-href]").forEach(function (node) {
        node.setAttribute("href", node.getAttribute("data-v-href").replace(/\{version\}/g, version));
      });
    }
    document.querySelectorAll("[data-t-aria]").forEach(function (node) {
      node.setAttribute("aria-label", ui[node.getAttribute("data-t-aria")]);
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });
  }

  function visible() {
    return state.model.examples.filter(function (ex) {
      return state.filter === "all" || ex.cases.indexOf(state.filter) !== -1;
    });
  }

  function renderFilters() {
    var ui = UI[state.lang];
    dom.filters.replaceChildren();

    var counts = { all: state.model.examples.length };
    state.model.examples.forEach(function (ex) {
      ex.cases.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
    });

    [{ id: "all", label: ui.all }].concat(state.model.cases).forEach(function (kase) {
      var chip = el("button", "chip" + (state.filter === kase.id ? " is-active" : ""));
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(state.filter === kase.id));
      chip.appendChild(document.createTextNode(t(kase.label) + " "));
      chip.appendChild(el("span", "chip-count", String(counts[kase.id] || 0)));
      chip.addEventListener("click", function () {
        state.filter = kase.id;
        // The filter belongs in the URL: "here's the recurring-meetup example" has to be a link.
        var url = new URL(location.href);
        if (kase.id === "all") url.searchParams.delete("case");
        else url.searchParams.set("case", kase.id);
        history.replaceState(null, "", url);
        render();
      });
      dom.filters.appendChild(chip);
    });
  }

  function renderCard(ex) {
    var ui = UI[state.lang];
    var card = el("article", "ex-card");
    card.id = ex.file.replace(/\.json$/, "");

    var head = el("header", "ex-head");
    var titleRow = el("div", "ex-title-row");
    var h2 = el("h2", null, t(ex.title));
    titleRow.appendChild(h2);
    var anchor = el("a", "ex-anchor", "#");
    anchor.href = "#" + card.id;
    anchor.setAttribute("aria-label", ui.anchorLabel + ": " + t(ex.title));
    titleRow.appendChild(anchor);
    head.appendChild(titleRow);

    var badges = el("div", "ex-badges");
    badges.appendChild(el("span", "ex-kind ex-kind-" + ex.kind, ex.kind === "feed" ? ui.kindFeed : ui.kindEvent));
    ex.cases.forEach(function (id) {
      var kase = state.model.cases.find(function (c) { return c.id === id; });
      var tag = el("button", "ex-tag", t(kase ? kase.label : id));
      tag.type = "button";
      tag.addEventListener("click", function () {
        state.filter = id;
        var url = new URL(location.href);
        url.searchParams.set("case", id);
        url.hash = "";
        history.replaceState(null, "", url);
        render();
        window.scrollTo({ top: dom.filters.getBoundingClientRect().top + window.scrollY - 90 });
      });
      badges.appendChild(tag);
    });
    head.appendChild(badges);
    var summary = el("p", "ex-summary");
    summary.appendChild(inlineCode(t(ex.summary)));
    head.appendChild(summary);
    card.appendChild(head);

    var body = el("div", "ex-body");

    var notes = el("div", "ex-notes");
    notes.appendChild(el("h3", "ex-notes-title", ui.why));
    var list = el("ul", "ex-points");
    t(ex.points).forEach(function (point) {
      var li = document.createElement("li");
      li.appendChild(inlineCode(point));
      list.appendChild(li);
    });
    notes.appendChild(list);

    if (ex.fields.length) {
      var fields = el("div", "ex-fields");
      fields.appendChild(el("span", "ex-fields-label", ui.fields));
      ex.fields.forEach(function (path) {
        var link = el("a", "ex-field-link");
        link.href = "/spec/#" + path.replace(".", "-");
        link.appendChild(el("code", null, path.slice(path.indexOf(".") + 1)));
        fields.appendChild(link);
      });
      notes.appendChild(fields);
    }
    body.appendChild(notes);

    var figure = el("figure", "code-block");
    var caption = el("figcaption");
    caption.appendChild(el("code", null, ex.file));
    var actions = el("div", "ex-actions");

    var copy = el("button", "ex-btn", ui.copy);
    copy.type = "button";
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(ex.source).then(
        function () {
          copy.textContent = ui.copied;
          copy.classList.add("is-done");
          setTimeout(function () {
            copy.textContent = ui.copy;
            copy.classList.remove("is-done");
          }, 1600);
        },
        function () { copy.textContent = ui.copyFailed; }
      );
    });
    actions.appendChild(copy);

    var repo = el("a", "ex-btn", ui.viewRepo);
    repo.href = ex.repoUrl;
    repo.target = "_blank";
    repo.rel = "noopener";
    actions.appendChild(repo);

    caption.appendChild(actions);
    figure.appendChild(caption);

    var pre = document.createElement("pre");
    var code = document.createElement("code");
    code.appendChild(window.OTECode.renderJson(ex.source, { extTitle: ui.legendExt }));
    pre.appendChild(code);
    figure.appendChild(pre);
    body.appendChild(figure);

    card.appendChild(body);
    return card;
  }

  function render() {
    applyUi();
    dom.list.replaceChildren();
    if (!state.model) return;

    renderFilters();
    var items = visible();
    dom.empty.hidden = items.length > 0;
    items.forEach(function (ex) { dom.list.appendChild(renderCard(ex)); });
  }

  dom.reset.addEventListener("click", function () {
    state.filter = "all";
    var url = new URL(location.href);
    url.searchParams.delete("case");
    history.replaceState(null, "", url);
    render();
  });

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* private mode */ }
      render();
    });
  });

  state.lang = pickLang();
  state.filter = new URLSearchParams(location.search).get("case") || "all";
  applyUi();

  fetch("../data/examples.json")
    .then(function (res) { return res.json(); })
    .then(function (model) {
      state.model = model;
      // A filter in the URL that no longer exists must not empty the page for good.
      if (state.filter !== "all" && !model.cases.some(function (c) { return c.id === state.filter; })) {
        state.filter = "all";
      }
      render();
      // A deep link opened before the cards existed still has to land on its example.
      if (location.hash.length > 1) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function (err) {
      console.error("[OTE] failed to load the examples", err);
    });
})();
