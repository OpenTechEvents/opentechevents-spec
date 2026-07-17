# Landing page (`docs/`)

Static landing page for the OTE Spec, aimed at **event organisers**. No build step, no dependencies: plain HTML, CSS and vanilla JS.

Published at **[opentechevents.org](https://opentechevents.org)** via GitHub Pages (*Settings → Pages → source: `main` / `/docs`*, custom domain `opentechevents.org`, *Enforce HTTPS* on). The [`CNAME`](CNAME) file in this folder is what pins the domain — **do not delete it**, or Pages reverts to `opentechevents.github.io`.

## Run it locally

`fetch()` needs HTTP, so opening `index.html` from disk won't work. From the repo root:

```bash
npm run dev          # → http://localhost:8000  (and /spec/ for the field reference)
```

No build step and no dependencies — [`scripts/serve.mjs`](../scripts/serve.mjs) is Node's `http` module and nothing else. It sends `cache-control: no-store`, so you see your edits and not yesterday's stylesheet.

## Languages

English and Spanish. The page picks the language in this order:

1. `?lang=en` / `?lang=es` in the URL,
2. the visitor's previous choice (`localStorage`),
3. **the browser/system language** (`navigator.languages`),
4. English as fallback.

Copy lives in [`i18n/en.json`](i18n/en.json) and [`i18n/es.json`](i18n/es.json). Keys are wired to the markup with `data-i18n="path.to.key"`. Values may contain inline HTML (`<code>`, `<strong>`).

To add a language: drop `i18n/<code>.json`, add the code to `SUPPORTED` in [`app.js`](app.js) and add a button to the `.lang` group in [`index.html`](index.html).

## Content you can update without touching code

| File | What it feeds |
| --- | --- |
| [`data/adopters.json`](data/adopters.json) | Communities publishing their events in OTE |
| [`data/consumers.json`](data/consumers.json) | Directories/apps/people consuming OTE feeds, plus testimonials |
| [`data/tools.json`](data/tools.json) | Ecosystem tools (`status`: `working` \| `wip` \| `proposed`) |

Free-text fields accept either a plain string or a `{ "en": …, "es": … }` object. Adopters and consumers render an empty "be the first" state while the lists are empty, so both are safe to leave as `[]`.

Adding yourself is a one-entry PR:

```json
{
  "name": "PyAlmería",
  "url": "https://pyalmeria.dev",
  "feed": "https://pyalmeria.dev/events.json",
  "logo": "assets/pyalmeria.svg",
  "desc": { "en": "Python community in Almería", "es": "Comunidad Python de Almería" }
}
```

`logo` is optional — entries without one fall back to their initials.

[`data/tools.json`](data/tools.json) is the canonical tools catalogue rendered by the website and developer docs.
