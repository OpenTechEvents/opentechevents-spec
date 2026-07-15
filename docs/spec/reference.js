/* Field reference — renders data/reference.json, which is generated from the JSON Schemas. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the landing page: pick a language once

  var UI = {
    en: {
      pill: "Draft 0.x",
      draft: "Fields can still change, be renamed or be dropped.",
      follow: "Follow the discussion",
      navSpec: "How it works",
      navAdopt: "Adopt it",
      navReference: "Reference",
      navTools: "Tools",
      title: "Field reference",
      lead: "Every field of OTE Spec v0.2. This page is generated from the JSON Schemas, so it cannot drift from what the validator actually enforces.",
      rules: "Rules a validator can't check",
      raw: "Raw JSON Schema",
      footerNote: "Generated from the schemas. Draft specification — fields may change.",
      required: "required",
      optional: "optional",
      examples: "Examples",
      onlyRequired: "Show only required fields",
    },
    es: {
      pill: "Borrador 0.x",
      draft: "Los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navReference: "Referencia",
      navTools: "Herramientas",
      title: "Referencia de campos",
      lead: "Todos los campos de OTE Spec v0.2. Esta página se genera a partir de los JSON Schema, así que no puede separarse de lo que el validador exige de verdad.",
      rules: "Reglas que un validador no ve",
      raw: "JSON Schema en crudo",
      footerNote: "Generado a partir de los schemas. Especificación en borrador: los campos pueden cambiar.",
      required: "obligatorio",
      optional: "opcional",
      examples: "Ejemplos",
      onlyRequired: "Ver solo los obligatorios",
    },
  };

  var state = { lang: FALLBACK, model: null, onlyRequired: false };

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

  // Field descriptions come from the schema and may name other fields in `backticks`.
  function withCode(text) {
    var frag = document.createDocumentFragment();
    text.split(/`([^`]+)`/).forEach(function (part, i) {
      frag.appendChild(i % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return frag;
  }

  function render() {
    var t = UI[state.lang];
    document.documentElement.lang = state.lang;
    document.title = t.title + " — OTE Spec v0.2";

    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = t[node.getAttribute("data-t")];
      if (value) node.textContent = value;
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });

    var root = document.getElementById("reference");
    root.replaceChildren();
    if (!state.model) return;

    var toggle = el("label", "req-toggle");
    var box = el("input");
    box.type = "checkbox";
    box.checked = state.onlyRequired;
    box.addEventListener("change", function () {
      state.onlyRequired = box.checked;
      render();
    });
    toggle.append(box, document.createTextNode(" " + t.onlyRequired));
    root.appendChild(toggle);

    state.model.schemas.forEach(function (schema) {
      var section = el("section", "ref-schema");
      section.id = schema.name;

      var h2 = el("h2");
      h2.append(el("code", null, schema.name), document.createTextNode(" — " + schema.title[state.lang]));
      section.appendChild(h2);
      section.appendChild(el("p", "ref-schema-desc", schema.description[state.lang]));

      schema.fields
        .filter(function (f) { return !state.onlyRequired || f.required; })
        .forEach(function (f) {
          var card = el("article", "field" + (f.required ? " field-required" : ""));
          card.id = schema.name + "-" + f.path;

          var head = el("div", "field-head");
          head.appendChild(el("code", "field-name", f.path));
          head.appendChild(el("span", "field-type", f.type));
          head.appendChild(
            el("span", "field-req " + (f.required ? "is-required" : "is-optional"), f.required ? t.required : t.optional)
          );
          card.appendChild(head);

          var desc = el("p", "field-desc");
          desc.appendChild(withCode(f.description[state.lang]));
          card.appendChild(desc);

          if (f.examples && f.examples.length) {
            var ex = el("div", "field-examples");
            ex.appendChild(el("span", "field-examples-label", t.examples));
            f.examples.forEach(function (value) {
              ex.appendChild(el("code", null, JSON.stringify(value)));
            });
            card.appendChild(ex);
          }

          section.appendChild(card);
        });

      root.appendChild(section);
    });
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, state.lang); } catch (e) { /* private mode */ }
      render();
    });
  });

  // Same nav as the landing page, so moving between them doesn't feel like leaving the site.
  // This page IS the reference, so say so.
  var current = document.querySelector('.nav a[data-nav="reference"]');
  if (current) current.setAttribute("aria-current", "page");

  state.lang = pickLang();
  render();

  fetch("../data/reference.json")
    .then(function (res) { return res.json(); })
    .then(function (model) {
      state.model = model;
      render();
    })
    .catch(function (err) {
      console.error("[OTE] failed to load the field reference", err);
    });
})();
