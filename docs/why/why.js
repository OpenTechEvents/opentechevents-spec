/* /why/ — the problem, the benefits and the FAQ.
 *
 * It reads the very same dictionaries as the landing page (docs/i18n/*.json) instead of
 * carrying its own copy of those strings, which is what the other subpages do: the three
 * sections moved here verbatim, keys included, and a second spelling of that prose would be
 * a second source of truth for text nobody would remember to update twice. Only the page's
 * own <title>/description live under a key of their own.
 */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang";
  var state = { lang: FALLBACK, dict: {} };

  function pickLang() {
    var qs = new URLSearchParams(location.search).get("lang");
    if (qs && SUPPORTED.indexOf(qs) !== -1) return qs;

    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;

    var prefs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || FALLBACK];
    for (var i = 0; i < prefs.length; i++) {
      var base = String(prefs[i]).toLowerCase().split("-")[0];
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
    return FALLBACK;
  }

  function get(obj, path) {
    return path.split(".").reduce(function (acc, k) {
      return acc && acc[k] !== undefined ? acc[k] : undefined;
    }, obj);
  }

  function applyDict() {
    document.documentElement.lang = state.lang;

    // meta.title/meta.description describe the landing page; this page has its own pair.
    var title = get(state.dict, "why.meta.title");
    if (title) document.title = title;
    var desc = document.querySelector('meta[name="description"]');
    var descText = get(state.dict, "why.meta.description");
    if (desc && descText) desc.setAttribute("content", descText);

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var value = get(state.dict, node.getAttribute("data-i18n"));
      // Strings come from our own i18n files and may carry inline markup (<code>, links).
      if (typeof value === "string") node.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (node) {
      var value = get(state.dict, node.getAttribute("data-i18n-aria"));
      if (typeof value === "string") node.setAttribute("aria-label", value);
    });

    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
    });
  }

  function renderFaq() {
    var container = document.getElementById("faq-list");
    var items = get(state.dict, "faq.items") || [];
    container.replaceChildren();

    items.forEach(function (item) {
      var details = document.createElement("details");
      var summary = document.createElement("summary");
      summary.textContent = item.q;
      details.appendChild(summary);
      // Answers come from our own i18n files and may carry inline markup (links).
      var answer = document.createElement("p");
      answer.innerHTML = item.a;
      details.appendChild(answer);
      container.appendChild(details);
    });
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    return fetch("../i18n/" + lang + ".json")
      .then(function (res) {
        if (!res.ok) throw new Error("i18n/" + lang + ".json: " + res.status);
        return res.json();
      })
      .then(function (dict) {
        state.dict = dict;
        applyDict();
        renderFaq();
      });
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.dataset.lang); });
  });

  setLang(pickLang()).catch(function (err) {
    // The English copy is already in the markup, so a failed fetch degrades to a readable
    // page rather than an empty one. The FAQ is the exception: it has no static fallback.
    console.error(err);
  });
})();
