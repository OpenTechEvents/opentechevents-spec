/* Prior art — all prose lives here in both languages, like the other subpages. The page
   is written to be read by the maintainers of the projects it describes, so the English
   is the version that goes in outreach; the Spanish is the one organisers land on.
   Anything that is a proper noun, a field name or a package name stays untranslated. */
(function () {
  "use strict";

  var SUPPORTED = ["en", "es"];
  var FALLBACK = "en";
  var STORAGE_KEY = "ote-lang"; // shared with the landing page: pick a language once

  var UI = {
    en: {
      metaTitle: "Prior art — standards and projects OTE builds on",
      skip: "Skip to content",
      pill: "Draft 0.x",
      draft: "The spec is not stable yet: fields can still change, be renamed or be dropped.",
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

      title: "Prior art",
      lead: "Standards and projects that already solve part of this problem — what we reuse from them, what we add, and where we would rather be corrected than be original.",
      pull: "<strong>OTE exists in an ecosystem, not in a vacuum.</strong> Calendar standards, structured web vocabularies, IndieWeb conventions and federation protocols already solve important parts of this problem. Wherever a concept exists somewhere else, we would rather map to it than invent a second, incompatible version of it. This page is what we read before writing the spec — and an invitation to tell us where we got it wrong.",
      intro: "Two things are deliberately kept apart below. <strong>Standards and protocols</strong> are what OTE maps to: they define vocabularies, serialisations and distribution mechanisms. <strong>Aggregators, directories and tools</strong> are software that already ingests event data from somewhere. They are not competing formats, and comparing the two in a single table would be comparing things that live in different layers. The <a href=\"#layers\">layer matrix</a> at the end is there to make those layers explicit.",

      "lbl.solves": "Solves",
      "lbl.reuses": "OTE reuses",
      "lbl.adds": "OTE adds",
      "lbl.stand": "Where we stand",
      "lbl.open": "Open question",
      "lbl.diff": "Different problem",
      "lbl.nots": "What they don't do",
      "lbl.repo": "Repository",
      "lbl.fix": "Correct this →",
      "badge.shipped": "Mapping shipped",
      "badge.half": "Import shipped, export proposed",
      "badge.notbuilt": "Mapping not built",
      "badge.notanalysed": "Not yet analysed",
      "badge.export": "Export shipped",

      "s1.title": "1 · Standards and protocols",
      "s1.lead": "The field survey behind this section lives in the repository: <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/blob/main/research/findings/standards.md\">research/findings/standards.md</a>, property by property. Here is the short version, plus what it means for OTE.",

      "ical.name": "iCalendar / <code>VEVENT</code> <span class=\"pa-rfc\">RFC 5545</span>",
      "ical.solves": "The hardest parts of calendaring, and it has solved them since 1998: date-times in three flavours (floating, UTC, zoned via <code>VTIMEZONE</code>), recurrence (<code>RRULE</code>, <code>RDATE</code>, <code>EXDATE</code>, <code>RECURRENCE-ID</code>), all-day events, and subscription by URL. Every calendar client on earth reads it.",
      "ical.reuses": "The date model, near-literally: ISO 8601 plus an IANA timezone, convertible to all three iCalendar forms. Recurrence semantics follow <code>RRULE</code> rather than a new invention. The \"subscribe to a URL\" distribution idea is the same idea.",
      "ical.adds": "Things <code>VEVENT</code> has no field for: a CFP with its own open/close dates, an explicit online / in-person / hybrid distinction, structured organisers, a data licence, and per-event translations. In iCalendar these end up as prose inside <code>DESCRIPTION</code>, which is exactly the state we are trying to leave.",
      "ical.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/import-ics\"><code>import-ics</code></a> and <a href=\"https://www.npmjs.com/package/@opentechevents/export-ics\"><code>export-ics</code></a> are published, and the aggregated feed is served as <a href=\"https://data.opentechevents.org/feed.ics\"><code>feed.ics</code></a>. The export is lossy by construction — CFP, attendance mode and structured speakers have nowhere to go — and we would rather say so than pretend otherwise.",

      "schema.name": "schema.org / <code>Event</code> <span class=\"pa-rfc\">JSON-LD</span>",
      "schema.solves": "A widely understood vocabulary for describing an event on a web page, and the one search engines actually read: embed it as JSON-LD and you can get <a href=\"https://developers.google.com/search/docs/appearance/structured-data/event\">event rich results</a>. It has the best online/hybrid modelling of anything we surveyed (<code>eventAttendanceMode</code>, <code>VirtualLocation</code>), plus <code>eventStatus</code>, <code>performer</code> and <code>offers</code>.",
      "schema.reuses": "The data model, close to one-to-one. Attendance mode, status, offers, organiser and location are shaped so that serialising an OTE event to <code>schema.org/Event</code> is a rename, not a redesign. This is our primary mapping target.",
      "schema.adds": "A <em>feed</em>. schema.org describes one event inside one HTML page; there is no notion of \"all of this community's events\" you can subscribe to without scraping. OTE adds the container (one URL, N events, an <code>updatedAt</code>), a small <strong>validatable</strong> core with real JSON Schemas — schema.org ships a huge and almost entirely optional vocabulary with no validation — plus CFP and a data licence.",
      "schema.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/import-jsonld\"><code>import-jsonld</code></a> is published and extracts <code>Event</code> JSON-LD from real pages. The exporter (OTE → <code>schema.org/Event</code>) is still <em>proposed</em>, not built — see the <a href=\"/#tools\">tools section</a>. Until it exists, \"maps 1:1\" is a claim backed by the field survey, not by running code.",

      "hevent.name": "h-event &amp; POSSE <span class=\"pa-rfc\">IndieWeb / microformats2</span>",
      "hevent.solves": "Marking up an event in the HTML you already publish, with no parallel file to maintain — the page <em>is</em> the data. Around it, IndieWeb has a decade of practice on the questions OTE also cares about: who owns the canonical copy (<a href=\"https://indieweb.org/POSSE\">POSSE</a> — publish on your own site, syndicate elsewhere), RSVPs, and replies via Webmention.",
      "hevent.reuses": "The principle, not yet the markup. \"The organiser is the authoritative source and the platforms are destinations\" is POSSE restated for events, and we should say so plainly instead of presenting it as new.",
      "hevent.adds": "A machine-readable feed decoupled from the page, for consumers that want N events in one fetch rather than a crawl, plus the tech-community fields (CFP, multi-part events, eligibility).",
      "hevent.open": "Should OTE be built much more directly on top of h-event instead of alongside it? Our survey rated h-event \"low priority\" as an HTML markup option, which is a decision about <em>output formats</em> — it never seriously tested whether the IndieWeb conventions should have shaped the model itself. That is a real gap in our homework, and feedback from people who have shipped h-event tooling would change our answer.",

      "fep.name": "ActivityPub + FEP-8a8e <span class=\"pa-rfc\">Fediverse</span>",
      "fep.solves": "Events that propagate between servers, and the social actions around them — RSVP, announcements, replies. FEP-8a8e is the in-progress convention for using ActivityStreams <code>Event</code> consistently enough that Mobilizon, GatherPress and others can actually interoperate; the <a href=\"https://event-federation.eu/\">Event Federation</a> project (NLnet-funded, active) is working on parent/child events, recurrence, RSVP and discovery.",
      "fep.reuses": "Nothing yet, and that is the honest answer. This is the one standard in this section that our <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/tree/main/research\">original research</a> never covered — it surveyed calendar, web and feed formats, and stopped there.",
      "fep.diff": "The distribution models genuinely differ: ActivityPub is a push protocol between actors on running servers, while OTE is a static file you can host on GitHub Pages. A community that cannot run a server can publish OTE today. That is complementary, not competing — an OTE ↔ FEP-8a8e adapter would let one published event reach the Fediverse.",
      "fep.open": "Are we modelling concepts — event identity, organisers, parent/child events, recurrence — in a way that conflicts with FEP-8a8e for no good reason? We would like this reviewed <em>before</em> the model stabilises, not after.",

      "rss.name": "RSS 2.0 &amp; JSON Feed",
      "rss.solves": "Syndication as a settled problem: one URL, many items, subscribers pull. Readers, bots and newsletters already speak it.",
      "rss.nots": "Model an event. There is no start date, no end date, no venue, no timezone — an event is just an <code>&lt;item&gt;</code> with a title and a link. They are a distribution format, not a data model.",
      "rss.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/export-rss\"><code>export-rss</code></a> is published: an OTE feed becomes RSS or JSON Feed, one event per item, with the structured data carried alongside and a link back to the full entry.",

      "s2.title": "2 · Aggregators, directories and tools",
      "s2.lead": "Projects solving the same problem from the consuming end. None of these is a competing format; several are the reason a format would be worth having. We describe them in a couple of sentences and link out — deliberately no adoption metrics, because we have not measured any and star counts are not adoption. <strong>If your project is here and we got it wrong, correct us</strong> — every card links to an issue.",
      "s2.more": "More directories, platforms and their export capabilities — EventosWiki, Event Garden, CFP Tracker, CallingAllPapers, dev.events, Meetup, Sessionize, Luma, joind.in, PaperCall — are catalogued in the <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/tree/main/research\">research folder</a>, which is the raw evidence behind this page.",

      "cc.desc": "An aggregator built on the premise that <em>event producers are the authoritative sources for their own events</em>: publish once, individuals and aggregators pull. Its gold standard is iCalendar, with scrapers for sites that do not publish a feed. Udell has been making this argument since roughly 2008 — \"ICS is RSS for events\".",
      "cc.rel": "<strong>Why it matters to us:</strong> it is the sharpest challenge to OTE's existence. If iCalendar plus curation is enough, we should hear that from someone who has actually built the aggregator.",
      "brainberg.by": "Open source",
      "brainberg.desc": "An aggregator of AI and tech events in Europe that already tries to ingest structured data from organisers — JSON-LD, schema.org microdata, RSS, iCal — instead of relying only on manual submission.",
      "brainberg.rel": "<strong>Why it matters to us:</strong> it is the fairest test of the whole idea. If Brainberg already gets what it needs from schema.org + RSS + iCal, then an OTE feed has to earn its place by saving them work, not by existing.",
      "meetable.desc": "A minimal event aggregator, deployed at events.indieweb.org, events.oauth.net and meet.modelcontextprotocol.io. Event pages, tags, iCal feeds, \"add to calendar\", RSVPs and Webmentions.",
      "meetable.rel": "<strong>Why it matters to us:</strong> a working example of a small, self-hosted directory — the kind of consumer OTE should be trivial to plug into — and evidence that iCal output is still what people want at the end.",
      "confstech.desc": "An open, community-curated dataset of tech conferences — JSON per topic and year, with name, dates, city, country, CFP URL and CFP deadline — contributed by pull request or through a web form.",
      "confstech.rel": "<strong>Why it matters to us:</strong> its schema is a directory's internal model, not a standard, and it works. The open question is whether organiser-maintained feeds would add anything to a curation model that already produces clean data.",
      "devevents.desc": "A long-running agenda of developer conferences and CFPs, maintained as open data and consumed by several other sites.",
      "devevents.rel": "<strong>Why it matters to us:</strong> OTE is not an alternative to it. The goal is that directories like this one can consume data the organisers maintain themselves, instead of everyone re-typing the same conference.",
      "nte.desc": "An aggregator for speakers, attendees and organisers that normalises several CFP and event sources — Sessionize, PaperCall, confs.tech, joind.in — into one internal model.",
      "nte.rel": "<strong>Why it matters to us:</strong> its normalised model is a requirements document we did not write. Comparing it against the OTE schema would surface missing concepts and unnecessary complexity quickly.",
      "osec.by": "WordPress plugin",
      "osec.desc": "A fully open-source WordPress plugin to create, manage, share and aggregate events, with native iCalendar import and export.",
      "osec.rel": "<strong>Why it matters to us:</strong> WordPress is where a large share of communities actually publish. A publishing tool that emits OTE alongside ICS would test the whole story — publish once, get several formats out.",
      "awesome.desc": "A curated list of developer, DevRel, cloud-native, platform-engineering, DevOps and API conferences, maintained by hand.",
      "awesome.rel": "<strong>Why it matters to us:</strong> the low-tech end of the same problem — collect, deduplicate, keep fresh — and a plausible consumer if the data can be fetched instead of typed.",

      "s3.title": "3 · Which layer is each one in?",
      "s3.lead": "Most arguments about \"another event format\" are really arguments between different layers. A dot means the project covers that layer as a first-class concern — not that it does it best, and not that the others could not be extended to do it.",
      "m.model": "Model<span>vocabulary</span>",
      "m.publish": "Publish<span>from the source</span>",
      "m.syndicate": "Syndicate<span>subscribe to N</span>",
      "m.federate": "Federate<span>server to server</span>",
      "m.aggregate": "Aggregate<span>combine sources</span>",
      "s3.note": "Read horizontally, not vertically: the rows below the line are software, the rows above it are specifications, and \"OTE vs Meetable\" is not a question. What the matrix does show is where OTE places its bet — model, publish and syndicate together, with no server to run — and that the neighbouring rows are the ones we should be exporting to, not arguing with.",

      "s4.title": "4 · What we can't claim yet",
      "s4.lead": "A page like this is easy to write persuasively and hard to write honestly. These are the load-bearing assumptions behind OTE that we have <em>not</em> demonstrated. If one of them turns out to be false, the right answer may well be to narrow OTE, turn it into a profile of an existing standard, or stop.",
      c1: "<strong>That the gap is real.</strong> We believe no widely adopted layer combines publish-from-the-source, syndication and a tech-event vocabulary. We have not measured adoption systematically, and \"we didn't find one\" is not \"there isn't one\".",
      c2: "<strong>That an aggregator saves work.</strong> No independent consumer has yet reported that ingesting OTE was less work than what they already do. Until one does, the efficiency argument is a hypothesis.",
      c3: "<strong>That reuse beats rolling your own.</strong> When a community needs structured events it is very easy to invent a small local <code>events.json</code> — that is what <a href=\"https://github.com/OpenRefine/openrefine.org/issues/506\">happens in practice</a>. Whether picking up OTE is genuinely easier than writing twenty lines of schema is untested.",
      c4: "<strong>That the schema.org mapping is 1:1.</strong> It is 1:1 on paper, from the field survey. The exporter is not built, so nothing has proved it end to end.",
      c5: "<strong>That we are not duplicating FEP-8a8e.</strong> We have not compared the models property by property. This is unreviewed work, not a settled conclusion.",
      c6: "<strong>That publishing is worth it for the organiser.</strong> If the only beneficiary is a future aggregator, the incentive to publish is weak. The immediate payoff — ICS, RSS, JSON-LD and a subscribe button from one file — is the bet, and it is only partly built.",
      "s4.caveat": "<strong>A standard is not worth anything for being well written</strong> — only for how many people use it. Everything on this page is a draft argument, not a verdict.",

      "s5.title": "5 · Tell us where we're wrong",
      "s5.p1": "The most useful thing anyone reading this can do is push back. Concretely, we would like: a review of the model by people working on event federation; a straight answer from aggregator maintainers about whether an OTE feed would save them work or add a format; and someone from the IndieWeb side telling us whether this should have been h-event all along.",
      "s5.p2": "We would rather build the importer or the mapping ourselves than ask a maintainer to implement our format. If your project could be a consumer, that offer is open.",
      "s5.cta1": "Open an issue",
      "s5.cta2": "Start a discussion",
      "s5.cta3": "The DevRel Foundation thread",

      footerNote: "Everything on this page is served from this repository — if a URL here breaks, that's a bug.",
    },

    es: {
      metaTitle: "Trabajo previo — estándares y proyectos sobre los que se apoya OTE",
      skip: "Saltar al contenido",
      pill: "Borrador 0.x",
      draft: "La spec aún no es estable: los campos pueden cambiar, renombrarse o desaparecer.",
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

      title: "Trabajo previo",
      lead: "Estándares y proyectos que ya resuelven parte de este problema: qué reutilizamos de ellos, qué añadimos, y dónde preferimos que nos corrijan antes que ser originales.",
      pull: "<strong>OTE existe dentro de un ecosistema, no en el vacío.</strong> Los estándares de calendario, los vocabularios estructurados de la web, las convenciones de IndieWeb y los protocolos de federación ya resuelven partes importantes de este problema. Siempre que un concepto exista en otro sitio, preferimos mapearlo antes que inventar una segunda versión incompatible. Esta página es lo que leímos antes de escribir la spec — y una invitación a decirnos en qué nos equivocamos.",
      intro: "Abajo hay dos cosas deliberadamente separadas. Los <strong>estándares y protocolos</strong> son aquello a lo que OTE mapea: definen vocabularios, serializaciones y mecanismos de distribución. Los <strong>agregadores, directorios y herramientas</strong> son software que ya ingiere datos de eventos de algún sitio. No son formatos rivales, y compararlos en una misma tabla sería comparar cosas que viven en capas distintas. La <a href=\"#layers\">matriz de capas</a> del final está para hacer esas capas explícitas.",

      "lbl.solves": "Qué resuelve",
      "lbl.reuses": "Qué reutiliza OTE",
      "lbl.adds": "Qué añade OTE",
      "lbl.stand": "Dónde estamos",
      "lbl.open": "Pregunta abierta",
      "lbl.diff": "Problema distinto",
      "lbl.nots": "Qué no hacen",
      "lbl.repo": "Repositorio",
      "lbl.fix": "Corrígenos →",
      "badge.shipped": "Mapeo publicado",
      "badge.half": "Importador publicado, exportador propuesto",
      "badge.notbuilt": "Mapeo sin construir",
      "badge.notanalysed": "Todavía sin analizar",
      "badge.export": "Exportador publicado",

      "s1.title": "1 · Estándares y protocolos",
      "s1.lead": "La investigación de campo detrás de esta sección está en el repositorio: <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/blob/main/research/findings/standards.md\">research/findings/standards.md</a>, propiedad por propiedad (en inglés, como todo el repositorio). Aquí va la versión corta, y qué implica para OTE.",

      "ical.name": "iCalendar / <code>VEVENT</code> <span class=\"pa-rfc\">RFC 5545</span>",
      "ical.solves": "Lo más difícil de los calendarios, y lo resuelve desde 1998: fechas-hora en tres formas (flotante, UTC y con zona vía <code>VTIMEZONE</code>), recurrencia (<code>RRULE</code>, <code>RDATE</code>, <code>EXDATE</code>, <code>RECURRENCE-ID</code>), eventos de todo el día y suscripción por URL. Lo lee cualquier cliente de calendario del planeta.",
      "ical.reuses": "El modelo de fechas, casi literal: ISO 8601 más una zona horaria IANA, convertible a las tres formas de iCalendar. La semántica de recurrencia sigue a <code>RRULE</code> en vez de inventar otra. Y la idea de distribución —«suscríbete a una URL»— es la misma idea.",
      "ical.adds": "Cosas para las que <code>VEVENT</code> no tiene campo: un CFP con sus propias fechas de apertura y cierre, la distinción explícita online / presencial / híbrido, organizadores estructurados, una licencia de datos y traducciones por evento. En iCalendar todo eso acaba como prosa dentro de <code>DESCRIPTION</code>, que es exactamente el estado del que intentamos salir.",
      "ical.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/import-ics\"><code>import-ics</code></a> y <a href=\"https://www.npmjs.com/package/@opentechevents/export-ics\"><code>export-ics</code></a> están publicados, y el feed agregado se sirve también como <a href=\"https://data.opentechevents.org/feed.ics\"><code>feed.ics</code></a>. La exportación pierde información por construcción —el CFP, el modo de asistencia y los ponentes estructurados no tienen dónde ir— y preferimos decirlo a disimularlo.",

      "schema.name": "schema.org / <code>Event</code> <span class=\"pa-rfc\">JSON-LD</span>",
      "schema.solves": "Un vocabulario ampliamente entendido para describir un evento en una página web, y el que los buscadores leen de verdad: si lo incrustas como JSON-LD puedes obtener <a href=\"https://developers.google.com/search/docs/appearance/structured-data/event\">resultados enriquecidos de evento</a>. Tiene el mejor modelado de online/híbrido de todo lo que analizamos (<code>eventAttendanceMode</code>, <code>VirtualLocation</code>), además de <code>eventStatus</code>, <code>performer</code> y <code>offers</code>.",
      "schema.reuses": "El modelo de datos, casi uno a uno. El modo de asistencia, el estado, las entradas, el organizador y la ubicación están modelados para que serializar un evento OTE a <code>schema.org/Event</code> sea un renombrado, no un rediseño. Es nuestro objetivo de mapeo principal.",
      "schema.adds": "Un <em>feed</em>. schema.org describe un evento dentro de una página HTML; no existe la noción de «todos los eventos de esta comunidad» a la que puedas suscribirte sin hacer scraping. OTE añade el contenedor (una URL, N eventos, un <code>updatedAt</code>), un núcleo pequeño y <strong>validable</strong> con JSON Schemas de verdad —schema.org ofrece un vocabulario enorme, casi todo opcional y sin validación— más el CFP y una licencia de datos.",
      "schema.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/import-jsonld\"><code>import-jsonld</code></a> está publicado y extrae JSON-LD de <code>Event</code> de páginas reales. El exportador (OTE → <code>schema.org/Event</code>) sigue <em>propuesto</em>, sin construir — ver la <a href=\"/#tools\">sección de herramientas</a>. Hasta que exista, «mapea 1:1» es una afirmación respaldada por la investigación, no por código que se ejecute.",

      "hevent.name": "h-event y POSSE <span class=\"pa-rfc\">IndieWeb / microformats2</span>",
      "hevent.solves": "Marcar un evento en el HTML que ya publicas, sin un fichero paralelo que mantener: la página <em>es</em> el dato. Alrededor, IndieWeb lleva una década de práctica sobre las preguntas que también le importan a OTE: quién posee la copia canónica (<a href=\"https://indieweb.org/POSSE\">POSSE</a> — publica en tu sitio, sindica fuera), los RSVP y las respuestas vía Webmention.",
      "hevent.reuses": "El principio, todavía no el marcado. «El organizador es la fuente autoritativa y las plataformas son destinos» es POSSE dicho para eventos, y deberíamos reconocerlo abiertamente en vez de presentarlo como nuevo.",
      "hevent.adds": "Un feed legible por máquinas y desacoplado de la página, para quien quiere N eventos en una sola petición en lugar de rastrear, más los campos propios de comunidades tech (CFP, eventos multi-parte, requisitos de acceso).",
      "hevent.open": "¿Debería OTE construirse mucho más directamente sobre h-event en vez de en paralelo? Nuestra investigación clasificó h-event como «baja prioridad» en tanto que opción de marcado HTML, que es una decisión sobre <em>formatos de salida</em>: nunca llegó a plantearse si las convenciones de IndieWeb deberían haber moldeado el propio modelo. Ese es un hueco real en nuestros deberes, y el criterio de quien ya ha construido herramientas h-event cambiaría nuestra respuesta.",

      "fep.name": "ActivityPub + FEP-8a8e <span class=\"pa-rfc\">Fediverso</span>",
      "fep.solves": "Eventos que se propagan entre servidores, y las acciones sociales alrededor: RSVP, anuncios, respuestas. FEP-8a8e es la convención —todavía en curso— para usar el <code>Event</code> de ActivityStreams de forma lo bastante homogénea como para que Mobilizon, GatherPress y otros interoperen de verdad; el proyecto <a href=\"https://event-federation.eu/\">Event Federation</a> (financiado por NLnet, activo) trabaja en eventos padre/hijo, recurrencia, RSVP y descubrimiento.",
      "fep.reuses": "Nada todavía, y esa es la respuesta honesta. Es el único estándar de esta sección que nuestra <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/tree/main/research\">investigación original</a> no cubrió: analizó formatos de calendario, web y feeds, y se detuvo ahí.",
      "fep.diff": "Los modelos de distribución sí son distintos: ActivityPub es un protocolo de push entre actores en servidores en ejecución, mientras que OTE es un fichero estático que puedes alojar en GitHub Pages. Una comunidad que no puede mantener un servidor sí puede publicar OTE hoy. Eso es complementario, no rival: un adaptador OTE ↔ FEP-8a8e permitiría que un evento publicado una vez llegue al Fediverso.",
      "fep.open": "¿Estamos modelando conceptos —identidad del evento, organizadores, eventos padre/hijo, recurrencia— de una forma que choca con FEP-8a8e sin buen motivo? Nos gustaría que alguien lo revisara <em>antes</em> de que el modelo se estabilice, no después.",

      "rss.name": "RSS 2.0 y JSON Feed",
      "rss.solves": "La sindicación como problema resuelto: una URL, muchos ítems, y quien se suscribe tira del dato. Lectores, bots y newsletters ya lo hablan.",
      "rss.nots": "Modelar un evento. No hay fecha de inicio, ni de fin, ni lugar, ni zona horaria: un evento es un <code>&lt;item&gt;</code> con un título y un enlace. Son un formato de distribución, no un modelo de datos.",
      "rss.stand": "<a href=\"https://www.npmjs.com/package/@opentechevents/export-rss\"><code>export-rss</code></a> está publicado: un feed OTE se convierte en RSS o JSON Feed, un evento por ítem, con los datos estructurados al lado y un enlace de vuelta a la ficha completa.",

      "s2.title": "2 · Agregadores, directorios y herramientas",
      "s2.lead": "Proyectos que resuelven el mismo problema desde el lado de quien consume. Ninguno es un formato rival; varios son justamente la razón por la que un formato tendría sentido. Los describimos en dos frases y enlazamos fuera — a propósito sin métricas de adopción, porque no hemos medido ninguna y las estrellas de GitHub no son adopción. <strong>Si tu proyecto está aquí y lo hemos contado mal, corrígenos</strong>: cada ficha enlaza a un issue.",
      "s2.more": "Más directorios, plataformas y sus capacidades de exportación —EventosWiki, Event Garden, CFP Tracker, CallingAllPapers, dev.events, Meetup, Sessionize, Luma, joind.in, PaperCall— están catalogados en la <a href=\"https://github.com/OpenTechEvents/opentechevents-spec/tree/main/research\">carpeta de investigación</a>, que es la evidencia en bruto detrás de esta página.",

      "cc.desc": "Un agregador construido sobre la premisa de que <em>quien produce el evento es la fuente autoritativa de sus propios eventos</em>: publica una vez, y tanto personas como agregadores tiran del dato. Su estándar de referencia es iCalendar, con scrapers para los sitios que no publican feed. Udell defiende este argumento desde alrededor de 2008: «ICS es el RSS de los eventos».",
      "cc.rel": "<strong>Por qué nos importa:</strong> es el cuestionamiento más afilado a la existencia de OTE. Si iCalendar más curación basta, queremos oírlo de alguien que ha construido el agregador de verdad.",
      "brainberg.by": "Open source",
      "brainberg.desc": "Un agregador de eventos de IA y tecnología en Europa que ya intenta ingerir datos estructurados de quien organiza —JSON-LD, microdatos de schema.org, RSS, iCal— en lugar de depender solo del alta manual.",
      "brainberg.rel": "<strong>Por qué nos importa:</strong> es la prueba más justa de toda la idea. Si Brainberg ya obtiene lo que necesita de schema.org + RSS + iCal, un feed OTE tiene que ganarse el sitio ahorrándoles trabajo, no simplemente existiendo.",
      "meetable.desc": "Un agregador de eventos minimalista, desplegado en events.indieweb.org, events.oauth.net y meet.modelcontextprotocol.io. Fichas de evento, tags, feeds iCal, «añadir al calendario», RSVP y Webmentions.",
      "meetable.rel": "<strong>Por qué nos importa:</strong> es un ejemplo funcionando de directorio pequeño y autoalojado —el tipo de consumidor en el que enchufar OTE debería ser trivial— y la prueba de que la salida iCal sigue siendo lo que la gente quiere al final.",
      "confstech.desc": "Un dataset abierto y curado por la comunidad de conferencias tech: JSON por temática y año, con nombre, fechas, ciudad, país, URL del CFP y fecha límite, contribuido por pull request o mediante un formulario web.",
      "confstech.rel": "<strong>Por qué nos importa:</strong> su esquema es el modelo interno de un directorio, no un estándar, y funciona. La pregunta abierta es si los feeds mantenidos por quien organiza aportarían algo a un modelo de curación que ya produce datos limpios.",
      "devevents.desc": "Una agenda veterana de conferencias y CFPs para desarrolladores, mantenida como datos abiertos y consumida por varios sitios más.",
      "devevents.rel": "<strong>Por qué nos importa:</strong> OTE no es una alternativa a esto. El objetivo es que directorios así puedan consumir datos que mantiene quien organiza, en lugar de que todo el mundo vuelva a teclear la misma conferencia.",
      "nte.desc": "Un agregador para ponentes, asistentes y organizadores que normaliza varias fuentes de CFP y eventos —Sessionize, PaperCall, confs.tech, joind.in— en un único modelo interno.",
      "nte.rel": "<strong>Por qué nos importa:</strong> su modelo normalizado es un documento de requisitos que no escribimos nosotros. Compararlo con el schema de OTE sacaría a la luz conceptos que faltan y complejidad innecesaria muy rápido.",
      "osec.by": "Plugin de WordPress",
      "osec.desc": "Un plugin de WordPress completamente open source para crear, gestionar, compartir y agregar eventos, con importación y exportación nativas de iCalendar.",
      "osec.rel": "<strong>Por qué nos importa:</strong> WordPress es donde publica de verdad buena parte de las comunidades. Una herramienta de publicación que emita OTE junto al ICS pondría a prueba la historia completa: publicar una vez, obtener varios formatos.",
      "awesome.desc": "Una lista curada de conferencias de desarrollo, DevRel, cloud native, platform engineering, DevOps y APIs, mantenida a mano.",
      "awesome.rel": "<strong>Por qué nos importa:</strong> es el extremo de baja tecnología del mismo problema —recopilar, deduplicar, mantener al día— y un consumidor plausible si el dato se puede descargar en lugar de teclear.",

      "s3.title": "3 · ¿En qué capa está cada uno?",
      "s3.lead": "Casi todas las discusiones sobre «otro formato de eventos más» son en realidad discusiones entre capas distintas. Un punto significa que el proyecto cubre esa capa como preocupación de primer orden — no que la resuelva mejor, ni que los demás no pudieran extenderse para hacerlo.",
      "m.model": "Modelo<span>vocabulario</span>",
      "m.publish": "Publicar<span>desde la fuente</span>",
      "m.syndicate": "Sindicar<span>suscribirse a N</span>",
      "m.federate": "Federar<span>servidor a servidor</span>",
      "m.aggregate": "Agregar<span>combinar fuentes</span>",
      "s3.note": "Léela en horizontal, no en vertical: las filas por debajo de la línea son software, las de arriba son especificaciones, y «OTE vs Meetable» no es una pregunta. Lo que sí muestra la matriz es dónde apuesta OTE —modelar, publicar y sindicar a la vez, sin servidor que mantener— y que las filas vecinas son a las que deberíamos exportar, no con las que discutir.",

      "s4.title": "4 · Lo que todavía no podemos afirmar",
      "s4.lead": "Una página así es fácil de escribir de forma persuasiva y difícil de escribir de forma honesta. Estos son los supuestos que sostienen a OTE y que <em>no</em> hemos demostrado. Si alguno resulta falso, la respuesta correcta bien podría ser reducir el alcance de OTE, convertirlo en un perfil de un estándar existente, o parar.",
      c1: "<strong>Que el hueco es real.</strong> Creemos que ninguna capa ampliamente adoptada combina publicar desde la fuente, sindicación y un vocabulario de eventos tech. No hemos medido la adopción de forma sistemática, y «no lo encontramos» no es «no existe».",
      c2: "<strong>Que a un agregador le ahorra trabajo.</strong> Ningún consumidor independiente ha reportado todavía que ingerir OTE le costara menos que lo que ya hace. Hasta que ocurra, el argumento de la eficiencia es una hipótesis.",
      c3: "<strong>Que reutilizar gana a hacerse el suyo.</strong> Cuando una comunidad necesita eventos estructurados es facilísimo inventarse un <code>events.json</code> local — que es lo que <a href=\"https://github.com/OpenRefine/openrefine.org/issues/506\">pasa en la práctica</a>. Si coger OTE es de verdad más fácil que escribir veinte líneas de schema está sin comprobar.",
      c4: "<strong>Que el mapeo con schema.org es 1:1.</strong> Lo es sobre el papel, según la investigación de campo. El exportador no está construido, así que nada lo ha probado de punta a punta.",
      c5: "<strong>Que no estamos duplicando FEP-8a8e.</strong> No hemos comparado los modelos propiedad por propiedad. Es trabajo sin revisar, no una conclusión cerrada.",
      c6: "<strong>Que a quien organiza le compensa publicar.</strong> Si el único beneficiado es un futuro agregador, el incentivo para publicar es débil. El beneficio inmediato —ICS, RSS, JSON-LD y un botón de suscripción a partir de un solo fichero— es la apuesta, y está construido solo en parte.",
      "s4.caveat": "<strong>Un estándar no vale nada por estar bien escrito</strong>, sino por cuánta gente lo usa. Todo lo de esta página es un argumento en borrador, no un veredicto.",

      "s5.title": "5 · Dinos en qué nos equivocamos",
      "s5.p1": "Lo más útil que puede hacer quien lea esto es llevarnos la contraria. En concreto nos gustaría: que quien trabaja en federación de eventos revise el modelo; una respuesta franca de quien mantiene agregadores sobre si un feed OTE le ahorraría trabajo o solo le añade un formato; y que alguien del lado de IndieWeb nos diga si esto debería haber sido h-event desde el principio.",
      "s5.p2": "Preferimos construir nosotros el importador o el mapeo antes que pedirle a nadie que implemente nuestro formato. Si tu proyecto podría ser consumidor, esa oferta está abierta.",
      "s5.cta1": "Abrir un issue",
      "s5.cta2": "Empezar una discusión",
      "s5.cta3": "El hilo de la DevRel Foundation",

      footerNote: "Todo lo que hay en esta página se sirve desde este repositorio — si una URL de aquí se rompe, es un bug.",
    },
  };

  var lang = FALLBACK;

  function pickLang() {
    var stored;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (SUPPORTED.indexOf(stored) !== -1) return stored;
    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;
    return FALLBACK;
  }

  function applyDict() {
    var dict = UI[lang];
    document.documentElement.lang = lang;
    document.title = dict.metaTitle;
    document.querySelectorAll("[data-t]").forEach(function (node) {
      var value = dict[node.getAttribute("data-t")];
      // Strings come from this file and carry inline markup (links, <code>, <em>).
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll("[data-t-aria]").forEach(function (node) {
      var value = dict[node.getAttribute("data-t-aria")];
      if (typeof value === "string") node.setAttribute("aria-label", value);
    });
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lang = btn.dataset.lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
      applyDict();
    });
  });

  lang = pickLang();
  applyDict();
})();
