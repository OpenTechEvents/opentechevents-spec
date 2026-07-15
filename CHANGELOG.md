# Changelog — OTE Spec

Todos los cambios relevantes de la especificación. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado es
[SemVer](https://semver.org/lang/es/): mientras la spec esté en `0.x` se
considera **inestable** (puede romper entre versiones menores; la `1.0.0` será
la primera estable).

Cada versión publicada vive congelada en su carpeta (`spec/v0.1/`, `spec/v0.2/`…)
y bajo su `$id` (`https://opentechevents.org/schema/vX.Y/…`). Un documento declara
a cuál se adhiere con `specVersion`, así que **nada se rompe al publicar una
versión nueva**: los documentos `0.1.0` siguen validando contra `spec/v0.1/`.

## [0.2.0] — 2026-07-15

Primera ampliación del núcleo. Los tres campos son **opcionales y
retrocompatibles** (por eso MINOR, no MAJOR): un documento `0.1.0` válido, con
solo cambiar `specVersion` a `"0.2.0"`, sigue siendo válido. Entraron los tres
por la misma vía —la primera implementación real, el agregador de `.ics`
([`opentechevents-data`](https://github.com/OpenTechEvents/opentechevents-data)),
los tenía delante en cada `VEVENT` y no había dónde ponerlos— no por diseño
especulativo.

### Added

- **`tags`** (`string[]`) en el evento. Etiquetas temáticas de forma libre.
  Mapea a `CATEGORIES` de iCal y a `keywords` de schema.org. Se mantiene libre a
  propósito; un vocabulario controlado podría superponerse después sin cerrar el
  campo. Graduó desde el estado «en discusión» de la v0.1.
- **`location.geo`** (`{ lat, lon }`, grados decimales WGS-84) en el evento.
  Mapea a `GEO` de iCal y a `Place.geo` de schema.org. Va **dentro de
  `location`**, hermano de `venue`/`onlineUrl` (no cuelga de `venue`, que es una
  cadena). No basta por sí solo para satisfacer `location`.
- **`updatedAt`** (instante ISO 8601 con offset/Z, mismo `$defs/instant` que
  `Feed.updatedAt`) en el evento. Instante en que **los datos del evento**
  cambiaron por última vez — equivalente a `LAST-MODIFIED` de iCal, **no** a
  `DTSTAMP`. Habilita sincronización incremental por evento
  (`updatedAt > última_lectura`).

### Migration — cómo actualizar una herramienta

- **Consumidores:** los tres campos son opcionales; el código de v0.1 los ignora
  sin romperse. Para aprovecharlos, leer `tags`, `location.geo` y `updatedAt`
  cuando estén presentes; ausente significa *desconocido*, nunca un valor por
  defecto.
- **Validadores por paquete:** `npm install @opentechevents/schema@0.2.0`. El
  paquete ahora exporta los schemas de `v0.2` y `specVersion === "0.2.0"`.
- **Validadores por URL:** apuntar a
  `https://opentechevents.org/schema/v0.2/{event,feed}.schema.json`. Las URLs de
  `v0.1` siguen sirviéndose sin cambios.
- **Productores / importadores (`.ics` → OTE):**
  - `CATEGORIES` → `tags` (separar por coma, `trim`, dedupe).
  - `GEO` → `location.geo` (parsear `"lat;lon"`, separador `;`, a `number`).
    ⚠️ Es `location.geo`, **no** `location.venue.geo`: en OTE `venue` es una
    cadena.
  - `LAST-MODIFIED` → `updatedAt` (si falta, `DTSTAMP` como último recurso, pero
    es ruidoso: marca generación, no edición).
  - `CATEGORIES` no viaja por Google Calendar (no lo emite ni lo lee). Un
    importador puede recuperar temáticas de *hashtags* (`#rust`) en la
    `description`; es convención del importador, no del schema.

## [0.1.0] — 2026-07

Primera versión publicada. Núcleo mínimo para describir un evento de comunidad
técnica y publicarlo en un feed reutilizable: `id`, `name`, `startDate`,
`timezone` obligatorios (más `specVersion` y `license` en un documento suelto);
`url`, `description`, `endDate`, `location` (`venue`/`onlineUrl`),
`attendanceMode`, `languages`, `status`, `source` opcionales. Feed con
`specVersion`, `title`, `license`, `updatedAt`, `events`. Congelada en
[`spec/v0.1/`](spec/v0.1/).

[0.2.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.2
[0.1.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.1
