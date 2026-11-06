/* Field reference — renders data/reference.json, which is generated from the JSON Schemas. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the landing page: pick a language once
  var STICKY_OFFSET = 140; // header + sticky toolbar: what counts as "the top of the reading area"

  var UI = {
    en: {
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
      title: "Field reference",
      lead: "Every field of OTE Spec {version}. This page is generated from the JSON Schemas, so it cannot drift from what the validator actually enforces.",
      versionLabel: "Spec version",
      versionNote: "Older versions are frozen: what they say is what a document declaring them was validated against.",
      versionCurrent: "{version} — current",
      versionPermalink: "Permalink",
      unknownFragment: "No field with the id {id} in {version}.",
      unknownElsewhere: "It does exist in:",
      rules: "Rules a validator can't check",
      raw: "Raw JSON Schema",
      examplesCta: "Practical examples",
      footerNote: "Generated from the schemas. Draft specification — fields may change.",
      required: "required",
      requiredIn: "required in `{parent}`",
      requiredInTip:
        "Required inside {parent}, which is itself optional: a minimal document needs neither, but a document that has a {parent} must give this field. Leaving the whole object out stays valid.",
      recommended: "recommended",
      recommendedTip: "Valid without it — but a checker warns. These are the fields that decide whether the event can be found, filtered and subscribed to.",
      optional: "optional",
      defaultBadge: "default: {value}",
      inheritedBadge: "default: the feed's {parent}",
      lendsBadge: "default for every event that omits it",
      lendsTip:
        "Declared once here, for the whole file: every event in this feed that does not declare its own takes this one. An event that declares it replaces the inherited value, it does not add to it.",
      inheritedTip:
        "Inside a feed, an event that omits this field takes the feed's {parent}. That is what makes a feed cheap to publish: said once, never repeated per event.",
      defaultTip:
        "What a consumer assumes when the field is absent. Fields without this badge have no default: absent means unknown, never the reassuring value.",
      rulesField: "Rules on this object",
      rulesItem: "Rules on each entry of this list",
      rulesDoc: "Rules on the whole document",
      rulesLead: "Enforced by the validator: conditions that tie fields together, which no single field's level can state.",
      examples: "Examples",
      examplesHint: "Click a value to see it inside a whole document",
      inDocs: "See it in a real document",
      inDocsCount: "In {n} example document(s)",
      hideDocs: "Hide the document",
      loadingDocs: "Loading examples…",
      docsFailed: "The examples could not be loaded.",
      fullExample: "Open the full example",
      highlighted: "{n} highlighted line(s)",
      onlyRequired: "Only required",
      onlyRequiredShort: "Req.",
      tocTitle: "On this page",
      tocLegend: "Required in a minimal document",
      tocLegendRecommended: "Recommended: valid without it, but a checker warns",
      tocLegendInParent: "Unmarked: optional, or required only inside an object that is itself optional",
      tocExpand: "Show the subfields of {field}",
      tocCollapse: "Hide the subfields of {field}",
      searchPlaceholder: "Filter fields…",
      searchLabel: "Filter fields",
      count: "Showing {shown} of {total} fields",
      noMatch: "No field matches that filter.",
      clear: "Clear the filter",
      anchorLabel: "Link to this field",
      extTag: "Not generated from the schemas",
      extTitle: "The field you need isn't here",
      extLead: "Add it. OTE's schemas do not forbid extra fields, on purpose: your document stays valid, and a consumer that doesn't understand them can ignore them safely. This is how the spec grows — through fields someone already uses, not fields we imagine will be needed.",
      extCoreTitle: "Candidate for the core",
      extCoreBody: "A generic field that could become part of OTE. Write it without a prefix. If enough people need it, it gets standardised — and your local meaning gives way to the normative one.",
      extVocabTitle: "Someone else's vocabulary",
      extVocabBody: "A field whose meaning is defined by another project, and that will never belong to OTE. Write it with a prefix. It cannot collide with a core field, today or at 1.0.",
      extPromise: "OTE will never mint a field name containing a colon.",
      extPromiseBody: "That reservation is what makes the second column safe — and what lets OTE connect to other specifications without being coupled to them.",
      extMore: "Full extension rules",
      extIssue: "Tell us what you're using",
    },
    es: {
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
      title: "Referencia de campos",
      lead: "Todos los campos de OTE Spec {version}. Esta página se genera a partir de los JSON Schema, así que no puede separarse de lo que el validador exige de verdad.",
      versionLabel: "Versión de la spec",
      versionNote: "Las versiones anteriores están congeladas: lo que dicen es contra lo que se validó un documento que las declara.",
      versionCurrent: "{version} — actual",
      versionPermalink: "Enlace permanente",
      unknownFragment: "No hay ningún campo con el id {id} en {version}.",
      unknownElsewhere: "Sí existe en:",
      rules: "Reglas que un validador no ve",
      raw: "JSON Schema en crudo",
      examplesCta: "Ejemplos prácticos",
      footerNote: "Generado a partir de los schemas. Especificación en borrador: los campos pueden cambiar.",
      required: "obligatorio",
      requiredIn: "obligatorio en `{parent}`",
      requiredInTip:
        "Obligatorio dentro de {parent}, que a su vez es opcional: un documento mínimo no necesita ninguno de los dos, pero un documento que traiga un {parent} tiene que dar este campo. Dejar fuera el objeto entero sigue siendo válido.",
      recommended: "recomendado",
      recommendedTip: "El documento es válido sin él, pero un checker avisa. Son los campos que deciden si el evento se puede encontrar, filtrar y seguir.",
      optional: "opcional",
      defaultBadge: "por defecto: {value}",
      inheritedBadge: "por defecto: el {parent} del feed",
      lendsBadge: "valor por defecto de todo evento que lo omita",
      lendsTip:
        "Se declara una vez aquí, para todo el fichero: cada evento del feed que no declare el suyo toma este. El evento que lo declara reemplaza el valor heredado, no se suma a él.",
      inheritedTip:
        "Dentro de un feed, el evento que omite este campo toma el {parent} del feed. Eso es lo que hace barato publicar un feed: se dice una vez y ningún evento lo repite.",
      defaultTip:
        "Lo que un consumidor asume cuando el campo no está. Los campos sin esta etiqueta no tienen valor por defecto: su ausencia significa desconocido, nunca el valor tranquilizador.",
      rulesField: "Reglas de este objeto",
      rulesItem: "Reglas de cada entrada de esta lista",
      rulesDoc: "Reglas del documento completo",
      rulesLead: "Las aplica el validador: condiciones que atan campos entre sí y que el nivel de un campo suelto no puede enunciar.",
      examples: "Ejemplos",
      examplesHint: "Pulsa un valor para verlo dentro de un documento entero",
      inDocs: "Verlo en un documento real",
      inDocsCount: "En {n} documento(s) de ejemplo",
      hideDocs: "Ocultar el documento",
      loadingDocs: "Cargando los ejemplos…",
      docsFailed: "No se han podido cargar los ejemplos.",
      fullExample: "Abrir el ejemplo completo",
      highlighted: "{n} línea(s) resaltada(s)",
      onlyRequired: "Solo obligatorios",
      onlyRequiredShort: "Oblig.",
      tocTitle: "En esta página",
      tocLegend: "Obligatorio en un documento mínimo",
      tocLegendRecommended: "Recomendado: válido sin él, pero un checker avisa",
      tocLegendInParent: "Sin marca: opcional, u obligatorio solo dentro de un objeto que es opcional",
      tocExpand: "Mostrar los subcampos de {field}",
      tocCollapse: "Ocultar los subcampos de {field}",
      searchPlaceholder: "Filtrar campos…",
      searchLabel: "Filtrar campos",
      count: "Mostrando {shown} de {total} campos",
      noMatch: "Ningún campo coincide con el filtro.",
      clear: "Quitar el filtro",
      anchorLabel: "Enlace a este campo",
      extTag: "Escrito a mano, no generado de los schemas",
      extTitle: "El campo que necesitas no está aquí",
      extLead: "Añádelo. Los schemas de OTE no prohíben campos adicionales, a propósito: tu documento sigue siendo válido, y quien no los entienda puede ignorarlos sin romperse. Es la vía por la que la spec crece: campos que alguien ya usa de verdad, no campos que imaginamos que harán falta.",
      extCoreTitle: "Candidato a núcleo",
      extCoreBody: "Un campo genérico que aspira a ser de OTE. Se escribe sin prefijo. Si le hace falta a bastante gente, se estandariza — y tu significado local cede ante el normativo.",
      extVocabTitle: "Vocabulario de otro proyecto",
      extVocabBody: "Un campo cuyo significado lo define otro proyecto y que nunca será de OTE. Se escribe con prefijo. No puede colisionar con un campo del núcleo, hoy ni en la 1.0.",
      extPromise: "OTE no acuñará jamás un nombre de campo que contenga dos puntos.",
      extPromiseBody: "Esa reserva es lo que hace segura la segunda columna, y lo que permite que OTE conecte con otras especificaciones sin acoplarse a ellas.",
      extMore: "Las reglas completas",
      extIssue: "Cuéntanos qué estás usando",
    },
  };

  // `examples` is the gallery's data, fetched the first time someone asks to see a field in
  // context — the reference is useful without it, so it must not be on the critical path.
  // `open` maps a field's card id to the example file shown under it, and survives re-renders:
  // typing in the filter must not close the document you were reading.
  var state = {
    lang: FALLBACK,
    model: null,
    onlyRequired: false,
    query: "",
    examples: null,
    examplesState: "idle",
    open: {},
    // A TOC entry with subfields starts collapsed: the sidebar is a map, and `organizers`,
    // `location` or `offers` unfolded at once bury the top-level fields under their own detail.
    // `tocOpen` is what the reader opened by hand and keeps open; `tocShut` is a branch the
    // reader closed while reading inside it, which must not spring back open on the next frame.
    tocOpen: {},
    tocShut: {},
  };

  var dom = {
    reference: document.getElementById("reference"),
    toc: document.getElementById("toc-panel"),
    tocToggle: document.getElementById("toc-toggle"),
    search: document.getElementById("field-search"),
    required: document.getElementById("only-required"),
    count: document.getElementById("ref-count"),
    here: document.getElementById("toolbar-here"),
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

  // "Required" on a field means required *within its parent object* — `source.name` is required,
  // but only once there is a `source`. `requiredIn` names that parent when it is itself optional,
  // and the generator computes it, so the badge, the map and the filter cannot disagree about
  // what the word means. A minimal valid document needs exactly the fields with `required` and
  // no `requiredIn`, which is the notion the "only required" filter uses.
  function isDocRequired(f) {
    return Boolean(f.required) && !f.requiredIn;
  }

  /** The rules the schema enforces on an object, by the path of the object they constrain. */
  function rulesOf(schema, ownerPath) {
    return (schema.rules || []).filter(function (rule) { return rule.owner === ownerPath; });
  }

  function matches(schema, f, query) {
    if (!query) return true;
    var hay = [f.path, f.type, f.description[state.lang]]
      .concat((f.examples || []).map(function (e) { return JSON.stringify(e); }))
      // A field is also found by the rules that constrain it: someone searching "currency"
      // should land on `offers`, where the rule that demands it lives.
      .concat(rulesOf(schema, f.path).concat(rulesOf(schema, f.path + "[]")).map(function (rule) {
        return rule.text[state.lang] + " " + (rule.note ? rule.note[state.lang] : "");
      }))
      .join(" ")
      .toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function visibleFields(schema) {
    return schema.fields.filter(function (f) {
      return (!state.onlyRequired || isDocRequired(f)) && matches(schema, f, state.query);
    });
  }

  // Field descriptions come from the schema and may name other fields in `backticks`
  // or point at a spec elsewhere with a bare URL — both become real markup here.
  function withCode(text) {
    var frag = document.createDocumentFragment();
    text.split(/`([^`]+)`/).forEach(function (part, i) {
      if (i % 2) return frag.appendChild(el("code", null, part));
      part.split(/(https?:\/\/[^\s)]*[^\s).,;:])/).forEach(function (bit, j) {
        if (!bit) return;
        if (j % 2 === 0) return frag.appendChild(document.createTextNode(bit));
        var a = el("a", "ref-link", bit.replace(/^https?:\/\//, ""));
        a.href = bit;
        a.target = "_blank";
        a.rel = "noopener";
        frag.appendChild(a);
      });
    });
    return frag;
  }

  // Marks every occurrence of the active filter, in place, without touching the markup around it.
  function highlight(root, query) {
    if (!query) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (node) {
      var lower = node.nodeValue.toLowerCase();
      if (lower.indexOf(query) === -1) return;
      var frag = document.createDocumentFragment();
      var from = 0;
      for (var at = lower.indexOf(query); at !== -1; at = lower.indexOf(query, from)) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(from, at)));
        frag.appendChild(el("mark", null, node.nodeValue.slice(at, at + query.length)));
        from = at + query.length;
      }
      frag.appendChild(document.createTextNode(node.nodeValue.slice(from)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  // The name reads as "parent.parent.leaf" with the parents dimmed: the leaf is what you scan for.
  function fieldName(path) {
    var name = el("code", "field-name");
    var at = path.lastIndexOf(".");
    if (at !== -1) name.appendChild(el("span", "path-parent", path.slice(0, at + 1)));
    name.appendChild(document.createTextNode(path.slice(at + 1)));
    return name;
  }

  /**
   * The rules a set of fields cannot state on its own, printed where the object they constrain
   * is documented. The sentence arrives already written, in both languages, from the generator:
   * it is the same text the markdown reference prints, and a rule phrased twice is a rule that
   * ends up saying two different things. `note` is the schema author's reasoning, when there is
   * one — the part no generated sentence can replace.
   *
   * Collapsed by default: the rules are normative, but a reader scanning fields should not have
   * to scroll past a paragraph of them on every card. The summary keeps the count, so what is
   * hidden announces itself. A filter forces every block open, for the same reason the map's
   * branches open: a search that hides its own matches would be useless.
   */
  function appendRules(parent, rules, t, title) {
    if (!rules.length) return;
    var box = el("details", "field-rules");
    if (state.query) box.open = true;
    var summary = el("summary", "field-rules-title", title);
    summary.appendChild(el("span", "field-rules-count", String(rules.length)));
    box.appendChild(summary);
    box.appendChild(el("p", "field-rules-lead", t.rulesLead));
    var list = el("ul", "field-rules-list");
    rules.forEach(function (rule) {
      var item = el("li");
      var text = rule.text[state.lang];
      if (text) {
        var strong = el("strong");
        strong.appendChild(withCode(text));
        item.appendChild(strong);
      }
      if (rule.note) {
        if (text) item.appendChild(document.createTextNode(" "));
        item.appendChild(withCode(rule.note[state.lang]));
      }
      list.appendChild(item);
    });
    box.appendChild(list);
    parent.appendChild(box);
  }

  /* ---------- "show me this field in a real document" ---------- */

  /* The gallery's data, loaded on demand. The reference answers "what is this field"; these
     panels answer "what does it look like in something I could publish" — and the point is
     that you never leave the page to find out, so you keep your place in the table. */

  function usageFor(path) {
    var usage = state.examples && state.examples.usage[path];
    return usage && usage.length ? usage : null;
  }

  function exampleFile(file) {
    return state.examples.examples.find(function (ex) { return ex.file === file; });
  }

  function loadExamples() {
    if (state.examplesState !== "idle") return Promise.resolve();
    state.examplesState = "loading";
    render();
    return fetch("../data/examples.json")
      .then(function (res) { return res.json(); })
      .then(function (model) {
        state.examples = model;
        state.examplesState = "ready";
        render();
      })
      .catch(function (err) {
        console.error("[OTE] failed to load the example documents", err);
        state.examplesState = "failed";
        render();
      });
  }

  // `value` is optional: when the reader pressed one of the schema's example values, prefer a
  // document that actually contains that value — being shown the field elsewhere is a worse
  // answer to "where does this go?" than being shown the very thing you clicked.
  function openDocument(cardId, path, value) {
    state.open[cardId] = { path: path, value: value };
    if (!state.examples) return void loadExamples();
    // The offer is made before the documents are known; a field none of them uses withdraws it.
    if (!usageFor(path)) delete state.open[cardId];
    render();
    var card = document.getElementById(cardId);
    if (card) card.scrollIntoView({ block: "nearest" });
  }

  // A schema example is one value; a document is pretty-printed over many lines, so the two are
  // never equal as text. Compare by the scalars inside: a document containing every leaf of the
  // value is showing that value, whatever the whitespace.
  function leavesOf(value, out) {
    if (Array.isArray(value)) value.forEach(function (item) { leavesOf(item, out); });
    else if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) { leavesOf(value[key], out); });
    } else out.push(JSON.stringify(value));
    return out;
  }

  /** The field's own block: its line, plus everything indented under it. */
  function blockAt(source, line) {
    var lines = source.split("\n");
    var first = lines[line - 1];
    if (first === undefined) return "";
    var indent = first.search(/\S/);
    var block = [first];
    for (var i = line; i < lines.length && lines[i].search(/\S/) > indent; i++) block.push(lines[i]);
    return block.join("\n");
  }

  function blockShows(source, line, value) {
    var block = blockAt(source, line);
    // Compared block by block, not document by document: a feed holds ten events, and being
    // dropped on some other event's `startDate` is not showing the reader the value they pressed.
    return leavesOf(value, []).every(function (leaf) { return block.indexOf(leaf) !== -1; });
  }

  /**
   * Which document to open, and on which line: what the reader picked, else the occurrence that
   * actually holds the value they pressed, else simply the first example that uses the field.
   */
  function pickUsage(open, usage) {
    var chosen = open.file && usage.find(function (use) { return use.file === open.file; });
    var candidates = chosen ? [chosen] : usage;

    if (open.value !== undefined) {
      for (var i = 0; i < candidates.length; i++) {
        var source = exampleFile(candidates[i].file).source;
        var line = candidates[i].lines.find(function (n) { return blockShows(source, n, open.value); });
        if (line) return { use: candidates[i], line: line };
      }
    }
    var fallback = candidates[0] || usage[0];
    return { use: fallback, line: fallback.lines[0] };
  }

  function appendDocuments(card, path, t) {
    var open = state.open[card.id];
    var usage = usageFor(path);

    // Before the data is there we cannot know whether this field appears anywhere, so the
    // offer is made for every field and withdrawn for the few that turn out to have none.
    if (state.examples && !usage) return;

    var bar = el("div", "field-docs-bar");
    var toggle = el("button", "field-docs-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(Boolean(open)));
    toggle.textContent = open ? t.hideDocs : t.inDocs;
    toggle.addEventListener("click", function () {
      if (open) {
        delete state.open[card.id];
        render();
      } else {
        openDocument(card.id, path);
      }
    });
    bar.appendChild(toggle);

    if (usage) {
      bar.appendChild(el("span", "field-docs-count", t.inDocsCount.replace("{n}", usage.length)));
    }
    if (state.examplesState === "loading") bar.appendChild(el("span", "field-docs-count", t.loadingDocs));
    if (state.examplesState === "failed") bar.appendChild(el("span", "field-docs-count", t.docsFailed));
    card.appendChild(bar);

    if (!open || !usage) return;

    var picked = pickUsage(open, usage);
    var use = picked.use;
    var example = exampleFile(use.file);
    var panel = el("div", "field-docs");

    if (usage.length > 1) {
      var picker = el("div", "field-docs-picker");
      usage.forEach(function (candidate) {
        var chip = el("button", "field-doc-chip" + (candidate.file === use.file ? " is-active" : ""));
        chip.type = "button";
        chip.textContent = exampleFile(candidate.file).title[state.lang];
        chip.setAttribute("aria-pressed", String(candidate.file === use.file));
        chip.addEventListener("click", function () {
          state.open[card.id] = { path: path, file: candidate.file, value: open.value };
          render();
        });
        picker.appendChild(chip);
      });
      panel.appendChild(picker);
    }

    var figure = el("figure", "code-block code-block-sm");
    var caption = el("figcaption");
    caption.appendChild(el("code", null, example.file));
    caption.appendChild(el("span", "field-docs-lines", t.highlighted.replace("{n}", use.lines.length)));
    var full = el("a", "field-docs-full", t.fullExample + " →");
    full.href = "/examples/#" + example.file.replace(/\.json$/, "");
    caption.appendChild(full);
    figure.appendChild(caption);

    var pre = document.createElement("pre");
    var code = document.createElement("code");
    code.appendChild(window.OTECode.renderJson(example.source, { hits: use.lines, extTitle: t.extVocabTitle }));
    pre.appendChild(code);
    figure.appendChild(pre);
    panel.appendChild(figure);
    card.appendChild(panel);

    // Open on the field, not on line 1: a 90-line feed would otherwise show its licence header
    // and hide the very thing the reader asked to see. On the next frame, because the card is
    // still detached from the document here — offsets of a detached element are all zero.
    requestAnimationFrame(function () {
      var hit = code.querySelector('.code-line[data-line="' + picked.line + '"]') ||
        code.querySelector(".code-line.is-hit");
      if (!hit) return;
      // By rectangle, not by offsetTop: the card is positioned, so offsets are measured from it
      // and not from the scrolling box.
      var delta = hit.getBoundingClientRect().top - pre.getBoundingClientRect().top;
      pre.scrollTop = Math.max(0, pre.scrollTop + delta - pre.clientHeight / 3);
    });
  }

  /* ---------- table of contents ---------- */

  /** The parent of `location.geo.lat` is `location.geo`; of `organizers[].name`, `organizers`. */
  function parentPath(path) {
    var at = path.lastIndexOf(".");
    return at === -1 ? null : path.slice(0, at).replace(/\[\]$/, "");
  }

  // The fields arrive flat, in canonical order, so a parent always precedes its children: one
  // pass is enough to hang each field off its parent. A child whose parent the filter removed
  // becomes a root of its own — it still has to be reachable.
  function tocTree(fields) {
    var roots = [];
    var byPath = {};
    fields.forEach(function (f) {
      var node = { field: f, children: [] };
      byPath[f.path] = node;
      var parent = byPath[parentPath(f.path) || ""];
      (parent ? parent.children : roots).push(node);
    });
    return roots;
  }

  function branchLabel(t, path, open) {
    return (open ? t.tocCollapse : t.tocExpand).replace("{field}", path);
  }

  /** Reflect a branch's open/closed state in the DOM. State itself lives in `state.tocOpen`. */
  function setBranch(button, open) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", branchLabel(UI[state.lang], button.dataset.path, open));
    button.closest(".toc-item").classList.toggle("is-collapsed", !open);
  }

  function tocItems(list, nodes, schema, t, forceOpen) {
    nodes.forEach(function (node) {
      var f = node.field;
      var key = schema.name + "-" + f.path;
      var item = el("li", "toc-item");
      var row = el("div", "toc-row");
      row.dataset.depth = String(f.path.split(".").length - 1);

      var link = el("a", isDocRequired(f) ? "toc-required" : f.recommended ? "toc-recommended" : null);
      link.appendChild(el("span", null, f.path.split(".").pop()));
      link.href = "#" + key;
      link.title = f.path;
      link.dataset.depth = row.dataset.depth;
      link.dataset.target = key;

      if (node.children.length) {
        var open = forceOpen || state.tocOpen[key] === true;
        item.classList.add("has-children");
        if (!open) item.classList.add("is-collapsed");

        var branch = el("button", "toc-branch");
        branch.type = "button";
        branch.dataset.key = key;
        branch.dataset.path = f.path;
        branch.setAttribute("aria-expanded", String(open));
        branch.setAttribute("aria-label", branchLabel(t, f.path, open));
        branch.addEventListener("click", function () {
          var next = item.classList.contains("is-collapsed");
          state.tocOpen[key] = next;
          // Closing a branch you are currently reading inside has to stick: the scrollspy would
          // otherwise re-open it on the very next scroll frame.
          if (next) delete state.tocShut[key];
          else state.tocShut[key] = true;
          setBranch(branch, next);
        });
        row.appendChild(branch);
        // How much is hidden, so the reader can tell a leaf from a folded subtree at a glance.
        link.appendChild(el("span", "toc-count", String(node.children.length)));
      }

      row.appendChild(link);
      item.appendChild(row);

      if (node.children.length) {
        var sub = el("ul", "toc-children");
        tocItems(sub, node.children, schema, t, forceOpen);
        item.appendChild(sub);
      }
      list.appendChild(item);
    });
  }

  function renderToc(t) {
    dom.toc.replaceChildren();
    dom.toc.appendChild(el("p", "toc-title", t.tocTitle));
    dom.toc.appendChild(el("p", "toc-legend", t.tocLegend));
    dom.toc.appendChild(el("p", "toc-legend toc-legend-recommended", t.tocLegendRecommended));
    // The map marks what a MINIMAL document must carry, so `source.name` — required, but only
    // once there is a `source` — carries no mark. Said here, because a reader who saw the badge
    // on the field and no mark here would be right to think one of the two is lying.
    dom.toc.appendChild(el("p", "toc-legend toc-legend-in-parent", t.tocLegendInParent));

    // A filter that hides its own matches would be useless: while one is active every branch
    // is open, whatever the reader collapsed before.
    var forceOpen = Boolean(state.query) || state.onlyRequired;

    var any = false;
    state.model.schemas.forEach(function (schema) {
      var fields = visibleFields(schema);
      if (!fields.length) return;
      any = true;

      var group = el("div", "toc-group");
      var head = el("a", null, schema.name);
      head.href = "#" + schema.name;
      group.appendChild(head);

      var list = el("ul", "toc-list");
      tocItems(list, tocTree(fields), schema, t, forceOpen);
      group.appendChild(list);
      dom.toc.appendChild(group);
    });

    if (!any) dom.toc.appendChild(el("p", "toc-empty", t.noMatch));
  }

  /**
   * The spec version this page is showing, as the "v0.5" form used in paths and prose, read from
   * the data the table is built from. Hardcoding it here is how the page came to announce v0.4
   * while rendering v0.5's 99 fields: the fields were generated, the version label was not.
   * Empty string before the model loads — the static HTML already carries the right label, so
   * nothing flickers to a wrong one.
   */
  /**
   * Which version's data this page renders, and where to fetch it from. /spec/ has no pin and
   * shows the latest; /spec/v0.4/ carries <meta name="ote-spec-version"> and sits one directory
   * deeper, so its data path gains a ../ . The pages are generated from this one, so the only
   * thing that distinguishes them is that meta tag.
   */
  var PINNED = (document.querySelector('meta[name="ote-spec-version"]') || {}).content || "";
  function dataUrlFor(version) {
    return (PINNED ? "../../data/reference-" : "../data/reference-") + version + ".json";
  }
  var DATA_URL = PINNED ? dataUrlFor(PINNED) : "../data/reference.json";

  /**
   * The version picker, filled from the data rather than from a hand-kept list: a version that
   * exists in docs/data/ is a version with a page, and one that does not cannot be offered.
   * Absolute hrefs because /spec/ and /spec/v0.4/ sit at different depths and the target is the
   * same either way.
   */
  function renderVersions(t) {
    var select = document.getElementById("spec-version");
    if (!select || !state.model || !state.model.versions) return;
    var current = "v" + state.model.specVersion.split(".").slice(0, 2).join(".");
    var latest = state.model.versions[state.model.versions.length - 1];
    select.replaceChildren();
    state.model.versions
      .slice()
      .reverse()
      .forEach(function (version) {
        var option = el("option", null, version === latest ? t.versionCurrent.replace("{version}", version) : version);
        option.value = version === latest ? "/spec/" : "/spec/" + version + "/";
        option.selected = version === current;
        select.appendChild(option);
      });
    select.onchange = function () {
      location.assign(select.value);
    };
  }

  /**
   * A fragment matching no field used to do nothing whatsoever: the browser served the page and
   * stayed at the top, which looks identical to a page where the field exists and the scroll
   * merely failed. That silence is how two readers of the same URL could reach opposite
   * conclusions and both be certain. So say it — and say where the field does exist, because a
   * fragment that resolves in another version is the common case: a link written against /spec/,
   * read after the spec moved on.
   */
  function unknownFragment(id) {
    var t = UI[state.lang];
    var here = specLabel();
    var notice = el("p", "ref-unknown");
    notice.setAttribute("role", "status");
    notice.append(t.unknownFragment.replace("{id}", id).replace("{version}", here));
    dom.reference.prepend(notice);

    // Which versions DO have it is not knowable from here: each version's fields live in its own
    // data file and this page holds exactly one. Hence the fan-out — on the failure path only,
    // where five small fetches cost nothing and answer the reader's actual question.
    var others = (state.model.versions || []).filter(function (version) { return version !== here; });
    Promise.all(
      others.map(function (version) {
        return fetch(dataUrlFor(version))
          .then(function (res) { return res.json(); })
          .then(function (model) {
            var has = model.schemas.some(function (schema) {
              return schema.fields.some(function (f) { return schema.name + "-" + f.path === id; });
            });
            return has ? version : null;
          })
          .catch(function () { return null; });
      })
    ).then(function (hits) {
      var found = hits.filter(Boolean);
      if (!found.length) return;
      notice.append(" " + t.unknownElsewhere + " ");
      found.forEach(function (version, i) {
        // The latest lives at /spec/ as well as at its own path; link the version-pinned one,
        // which is what the reader wants to cite from here.
        var link = el("a", null, version);
        link.href = "/spec/" + version + "/#" + encodeURIComponent(id);
        notice.append(link, i === found.length - 1 ? "." : ", ");
      });
    });
  }

  function specLabel() {
    var version = state.model && state.model.specVersion;
    return version ? "v" + version.split(".").slice(0, 2).join(".") : "";
  }

  function render() {
    var t = UI[state.lang];
    var version = specLabel();
    var withVersion = function (text) {
      return version ? text.replace(/\{version\}/g, version) : text.replace(/ \{version\}/g, "");
    };
    document.documentElement.lang = state.lang;
    document.title = t.title + " — OTE Spec" + (version ? " " + version : "");

    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = t[node.getAttribute("data-t")];
      if (value) node.textContent = withVersion(value);
    });
    // Links that point INTO a version (the raw schema, the normative README). Same reason as the
    // prose: the template lives in the HTML, the version comes from the data.
    if (version) {
      document.querySelectorAll("[data-v-href]").forEach(function (node) {
        node.setAttribute("href", node.getAttribute("data-v-href").replace(/\{version\}/g, version));
      });
    }
    document.querySelectorAll("[data-t-placeholder]").forEach(function (node) {
      node.placeholder = t[node.getAttribute("data-t-placeholder")];
    });
    document.querySelectorAll("[data-t-aria]").forEach(function (node) {
      node.setAttribute("aria-label", t[node.getAttribute("data-t-aria")]);
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });

    renderVersions(t);

    // The guard comes BEFORE the wipe, and that order is load-bearing: the region arrives with
    // the fields already in the HTML, generated by build-reference.mjs. Wiping first would blank
    // them for the whole duration of the fetch — the one reader this page was failing (no JS, or
    // slow JS) would see exactly what it saw before.
    if (!state.model) return;
    dom.reference.replaceChildren();

    var shown = 0;
    var total = 0;

    state.model.schemas.forEach(function (schema) {
      total += schema.fields.length;
      var fields = visibleFields(schema);
      shown += fields.length;
      if (!fields.length) return;

      var section = el("section", "ref-schema");
      section.id = schema.name;

      var h2 = el("h2");
      h2.append(el("code", null, schema.name), document.createTextNode(" — " + schema.title[state.lang]));
      section.appendChild(h2);
      section.appendChild(el("p", "ref-schema-desc", schema.description[state.lang]));
      // The document's own rules go here, above the fields: they are conditions on the whole
      // thing (any translations map requires textLanguage) and belong to no single field.
      appendRules(section, rulesOf(schema, ""), t, t.rulesDoc);

      fields.forEach(function (f) {
        var card = el(
          "article",
          "field" + (f.required ? " field-required" : f.recommended ? " field-recommended" : "")
        );
        card.id = schema.name + "-" + f.path;
        card.dataset.depth = String(f.path.split(".").length - 1);
        // Read back by the scrollspy to unfold the TOC branch you are currently inside.
        card.dataset.schema = schema.name;
        card.dataset.path = f.path;

        var head = el("div", "field-head");
        head.appendChild(fieldName(f.path));
        head.appendChild(el("span", "field-type", f.type));

        // The default, when the schema declares one — read from the schema, never from prose, so
        // it cannot say one thing here and another to the validator. Its absence carries meaning
        // too: a field with no badge has no default, and missing means unknown. That is said in
        // the badge's own tooltip, because the reader who needs it is looking at one field.
        // It sits next to the type, not out on the right with the level: both answer "what goes
        // in this field", and the level answers a different question — whether it has to be there.
        if (f.default !== undefined) {
          var def = el("span", "field-default", t.defaultBadge.replace("{value}", JSON.stringify(f.default)));
          def.title = t.defaultTip;
          head.appendChild(def);
        } else if (f.inheritsFrom) {
          // The other kind of default: not a literal, but whatever the enclosing feed declared.
          // Said as a badge for the same reason as the literal one — a reader who has to find it
          // in the middle of a paragraph is a reader who reads the field as having no default.
          var parent = f.inheritsFrom.replace(/^feed\./, "");
          var inh = el("span", "field-default is-inherited");
          inh.title = t.inheritedTip.replace(/\{parent\}/g, parent);
          // The feed field it falls back to has its own card on this page, so the name is a link:
          // "inherits the feed's license" is only useful if you can go and read what that says.
          var around = t.inheritedBadge.split("{parent}");
          var link = el("a", "field-default-link", parent);
          link.href = "#feed-" + f.inheritsFrom.replace(/^feed\./, "");
          inh.append(around[0], link, around[1] || "");
          head.appendChild(inh);
        } else if (f.inheritedBy) {
          // The same fact, seen from the feed: this is the field a publisher declares once and no
          // event repeats. Derived from the event's own annotation, so the two sides cannot drift.
          var lends = el("span", "field-default is-inherited", t.lendsBadge);
          lends.title = t.lendsTip;
          head.appendChild(lends);
        }

        var anchor = el("a", "field-anchor", "#");
        anchor.href = "#" + card.id;
        anchor.setAttribute("aria-label", t.anchorLabel + ": " + f.path);
        head.appendChild(anchor);

        // Three levels, one badge: required (the validator rejects the document without it),
        // recommended (valid, but a checker warns) and optional. The middle one is the whole
        // point of the profiles — flattening it back into "optional" would hide it. A required
        // field inside an optional object says so on the badge itself: "required" alone sent
        // readers looking for it in the map, where it is not marked, and nothing explained why.
        var level = f.required ? "required" : f.recommended ? "recommended" : "optional";
        var badge = el("span", "field-req is-" + level, t[level]);
        if (level === "recommended") badge.title = t.recommendedTip;
        if (f.requiredIn) {
          badge.classList.add("is-required-in");
          badge.replaceChildren(withCode(t.requiredIn.replace("{parent}", f.requiredIn)));
          // A title attribute is plain text: the backticks that mark up the badge would show.
          badge.title = t.requiredInTip.replace(/\{parent\}/g, f.requiredIn).replace(/`/g, "");
        }
        head.appendChild(badge);
        card.appendChild(head);

        var desc = el("p", "field-desc");
        desc.appendChild(withCode(f.description[state.lang]));
        card.appendChild(desc);

        // What the validator enforces about this object beyond the level of its fields: at least
        // one of venue and onlineUrl, currency once price is non-zero. Read from the schema like
        // everything else here — a page that showed every one of those fields as "optional" was
        // describing a document the validator would reject.
        appendRules(card, rulesOf(schema, f.path), t, t.rulesField);
        // A list has no card of its own for its items: the rules of `offers[]` are documented on
        // the `offers` card, said of each entry — which is what `[]` means in the field paths.
        appendRules(card, rulesOf(schema, f.path + "[]"), t, t.rulesItem);

        var path = schema.name + "." + f.path;

        if (f.examples && f.examples.length) {
          var ex = el("div", "field-examples");
          ex.appendChild(el("span", "field-examples-label", t.examples));
          f.examples.forEach(function (value) {
            // The schema's own examples stay exactly what they were — single values, as the
            // schema declares them. They just became a way in: press one and the same value
            // appears where it lives, inside a whole document. Pressable from the first paint,
            // before the documents are fetched: whether a value leads anywhere is not something
            // the reader should have to discover by the button appearing late.
            var button = el("button", "field-example", JSON.stringify(value));
            button.type = "button";
            button.title = t.examplesHint;
            button.addEventListener("click", function () {
              openDocument(card.id, path, value);
            });
            ex.appendChild(button);
          });
          card.appendChild(ex);
        }

        appendDocuments(card, path, t);

        highlight(card, state.query);
        section.appendChild(card);
      });

      dom.reference.appendChild(section);
    });

    if (!shown) {
      var empty = el("div", "ref-empty");
      empty.appendChild(el("p", null, t.noMatch));
      var reset = el("button", "btn btn-ghost", t.clear);
      reset.type = "button";
      reset.addEventListener("click", function () {
        dom.search.value = "";
        dom.required.checked = false;
        state.query = "";
        state.onlyRequired = false;
        render();
        dom.search.focus();
      });
      empty.appendChild(reset);
      dom.reference.appendChild(empty);
    }

    dom.count.textContent =
      state.query || state.onlyRequired
        ? t.count.replace("{shown}", shown).replace("{total}", total)
        : "";

    renderToc(t);
    syncPosition();
  }

  /* ---------- scrollspy: the TOC and the toolbar chip say where you are ---------- */

  var spyQueued = false;
  function syncPosition() {
    var sections = dom.reference.querySelectorAll(".ref-schema");
    var cards = dom.reference.querySelectorAll(".field");
    var currentSchema = null;
    var currentCard = null;

    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= STICKY_OFFSET) currentSchema = s.id;
    });
    cards.forEach(function (c) {
      if (c.getBoundingClientRect().top <= STICKY_OFFSET) currentCard = c;
    });
    var currentField = currentCard && currentCard.id;
    if (!currentSchema && sections.length) currentSchema = sections[0].id;

    dom.here.hidden = !currentSchema;
    if (currentSchema) {
      dom.here.href = "#" + currentSchema;
      dom.here.firstElementChild.textContent = currentSchema;
    }

    dom.toc.querySelectorAll(".toc-list a").forEach(function (link) {
      if (link.dataset.target === currentField) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    // Reading `location.geo.lat` unfolds `location` and `location.geo` on its own — a highlight
    // inside a folded branch would mark a place the reader cannot see. Branches the reader did
    // not open by hand fold back once the reading position leaves them, so the map stays short.
    var onPath = {};
    if (currentCard && currentCard.dataset.path) {
      var parts = currentCard.dataset.path.split(".");
      for (var i = 0; i < parts.length; i++) {
        onPath[currentCard.dataset.schema + "-" + parts.slice(0, i + 1).join(".").replace(/\[\]$/, "")] = true;
      }
    }
    var forceOpen = Boolean(state.query) || state.onlyRequired;
    dom.toc.querySelectorAll(".toc-branch").forEach(function (branch) {
      var key = branch.dataset.key;
      if (!onPath[key]) delete state.tocShut[key];
      var open = forceOpen || state.tocOpen[key] === true ||
        (Boolean(onPath[key]) && !state.tocShut[key]);
      if (String(open) !== branch.getAttribute("aria-expanded")) setBranch(branch, open);
    });

    // Keep the active entry inside the (scrollable) TOC viewport. After the unfolding above,
    // never before it: an entry that was still hidden has no position worth scrolling to. Scroll the panel by hand:
    // scrollIntoView would also move the document, fighting the reader's own scroll.
    var active = dom.toc.querySelector('.toc-list a[aria-current="true"]');
    if (active) {
      var panel = dom.toc.getBoundingClientRect();
      var item = active.getBoundingClientRect();
      if (item.top < panel.top) dom.toc.scrollTop -= panel.top - item.top + 8;
      else if (item.bottom > panel.bottom) dom.toc.scrollTop += item.bottom - panel.bottom + 8;
    }
  }

  window.addEventListener("scroll", function () {
    if (spyQueued || !state.model) return;
    spyQueued = true;
    requestAnimationFrame(function () {
      spyQueued = false;
      syncPosition();
    });
  }, { passive: true });

  /* ---------- controls ---------- */

  var searchTimer;
  dom.search.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = dom.search.value.trim().toLowerCase();
      render();
    }, 90);
  });
  dom.search.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dom.search.value) {
      dom.search.value = "";
      state.query = "";
      render();
    }
  });

  // "/" jumps to the filter, the convention on every reference site.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    e.preventDefault();
    dom.search.focus();
    dom.search.select();
  });

  dom.required.addEventListener("change", function () {
    state.onlyRequired = dom.required.checked;
    render();
  });

  // Below 980px the TOC is a disclosure; above it, it is always open.
  var narrow = window.matchMedia("(max-width: 980px)");
  var expanded = false;
  function syncToc() {
    if (narrow.matches) {
      dom.toc.hidden = !expanded;
      dom.tocToggle.setAttribute("aria-expanded", String(expanded));
    } else {
      dom.toc.hidden = false;
      dom.tocToggle.setAttribute("aria-expanded", "false");
    }
  }
  dom.tocToggle.addEventListener("click", function () {
    expanded = !expanded;
    syncToc();
  });
  dom.toc.addEventListener("click", function (e) {
    if (e.target.closest("a") && narrow.matches) {
      expanded = false;
      syncToc();
    }
  });
  narrow.addEventListener("change", syncToc);
  syncToc();

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
  // Browsers restore form values on reload and back-navigation: start from what the controls say.
  state.query = dom.search.value.trim().toLowerCase();
  state.onlyRequired = dom.required.checked;
  render();

  fetch(DATA_URL)
    .then(function (res) { return res.json(); })
    .then(function (model) {
      state.model = model;
      render();
      // A deep link opened before the fields existed still has to land on its field.
      if (location.hash.length > 1) {
        var wanted = decodeURIComponent(location.hash.slice(1));
        var target = document.getElementById(wanted);
        if (target) target.scrollIntoView();
        else unknownFragment(wanted);
      }
    })
    .catch(function (err) {
      console.error("[OTE] failed to load the field reference", err);
    });
})();
