/* OpenTechEvents landing — i18n + data-driven lists. No build step, no dependencies. */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var FALLBACK = 'en';
  var STORAGE_KEY = 'ote-lang';
  var WIDGETS_URL = 'https://tools.opentechevents.org/embed/';
  var WIDGETS_VERSION_URL = WIDGETS_URL + 'v0.10.0/';
  var CONVERTER_URL = 'https://convert.opentechevents.org/';

  var state = { lang: FALLBACK, dict: {}, data: {}, filter: 'all' };
  var adopterCards = new Map();
  var activeFeedDialog;

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

  function entryKind(item) {
    return typeof item.kind === 'string'
      ? (get(state.dict, 'adopters.kind.' + item.kind) || item.kind)
      : t(item.kind);
  }

  function eventCountLabel(item) {
    if (!Number.isInteger(item.eventCount) || item.eventCount < 0 || !item.eventCountCheckedAt) return '';
    return get(state.dict, item.eventCount === 1 ? 'adopters.eventCountOne' : 'adopters.eventCount')
      .replace('{count}', new Intl.NumberFormat(state.lang).format(item.eventCount));
  }

  function eventCountHint(item) {
    return get(state.dict, 'adopters.eventCountTitle').replace('{date}', item.eventCountCheckedAt);
  }

  function formatFeedDate(value, dateOnly) {
    var options = dateOnly ? { dateStyle: 'medium', timeZone: 'UTC' } : { dateStyle: 'medium', timeStyle: 'short' };
    return new Intl.DateTimeFormat(state.lang, options).format(new Date(value));
  }

  /* `eventLanguages` (what the events are held in) and `textLanguages` (what the feed's own
     text is written in) are different fields and answer different questions, so the first is
     a fact and only the second is a control. */
  function exportLanguageChip(item, dict, onPick) {
    var metadata = item.metadata || {};
    var textLanguages = metadata.textLanguages || [];
    if (!textLanguages.length) return undefined;
    var entry = el('li', 'feed-chip feed-chip-control');
    var group = el('span', 'feed-chip-options');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', dict.exportLanguage + '. ' + dict.exportLanguageHint);
    entry.append(el('span', 'feed-chip-key', dict.chipKeys.text), group);
    var names = new Intl.DisplayNames(state.lang, { type: 'language' });
    /* A language offered flat promises a translated calendar the feed may not deliver: on one
       registered adopter only 36 of 96 events carry Spanish. The count is what makes the
       option honest, so it rides in the label and not in a tooltip nobody reads. */
    var coverage = metadata.textLanguageEvents;
    var measured = coverage && typeof coverage === 'object';
    var total = Number.isInteger(item.eventCount) ? item.eventCount : undefined;
    [''].concat(textLanguages).forEach(function (tag, index) {
      var label = tag ? names.of(tag) : dict.originalLanguage;
      /* A tag absent from the map is zero, not unknown — that is the case worth labelling:
         a language that exists only in an image's alt text would otherwise be offered as if
         the whole calendar came in it. Unknown is only when the scan predates the count. */
      var covered = measured ? (coverage[tag] || 0) : undefined;
      var partial = tag && measured && total && covered < total;
      var option = el('button', 'feed-chip-option', label);
      if (partial) {
        option.appendChild(el('span', 'feed-chip-coverage', ' ' + covered + '/' + total));
        option.title = dict.exportLanguageCoverage
          .replace('{count}', covered).replace('{total}', total).replace('{language}', label);
      }
      option.type = 'button';
      option.setAttribute('aria-pressed', String(index === 0));
      option.addEventListener('click', function () {
        group.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
        option.setAttribute('aria-pressed', 'true');
        onPick(tag);
      });
      group.appendChild(option);
    });
    return entry;
  }

  /* The facts of a feed — spec version, licence, freshness, how many events — are what
     makes the card credible, so they ride at the top as chips rather than inside a closed
     <details>: hiding them put the strongest evidence behind the least likely click. */
  function feedChips(item, dict, onExportLanguage) {
    var chips = el('ul', 'feed-dialog-chips');
    chips.setAttribute('role', 'list');
    /* Short key on screen, full label in the tooltip: "0.6.0" or a bare timestamp says
       nothing on its own, and a touch visitor never sees a title attribute. */
    function chip(key, label, value, hint) {
      if (!value) return;
      var entry = el('li', 'feed-chip');
      entry.title = label + ': ' + value + (hint ? ' — ' + hint : '');
      entry.append(el('span', 'feed-chip-key', dict.chipKeys[key]), el('span', 'feed-chip-value', value));
      chips.appendChild(entry);
    }
    var metadata = item.metadata || {};
    chip('kind', dict.kind, entryKind(item));
    chip('version', dict.version, item.specVersion);
    if (item.licenses && item.licenses.length) {
      chip('license', item.licenses.length === 1 ? dict.license : dict.licenses, item.licenses.join(', '));
    }
    var count = eventCountLabel(item);
    chip('events', dict.events, count || dict.countUnknown, count && eventCountHint(item));
    var eventLanguages = metadata.eventLanguages || [];
    var languageNames = new Intl.DisplayNames(state.lang, { type: 'language' });
    var languageList = new Intl.ListFormat(state.lang);
    chip('languages', dict.eventLanguages, eventLanguages.length
      ? languageList.format(eventLanguages.map(function (tag) { return languageNames.of(tag); }))
      : dict.languagesUnknown);
    if (metadata.updatedAt) chip('updated', dict.updated, formatFeedDate(metadata.updatedAt, false), metadata.updatedAt);
    var covers = metadata.covers || {};
    if (covers.from && covers.to) {
      chip('coverage', dict.coverage, formatFeedDate(covers.from, true) + ' – ' + formatFeedDate(covers.to, true));
    } else if (covers.from || covers.to) {
      var bound = covers.from ? dict.coverageFrom : dict.coverageTo;
      chip('coverage', dict.coverage, bound.replace('{date}', formatFeedDate(covers.from || covers.to, true)));
    } else if (item.metadata) {
      chip('coverage', dict.coverage, dict.coverageUnknown);
    }
    var exportLanguage = exportLanguageChip(item, dict, onExportLanguage);
    if (exportLanguage) chips.appendChild(exportLanguage);
    return chips;
  }

  function feedDescription(item) {
    var metadata = item.metadata || {};
    var translations = metadata.translations || {};
    var translatedLang = Object.keys(translations).find(function (lang) { return lang.toLowerCase() === state.lang; });
    var description = translations[translatedLang] || metadata.description;
    if (!description && !item.desc) return undefined;
    var summary = el('p', 'feed-dialog-description', description || t(item.desc));
    var language = translatedLang || metadata.textLanguage;
    if (description && language) summary.lang = language;
    return summary;
  }

  /* The feed URL is what the visitor came for, so it reads as plain text under the title
     rather than as a widget: `user-select: all` makes one click select the whole URL, which
     is the copy button's job without the button. */
  function feedUrlLine(item, dict) {
    var url = el('code', 'feed-dialog-url', item.feed);
    url.setAttribute('aria-label', dict.source + ': ' + item.feed);
    return url;
  }

  function conversionUrl(feed, format, language) {
    var url = new URL(format, CONVERTER_URL);
    url.searchParams.set('feed', feed);
    if (language) url.searchParams.set('lang', language);
    return url.href;
  }

  function updateSubscription(subscribe, feed, language) {
    var ics = conversionUrl(feed, 'ics', language);
    subscribe.setAttribute('feed-ics', ics);
    subscribe.setAttribute('feed-rss', conversionUrl(feed, 'rss', language));
    if (subscribe.firstElementChild) subscribe.firstElementChild.href = ics;
  }

  function feedPreview(item, dict, subscribe, tools) {
    var preview = el('section', 'feed-dialog-preview');
    var heading = el('h3', '', dict.preview.title);
    heading.id = 'feed-preview-title';
    preview.setAttribute('aria-labelledby', heading.id);
    var header = el('div', 'feed-widget-header');
    /* Nothing on screen says the agenda and the button are themselves OTE widgets, running
       on this feed — without that sentence the preview reads as a screenshot of the site. */
    var note = el('p', 'feed-widget-note', dict.preview.widgetsNote + ' ');
    var reveal = el('button', 'feed-widget-note-cta', dict.preview.widgetsCta);
    reveal.type = 'button';
    reveal.addEventListener('click', function () {
      if (tools.reveal) tools.reveal('share', 'embed');
    });
    note.appendChild(reveal);
    header.append(heading, subscribe, note);

    /* `responsive="off"` because this preview has a segmented control: letting the widget
       pick the layout by container width made the toolbar lie — the left column is ~580px, so
       "Calendar" rendered an agenda. The widget's own degradation is right for an embed that
       has no control; here the control is the contract, and the narrow case is handled by
       choosing `list` outright below 640px, which keeps the pressed button true. */
    var narrow = window.matchMedia('(max-width: 640px)').matches;
    var defaultLayout = narrow ? 'list' : 'calendar';
    var events = el('ote-events');
    events.setAttribute('feed', item.feed);
    events.setAttribute('lang', state.lang);
    events.setAttribute('layout', defaultLayout);
    events.setAttribute('theme', 'auto');
    events.setAttribute('responsive', 'off');
    /* The widget bounds itself (ote-tools#168). `48dvh` and not `min(520px, 48dvh)`: the
       attribute refuses calc() and %, and a refused value falls back to unbounded. */
    events.setAttribute('max-height', '48dvh');

    var status = el('p', 'feed-widget-status', dict.preview.loading);
    status.setAttribute('role', 'status');
    var frame = el('div', 'feed-widget-frame');
    frame.dataset.theme = 'auto';
    frame.dataset.layout = defaultLayout;
    frame.append(status, events);

    var toolbar = el('div', 'feed-widget-toolbar');
    [
      [dict.preview.layout, dict.preview.layouts, defaultLayout, function (layout) {
        events.setAttribute('layout', layout);
        frame.dataset.layout = layout;
      }],
      [dict.preview.appearance, dict.preview.themes, 'auto', function (theme) {
        events.setAttribute('theme', theme);
        subscribe.setAttribute('theme', theme);
        frame.dataset.theme = theme;
      }]
    ].forEach(function (control) {
      var group = el('div', 'feed-widget-control');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', control[0]);
      Object.keys(control[1]).forEach(function (value) {
        var button = el('button', 'feed-widget-option', control[1][value]);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(value === control[2]));
        button.addEventListener('click', function () {
          group.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-pressed', 'true');
          control[3](value);
        });
        group.appendChild(button);
      });
      toolbar.appendChild(group);
    });

    preview.append(header, toolbar, frame);
    import(WIDGETS_VERSION_URL + 'ote-events.js').then(function () {
      status.remove();
    }).catch(function () {
      status.textContent = dict.preview.unavailable;
      toolbar.hidden = true;
    });
    import(WIDGETS_VERSION_URL + 'ote-subscribe.js').catch(function () {
      var fallback = el('a', 'feed-widget-install', dict.preview.subscribe);
      fallback.href = subscribe.getAttribute('feed-ics');
      fallback.target = '_blank';
      fallback.rel = 'noopener';
      subscribe.appendChild(fallback);
    });
    return preview;
  }

  function feedUtilities(item, dict, localized, tools) {
    var feed = encodeURIComponent(item.feed);
    /* Not a <details>: what the ecosystem can do with the feed is the reason the dialog
       exists, and it used to sit behind a closed disclosure under a full screen of calendar.
       Nothing here subscribes: that is the one job of the widget's own menu, and three cards
       repeating its destinations made the same action look like two different offers. */
    var utilities = el('section', 'feed-dialog-utilities');
    var title = el('h3', 'feed-dialog-utilities-title', dict.utilities);
    title.id = 'feed-utilities-title';
    utilities.setAttribute('aria-labelledby', title.id);
    var body = el('div', 'feed-dialog-utility-body');
    var lead = el('p', 'feed-dialog-utilities-lead', dict.utilitiesLead);
    body.appendChild(lead);
    var tabs = el('div', 'feed-dialog-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-labelledby', title.id);
    body.appendChild(tabs);
    utilities.append(title, body);

    var textLanguages = (item.metadata || {}).textLanguages || [];

    var icons = {
      reader: '≡', broadcast: '↗', schema: '{ }', embed: '⊞', validate: '✓'
    };
    /* Grouped by who the visitor is, not by output format — and the embedded-calendar
       example is gone: the live preview two columns to the left is the same demo, running. */
    var groups = [
      ['explore', [
        ['preview', 'https://tools.opentechevents.org/preview?feed=' + feed],
        ['reader', 'https://reader.opentechevents.org/?subscribe=' + feed]
      ]],
      ['share', [
        ['broadcast', 'https://tools.opentechevents.org/publish/?feed=' + feed],
        ['embed', WIDGETS_URL]
      ]],
      ['build', [
        ['validate', 'https://validator.opentechevents.org/?doc=' + feed],
        ['schema', conversionUrl(item.feed, 'schema'), 'schema'],
        ['options', CONVERTER_URL + '#parameters']
      ]]
    ].map(function (group) {
      var key = group[0];
      var tab = el('button', 'feed-dialog-tab', dict.tabs[key]);
      tab.type = 'button';
      tab.id = 'feed-tab-' + key;
      tab.setAttribute('role', 'tab');

      var panel = el('div', 'feed-dialog-panel');
      panel.id = 'feed-panel-' + key;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', panel.id);

      var actions = el('ul', 'feed-dialog-actions');
      actions.setAttribute('role', 'list');
      var actionsByKey = {};
      group[1].forEach(function (action) {
        var info = dict.actions[action[0]];
        var link = el('a', 'feed-dialog-action');
        link.href = action[1];
        if (action[2] && textLanguages.length) localized.links.push({ link: link, format: action[2] });
        link.target = '_blank';
        link.rel = 'noopener';
        var description = info.desc.replace('{name}', function () { return item.name; });
        var icon = el('span', 'feed-action-icon feed-action-icon-' + action[0], icons[action[0]]);
        icon.setAttribute('aria-hidden', 'true');
        var copy = el('span', 'feed-action-copy');
        copy.append(el('strong', '', info.title), el('span', 'feed-action-description', description));
        link.append(icon, copy);
        actionsByKey[action[0]] = link;
        var listItem = el('li');
        listItem.appendChild(link);
        actions.appendChild(listItem);
      });
      panel.appendChild(actions);
      tab.addEventListener('click', function () { selectTab(tab); });
      tabs.appendChild(tab);
      body.appendChild(panel);
      return { tab: tab, panel: panel, key: key, actions: actionsByKey };
    });

    function selectTab(tab) {
      groups.forEach(function (group) {
        var active = group.tab === tab;
        group.tab.setAttribute('aria-selected', String(active));
        group.tab.tabIndex = active ? 0 : -1;
        group.panel.hidden = !active;
      });
    }

    tabs.addEventListener('keydown', function (event) {
      var index = groups.findIndex(function (group) { return group.tab === event.target; });
      if (index === -1) return;
      var last = groups.length - 1;
      switch (event.key) {
        case 'ArrowLeft': index = index === 0 ? last : index - 1; break;
        case 'ArrowRight': index = index === last ? 0 : index + 1; break;
        case 'Home': index = 0; break;
        case 'End': index = last; break;
        default: return;
      }
      event.preventDefault();
      var tab = groups[index].tab;
      selectTab(tab);
      tab.focus();
    });
    selectTab(groups[0].tab);

    /* The preview's note points here. Selecting the tab is not enough: the visitor's eye has
       to land on the one action that answers the sentence they just clicked, so the link is
       focused and flashes once. */
    tools.reveal = function (tabKey, actionKey) {
      var group = groups.find(function (entry) { return entry.key === tabKey; });
      if (!group) return;
      selectTab(group.tab);
      var link = group.actions[actionKey];
      if (!link) return;
      var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      utilities.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
      link.focus({ preventScroll: true });
      if (still) return;
      link.classList.remove('is-highlighted');
      void link.offsetWidth; // restarts the animation when the note is clicked twice
      link.classList.add('is-highlighted');
      link.addEventListener('animationend', function () {
        link.classList.remove('is-highlighted');
      }, { once: true });
    };
    return utilities;
  }

  function openFeedDialog(item, trigger) {
    var dict = state.dict.feedDialog;
    var dialog = el('dialog', 'feed-dialog');
    dialog.setAttribute('aria-labelledby', 'feed-dialog-title');
    dialog.setAttribute('closedby', 'any');

    var header = el('div', 'feed-dialog-header');
    var title = el('h2');
    title.id = 'feed-dialog-title';
    var site = item.name;
    if (item.url) {
      var website = el('a', 'feed-dialog-website', new URL(item.url).hostname);
      website.href = item.url;
      website.target = '_blank';
      website.rel = 'noopener';
      site = website;
    }
    var parts = dict.title.split('{site}');
    title.append(parts[0], site, parts[1]);
    // Open on the heading, not on "Close": the first thing announced should be what this is.
    title.tabIndex = -1;
    title.autofocus = true;
    var close = el('button', 'feed-dialog-close', dict.close);
    close.type = 'button';
    close.addEventListener('click', function () { dialog.close(); });
    header.append(title, close);

    var content = el('div', 'feed-dialog-content');
    // Below the sticky header, not inside it: the header stays one line tall.
    content.appendChild(feedUrlLine(item, dict));
    var subscribe = el('ote-subscribe');
    subscribe.setAttribute('feed-json', item.feed);
    subscribe.setAttribute('name', item.name);
    subscribe.setAttribute('lang', state.lang);
    /* Google Calendar is back: it was suppressed while the widget nested the ICS URL in `cid`
       raw, which truncated it at the first `&` — and the language chip appends one. Fixed in
       ote-tools#166, served from v0.9.0 (verified in the published bundle, not in its source).
       `ote-preview` stays out on purpose: previewing is not subscribing, and the "Explora" tab
       already offers it with the explanation. */
    subscribe.setAttribute('show', 'google,webcal,ics-download,feedly,feed-protocol,rss-download,ote-reader,json-download');
    updateSubscription(subscribe, item.feed);
    var tools = {};
    var preview = feedPreview(item, dict, subscribe, tools);
    var events = preview.querySelector('ote-events');
    var description = feedDescription(item);
    /* One language choice drives every export the converter serves — the ICS and RSS the
       widget's menu hands out, and the schema.org card. The tools that take no `lang`
       (Reader, validator, Broadcast) are unaffected, and say so in their own UI. */
    var localized = { links: [] };
    var utilities = feedUtilities(item, dict, localized, tools);
    content.appendChild(feedChips(item, dict, function (language) {
      updateSubscription(subscribe, item.feed, language);
      localized.links.forEach(function (entry) {
        entry.link.href = conversionUrl(item.feed, entry.format, language);
      });
    }));
    if (description) content.appendChild(description);
    /* Two columns on a wide viewport: the preview no longer pushes every action below the
       fold, which is what made the dialog a 2000px scroll on a busy feed. */
    var body = el('div', 'feed-dialog-body');
    var main = el('div', 'feed-dialog-main');
    var aside = el('div', 'feed-dialog-aside');
    main.appendChild(preview);
    aside.appendChild(utilities);
    body.append(main, aside);
    content.appendChild(body);
    dialog.append(header, content);
    // Let the widget close its own menu or event overlay before the outer dialog.
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (subscribe.shadowRoot?.querySelector('[aria-expanded="true"]')
        || events.shadowRoot?.querySelector('[aria-modal="true"]')) event.preventDefault();
    }, true);
    activeFeedDialog = { feed: item.feed, dialog: dialog };
    dialog.addEventListener('close', function () {
      dialog.remove();
      if (!activeFeedDialog || activeFeedDialog.dialog !== dialog) return;
      activeFeedDialog = undefined;
      var card = adopterCards.get(item.feed);
      var focusTarget = trigger.isConnected ? trigger : card && card.trigger;
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      var url = new URL(location.href);
      if (url.searchParams.get('adopter') !== item.feed) return;
      if (history.state && history.state.oteAdopter === item.feed) {
        history.back();
      } else {
        url.searchParams.delete('adopter');
        history.replaceState(history.state, '', url.href);
      }
    });
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function adopterUrl(feed) {
    var url = new URL(location.href);
    url.searchParams.set('adopter', feed);
    url.hash = 'adopters';
    return url;
  }

  function syncFeedDialog() {
    var feed = new URLSearchParams(location.search).get('adopter');
    if (activeFeedDialog && activeFeedDialog.feed === feed && activeFeedDialog.dialog.open) return;
    if (activeFeedDialog) activeFeedDialog.dialog.close();
    var card = adopterCards.get(feed);
    if (!card) return;
    card.trigger.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    openFeedDialog(card.item, card.trigger);
  }

  window.addEventListener('popstate', syncFeedDialog);

  function bindFeedDialog(trigger, item) {
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-label', get(state.dict, 'adopters.feedActionsFor').replace('{name}', function () { return item.name; }));
    trigger.addEventListener('click', function () {
      if (new URLSearchParams(location.search).get('adopter') !== item.feed) {
        history.pushState(Object.assign({}, history.state, { oteAdopter: item.feed }), '', adopterUrl(item.feed).href);
      }
      openFeedDialog(item, trigger);
    });
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
      var compact = containerId === 'adopters-list' && item.feed;
      var card = el(compact ? 'button' : 'div', compact ? 'entry entry-adopter' : 'entry');

      if (item.logo) {
        var img = el('img', 'entry-logo');
        img.src = item.logo;
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = function () {
          if (item.logoFallback && !img.dataset.fallbackUsed) {
            img.dataset.fallbackUsed = 'true';
            img.src = item.logoFallback;
            return;
          }
          img.replaceWith(el('span', 'entry-logo', initials(item.name)));
        };
        card.appendChild(img);
      } else {
        card.appendChild(el('span', 'entry-logo', initials(item.name)));
      }

      var metas = el(compact ? 'span' : 'div', 'entry-metas');
      var kind = entryKind(item);
      var count = eventCountLabel(item);
      if (kind) metas.appendChild(el('span', 'entry-meta', kind));
      if (count) {
        var countBadge = el('span', 'entry-meta entry-badge', count);
        countBadge.title = eventCountHint(item);
        metas.appendChild(countBadge);
      }

      if (compact) {
        bindFeedDialog(card, item);
        adopterCards.set(item.feed, { item: item, trigger: card });
        var displayedCount = count || state.dict.feedDialog.countUnknown;
        if (!count) metas.appendChild(el('span', 'entry-meta entry-badge', displayedCount));
        card.setAttribute('aria-description', [kind, displayedCount].filter(Boolean).join(' · '));
        card.appendChild(metas);
        container.appendChild(card);
        return;
      }

      var body = el('div', 'entry-body');
      var nameEl = el(item.url ? 'a' : 'div', 'entry-name', item.name);
      if (item.url) {
        nameEl.href = item.url;
        nameEl.target = '_blank';
        nameEl.rel = 'noopener';
        nameEl.classList.add('entry-name-link');
      }
      body.appendChild(nameEl);
      if (item.desc && containerId !== 'adopters-list') body.appendChild(el('p', 'entry-desc', t(item.desc)));

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
      if (item.feed) {
        var explore = el('button', 'feed-dialog-trigger', get(state.dict, 'adopters.feedActions'));
        bindFeedDialog(explore, item);
        body.appendChild(explore);
      }
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
  function withFeedHealth(adopters) {
    var health = (state.data.health && state.data.health.feeds) || [];
    return (adopters || []).map(function (adopter) {
      var entry = health.find(function (f) { return f.feed === adopter.feed; });
      if (!entry) return adopter;
      return Object.assign({}, adopter, {
        specVersion: entry.specVersion, licenses: entry.licenses,
        eventCount: entry.eventCount, eventCountCheckedAt: entry.eventCountCheckedAt, metadata: entry.metadata
      });
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
    return tools.concat(withFeedHealth(adopters));
  }

  function renderAll() {
    applyDict();
    adopterCards.clear();
    renderEntries(withFeedHealth((state.data.adopters || {}).adopters), 'adopters-list', 'adopters-empty');
    renderEntries(consumerEntries(), 'consumers-list', 'consumers-empty');
    renderSupporters((state.data.supporters || {}).supporters);
    renderTestimonials((state.data.testimonials || {}).testimonials);
    renderTools();
    renderFaq();
    syncFeedDialog();
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
