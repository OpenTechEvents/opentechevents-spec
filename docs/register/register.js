/* Adopter registration — a form that opens a prefilled GitHub issue. No backend.
   The name field autocompletes against pluggable community-directory sources, so a
   registration can be *linked* to an existing directory entry via its ID. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the landing page: pick a language once

  var REPO = "OpenTechEvents/opentechevents-spec";
  var ISSUE_TEMPLATE = "adopter.yml";
  var SCHEMA_BASE = "../schema/v0.2/"; // published copies — same origin, no CORS

  /* ---------- linking sources (pluggable) ----------
     A source turns an external community directory into a flat list of
     { id, name, website } entries, where `id` is globally unique thanks to the
     source prefix ("combuilders:42"). To add a directory, push another object
     with `id`, `label` ({en, es}), `url` and a `parse(json)` of its payload —
     nothing else in this file needs to change. The spec is international: the
     Spanish directory is the first source, not the definition of a community. */
  var SOURCES = [
    {
      id: "combuilders",
      label: {
        en: "the Community Builders directory",
        es: "el directorio de Community Builders",
      },
      url: "https://raw.githubusercontent.com/ComBuildersES/communities-directory/master/public/data/communities.json",
      parse: function (json) {
        return json.map(function (c) {
          return {
            id: "combuilders:" + c.id,
            name: c.name,
            website: c.communityUrl || "",
          };
        });
      },
    },
  ];

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
      title: "Register your community",
      lead: "Your community already publishes an OTE feed? Tell us. We validate the feed, list you on this site, and aggregators start picking up your events.",
      nameLabel: "Community name",
      nameHint: "Start typing — we try to match your community against known directories.",
      webLabel: "Website",
      webHint: "Optional. Filled in automatically when we find your community in a directory.",
      feedLabel: "OTE feed URL",
      feedHint: "The public URL of your <code>events.json</code>. No feed yet? <a href=\"/#adopt\">See how to publish one</a>.",
      formError: "Fill in the community name and the feed URL (a full URL, starting with https://).",
      submit: "Open the registration issue",
      note: "This opens a prefilled issue on GitHub for you to review before sending — nothing is submitted behind your back. You need a GitHub account.",
      matched: "Found in {source} — your registration will be linked to that entry ({id}).",
      feedChecking: "Checking the feed…",
      feedValid: "The feed parses and has the core OTE fields. Full validation runs when your issue is reviewed.",
      feedInvalid: "This doesn't look like a valid OTE feed: {errors}",
      feedCors: "Couldn't verify the feed from the browser (the server doesn't allow cross-origin reads). No problem — it will be validated when your issue is reviewed.",
      errHttp: "the URL answered HTTP {status}",
      errJson: "the URL doesn't return JSON",
      errNoEvents: "no `events` array — is this an OTE feed?",
      errMissing: "missing required field {field}",
      errEventMissing: "events[{i}] is missing required field {field}",
      footerNote: "Registrations are reviewed by hand. Draft specification — fields may change.",
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
      title: "Registra tu comunidad",
      lead: "¿Tu comunidad ya publica un feed OTE? Cuéntanoslo. Validamos el feed, te listamos en este sitio y los agregadores empiezan a recoger tus eventos.",
      nameLabel: "Nombre de la comunidad",
      nameHint: "Empieza a escribir: intentamos encontrar tu comunidad en directorios conocidos.",
      webLabel: "Web",
      webHint: "Opcional. Se rellena solo si encontramos tu comunidad en un directorio.",
      feedLabel: "URL del feed OTE",
      feedHint: "La URL pública de tu <code>events.json</code>. ¿Aún no tienes feed? <a href=\"/#adopt\">Mira cómo publicarlo</a>.",
      formError: "Rellena el nombre de la comunidad y la URL del feed (una URL completa, empezando por https://).",
      submit: "Abrir el issue de registro",
      note: "Esto abre un issue prefillado en GitHub para que lo revises antes de enviarlo — no se manda nada a tus espaldas. Necesitas una cuenta de GitHub.",
      matched: "Encontrada en {source}: tu registro quedará vinculado a esa entrada ({id}).",
      feedChecking: "Comprobando el feed…",
      feedValid: "El feed parsea y tiene los campos OTE básicos. La validación completa se hace al revisar tu issue.",
      feedInvalid: "Esto no parece un feed OTE válido: {errors}",
      feedCors: "No se pudo verificar el feed desde el navegador (el servidor no permite lecturas cross-origin). No pasa nada: se validará al revisar tu issue.",
      errHttp: "la URL responde HTTP {status}",
      errJson: "la URL no devuelve JSON",
      errNoEvents: "no hay array `events` — ¿es un feed OTE?",
      errMissing: "falta el campo obligatorio {field}",
      errEventMissing: "a events[{i}] le falta el campo obligatorio {field}",
      footerNote: "Los registros se revisan a mano. Especificación en borrador: los campos pueden cambiar.",
    },
  };

  var state = {
    lang: FALLBACK, entries: [], loaded: false, match: null,
    // Last feed check: url it ran against, status (checking|valid|invalid|cors)
    // and errors as {key, vars} pairs so a language switch can re-render them.
    feed: { url: "", status: "idle", errors: [] },
  };

  /* ---------- language (same logic as the rest of the site) ---------- */

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

  function applyDict() {
    var t = UI[state.lang];
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = t[node.getAttribute("data-t")];
      // Strings come from this file and may carry inline markup (<code>, links).
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });
    renderMatch(); // the "linked to directory" line is localised too
    renderFeedStatus(); // …and so is the feed-check result
  }

  /* ---------- directory autocomplete ---------- */

  var nameInput = document.getElementById("reg-name");
  var webInput = document.getElementById("reg-web");
  var feedInput = document.getElementById("reg-feed");
  var options = document.getElementById("reg-name-options");
  var matchLine = document.getElementById("reg-match");
  var errorLine = document.getElementById("reg-error");

  // Directories are only fetched when the user reaches the name field: no point
  // downloading community lists for visitors who bounce off the page.
  function loadSources() {
    if (state.loaded) return;
    state.loaded = true;

    SOURCES.forEach(function (source) {
      fetch(source.url)
        .then(function (res) {
          if (!res.ok) throw new Error(source.url + ": " + res.status);
          return res.json();
        })
        .then(function (json) {
          source.parse(json).forEach(function (entry) {
            entry.source = source;
            state.entries.push(entry);
            var opt = document.createElement("option");
            opt.value = entry.name;
            options.appendChild(opt);
          });
          findMatch(); // the user may have typed a name before the list arrived
        })
        .catch(function (err) {
          // A dead directory must not block registration — the form works unlinked.
          console.warn("[OTE] linking source unavailable", err);
        });
    });
  }

  function findMatch() {
    var name = nameInput.value.trim().toLowerCase();
    var match = null;
    if (name) {
      for (var i = 0; i < state.entries.length; i++) {
        if (state.entries[i].name.trim().toLowerCase() === name) { match = state.entries[i]; break; }
      }
    }
    if (match !== state.match) {
      state.match = match;
      if (match && match.website && !webInput.value) webInput.value = match.website;
      renderMatch();
    }
  }

  function renderMatch() {
    if (!state.match) {
      matchLine.hidden = true;
      return;
    }
    matchLine.textContent = UI[state.lang].matched
      .replace("{source}", state.match.source.label[state.lang])
      .replace("{id}", state.match.id);
    matchLine.hidden = false;
  }

  nameInput.addEventListener("focus", loadSources, { once: true });
  nameInput.addEventListener("input", findMatch);

  /* ---------- feed check (best-effort, in the browser) ----------
     Honest about its limits: this is a sanity check — the URL answers, it's JSON,
     and the required fields of the published schemas are there. The authoritative
     Ajv validation runs in the adopter-issue workflow, where CORS doesn't exist.
     A fetch the browser can't make (no CORS on the feed's host) therefore warns
     but never blocks. */

  var feedStatus = document.getElementById("reg-feed-status");
  var requiredFields = null; // { feed: [...], event: [...] } from the published schemas

  function loadRequired() {
    if (requiredFields) return Promise.resolve(requiredFields);
    return Promise.all([
      fetch(SCHEMA_BASE + "feed.schema.json").then(function (r) { return r.json(); }),
      fetch(SCHEMA_BASE + "event.schema.json").then(function (r) { return r.json(); }),
    ]).then(function (schemas) {
      requiredFields = {
        feed: schemas[0].required || [],
        event: (schemas[1].$defs && schemas[1].$defs.event && schemas[1].$defs.event.required) || [],
      };
      return requiredFields;
    }).catch(function () {
      // Schemas unreachable (offline dev?): degrade to the structural checks only.
      requiredFields = { feed: [], event: [] };
      return requiredFields;
    });
  }

  function structuralErrors(doc, req) {
    var errors = [];
    req.feed.forEach(function (field) {
      if (doc[field] === undefined) errors.push({ key: "errMissing", vars: { field: field } });
    });
    if (!Array.isArray(doc.events)) {
      // A missing `events` is already reported by the required-fields loop when
      // the schema lists it; only flag it here when present-but-not-an-array.
      if (doc.events !== undefined || req.feed.indexOf("events") === -1) {
        errors.push({ key: "errNoEvents", vars: {} });
      }
      return errors;
    }
    doc.events.forEach(function (event, i) {
      req.event.forEach(function (field) {
        if (event && event[field] === undefined) {
          errors.push({ key: "errEventMissing", vars: { i: String(i), field: field } });
        }
      });
    });
    return errors.slice(0, 6); // enough to act on, not a wall
  }

  function checkFeed() {
    var url = feedInput.value.trim();
    if (state.feed.url === url && state.feed.status !== "idle") return; // already checked
    if (!/^https?:\/\/.+/.test(url)) {
      state.feed = { url: url, status: "idle", errors: [] };
      renderFeedStatus();
      return;
    }

    state.feed = { url: url, status: "checking", errors: [] };
    renderFeedStatus();

    var done = function (status, errors) {
      if (state.feed.url !== url) return; // the field changed while we fetched
      state.feed = { url: url, status: status, errors: errors || [] };
      renderFeedStatus();
    };

    Promise.all([fetch(url), loadRequired()]).then(function (results) {
      var res = results[0], req = results[1];
      if (!res.ok) return done("invalid", [{ key: "errHttp", vars: { status: String(res.status) } }]);
      return res.json().then(function (doc) {
        var errors = structuralErrors(doc, req);
        done(errors.length ? "invalid" : "valid", errors);
      }, function () {
        done("invalid", [{ key: "errJson", vars: {} }]);
      });
    }).catch(function () {
      done("cors"); // network error or CORS — indistinguishable from here, and neither blocks
    });
  }

  function renderFeedStatus() {
    var t = UI[state.lang];
    var f = state.feed;
    feedStatus.className = "feed-status";
    if (f.status === "idle") {
      feedStatus.hidden = true;
      return;
    }
    feedStatus.hidden = false;
    if (f.status === "checking") {
      feedStatus.textContent = t.feedChecking;
    } else if (f.status === "valid") {
      feedStatus.classList.add("feed-status-ok");
      feedStatus.textContent = t.feedValid;
    } else if (f.status === "cors") {
      feedStatus.classList.add("feed-status-warn");
      feedStatus.textContent = t.feedCors;
    } else {
      feedStatus.classList.add("feed-status-err");
      var errors = f.errors.map(function (e) {
        return t[e.key].replace(/\{(\w+)\}/g, function (m, k) { return e.vars[k] || m; });
      });
      feedStatus.textContent = t.feedInvalid.replace("{errors}", errors.join("; ") + ".");
    }
  }

  feedInput.addEventListener("change", checkFeed);

  /* ---------- submit: prefilled issue via URL params ---------- */

  document.getElementById("reg-form").addEventListener("submit", function (event) {
    event.preventDefault();

    var name = nameInput.value.trim();
    var feed = feedInput.value.trim();
    var valid = name && /^https?:\/\/.+/.test(feed);
    errorLine.hidden = !!valid;
    if (!valid) return;

    // An invalid feed blocks; the fix is right there in the status line. A check
    // still in flight blocks too — clicking again once it lands keeps the
    // window.open inside a user gesture, so no popup blocker heuristics.
    checkFeed();
    if (state.feed.status === "invalid" || state.feed.status === "checking") return;

    // Keys must match the field ids in .github/ISSUE_TEMPLATE/adopter.yml.
    var params = new URLSearchParams({
      template: ISSUE_TEMPLATE,
      title: "[Adopter] " + name,
      community: name,
      feed: feed,
    });
    var website = webInput.value.trim();
    if (website) params.set("website", website);
    if (state.match) params.set("directory", state.match.id);

    window.open("https://github.com/" + REPO + "/issues/new?" + params.toString(), "_blank", "noopener");
  });

  /* ---------- prefill from query params ----------
     Lets other tools (the organizer kit, docs, emails) deep-link a half-filled
     form: /register/?name=…&url=…&feed=…  ("website" works as an alias of
     "url"). Prefilled values go through the same paths as typed ones: the
     feed gets checked, the name gets matched against directories. */

  function prefillFromQuery() {
    var qs = new URLSearchParams(location.search);
    var name = (qs.get("name") || "").trim();
    var website = (qs.get("url") || qs.get("website") || "").trim();
    var feed = (qs.get("feed") || "").trim();

    if (name) nameInput.value = name;
    if (website) webInput.value = website;
    if (feed) {
      feedInput.value = feed;
      checkFeed();
    }
    if (name) {
      loadSources(); // fetch directories now — findMatch() re-runs when they arrive
      findMatch();
    }
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
  prefillFromQuery();
})();
