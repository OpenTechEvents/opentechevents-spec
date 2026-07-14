/* OpenTechEvents landing — i18n + data-driven lists. No build step, no dependencies. */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var FALLBACK = 'en';
  var STORAGE_KEY = 'ote-lang';

  var state = { lang: FALLBACK, dict: {}, data: {}, filter: 'all' };

  /* ---------- language detection ---------- */

  function pickLang() {
    var qs = new URLSearchParams(location.search).get('lang');
    if (qs && SUPPORTED.indexOf(qs) !== -1) return qs;

    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;

    // System / browser language, e.g. "es-ES" -> "es".
    var prefs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || FALLBACK];
    for (var i = 0; i < prefs.length; i++) {
      var base = String(prefs[i]).toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
    return FALLBACK;
  }

  /* ---------- helpers ---------- */

  function get(obj, path) {
    return path.split('.').reduce(function (acc, k) {
      return acc && acc[k] !== undefined ? acc[k] : undefined;
    }, obj);
  }

  // Picks the current language out of a {en, es} object; plain strings pass through.
  function t(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[state.lang] || value[FALLBACK] || '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (w) {
      return w[0].toUpperCase();
    }).join('');
  }

  /* ---------- i18n application ---------- */

  function applyDict() {
    document.documentElement.lang = state.lang;

    var title = get(state.dict, 'meta.title');
    if (title) document.title = title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && get(state.dict, 'meta.description')) {
      desc.setAttribute('content', get(state.dict, 'meta.description'));
    }

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var value = get(state.dict, node.getAttribute('data-i18n'));
      // Strings come from our own i18n files and may carry inline markup (<code>, <strong>).
      if (typeof value === 'string') node.innerHTML = value;
    });

    document.querySelectorAll('.lang button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
    });
  }

  /* ---------- renderers ---------- */

  function renderEntries(items, containerId, emptyId) {
    var container = document.getElementById(containerId);
    var empty = document.getElementById(emptyId);
    container.replaceChildren();

    if (!items || !items.length) {
      container.hidden = true;
      empty.hidden = false;
      return;
    }
    container.hidden = false;
    empty.hidden = true;

    items.forEach(function (item) {
      var card = el(item.url ? 'a' : 'div', 'entry');
      if (item.url) {
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener';
      }

      if (item.logo) {
        var img = el('img', 'entry-logo');
        img.src = item.logo;
        img.alt = '';
        img.loading = 'lazy';
        card.appendChild(img);
      } else {
        card.appendChild(el('div', 'entry-logo', initials(item.name)));
      }

      var body = el('div');
      body.appendChild(el('div', 'entry-name', item.name));
      if (item.desc) body.appendChild(el('p', 'entry-desc', t(item.desc)));
      if (item.kind) body.appendChild(el('span', 'entry-meta', t(item.kind)));
      else if (item.feed) body.appendChild(el('span', 'entry-meta', 'OTE feed →'));
      card.appendChild(body);

      container.appendChild(card);
    });
  }

  function renderTestimonials(items) {
    var container = document.getElementById('testimonials');
    container.replaceChildren();
    if (!items || !items.length) return;

    items.forEach(function (item) {
      var fig = el('figure', 'quote');
      fig.appendChild(el('blockquote', null, t(item.quote)));

      var cap = el('figcaption');
      if (item.avatar) {
        var img = el('img');
        img.src = item.avatar;
        img.alt = '';
        img.loading = 'lazy';
        cap.appendChild(img);
      }
      var who = el('div');
      who.appendChild(el('span', 'quote-name', item.name));
      if (item.role) who.appendChild(document.createTextNode(t(item.role)));
      cap.appendChild(who);

      fig.appendChild(cap);
      container.appendChild(fig);
    });
  }

  function renderTools() {
    var container = document.getElementById('tools-list');
    var tools = (state.data.tools && state.data.tools.tools) || [];
    container.replaceChildren();

    tools
      .filter(function (tool) { return state.filter === 'all' || tool.status === state.filter; })
      .forEach(function (tool) {
        var card = el('article', 'tool');

        var head = el('div', 'tool-head');
        head.appendChild(el('h3', null, t(tool.name)));
        var label = get(state.dict, 'tools.status.' + tool.status) || tool.status;
        head.appendChild(el('span', 'badge badge-' + tool.status, label));
        card.appendChild(head);

        card.appendChild(el('p', null, t(tool.desc)));

        if (tool.url) {
          var link = el('a', 'tool-link', get(state.dict, tool.status === 'proposed' ? 'tools.linkIdea' : 'tools.linkRepo'));
          link.href = tool.url;
          link.target = '_blank';
          link.rel = 'noopener';
          card.appendChild(link);
        }

        container.appendChild(card);
      });
  }

  function renderFaq() {
    var container = document.getElementById('faq-list');
    var items = get(state.dict, 'faq.items') || [];
    container.replaceChildren();

    items.forEach(function (item) {
      var details = el('details');
      details.appendChild(el('summary', null, item.q));
      // Answers come from our own i18n files and may carry inline markup (links).
      var answer = el('p');
      answer.innerHTML = item.a;
      details.appendChild(answer);
      container.appendChild(details);
    });
  }

  function renderAll() {
    applyDict();
    renderEntries((state.data.adopters || {}).adopters, 'adopters-list', 'adopters-empty');
    renderEntries((state.data.consumers || {}).consumers, 'consumers-list', 'consumers-empty');
    renderTestimonials((state.data.consumers || {}).testimonials);
    renderTools();
    renderFaq();
  }

  /* ---------- boot ---------- */

  function loadJson(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + ': ' + res.status);
      return res.json();
    });
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    loadJson('i18n/' + lang + '.json').then(function (dict) {
      state.dict = dict;
      renderAll();
    });
  }

  document.querySelectorAll('.lang button').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
  });

  /* Highlight the nav item for the section you're actually looking at. A sticky nav that never
     reacts is what makes a long page feel like a maze. */
  (function trackSections() {
    var links = {};
    document.querySelectorAll('.nav a[data-nav]').forEach(function (a) { links[a.dataset.nav] = a; });

    var sections = Object.keys(links)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      Object.keys(links).forEach(function (id) {
        links[id].removeAttribute('aria-current');
      });
      // Topmost visible section wins, so scrolling down moves the marker forward, not back.
      var active = sections.find(function (section) { return visible.has(section.id); });
      if (active) links[active.id].setAttribute('aria-current', 'true');
    }, { rootMargin: '-64px 0px -55% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  })();

  document.querySelectorAll('.tools-filters .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.filter = chip.dataset.filter;
      document.querySelectorAll('.tools-filters .chip').forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
      });
      renderTools();
    });
  });

  state.lang = pickLang();

  Promise.all([
    loadJson('i18n/' + state.lang + '.json'),
    loadJson('data/adopters.json'),
    loadJson('data/consumers.json'),
    loadJson('data/tools.json')
  ]).then(function (results) {
    state.dict = results[0];
    state.data = { adopters: results[1], consumers: results[2], tools: results[3] };
    renderAll();
  }).catch(function (err) {
    console.error('[OTE] failed to load site data', err);
  });
})();
