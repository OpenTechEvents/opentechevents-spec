# Modelo de datos — OTE Spec (borrador)

> ⚠️ **Borrador inicial generado por IA, sin revisión humana todavía.**
> Este modelo es un **boceto propuesto para ilustrar la idea** y abrir el debate. No está acordado ni validado. Todo (nombres de campos, obligatoriedad, estructura, tipos) es provisional y cambiará.

## Principios de diseño

Derivados de la investigación ([analysis.md](../research/findings/analysis.md), [standards.md](../research/findings/standards.md)):

1. **Núcleo pequeño + módulos opcionales.** Pocos campos obligatorios (como joind.in); el resto enriquece. Una comunidad pequeña debe poder describir un evento con lo mínimo.
2. **Alineado con schema.org/`Event`.** Es el modelo más completo y con difusión automática; OTE se serializa a JSON-LD casi 1:1.
3. **Convertible a iCalendar.** Núcleo mapeable a `VEVENT`.
4. **Online/presencial/híbrido de primera clase.** `attendanceMode` explícito, no inferido de la ubicación.
5. **CFP como módulo propio.** Ningún estándar generalista lo modela.
6. **Fechas ISO 8601 + zona IANA.** Base convertible a todas las formas de iCal y schema.org.
7. **Serializable en JSON y YAML.** Mismo modelo, dos sintaxis.
8. **Separar evento de comunidad (sin acoplar a un registro concreto).** El evento describe el **encuentro**, no al organizador. La comunidad se **referencia** mediante un identificador **global y descentralizado** (su URL canónica), de forma opcional. Ver siguiente sección.

## Separación de responsabilidades: evento vs. comunidad

OTE Spec describe **eventos/encuentros** (algo que ocurre en una fecha). **No** modela al organizador (tipo de comunidad, audiencia, redes sociales de la comunidad…): eso es responsabilidad de un **registro de comunidades**, que es otra capa.

| Concepto | Qué modela | Identificador |
| --- | --- | --- |
| **Evento** (un encuentro concreto, con fecha) | OTE Spec (esto) | `event.id` |
| **Comunidad** (organizador: meetup, conferencia, hacklab…) | Un registro de comunidades (capa aparte) | URI global (su URL canónica) |

**Identidad descentralizada, sin registro central obligatorio.** Igual que el evento, la comunidad se identifica con un **URI global**. La opción por defecto es **su URL canónica**: el dominio ya garantiza unicidad vía DNS, sin necesidad de un registro central (mismo enfoque que RSS o schema.org, que usan URLs como identidad). Esa identidad puede "vivir en cualquier sitio".

**Registros como dato opcional, no como dependencia.** Quien quiera puede, *además*, apuntar a uno o varios registros que describan esa comunidad. El [directorio de Community Builders](https://github.com/ComBuildersES/communities-directory) es **una implementación de referencia / un registro compatible**, no un requisito de la spec. OTE no depende de él.

En consecuencia, el evento OTE **no duplica** datos del organizador; como mucho **cachea** su `name` para mostrarlo. Solo lleva datos **propios del encuentro** (fecha, lugar de esa edición, CFP, ponentes, registro).

> Nota de alineación: el directorio de ComBuilders usa `eventFormat` con valores `in-person`/`online`/`hybrid` y `langs`; OTE reutiliza ese vocabulario (`attendanceMode`, `languages`) para facilitar la interoperabilidad con ese y otros registros, sin acoplarse a ninguno.

## Entidad núcleo: `Event`

| Campo | Tipo | Oblig. | Descripción | Mapeo |
| --- | --- | :---: | --- | --- |
| `specVersion` | string (SemVer) | ✅ | Versión de OTE Spec a la que se adhiere el documento (p. ej. `0.1.0`). | — |
| `id` | string (URI) | ✅ | Identificador estable y único del evento. URI global (URL canónica del evento o `slug` + dominio). | iCal `UID`, JSON Feed `id` |
| `name` | string | ✅ | Título del evento. | schema `name`, iCal `SUMMARY` |
| `startDate` | string (ISO 8601) | ✅ | Inicio. Fecha u fecha-hora. | schema `startDate`, iCal `DTSTART` |
| `timezone` | string (IANA, p. ej. `Europe/Madrid`) | ✅¹ | Zona horaria. ¹Obligatoria salvo eventos de día completo. | iCal `TZID`/`VTIMEZONE` |
| `attendanceMode` | enum: `in-person` \| `online` \| `hybrid` | ✅ | Formato de asistencia. | schema `eventAttendanceMode` |
| `endDate` | string (ISO 8601) | — | Fin. Si falta, se asume evento puntual o se usa `duration`. | schema `endDate`, iCal `DTEND` |
| `duration` | string (ISO 8601 duration, p. ej. `PT2H`) | — | Alternativa a `endDate`. | iCal `DURATION` |
| `summary` | string | — | Resumen corto (una línea), para listados. | iCal `SUMMARY` corto |
| `description` | string (Markdown) | — | Descripción completa. | schema `description`, iCal `DESCRIPTION` |
| `url` | string (URL) | — | Página canónica del evento. | schema `url`, iCal `URL` |
| `status` | enum: `scheduled` \| `cancelled` \| `postponed` \| `rescheduled` | — | Estado. Por defecto `scheduled`. | schema `eventStatus`, iCal `STATUS` |
| `languages` | string[] (BCP 47, p. ej. `["es","en"]`) | — | Idiomas del evento. | — |
| `image` | string (URL) | — | Imagen de portada / logo. | schema `image` |
| `location` | `Location` | —² | Ubicación. ²Recomendada según `attendanceMode`. | schema `location` |
| `tags` | string[] | — | Temáticas (p. ej. `["ai","cloud"]`). Comparte taxonomía con el directorio. | schema `keywords`, iCal `CATEGORIES` |
| `community` | `CommunityRef` \| `CommunityRef[]` | —³ | **Referencia** a la comunidad organizadora por URI global. ³Opcional pero recomendada. No se duplican sus datos. | schema `organizer` (resuelto) |
| `createdAt` / `updatedAt` | string (ISO 8601) | — | Metadatos de la ficha. | iCal `DTSTAMP` / `LAST-MODIFIED` |

> **Un documento = un evento concreto** (una fecha). La spec **no** modela recurrencia: un meetup que se repite produce **varios** documentos de evento, uno por ocurrencia, todos referenciando la misma `community`. La cadencia (mensual, anual…) es propiedad de la *serie*, no del evento → ver [Conceptos diferidos](#conceptos-diferidos).

### Sub-objeto `Location`

Soporta presencial, online o ambos a la vez (híbrido).

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `venue` | `Venue` | Lugar físico (solo si presencial/híbrido). |
| `online` | `OnlineLocation` | Acceso online (solo si online/híbrido). |

```
Venue:           { name, address, city, region, postalCode, country (ISO 3166-1 alpha-2), geo: { lat, lon } }
OnlineLocation:  { url, platform }   # platform opcional: "zoom", "youtube", "twitch"…
```

Mapeo: `Venue` → schema `Place`/`PostalAddress`/`geo`, iCal `LOCATION`+`GEO`. `OnlineLocation` → schema `VirtualLocation`.

### Sub-objeto `CommunityRef`

Referencia (no copia) a la comunidad organizadora, **agnóstica de registro**.

| Campo | Tipo | Oblig.² | Descripción |
| --- | --- | :---: | --- |
| `uri` | string (URI) | ✅ | Identidad global de la comunidad. Por defecto, su **URL canónica** (única vía DNS, sin registro central). |
| `name` | string | — | Nombre, cacheado para mostrar sin resolver el `uri`. |
| `registries` | `Registry[]` | — | Registros opcionales que describen esta comunidad (0..N). No obligatorio. |

```
Registry: { name: "community-builders", url: "https://github.com/ComBuildersES/communities-directory", localId: "42" }
```

`registries` permite enlazar la comunidad con **cualquier** directorio compatible (ComBuilders u otros) sin acoplar la spec a ninguno. `localId` es el id que use ese registro concreto.

> Un mismo evento puede co-organizarse entre varias comunidades → `community` se admite también como **lista** de `CommunityRef`.

## Módulos opcionales

Bloques que se añaden a `Event` solo si aplican. Mantienen el núcleo ligero.

### `cfp` — Call for Papers/Speakers

> No existe en ningún estándar generalista; al exportar a iCal/schema se degrada a texto/URL.

| Campo | Tipo | Oblig.² | Descripción |
| --- | --- | :---: | --- |
| `url` | string (URL) | ✅ | Formulario/página de la convocatoria. |
| `opensAt` | string (ISO 8601) | — | Apertura. |
| `closesAt` | string (ISO 8601) | — | Cierre. |
| `timezone` | string (IANA) | — | Zona horaria del CFP. |
| `coversTravel` | boolean | — | Cubre gastos de viaje. |
| `coversAccommodation` | boolean | — | Cubre alojamiento. |

²Obligatorio _dentro del módulo_ si el módulo está presente.

### `speakers` — Ponentes

Lista de `Speaker` (mapea a schema `performer`):

```
{ name, bio, photo (URL), website (URL), socials: [Social], talkTitle }
```

### `offers` — Registro y precio

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `isFree` | boolean | Gratuito o de pago. |
| `price` | number | Importe (si de pago). |
| `currency` | string (ISO 4217) | Moneda. |
| `registrationUrl` | string (URL) | Enlace de registro/entradas. |
| `capacity` | integer | Aforo máximo. |

Mapeo: schema `offers` (`Offer`).

### `promotion` — Difusión específica del evento

> Las **redes de la comunidad** organizadora **no** van aquí: viven en el directorio (`urls`). Este módulo es solo para datos de difusión **propios del encuentro**.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `hashtag` | string | Hashtag del evento (p. ej. `#RustMad2026`). |
| `eventUrls` | object | Enlaces propios del evento que no sean los de la comunidad (página de la edición, álbum de fotos, grabación…). |

### `governance` — Buenas prácticas

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `codeOfConductUrl` | string (URL) | Código de conducta. |
| `accessibility` | object | `{ captions: bool, signLanguage: bool, notes: string }`. |
| `privacyPolicyUrl` | string (URL) | Política de privacidad / derechos de imagen. |

### `sponsors` — Patrocinadores

Lista de `{ name, url, logo, tier }`.

## Ejemplo (YAML)

```yaml
specVersion: "0.1.0"
id: "https://rustmadrid.example/2026-05"
name: "Rust Madrid — Mayo 2026"
summary: "Charlas mensuales sobre Rust en Madrid"
startDate: "2026-05-29T19:00:00"
endDate: "2026-05-29T21:00:00"
timezone: "Europe/Madrid"
attendanceMode: hybrid
status: scheduled
url: "https://rustmadrid.example/2026-05"
languages: ["es"]
image: "https://rustmadrid.example/cover.png"
location:
  venue:
    name: "Campus Madrid"
    address: "Calle de Moreno Nieto 2"
    city: "Madrid"
    country: "ES"
    geo: { lat: 40.4081, lon: -3.7188 }
  online:
    url: "https://youtube.example/live/xyz"
    platform: "youtube"
tags: ["rust", "systems"]
community:                      # referencia por URI global; no se duplican sus datos
  uri: "https://rustmadrid.example"
  name: "Rust Madrid"
  registries:                  # opcional: registros compatibles que la describen
    - { name: "community-builders", url: "https://github.com/ComBuildersES/communities-directory", localId: "42" }
offers:
  isFree: true
  registrationUrl: "https://rustmadrid.example/2026-05/register"
  capacity: 80
promotion:
  hashtag: "#RustMad202605"
governance:
  codeOfConductUrl: "https://rustmadrid.example/coc"
  accessibility: { captions: true, signLanguage: false }
```

## Resumen de mapeo a estándares

| OTE | schema.org/Event | iCalendar VEVENT | RSS / JSON Feed |
| --- | --- | --- | --- |
| `id` | `@id` | `UID` | `guid` / `id` |
| `name` | `name` | `SUMMARY` | `title` |
| `description` | `description` | `DESCRIPTION` | `description` / `content_html` |
| `startDate`/`endDate` | `startDate`/`endDate` | `DTSTART`/`DTEND` | — (en cuerpo) |
| `timezone` | (en fecha ISO) | `TZID`+`VTIMEZONE` | — |
| `attendanceMode` | `eventAttendanceMode` | (sin equiv.) | — |
| `location.venue` | `Place`/`PostalAddress` | `LOCATION`+`GEO` | — |
| `location.online` | `VirtualLocation` | `URL` | — |
| `tags` | `keywords` | `CATEGORIES` | `category` / `tags` |
| `cfp` | (extensión) | (texto) | (cuerpo) |
| `community` | `organizer` (resuelto desde el directorio) | `ORGANIZER` | — |
| `speakers` | `performer` | (sin equiv.) | — |
| `offers` | `offers` | (sin equiv.) | — |
| `promotion.hashtag` | (sin equiv.) | (sin equiv.) | — |

> **Difusión**: RSS y JSON Feed no modelan eventos → un evento por `item`, con enlace a la ficha y el evento estructurado en una extensión (namespace en RSS, campo `_ote` en JSON Feed).

## Conceptos diferidos

Cosas deliberadamente **fuera** de la v0.1 para no complicar el núcleo; se evaluarán como entidades/módulos aparte:

- **Serie de eventos (`EventSeries`)**: la cadencia de un meetup mensual o las ediciones anuales de una conferencia. Cada ocurrencia sigue siendo un `Event` independiente; la serie los agruparía y podría exportarse a un `VEVENT` con `RRULE`. Mantiene la identidad "un documento = un evento".
- **Agenda multi-sesión** (tracks, horarios por charla dentro de un evento).

## Versionado

La especificación se versiona con **SemVer** (`MAJOR.MINOR.PATCH`):

- **MAJOR** — cambios incompatibles (renombrar/eliminar campos, cambiar obligatoriedad o tipos).
- **MINOR** — añadidos retrocompatibles (nuevos campos/módulos opcionales).
- **PATCH** — correcciones sin impacto en el modelo (redacción, ejemplos, aclaraciones).

Cada documento de evento declara la versión a la que se adhiere en `specVersion`, lo que permite a las herramientas validar y migrar. Mientras la spec esté en `0.x` se considera **inestable**: puede haber cambios incompatibles entre versiones menores. La primera versión estable será `1.0.0`.

> Los **estándares destino** (iCal, schema.org…) tienen su propio versionado; el mapeo documenta contra qué versión se valida.

## Preguntas abiertas

- **Identidad de la comunidad**: ¿imponer que `community.uri` sea una URL resoluble, o admitir otros esquemas URI (DID, etc.)? ¿Cómo se "resuelven" los datos de la comunidad desde el `uri` (convención de descubrimiento)?
- **Identidad del evento** (sí es de la spec; el *dónde* se almacena, no): ¿`event.id` siempre URI resoluble o se admite slug? ¿Cómo garantizar unicidad **independiente de la ubicación** de los datos?
- ¿Normalizar `tags` con un vocabulario controlado (reutilizando taxonomías existentes) o dejar libre?
- **Serie de eventos**: ¿hace falta una entidad `EventSeries` que agrupe ocurrencias (meetup mensual, ediciones anuales) y, opcionalmente, las enlace? ¿Cómo se referencian entre sí evento y serie? (ver [Conceptos diferidos](#conceptos-diferidos)).
- Validación: ¿JSON Schema oficial, versionado junto a la spec?
