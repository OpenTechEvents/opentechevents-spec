# Hallazgos — Estándares existentes

A diferencia de plataformas y directorios, aquí no analizamos "cómo dar de alta un evento" sino **el modelo de datos del estándar** y **cómo mapear hacia/desde él**. Son la base de la interoperabilidad que persigue OTE Spec: queremos que un evento descrito en nuestro formato se pueda transformar sin pérdida a estos.

## Resumen

Dos familias claras:

- **Estándares con modelo de evento nativo**: **iCalendar** (`VEVENT`) y **schema.org/`Event`** (JSON-LD) y, en HTML, **h-event** (microformats). Cubren nombre, fechas, ubicación, zona horaria, organizador/ponentes y, en iCal, recurrencia. Son los objetivos de mapeo prioritarios.
- **Estándares de feed sin concepto de evento**: **RSS 2.0** y **JSON Feed**. No modelan eventos ni rangos de fechas ni ubicación; sirven como **formato de distribución/anuncio** (un evento por `item`), apoyándose en extensiones (namespaces en RSS, campos `_` en JSON Feed) para los datos estructurados.

Conclusión de diseño: OTE Spec debe mapear **1:1 con schema.org/Event e iCalendar** (cubren el núcleo), y ofrecer feeds RSS/JSON Feed como salida de difusión, metiendo lo estructurado vía extensión + enlace a la ficha completa.

## iCalendar — `VEVENT` (RFC 5545)

- **Referencia**: https://datatracker.ietf.org/doc/html/rfc5545
- **Serialización**: texto plano `text/calendar` (.ics). Muy soportado por clientes de calendario (Google Calendar, Apple, Outlook).

| Aspecto | Detalle |
| --- | --- |
| **Obligatorios** | `UID` (identificador único), `DTSTAMP` (timestamp de creación) y `DTSTART` (inicio). |
| **Núcleo opcional** | `DTEND` o `DURATION` (fin/duración), `SUMMARY` (título), `DESCRIPTION`, `LOCATION`, `URL`, `CATEGORIES` (tags), `GEO` (lat/long), `STATUS`, `ORGANIZER`, `ATTENDEE`, `TRANSP`. |
| **Fechas/zonas horarias** | DATE-TIME en 3 formas: flotante (`19970714T133000`), UTC (`...Z`) y local con zona (`TZID=America/New_York:...`). El `TZID` referencia un componente `VTIMEZONE` que define reglas de la zona (offsets, DST). |
| **Recurrencia** | `RRULE` (con `FREQ` obligatorio; `INTERVAL`, `COUNT`/`UNTIL`, `BYDAY`, `BYMONTHDAY`, `BYMONTH`, `WKST`). Más `RDATE` (fechas extra), `EXDATE` (excluidas) y `RECURRENCE-ID` (instancia modificada). Ideal para meetups recurrentes. |
| **Eventos online** | No hay campo nativo de "online/híbrido"; se suele poner la URL en `URL`/`LOCATION`. Lo cubre peor que schema.org. |
| **CFP / ponentes** | Sin concepto de CFP. Ponentes solo encajan forzados en `ATTENDEE`/`ORGANIZER`. |

**Mapeo OTE → iCal**: `name→SUMMARY`, `description→DESCRIPTION`, `start/end→DTSTART/DTEND`, `timezone→TZID`+`VTIMEZONE`, `location→LOCATION`+`GEO`, `url→URL`, `tags→CATEGORIES`, recurrencia→`RRULE`. **Se pierde**: CFP, distinción online/híbrido fina, ponentes estructurados, redes sociales. Generar UID/DTSTAMP en la exportación.

## schema.org / `Event` (JSON-LD)

- **Referencia**: https://schema.org/Event
- **Serialización**: JSON-LD embebido en HTML (`<script type="application/ld+json">`). **Clave**: dev.events (y buscadores) ya lo detectan automáticamente → publicarlo da difusión "gratis".

| Aspecto | Detalle |
| --- | --- |
| **Propiedades núcleo** | `name`, `description`, `startDate`, `endDate` (ISO 8601), `location`, `organizer`, `performer` (ponentes), `offers` (entradas/precio), `image`, `url`, `eventStatus`, `eventAttendanceMode`. |
| **Online/presencial/híbrido** | `eventAttendanceMode`: `OnlineEventAttendanceMode`, `OfflineEventAttendanceMode`, `MixedEventAttendanceMode`. Eventos online usan `VirtualLocation` (con `url`) en lugar de `Place` físico. **El mejor soporte de los analizados.** |
| **Estado** | `eventStatus`: scheduled, cancelled, rescheduled, postponed. |
| **Ubicación** | `Place` (con `PostalAddress`/`geo`), `PostalAddress`, `Text` o `VirtualLocation`. |
| **Subtipos** | `ConferenceEvent`, `EducationEvent`, `Festival`, `MusicEvent`, `SportsEvent`, etc. |
| **CFP / ponentes** | `performer` cubre ponentes. No hay CFP nativo → requeriría extensión propia. |

**Mapeo OTE ↔ schema.org**: prácticamente 1:1 para el núcleo (incluido online/híbrido vía `eventAttendanceMode`, que iCal no tiene). Es el **modelo de referencia más alineado** con OTE. **Falta**: CFP (extensión), y normalización de redes sociales (`sameAs`).

## RSS 2.0

- **Referencia**: https://www.rssboard.org/rss-specification
- **Serialización**: XML.

| Aspecto | Detalle |
| --- | --- |
| **Estructura** | `<rss>` → un `<channel>` → varios `<item>`. |
| **`channel` obligatorio** | `title`, `link`, `description`. |
| **`item`** | Todos opcionales: `title`, `link`, `description`, `author`, `pubDate` (RFC 822), `guid`, `category`, `enclosure` (media), `comments`. |
| **Evento/fecha/ubicación** | **Sin soporte nativo.** No hay rangos de fechas ni ubicación; `pubDate` es fecha de publicación, no del evento. |
| **Extensibilidad** | Permite elementos/atributos extra **solo si están en un namespace** (módulos). Vía para inyectar datos estructurados. |

**Rol para OTE**: formato de **difusión/anuncio**, no de modelo. Un evento = un `item` (título, enlace a ficha, descripción). Para datos estructurados, usar un módulo con namespace propio o reutilizar uno existente, y dejar el detalle completo en la URL enlazada (idealmente con JSON-LD). Compatible con lectores RSS que la gente ya usa.

## h-event (microformats2)

- **Referencia**: http://microformats.org/wiki/h-event
- **Serialización**: clases semánticas en HTML (sucesor de hCalendar/hCard).

| Aspecto | Detalle |
| --- | --- |
| **Propiedades** | `p-name`, `dt-start`, `dt-end`, `dt-duration`, `p-location`, `p-summary`, `p-description` (→ `e-content`), `u-url`, `p-category`. |
| **Obligatorios** | Ninguno; todas opcionales. |
| **Fechas** | Atributo `datetime` en ISO. |
| **Ubicación** | Texto, o enriquecida anidando `h-card`/`h-adr`/`h-geo`. |
| **CFP/online** | Sin soporte específico. |

**Rol para OTE**: alternativa/complemento a JSON-LD para incrustar el evento en el HTML de la web del organizador. Menor adopción que schema.org hoy; prioridad secundaria, pero mapeo trivial (mismos campos núcleo).

## JSON Feed 1.1

- **Referencia**: https://www.jsonfeed.org/version/1.1/
- **Serialización**: JSON. Alternativa moderna a RSS/Atom.

| Aspecto | Detalle |
| --- | --- |
| **Feed obligatorio** | `version`, `title`, `items`. Recomendados: `home_page_url`, `feed_url`. |
| **`item` obligatorio** | `id`. Comunes: `url`, `title`, `content_html`/`content_text`, `summary`, `image`, `date_published`/`date_modified` (RFC 3339), `authors`, `tags`, `attachments`. |
| **Evento/fecha/ubicación** | **Sin semántica de evento.** Solo timestamps de publicación/modificación; sin rango ni ubicación. |
| **Extensibilidad** | Campos personalizados con prefijo `_` (p. ej. `_ote`) en cualquier nivel; los lectores ignoran lo desconocido (forward-compatible). |

**Rol para OTE**: igual que RSS pero en JSON — feed de difusión. Ventaja: extensión limpia vía objeto `_ote` para colgar el evento estructurado completo junto al `item`, sin romper lectores estándar.

## Conclusiones para el mapeo OTE ↔ estándares

1. **Modelo de referencia: schema.org/Event.** Es el más completo y alineado (online/híbrido nativo, ponentes, estado, offers) y da difusión automática vía JSON-LD. OTE debería poder serializarse a JSON-LD/Event de forma directa.
2. **iCalendar para calendarios.** Mapeo sólido del núcleo + recurrencia (única fuente analizada con recurrencia formal → clave para meetups periódicos). Generar `UID`/`DTSTAMP`; aceptar pérdida de CFP y matices online.
3. **RSS y JSON Feed para difundir, no para modelar.** Un evento por `item`, enlace a la ficha completa; datos estructurados vía namespace (RSS) o campo `_ote` (JSON Feed).
4. **h-event** como opción de marcado en HTML; baja prioridad.
5. **Hueco común: CFP.** Ningún estándar generalista lo modela. OTE debe definirlo como módulo propio y, al exportar, degradarlo a campos de texto/URL.
6. **Fechas y zonas horarias**: adoptar ISO 8601 + zona IANA (`TZID`) como base; convertible a las 3 formas de iCal y al `startDate`/`endDate` de schema.org. Soportar rango (inicio/fin) y recurrencia desde el núcleo.

> Estas conclusiones se integran con las de [analysis.md](analysis.md).
