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

    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      var value = get(state.dict, node.getAttribute('data-i18n-aria'));
      if (typeof value === 'string') node.setAttribute('aria-label', value);
    });

    document.querySelectorAll('.lang button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
    });
  }

  /* ---------- renderers ---------- */

  /* `license` is an SPDX identifier or a URL. The identifier is the label; a URL has no
     short form that says anything true about the terms, so it says only that it is custom
     and links nowhere — the tooltip carries the URL. */
  function licenseLabel(license) {
    if (!/^https?:/i.test(license)) return license;
    return get(state.dict, 'adopters.licenseCustom') || 'Custom licence';
  }

  function feedLink(className, label, href) {
    var a = el('a', 'entry-meta ' + className, label);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

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
      // Not an <a>: an entry can carry two separate links (site + feed preview), and
      // nesting <a> elements is invalid HTML with unreliable click behaviour. The
      // site link stretches over the whole card via .entry-name-link::after instead.
      var card = el('div', 'entry');

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
      var nameEl = el(item.url ? 'a' : 'div', 'entry-name', item.name);
      if (item.url) {
        nameEl.href = item.url;
        nameEl.target = '_blank';
        nameEl.rel = 'noopener';
        nameEl.classList.add('entry-name-link');
      }
      body.appendChild(nameEl);
      if (item.desc) body.appendChild(el('p', 'entry-desc', t(item.desc)));

      var metas = el('div', 'entry-metas');
      // What the entity is (community, directory) or — for a tool — its own label. Used to
      // be an either/or with the feed links below, which meant giving an adopter a `kind`
      // silently took its feed links away.
      if (item.kind) {
        var kindLabel = typeof item.kind === 'string'
          ? (get(state.dict, 'adopters.kind.' + item.kind) || item.kind)
          : t(item.kind);
        metas.appendChild(el('span', 'entry-meta', kindLabel));
      }
      // Two different acts on the same feed: inspect it, or start following it. Preview is
      // for someone evaluating the format; subscribe is the one an attendee wants, and the
      // reader's applySubscribeParam() reads exactly this parameter — it prefills the
      // subscribe dialog, and does nothing if the feed is already in their list.
      if (item.feed) {
        metas.appendChild(
          feedLink('entry-preview', get(state.dict, 'adopters.preview') || 'Preview feed \u2192',
            'https://tools.opentechevents.org/preview?feed=' + encodeURIComponent(item.feed))
        );
        metas.appendChild(
          feedLink('entry-subscribe', get(state.dict, 'adopters.subscribe') || 'Subscribe \u2192',
            'https://reader.opentechevents.org/?subscribe=' + encodeURIComponent(item.feed))
        );
      }
      // Which version of the spec this feed speaks, from the daily health check. It
      // says what a consumer needs before subscribing and nothing about being behind:
      // every published version stays supported, so this is never a mark of shame.
      if (item.specVersion) {
        var badge = el('span', 'entry-meta entry-badge', 'OTE ' + item.specVersion.replace(/\.0$/, ''));
        var title = get(state.dict, 'adopters.specVersionBadge');
        if (title) badge.title = title.replace('{version}', item.specVersion);
        metas.appendChild(badge);
      }
      // Said once, where the claim is made: this entity intends to consume, it does not yet.
      if (item.consumes === 'planned' && containerId === 'consumers-list') {
        var soon = el('span', 'entry-meta entry-badge entry-badge-planned', get(state.dict, 'consumers.planned') || 'Coming soon');
        var soonTitle = get(state.dict, 'consumers.plannedTitle');
        if (soonTitle) soon.title = soonTitle;
        metas.appendChild(soon);
      }
      // What may be done with the data, which is the other half of "can I consume this
      // feed". A feed whose events carry different licences says so instead of picking
      // one: an aggregator has to check every event, and the badge must not imply
      // otherwise. Inheritance is already resolved in feed-health.json.
      if (item.licenses && item.licenses.length) {
        var mixed = item.licenses.length > 1;
        var label = mixed
          ? (get(state.dict, 'adopters.licenseMixed') || '{count} licences').replace('{count}', item.licenses.length)
          : licenseLabel(item.licenses[0]);
        var lic = el('span', 'entry-meta entry-badge entry-badge-license', label);
        var licTitle = get(state.dict, mixed ? 'adopters.licenseMixedTitle' : 'adopters.licenseBadge');
        if (licTitle) lic.title = licTitle.replace('{licenses}', item.licenses.join(', '));
        metas.appendChild(lic);
      }
      if (metas.childNodes.length) body.appendChild(metas);
      card.appendChild(body);

      container.appendChild(card);
    });
  }

  /* Supporters are the same card as an adopter, with one difference: their meta line is not
     free text but their tier(s), so "pledged to adopt" cannot quietly read as "already adopted". */
  function renderSupporters(items) {
    var labelled = (items || []).map(function (item) {
      var tiers = [].concat(item.tier || []);
      var label = tiers.map(function (tier) {
        return get(state.dict, 'support.tiers.' + tier) || tier;
      }).join(' · ');
      return Object.assign({}, item, { kind: label || undefined });
    });
    renderEntries(labelled, 'supporters-list', 'supporters-empty');
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
    var statusOrder = { working: 0, wip: 1, proposed: 2 };
    function rank(tool) {
      return statusOrder[tool.status] !== undefined ? statusOrder[tool.status] : 99;
    }
    function order(tool) {
      return tool.order !== undefined ? tool.order : 999;
    }
    container.replaceChildren();
    renderToolFilterCounts(tools);

    tools
      .filter(function (tool) {
        return state.filter === 'all' || (tool.audience || []).indexOf(state.filter) !== -1;
      })
      .slice()
      .sort(function (a, b) {
        return rank(a) - rank(b) || order(a) - order(b);
      })
      .forEach(function (tool) {
        var card = el('article', 'tool');

        var head = el('div', 'tool-head');
        head.appendChild(el('h3', null, t(tool.name)));
        var label = get(state.dict, 'tools.status.' + tool.status) || tool.status;
        head.appendChild(el('span', 'badge badge-' + tool.status, label));
        card.appendChild(head);

        card.appendChild(el('p', null, t(tool.desc)));

        if (tool.url) {
          var linkKeyByKind = { app: 'tools.linkOpen', npm: 'tools.linkPkg', 'npm-scope': 'tools.linkPkgs' };
          var linkKey = tool.status === 'proposed' ? 'tools.linkIdea' : (linkKeyByKind[tool.linkKind] || 'tools.linkRepo');
          var link = el('a', 'tool-link', get(state.dict, linkKey));
          link.href = tool.url;
          link.target = '_blank';
          link.rel = 'noopener';
          card.appendChild(link);
        }

        container.appendChild(card);
      });
  }

  function renderToolFilterCounts(tools) {
    var counts = tools.reduce(function (acc, tool) {
      acc.all += 1;
      (tool.audience || []).forEach(function (audience) {
        acc[audience] = (acc[audience] || 0) + 1;
      });
      return acc;
    }, { all: 0 });

    document.querySelectorAll('.tools-filters .chip[data-filter]').forEach(function (chip) {
      var filter = chip.dataset.filter;
      var label = get(state.dict, chip.getAttribute('data-i18n')) || chip.textContent.trim();
      chip.replaceChildren(document.createTextNode(label + ' '));
      chip.appendChild(el('span', 'chip-count', String(counts[filter] || 0)));
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

  /* adopters.json is a hand-curated registry edited by PR; the spec version each feed
     declares is measured daily by scripts/check-feeds.mjs. They are joined here, by feed
     URL, rather than written back into the registry — a bot editing adopters.json would
     collide with the registration PRs that are its only intended author. */
  function withSpecVersion(adopters) {
    var health = (state.data.health && state.data.health.feeds) || [];
    return (adopters || []).map(function (adopter) {
      var entry = health.find(function (f) { return f.feed === adopter.feed; });
      if (!entry) return adopter;
      return Object.assign({}, adopter, { specVersion: entry.specVersion, licenses: entry.licenses });
    });
  }

  /* "Who consumes OTE data" has no file behind it any more, on purpose: its one entry
     (the Feed Reader) was a copy of a row in tools.json, which calls itself the canonical
     tools catalogue — two spellings of one product, one of them bound to go stale. The
     section is a view over the two registries that CAN be kept true:
       · tools.json, software whose job is consuming feeds (working ones only — a proposed
         tool is an idea, and listing it here would promise a reach that doesn't exist yet);
       · adopters.json entries that declare `consumes`, i.e. an organisation that both
         publishes and ingests. A directory is the normal case of being in both sections.
     An entity therefore appears once in the data, with one name and one logo, and twice on
     the page only when both halves are true of it. */
  function consumerEntries() {
    var tools = ((state.data.tools && state.data.tools.tools) || []).filter(function (tool) {
      // Matched on the English category, the canonical key in tools.json — comparing the
      // translated label would make a reworded es string empty this list without a sound.
      // scripts/validate.mjs fails if nothing in the catalogue matches it any more.
      return (tool.category || {}).en === 'Consume' && tool.status === 'working';
    }).map(function (tool) {
      return { name: t(tool.name), url: tool.url, desc: tool.desc, kind: get(state.dict, 'consumers.kindTool') || 'Tool' };
    });
    // "planned" sorts last and carries a badge: listing intent as if it were live would
    // overstate the reach the section exists to show.
    var adopters = ((state.data.adopters && state.data.adopters.adopters) || []).filter(function (a) {
      return a.consumes === 'live' || a.consumes === 'planned';
    }).sort(function (a, b) {
      return (a.consumes === 'planned' ? 1 : 0) - (b.consumes === 'planned' ? 1 : 0);
    });
    return tools.concat(withSpecVersion(adopters));
  }

  function renderAll() {
    applyDict();
    renderEntries(withSpecVersion((state.data.adopters || {}).adopters), 'adopters-list', 'adopters-empty');
    renderEntries(consumerEntries(), 'consumers-list', 'consumers-empty');
    renderSupporters((state.data.supporters || {}).supporters);
    renderTestimonials((state.data.testimonials || {}).testimonials);
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

  /* Hero samples: a meetup and a conference. One event does not show what the format covers,
     and two stacked snippets would push the whole page down. */
  (function heroTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.code-tab'));
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (other) {
        var on = other === tab;
        other.classList.toggle('is-active', on);
        other.setAttribute('aria-selected', String(on));
        document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      // Arrow keys are how a tablist is expected to work once it has focus.
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = tabs[(i + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  })();

  /* The hero samples, folded. They carry real offers, a CFP and translations now, and a block
     that scrolls sideways for thirty lines teaches nobody the shape of an event. So the static
     <pre> — which is what a reader without JS keeps — is re-read as JSON and rendered as a tree:
     top level open, every nested object folded, long URLs wrapped instead of pushed off-screen. */
  (function heroTree() {
    // Above this, an object on one line is a wall of text; below it, folding hides nothing.
    var INLINE_MAX = 58;

    function el(name, className, text) {
      var node = document.createElement(name);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function isBranch(v) { return v !== null && typeof v === 'object'; }

    function scalar(v) {
      return typeof v === 'string'
        ? el('s', null, JSON.stringify(v))
        : el('span', 'tok-lit', JSON.stringify(v));
    }

    // { "type": "open" } or a list of tags reads fine inline, and folding it would cost a click
    // to reveal something shorter than the line that hid it. Only flat, short values qualify.
    function inline(value) {
      var arr = Array.isArray(value);
      var keys = arr ? value.map(function (_, i) { return i; }) : Object.keys(value);
      if (keys.some(function (k) { return isBranch(value[k]); })) return null;
      if (JSON.stringify(value).length > INLINE_MAX) return null;

      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(arr ? '[' : '{ '));
      keys.forEach(function (k, i) {
        if (i) frag.appendChild(document.createTextNode(', '));
        if (!arr) {
          frag.appendChild(el('k', null, JSON.stringify(k)));
          frag.appendChild(document.createTextNode(': '));
        }
        frag.appendChild(scalar(value[k]));
      });
      frag.appendChild(document.createTextNode(arr ? ']' : ' }'));
      return frag;
    }

    // key is null inside an array, where an item has no name of its own.
    function entry(key, value, last, into) {
      var comma = last ? '' : ',';
      var flat = isBranch(value) ? inline(value) : scalar(value);

      if (flat) {
        var line = el('div', 'jline');
        if (key !== null) {
          line.appendChild(el('k', null, JSON.stringify(key)));
          line.appendChild(document.createTextNode(': '));
        }
        line.appendChild(flat);
        line.appendChild(document.createTextNode(comma));
        into.appendChild(line);
        return;
      }

      var arr = Array.isArray(value);
      var keys = arr ? value.map(function (_, i) { return i; }) : Object.keys(value);
      var close = (arr ? ']' : '}') + comma;

      var node = el('div', 'jnode is-collapsed');
      var head = el('button', 'jtoggle');
      head.type = 'button';
      head.setAttribute('aria-expanded', 'false');
      head.appendChild(el('span', 'jcaret', '▸'));
      if (key !== null) {
        head.appendChild(el('k', null, JSON.stringify(key)));
        head.appendChild(document.createTextNode(': '));
      }
      head.appendChild(document.createTextNode(arr ? '[' : '{'));
      head.appendChild(el('span', 'jbrief', ' … ' + close));
      node.appendChild(head);

      var body = el('div', 'jbody');
      keys.forEach(function (k, i) {
        entry(arr ? null : k, value[k], i === keys.length - 1, body);
      });
      body.appendChild(el('div', 'jline jclose', close));
      node.appendChild(body);

      head.addEventListener('click', function () {
        var folded = node.classList.toggle('is-collapsed');
        head.setAttribute('aria-expanded', String(!folded));
      });
      into.appendChild(node);
    }

    function tree(doc) {
      var root = el('div', 'json-tree');
      var keys = Object.keys(doc);
      var body = el('div', 'jbody');
      root.appendChild(el('div', 'jline', '{'));
      keys.forEach(function (k, i) { entry(k, doc[k], i === keys.length - 1, body); });
      root.appendChild(body);
      root.appendChild(el('div', 'jline', '}'));
      return root;
    }

    document.querySelectorAll('.hero-code pre[data-ote]').forEach(function (pre) {
      var doc;
      try { doc = JSON.parse(pre.textContent); } catch (e) { return; } // static markup stays
      pre.textContent = '';
      pre.appendChild(tree(doc));
    });
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
    loadJson('data/testimonials.json'),
    loadJson('data/tools.json'),
    loadJson('data/supporters.json'),
    // Health is a nice-to-have overlay on the registry: if it is missing or stale the
    // cards still render, just without version badges.
    loadJson('data/feed-health.json').catch(function () { return null; })
  ]).then(function (results) {
    state.dict = results[0];
    state.data = { adopters: results[1], testimonials: results[2], tools: results[3], supporters: results[4], health: results[5] };
    renderAll();
  }).catch(function (err) {
    console.error('[OTE] failed to load site data', err);
  });
})();
