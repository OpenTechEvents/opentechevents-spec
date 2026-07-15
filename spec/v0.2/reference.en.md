# Field reference — OTE Spec 0.2.0

> 🤖 Generated from the schemas — do not edit by hand. Run `npm run build-reference`.
>
> The rules a validator cannot check (why `id` must never change, why a cancelled event stays published) are in [README.md](README.md).

## `event` — OTE Event

A single tech community event. See https://opentechevents.org for the normative prose.

| Field | Type | Required | Description | Examples |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.2.0" | **yes** | Version of OTE Spec this document adheres to. | `"0.2.0"` |
| `id` | string (uri) | **yes** | Stable, globally unique identifier. A URI under a domain the publisher controls. Minted once, never rewritten — this is what lets consumers update an event instead of duplicating it. | `"https://pyalmeria.example/eventos/2026-06-async"`<br>`"https://calendar.example/ics/rust-madrid#a1b2c3d4-uid"` |
| `url` | string (uri) | — | Canonical URL where the event is described today. May change over time; id may not. | `"https://pyalmeria.example/eventos/2026-06-async"` |
| `name` | string | **yes** | Display name of the event. | `"PyAlmería — Introducción a async/await"` |
| `description` | string | — | Short description. Plain text or Markdown. | `"Charla introductoria a la programación asíncrona en Python, con ejemplos en vivo."` |
| `timezone` | string | **yes** | IANA timezone (e.g. Europe/Madrid). Turns a wall-clock startDate into an unambiguous instant. For all-day events it contextualises the date — it does not shift it. | `"Europe/Madrid"`<br>`"America/Bogota"`<br>`"UTC"` |
| `startDate` | string | **yes** | Wall-clock start: a date (2026-10-15) for all-day events, or a local date-time (2026-10-15T09:00:00). Never carries a UTC offset — timezone does that. | `"2026-06-11T18:30:00"`<br>`"2026-10-15"` |
| `endDate` | string | — | Wall-clock end, in the SAME form as startDate (both dates, or both date-times). If absent, the event is assumed to end on the day it starts. | `"2026-06-11T20:00:00"`<br>`"2026-10-16"` |
| `license` | string | **yes** | License of THIS DATA, not of the event. SPDX identifier (CC0-1.0, CC-BY-4.0…) or a URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `location` | object | — | What is KNOWN about where the event happens. Not the same question as attendanceMode, which states the organiser's intent. | `{"venue":"El Cable, Almería"}`<br>`{"onlineUrl":"https://meet.example/pyalmeria"}`<br>`{"venue":"Campus Madrid, Calle de Moreno Nieto 2, Madrid","onlineUrl":"https://meet.example/rust-madrid"}` |
| `location.venue` | string | — | Human-readable physical location. Its presence means the event has a physical venue. | `"El Cable, Almería"` |
| `location.onlineUrl` | string (uri) | — | URL to attend online. Its presence means the event has online access. | `"https://meet.example/pyalmeria"` |
| `location.geo` | object | — | Coordinates of the physical venue (WGS-84 decimal degrees). Independent of venue, which is free text — a point, not a name. Maps to iCal GEO and schema.org Place.geo (GeoCoordinates). | — |
| `location.geo.lat` | number | **yes** | Latitude in decimal degrees. | `40.4168` |
| `location.geo.lon` | number | **yes** | Longitude in decimal degrees. | `-3.7038` |
| `attendanceMode` | enum: in-person | online | hybrid | — | What the organiser says this event is. NO DEFAULT: absent means unknown, never in-person. | `"in-person"`<br>`"online"`<br>`"hybrid"` |
| `languages` | string[] | — | BCP 47 tags, e.g. ["es","en"]. No default: absent means unknown. | `["es"]`<br>`["es","en"]` |
| `tags` | string[] | — | Free-form topic tags. Maps to iCal CATEGORIES and schema.org keywords. A controlled vocabulary may layer on top later; the field itself stays free. No default: absent means unknown. | `["rust","wasm"]`<br>`["python","async"]` |
| `status` | enum: scheduled | cancelled | postponed | rescheduled | — | A cancelled or postponed event MUST stay published: removing it leaves a dead event in subscribers' calendars. | `"scheduled"`<br>`"cancelled"` |
| `source` | object | — | Provenance. Required when the event was imported or aggregated from elsewhere; omitted when the organiser describes their own event — they are the source. | `{"name":"Rust Madrid","url":"https://calendar.example/ics/rust-madrid","license":"CC-BY-4.0","retrievedAt":"2026-06-01T05:00:00Z"}` |
| `source.name` | string | **yes** | Name of the origin (e.g. "Rust Madrid", "Meetup"). | `"Rust Madrid"`<br>`"Meetup"` |
| `source.url` | string (uri) | — | Link to the original record, so the data can be verified and corrected upstream. | `"https://calendar.example/ics/rust-madrid"` |
| `source.license` | string | — | License under which the ORIGIN publishes the data. Constrains what may be republished: declaring a license does not grant rights the origin never gave. | `"CC-BY-4.0"` |
| `source.retrievedAt` | string | — | When the data was fetched. | `"2026-06-01T05:00:00Z"` |
| `updatedAt` | string | — | Instant the event's DATA last changed — equivalent to iCal LAST-MODIFIED, not DTSTAMP (which marks generation and changes on every export). Lets a consumer sync incrementally: fetch only what changed since its last read. Absent means unknown, not 'never changed'. | `"2026-06-10T18:00:00Z"` |

## `feed` — OTE Feed

A collection of OTE events published at a stable URL. An exchange format, not an API.

| Field | Type | Required | Description | Examples |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.2.0" | **yes** | Version of OTE Spec this feed adheres to. Applies to every event in it. | `"0.2.0"` |
| `title` | string | **yes** | Human-readable name of the feed. | `"Eventos de PyAlmería"` |
| `description` | string | — | Short description of the feed. | `"Meetups mensuales de Python en Almería."` |
| `url` | string (uri) | — | Canonical URL of the community, directory or organisation publishing the feed. | `"https://pyalmeria.example"` |
| `license` | string | **yes** | License for the feed's contents. Acts as the DEFAULT for every event that does not declare its own. SPDX identifier or URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `licenseUrl` | string (uri) | — | URL of the full license text. | `"https://creativecommons.org/licenses/by/4.0/"` |
| `updatedAt` | string | **yes** | When this feed was generated. | `"2026-07-06T10:00:00Z"` |
| `events` | object[] | **yes** | Events in this feed. Each one inherits the feed's specVersion and license unless it declares its own. | — |
