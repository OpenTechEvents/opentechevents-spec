/* OpenTechEvents landing — i18n + data-driven lists. No build step, no dependencies. */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var FALLBACK = 'en';
  var STORAGE_KEY = 'ote-lang';
  var WIDGETS_URL = 'https://tools.opentechevents.org/embed/';
  var WIDGETS_MODULE_URL = WIDGETS_URL + 'latest/ote-events.js';
  var CONVERTER_URL = 'https://convert.opentechevents.org/';
  var directoryFeeds = {
    'https://eventos.wiki/events.json': {
      chip: 'byOrganisation',
      catalogue: 'https://eventos.wiki/organizations',
      catalogueLabel: 'organisations',
      groups: organisationFeedGroups
    },
    'https://confs.rauljimenez.info/events.json': {
      chip: 'filtered',
      catalogue: 'https://confs.rauljimenez.info/subscribe',
      catalogueLabel: 'filters',
      history: 'https://confs.rauljimenez.info/events.json?show=all',
      groups: conferenceFeedGroups
    }
  };

  var state = { lang: FALLBACK, dict: {}, data: {}, filter: 'all' };
  var directoryDocuments = new Map();
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
    if (!Number.isInteger(item.eventCount) || item.eventCount < 0 || (!item.eventCountCheckedAt && !item.liveMetadata)) return '';
    return get(state.dict, item.eventCount === 1 ? 'adopters.eventCountOne' : 'adopters.eventCount')
      .replace('{count}', new Intl.NumberFormat(state.lang).format(item.eventCount));
  }

  function eventCountHint(item) {
    if (item.liveMetadata) return get(state.dict, 'adopters.eventCountLiveTitle');
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

  function feedChips(item, dict, onExportLanguage) {
    var chips = el('ul', 'feed-dialog-chips');
    chips.setAttribute('role', 'list');
    var extra = el('ul', 'feed-dialog-chips feed-dialog-extra-chips');
    extra.setAttribute('role', 'list');
    /* Short key on screen, full label in the tooltip: "0.6.0" or a bare timestamp says
       nothing on its own, and a touch visitor never sees a title attribute. */
    function chip(list, key, label, value, hint) {
      if (!value) return;
      var entry = el('li', 'feed-chip');
      entry.title = label + ': ' + value + (hint ? ' — ' + hint : '');
      entry.append(el('span', 'feed-chip-key', dict.chipKeys[key]), el('span', 'feed-chip-value', value));
      list.appendChild(entry);
    }
    var metadata = item.metadata || {};
    var count = eventCountLabel(item);
    chip(chips, 'events', dict.events, count || dict.countUnknown, count && eventCountHint(item));
    chip(chips, 'kind', dict.kind, entryKind(item));
    if (metadata.updatedAt) chip(chips, 'updated', dict.updated, formatFeedDate(metadata.updatedAt, false), metadata.updatedAt);
    if (item.licenses && item.licenses.length) {
      chip(chips, 'license', item.licenses.length === 1 ? dict.license : dict.licenses,
        item.licenses.join(', '));
    }
    chip(extra, 'version', dict.version, item.specVersion);
    var eventLanguages = metadata.eventLanguages || [];
    var languageNames = new Intl.DisplayNames(state.lang, { type: 'language' });
    var languageList = new Intl.ListFormat(state.lang);
    chip(extra, 'languages', dict.eventLanguages, eventLanguages.length
      ? languageList.format(eventLanguages.map(function (tag) { return languageNames.of(tag); }))
      : dict.languagesUnknown);
    var covers = metadata.covers || {};
    if (covers.from && covers.to) {
      chip(extra, 'coverage', dict.coverage, formatFeedDate(covers.from, true) + ' – ' + formatFeedDate(covers.to, true));
    } else if (covers.from || covers.to) {
      var bound = covers.from ? dict.coverageFrom : dict.coverageTo;
      chip(extra, 'coverage', dict.coverage, bound.replace('{date}', formatFeedDate(covers.from || covers.to, true)));
    } else if (item.metadata) {
      chip(extra, 'coverage', dict.coverage, dict.coverageUnknown);
    }
    var exportLanguage = exportLanguageChip(item, dict, onExportLanguage);
    if (exportLanguage) chips.appendChild(exportLanguage);
    var entry = el('li', 'feed-chip-disclosure');
    var details = el('details');
    var summary = el('summary', 'feed-chip-value', dict.moreChips.replace('{count}', extra.children.length));
    summary.setAttribute('aria-label', dict.moreMetadata.replace('{label}', summary.textContent));
    details.append(summary, extra);
    entry.appendChild(details);
    chips.appendChild(entry);
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

  function feedUrlLine(item, label, action) {
    var line = el('div', 'feed-dialog-source');
    var address = el('span', 'feed-dialog-address');
    var code = el('code', 'feed-dialog-url');
    var link = el('a', null, item.feed);
    link.href = item.feed;
    code.appendChild(link);
    address.append(el('span', 'feed-dialog-source-label', label + ': '), code);
    line.appendChild(address);
    if (action) line.appendChild(action);
    return line;
  }

  function conversionUrl(feed, format, language) {
    var url = new URL(format, CONVERTER_URL);
    url.searchParams.set('feed', feed);
    if (language) url.searchParams.set('lang', language);
    return url.href;
  }

  function embedUrl(feed) {
    var url = new URL(WIDGETS_URL);
    url.searchParams.set('feed', feed);
    return url.href;
  }

  function feedPreview(item, dict, widgetUrl) {
    var preview = el('section', 'feed-dialog-preview');
    var heading = el('h3');
    heading.id = 'feed-preview-title';
    preview.setAttribute('aria-labelledby', heading.id);
    var parts = dict.preview.title.split('{widget}');
    var link = el('a', 'feed-widget-link', dict.preview.widget);
    link.href = widgetUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    var icon = el('span', 'feed-widget-link-icon', '↗');
    icon.setAttribute('aria-hidden', 'true');
    link.appendChild(icon);
    heading.append(parts[0], link, parts[1]);
    var header = el('div', 'feed-widget-header');
    header.appendChild(heading);

    var events = el('ote-events');
    events.setAttribute('feed', item.feed);
    events.setAttribute('lang', state.lang);
    events.setAttribute('responsive', 'off');
    events.setAttribute('density', 'compact');
    events.setAttribute('footer', 'on');
    events.setAttribute('subscribe-layout', 'menu');
    events.setAttribute('max-height', '48dvh');

    var status = el('p', 'feed-widget-status', dict.preview.loading);
    status.setAttribute('role', 'status');
    var frame = el('div', 'feed-widget-frame');
    frame.append(status, events);
    preview.append(header, frame);
    import(WIDGETS_MODULE_URL).then(function () {
      status.remove();
    }).catch(function () {
      status.textContent = dict.preview.unavailable;
    });
    return preview;
  }

  function developerToolsUrl() {
    var url = new URL(location.href);
    url.searchParams.delete('adopter');
    url.hash = 'tools';
    return url;
  }

  function feedUtilities(item, dict, widgetUrl, localized, onDeveloperTools) {
    var feed = encodeURIComponent(item.feed);
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

    var icons = {
      reader: '≡', broadcast: '↗', schema: '{ }', embed: '⊞', validate: '✓'
    };
    var groups = [
      ['explore', [
        ['reader', 'https://reader.opentechevents.org/?subscribe=' + feed],
        ['preview', 'https://tools.opentechevents.org/preview?feed=' + feed]
      ]],
      ['share', [
        ['broadcast', 'https://tools.opentechevents.org/publish/?feed=' + feed],
        ['embed', widgetUrl],
        ['schema', conversionUrl(item.feed, 'schema'), 'schema']
      ]],
      ['build', [
        ['options', CONVERTER_URL + '#convert-form'],
        ['validate', 'https://validator.opentechevents.org/?doc=' + feed]
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
      group[1].forEach(function (action) {
        var info = dict.actions[action[0]];
        var link = el('a', 'feed-dialog-action');
        link.href = action[1];
        if (action[2]) localized.push({ link: link, format: action[2] });
        link.target = '_blank';
        link.rel = 'noopener';
        var description = info.desc.replace('{name}', function () { return item.name; });
        var icon = el('span', 'feed-action-icon feed-action-icon-' + action[0], icons[action[0]]);
        icon.setAttribute('aria-hidden', 'true');
        var copy = el('span', 'feed-action-copy');
        copy.append(el('strong', '', info.title), el('span', 'feed-action-description', description));
        link.append(icon, copy);
        var listItem = el('li');
        listItem.appendChild(link);
        actions.appendChild(listItem);
      });
      panel.appendChild(actions);
      if (key === 'build') {
        var more = el('a', 'feed-dialog-more-tools', dict.moreDeveloperTools);
        more.href = developerToolsUrl().href;
        var arrow = el('span', '', ' →');
        arrow.setAttribute('aria-hidden', 'true');
        more.appendChild(arrow);
        more.addEventListener('click', function (event) {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onDeveloperTools();
        });
        panel.appendChild(more);
      }
      tab.addEventListener('click', function () { selectTab(tab); });
      tabs.appendChild(tab);
      body.appendChild(panel);
      return { tab: tab, panel: panel };
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

    return utilities;
  }

  function directoryOption(name, id, origin, route, suffix) {
    if (typeof name !== 'string' || !name.trim() || typeof id !== 'string') return;
    var url;
    try { url = new URL(id); } catch (e) { return; }
    var path = url.pathname.replace(/\/$/, '');
    if (url.origin !== origin || url.username || url.password || !route.test(path)) return;
    return { name: name.trim(), feed: origin + path + suffix };
  }

  function organisationFeedGroups(data, origin) {
    var organisers = [].concat(data.organizers || []);
    data.events.forEach(function (event) {
      if (Array.isArray(event?.organizers)) organisers.push.apply(organisers, event.organizers);
    });
    return { listedOrganisations: organisers.map(function (organiser) {
      return directoryOption(organiser?.name, organiser?.url, origin, /^\/organizations\/[^/]+$/, '/events.json');
    }) };
  }

  function conferenceFeedGroups(data, origin) {
    var series = new Map();
    var editions = new Map();
    data.events.forEach(function (event) {
      var parent = event?.partOf;
      var multipart = parent?.type === 'multipart';
      var conference = multipart ? event['confwatch:series'] : parent;
      var seriesFeed = directoryOption(conference?.name, conference?.id, origin, /^\/conf\/[^/]+$/, '.json');
      if (seriesFeed && !series.has(seriesFeed.feed)) series.set(seriesFeed.feed, seriesFeed);
      // confwatch gives each part a fragment ID. The edition feed serves all of those parts.
      var edition = directoryOption(multipart ? parent.name : event?.name, multipart ? parent.id : event?.id,
        origin, /^\/e\/[^/]+$/, '.json');
      if (!edition) return;
      var start = event.startDate?.slice(0, 10);
      var end = event.endDate?.slice(0, 10) || start;
      var existing = editions.get(edition.feed);
      if (existing) {
        if (start && (!existing.start || start < existing.start)) existing.start = start;
        if (end && (!existing.end || end > existing.end)) existing.end = end;
        return;
      }
      edition.start = start;
      edition.end = end;
      edition.series = seriesFeed?.feed;
      edition.seriesName = seriesFeed?.name;
      editions.set(edition.feed, edition);
    });
    editions.forEach(function (edition) {
      var conference = series.get(edition.series);
      if (!conference) return;
      if (!conference.editions) conference.editions = [];
      conference.editions.push(edition);
    });
    return { series: Array.from(series.values()), editions: Array.from(editions.values()) };
  }

  function loadDirectoryGroups(directory, feed) {
    if (!directory.loadedGroups) {
      directory.loadedGroups = loadDirectoryDocument(directory.history || feed).then(function (data) {
        return directory.groups(data, new URL(feed).origin);
      }).catch(function (error) {
        delete directory.loadedGroups;
        throw error;
      });
    }
    return directory.loadedGroups;
  }

  function loadDirectoryDocument(feed) {
    if (!directoryDocuments.has(feed)) {
      directoryDocuments.set(feed, loadJson(feed).then(function (data) {
        if (!Array.isArray(data?.events)) throw new Error('Missing OTE events');
        return data;
      }).catch(function (error) {
        directoryDocuments.delete(feed);
        throw error;
      }));
    }
    return directoryDocuments.get(feed);
  }

  function directoryMetadata(item, data) {
    var languages = new Set();
    var licenses = new Set();
    function addLicense(value) { if (typeof value === 'string' && value.trim()) licenses.add(value); }
    if (!data.events.length) addLicense(data.license);
    data.events.forEach(function (event) {
      addLicense(event?.license ?? data.license);
      if (!Array.isArray(event?.languages)) return;
      event.languages.forEach(function (tag) {
        if (typeof tag !== 'string') return;
        try { languages.add(Intl.getCanonicalLocales(tag)[0]); } catch (e) { /* Invalid tag */ }
      });
    });
    var translations = Object.entries(data.translations || {}).filter(function (pair) {
      return typeof pair[1]?.description === 'string';
    }).map(function (pair) { return [pair[0], pair[1].description]; });
    function date(value) {
      return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : undefined;
    }
    return Object.assign({}, item, {
      liveMetadata: true,
      specVersion: typeof data.specVersion === 'string' ? data.specVersion : undefined,
      eventCount: data.events.length,
      licenses: Array.from(licenses).sort(),
      metadata: {
        description: typeof data.description === 'string' ? data.description : undefined,
        textLanguage: typeof data.textLanguage === 'string' ? data.textLanguage : undefined,
        translations: Object.fromEntries(translations),
        updatedAt: date(data.updatedAt),
        covers: { from: date(data.covers?.from), to: date(data.covers?.to) },
        eventLanguages: Array.from(languages).sort()
      }
    });
  }

  function catalogueResults(entries, key, onSelect) {
    var dict = state.dict.directoryFeeds;
    var numbers = new Intl.NumberFormat(state.lang);
    var section = el('section', 'feed-catalogue-group');
    var heading = el('h3', null, dict[key]);
    var list = el('ul', 'feed-catalogue-list');
    list.setAttribute('role', 'list');
    var count = el('p', 'feed-catalogue-count');
    var more = el('button', 'feed-dialog-close feed-catalogue-more', dict.more);
    more.type = 'button';
    var shown = 0;

    function result(choice) {
      var row = el('li', 'feed-catalogue-row');
      var button = el('button', 'feed-catalogue-result');
      button.type = 'button';
      button.appendChild(el('span', 'feed-catalogue-name', choice.name));
      button.appendChild(el('span', 'feed-catalogue-arrow', '→')).setAttribute('aria-hidden', 'true');
      if (choice.start && Number.isFinite(Date.parse(choice.start))) {
        var date = el('time', 'feed-catalogue-date', formatFeedDate(choice.start, true));
        date.dateTime = choice.start;
        button.appendChild(date);
      }
      button.addEventListener('click', function () { onSelect(choice, button); });
      row.appendChild(button);
      return row;
    }

    function addPage() {
      var first;
      entries.slice(shown, shown + 20).forEach(function (choice) {
        var row = result(choice);
        if (!first) first = row.firstElementChild;
        if (choice.editions?.length) {
          var details = el('details', 'feed-catalogue-editions');
          var label = dict.editionList.replace('{count}', numbers.format(choice.editions.length));
          var children = el('ul', 'feed-catalogue-list');
          children.setAttribute('role', 'list');
          details.append(el('summary', null, label), children);
          details.addEventListener('toggle', function () {
            if (!details.open || children.children.length) return;
            choice.editions.slice().sort(function (a, b) {
              return (b.start || '').localeCompare(a.start || '');
            }).forEach(function (edition) { children.appendChild(result(edition)); });
          });
          row.appendChild(details);
        }
        list.appendChild(row);
        shown += 1;
      });
      count.textContent = dict.showing
        .replace('{shown}', numbers.format(shown)).replace('{total}', numbers.format(entries.length));
      more.hidden = shown === entries.length;
      return first;
    }

    more.addEventListener('click', function () { addPage()?.focus(); });
    section.append(heading, list, count, more);
    addPage();
    return section;
  }

  function directoryCatalogue(publisher, onSelect, onBack) {
    var directory = directoryFeeds[publisher.feed];
    var dict = state.dict.directoryFeeds;
    var page = el('div', 'feed-catalogue');
    var header = el('div', 'feed-dialog-header feed-catalogue-header');
    var heading = el('div', 'feed-dialog-heading');
    var title = el('h2', null, dict.catalogueTitle.replace('{publisher}', publisher.name));
    title.id = 'directory-catalogue-title';
    title.tabIndex = -1;
    var back = el('button', 'feed-dialog-close feed-catalogue-back', dict.back);
    back.type = 'button';
    back.addEventListener('click', function () { onBack(); });
    heading.append(title, back);
    header.appendChild(heading);

    var content = el('div', 'feed-dialog-content feed-catalogue-content');
    var shortcuts = el('div', 'feed-catalogue-shortcuts');
    var link = el('a', 'feed-catalogue-external', dict[directory.catalogueLabel]);
    link.href = directory.catalogue;
    function shortcut(choice, label) {
      var button = el('button', 'feed-dialog-close', label || choice.name);
      button.type = 'button';
      button.addEventListener('click', function () { onSelect(choice, button); });
      shortcuts.appendChild(button);
    }
    shortcut(publisher, directory.history ? dict.upcomingFeed : dict.full);
    if (directory.history) {
      shortcut({ name: dict.archive, feed: directory.history }, dict.history);
      shortcut({ name: dict.spain, feed: publisher.feed + '?country=Spain' });
    }
    shortcuts.appendChild(link);

    var search = el('input', 'feed-catalogue-search');
    search.type = 'search';
    search.id = 'directory-search';
    search.autocomplete = 'off';
    search.placeholder = directory.history ? dict.searchConferencesHint : dict.searchOrganisationsHint;
    var label = el('label', 'feed-catalogue-label', directory.history ? dict.searchConferences : dict.searchOrganisations);
    label.htmlFor = search.id;
    var views = el('div', 'feed-catalogue-views');
    views.setAttribute('role', 'group');
    views.setAttribute('aria-label', dict.views);
    var status = el('p', 'feed-catalogue-status', dict.loading);
    status.setAttribute('role', 'status');
    var results = el('div', 'feed-catalogue-results');
    content.append(shortcuts, label, search, views, status, results);
    page.append(header, content);
    search.disabled = true;
    views.hidden = true;

    loadDirectoryGroups(directory, publisher.feed).then(function (sourceGroups) {
      var collator = new Intl.Collator(state.lang, { numeric: true, sensitivity: 'base' });
      var groupKeys = Object.keys(sourceGroups);
      var groups = {};
      groupKeys.forEach(function (key) {
        var unique = new Map();
        sourceGroups[key].forEach(function (choice) {
          if (choice && !unique.has(choice.feed)) unique.set(choice.feed, choice);
        });
        groups[key] = Array.from(unique.values()).sort(function (a, b) { return collator.compare(a.name, b.name); });
      });
      var viewKeys = groupKeys;
      if (directory.history) {
        var now = new Date();
        var today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        groups.upcoming = groups.editions.filter(function (edition) { return edition.start && edition.end >= today; })
          .sort(function (a, b) { return a.start.localeCompare(b.start); });
        viewKeys = ['series', 'upcoming', 'editions'];
      }
      var selectedView = viewKeys[0];
      var viewButtons = new Map();
      if (viewKeys.length > 1) viewKeys.forEach(function (key) {
        var button = el('button', 'feed-dialog-close', dict[key]);
        button.type = 'button';
        button.addEventListener('click', function () {
          selectedView = key;
          renderResults();
        });
        viewButtons.set(key, button);
        views.appendChild(button);
      });

      function searchable(text) {
        return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(state.lang);
      }

      function renderResults() {
        var query = searchable(search.value.trim());
        var terms = query ? query.split(/\s+/) : [];
        views.hidden = viewButtons.size === 0 || !!query;
        viewButtons.forEach(function (button, key) {
          button.setAttribute('aria-pressed', String(key === selectedView));
        });
        var keys = query ? groupKeys : [selectedView];
        var matches = 0;
        results.replaceChildren();
        keys.forEach(function (key) {
          var entries = groups[key].filter(function (choice) {
            var name = searchable([choice.name, choice.seriesName].filter(Boolean).join(' '));
            return terms.every(function (term) { return name.includes(term); });
          });
          matches += entries.length;
          if (entries.length) results.appendChild(catalogueResults(entries, key, onSelect));
        });
        status.textContent = matches
          ? dict[matches === 1 ? 'oneMatch' : 'matches'].replace('{count}', new Intl.NumberFormat(state.lang).format(matches))
          : (query ? dict.noMatches : selectedView === 'upcoming' ? dict.noUpcoming : dict.empty);
      }
      search.disabled = false;
      search.addEventListener('input', renderResults);
      renderResults();
    }).catch(function () {
      status.textContent = dict.unavailable;
    });
    return page;
  }

  function renderFeedDialog(dialog, page, publisher, item, onBrowse) {
    var dict = state.dict.feedDialog;
    var directory = directoryFeeds[publisher.feed];
    var directoryDict = state.dict.directoryFeeds;
    var isMainFeed = item === publisher;
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
    var template = isMainFeed ? dict.title : directoryDict.variantTitle.replace('{publisher}', publisher.name);
    var parts = template.split('{site}');
    title.append(parts[0], site, parts[1]);
    // Open on the heading, not on "Close": the first thing announced should be what this is.
    title.tabIndex = -1;
    title.autofocus = true;
    var close = el('button', 'feed-dialog-close', dict.close);
    close.type = 'button';
    close.addEventListener('click', function () { dialog.close(); });
    var heading = el('div', 'feed-dialog-heading');
    heading.append(title, close);
    var content = el('div', 'feed-dialog-content');
    var widgetUrl = embedUrl(item.feed);
    var preview = feedPreview(item, dict, widgetUrl);
    var events = preview.querySelector('ote-events');
    var localized = [];
    var utilities = feedUtilities(item, dict, widgetUrl, localized, function () {
      dialog.close('developer-tools');
    });
    function onExportLanguage(language) {
      // An explicit language uses the converter. For original text the footer
      // can pick up publisher-supplied alternates from the feed again.
      ['ics', 'rss'].forEach(function (format) {
        if (language) events.setAttribute('feed-' + format, conversionUrl(item.feed, format, language));
        else events.removeAttribute('feed-' + format);
      });
      localized.forEach(function (entry) {
        entry.link.href = conversionUrl(item.feed, entry.format, language);
      });
    }
    header.appendChild(heading);
    var browse;
    if (onBrowse) {
      browse = el('button', 'feed-catalogue-open', directoryDict[isMainFeed ? 'browse' : 'backToCatalogue']);
      browse.type = 'button';
      browse.addEventListener('click', onBrowse);
    }
    var sourceLabel = dict.source;
    if (directory) {
      var sourceKey = isMainFeed ? (directory.history ? 'sourceUpcoming' : 'sourceFull') : 'sourceVariant';
      sourceLabel = directoryDict[sourceKey].replace('{publisher}', function () { return publisher.name; })
        .replace('{name}', function () { return item.name; });
    }
    header.appendChild(feedUrlLine(item, sourceLabel, browse));

    var chips;
    var description;
    function renderMetadata(feedItem) {
      var nextChips = feedChips(feedItem, dict, onExportLanguage);
      if (chips) {
        var previousDetails = chips.querySelector('details');
        var nextDetails = nextChips.querySelector('details');
        nextDetails.open = previousDetails.open;
        var restoreFocus = chips.contains(document.activeElement);
        chips.replaceWith(nextChips);
        if (restoreFocus) nextDetails.querySelector('summary').focus({ preventScroll: true });
      } else {
        header.appendChild(nextChips);
      }
      chips = nextChips;

      var nextDescription = feedDescription(feedItem);
      if (description) description.remove();
      description = nextDescription;
      if (description) content.prepend(description);
    }
    renderMetadata(item);
    if (directory && !item.metadata) {
      loadDirectoryDocument(item.feed).then(function (data) {
        if (dialog.isConnected && page.firstElementChild === header) renderMetadata(directoryMetadata(item, data));
      }).catch(function () { /* Existing metadata and the preview remain available. */ });
    }
    /* Two columns on a wide viewport: the preview no longer pushes every action below the
       fold, which is what made the dialog a 2000px scroll on a busy feed. */
    var body = el('div', 'feed-dialog-body');
    var main = el('div', 'feed-dialog-main');
    var aside = el('div', 'feed-dialog-aside');
    main.appendChild(preview);
    aside.appendChild(utilities);
    body.append(main, aside);
    content.appendChild(body);
    page.replaceChildren(header, content);
  }

  function openFeedDialog(item, trigger) {
    var dialog = el('dialog', 'feed-dialog');
    dialog.setAttribute('aria-labelledby', 'feed-dialog-title');
    dialog.setAttribute('closedby', 'any');
    var page = el('div');
    var catalogue;
    var catalogueFocus;
    var catalogueScroll = 0;
    var previewScroll = 0;
    function showCatalogue() {
      previewScroll = dialog.scrollTop;
      if (!catalogue) {
        catalogue = directoryCatalogue(item, function (selected, source) {
          catalogueFocus = source;
          renderFeedDialog(dialog, page, item, selected, showCatalogue);
          previewScroll = 0;
          showPreview(page.querySelector('h2'));
        }, showPreview);
        dialog.appendChild(catalogue);
      }
      page.hidden = true;
      catalogue.hidden = false;
      dialog.setAttribute('aria-labelledby', 'directory-catalogue-title');
      var focus = catalogue.contains(catalogueFocus) ? catalogueFocus : catalogue.querySelector('h2');
      focus.focus({ preventScroll: true });
      dialog.scrollTop = catalogueScroll;
    }
    function showPreview(focus) {
      catalogueScroll = dialog.scrollTop;
      catalogue.hidden = true;
      page.hidden = false;
      dialog.setAttribute('aria-labelledby', 'feed-dialog-title');
      (focus || page.querySelector('.feed-catalogue-open')).focus({ preventScroll: true });
      dialog.scrollTop = previewScroll;
    }
    dialog.appendChild(page);
    renderFeedDialog(dialog, page, item, item, directoryFeeds[item.feed] && showCatalogue);
    // The widget can replace its focused trigger when it opens the menu. Listen at
    // the document so Escape reaches the menu first even if focus moved to the body.
    function handleEscape(event) {
      if (event.key !== 'Escape' || !dialog.open) return;
      if (page.hidden) {
        event.preventDefault();
        showPreview();
        return;
      }
      var events = dialog.querySelector('ote-events');
      var subscribe = events.shadowRoot?.querySelector('ote-subscribe');
      if (subscribe?.shadowRoot?.querySelector('[aria-expanded="true"]')
        || events.shadowRoot?.querySelector('[aria-modal="true"]')) event.preventDefault();
    }
    document.addEventListener('keydown', handleEscape, true);
    activeFeedDialog = { feed: item.feed, dialog: dialog };
    dialog.addEventListener('close', function () {
      document.removeEventListener('keydown', handleEscape, true);
      dialog.remove();
      if (!activeFeedDialog || activeFeedDialog.dialog !== dialog) return;
      activeFeedDialog = undefined;
      if (dialog.returnValue === 'developer-tools') {
        var toolsState = Object.assign({}, history.state);
        delete toolsState.oteAdopter;
        history.replaceState(toolsState, '', developerToolsUrl().href);
        setToolFilter('developers');
        var tools = document.getElementById('tools');
        tools.querySelector('h2').focus({ preventScroll: true });
        tools.scrollIntoView({ behavior: 'instant' });
        return;
      }
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
        var directory = directoryFeeds[item.feed];
        var directoryLabel = directory && state.dict.directoryFeeds[directory.chip];
        if (directoryLabel) metas.appendChild(el('span', 'entry-meta entry-badge entry-directory-chip', directoryLabel));
        card.setAttribute('aria-description', [kind, displayedCount, directoryLabel].filter(Boolean).join(' · '));
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

  function setToolFilter(filter) {
    state.filter = filter;
    document.querySelectorAll('.tools-filters .chip[data-filter]').forEach(function (chip) {
      var active = chip.dataset.filter === filter;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    renderTools();
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
      setToolFilter(chip.dataset.filter);
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
