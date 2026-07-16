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
      footerNote: "Registrations are reviewed by hand. Draft specification — fields may change.",
    },
    es: {
      pill: "Borrador 0.x",
      draft: "La spec aún no es estable: los campos pueden cambiar, renombrarse o desaparecer.",
      follow: "Sigue la discusión",
      navSpec: "Cómo funciona",
      navAdopt: "Adhiérete",
      navReference: "Referencia",
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
      footerNote: "Los registros se revisan a mano. Especificación en borrador: los campos pueden cambiar.",
    },
  };

  var state = { lang: FALLBACK, entries: [], loaded: false, match: null };

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

  /* ---------- submit: prefilled issue via URL params ---------- */

  document.getElementById("reg-form").addEventListener("submit", function (event) {
    event.preventDefault();

    var name = nameInput.value.trim();
    var feed = feedInput.value.trim();
    var valid = name && /^https?:\/\/.+/.test(feed);
    errorLine.hidden = !!valid;
    if (!valid) return;

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
})();
