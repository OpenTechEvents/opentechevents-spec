# Feed de eventos — OTE Spec (borrador)

> ⚠️ **Borrador inicial generado por IA, sin revisión humana todavía.**
> Boceto para ilustrar la idea y abrir debate. Nombres, campos y decisiones son provisionales.

Los documentos de [data-model.md](data-model.md) describen **eventos individuales**. Un **feed** es una **colección** de eventos publicada en una URL estable, a la que la gente puede **suscribirse** y que las herramientas pueden ingerir.

## Alcance: qué es y qué no es de la spec

| Es de la spec | Es del ecosistema (herramientas) |
| --- | --- |
| Formato del feed (colección de eventos + metadatos). | Motor de **suscripción** y entrega de **notificaciones**. |
| Mapeo a estándares de feed (RSS, JSON Feed, iCal). | UI para que el usuario fije condiciones/alertas. |
| Qué campos son **filtrables** y la convención de filtrado por URL. | Lógica de filtrado en cliente, dedupe entre feeds, etc. |

Objetivo de diseño: que un feed OTE sea **suscribible con herramientas que la gente ya usa** (lector RSS, app de calendario) sin adoptar nada nuevo.

## Objeto `Feed`

```
{
  "specVersion": "0.1.0",
  "kind": "feed",
  "title": "Eventos de IA en España",
  "feedUrl": "https://eventos.example/feeds/ia-es.json",   // identidad/self
  "homePageUrl": "https://eventos.example/ia-es",
  "description": "Meetups y conferencias de IA en España.",
  "updatedAt": "2026-05-29T08:00:00Z",
  "scope": { ... },        // opcional: a qué está pre-filtrado este feed
  "next": "https://eventos.example/feeds/ia-es.json?page=2",  // opcional, paginación
  "events": [ /* Event, Event, … */ ]
}
```

| Campo | Tipo | Oblig. | Descripción |
| --- | --- | :---: | --- |
| `specVersion` | string (SemVer) | ✅ | Versión de OTE Spec. |
| `kind` | `"feed"` | ✅ | Discrimina feed de evento suelto. |
| `title` | string | ✅ | Nombre del feed. |
| `feedUrl` | string (URL) | ✅ | URL canónica del propio feed (identidad). |
| `events` | `Event[]` | ✅ | Eventos contenidos (formato de [data-model.md](data-model.md)). |
| `homePageUrl` | string (URL) | — | Página HTML asociada. |
| `description` | string | — | De qué va el feed. |
| `updatedAt` | string (ISO 8601) | — | Última actualización. |
| `scope` | `Scope` | — | Filtros ya aplicados (ver abajo). |
| `next` | string (URL) | — | Siguiente página (paginación). |
| `license` | string (SPDX id o URL) | — | Licencia **por defecto** de los eventos del feed (cada `Event` puede sobrescribirla con su propio `license`). |
| `source` | `Source` \| `Source[]` | — | Procedencia/atribución del feed si agrega otras fuentes. |

> Atribución y licencia: un feed que **agrega** varias fuentes debería declarar `source`/`license` a nivel de feed y/o por evento, para respetar y propagar la procedencia. Ver [data-model.md](data-model.md#sub-objeto-source).

`events` puede contener eventos **completos** o una forma reducida con enlace (`id`/`url`) a la ficha completa; pendiente de decidir (ver preguntas abiertas).

## Filtrado

### 1. Feeds pre-filtrados (curados)

Un publicador ofrece **varias URLs**, cada una ya acotada: por `tag`, ciudad, comunidad, modalidad… Cada feed declara su acotación en `scope`, de forma informativa:

```
scope: {
  tags: ["ai"],
  country: "ES",
  attendanceMode: "online",     // in-person | online | hybrid
  from: "2026-05-01",
  to: "2026-12-31"
}
```

Es la opción más interoperable: cada `scope` = una URL suscribible en cualquier lector estándar, sin lógica adicional.

### 2. Convención de filtrado por query params (endpoints dinámicos)

Para feeds servidos dinámicamente, **recomendación** de parámetros (no obligatoria; el servidor decide qué soporta):

| Param | Ejemplo | Filtra por |
| --- | --- | --- |
| `tag` | `?tag=ai&tag=cloud` | etiquetas (OR) |
| `attendanceMode` | `?attendanceMode=online` | modalidad |
| `country` / `city` | `?country=ES` | ubicación |
| `community` | `?community=https://rustmadrid.example` | comunidad (por URI) |
| `from` / `to` | `?from=2026-06-01&to=2026-06-30` | rango de fechas |
| `hasCfp` | `?hasCfp=true` | solo con CFP abierto |

El resultado es un `Feed` cuyo `scope` refleja los filtros aplicados.

### 3. Notificaciones y condiciones del usuario → herramientas

Suscribirse, evaluar condiciones ("avísame de eventos online de Rust a <50 km") y **notificar** es responsabilidad de las herramientas del ecosistema, no de la spec. La spec solo garantiza que los **campos** necesarios para filtrar (tags, modalidad, ubicación, fechas, CFP) están normalizados.

## Mapeo a estándares de feed

Para máxima compatibilidad, un `Feed` OTE debería poder exportarse a:

| Estándar | Cómo | Suscripción con |
| --- | --- | --- |
| **JSON Feed 1.1** | `Feed`→feed, cada `Event`→`item` (evento estructurado en `_ote`). | Lectores JSON Feed. |
| **RSS 2.0** | `channel` + un `item` por evento; datos estructurados en un namespace. | Cualquier lector RSS. |
| **iCalendar** | `VCALENDAR` con un `VEVENT` por evento. | Google/Apple/Outlook Calendar (suscripción a `.ics`). |

> El mapeo de cada `Event` es el de [data-model.md](data-model.md#resumen-de-mapeo-a-estándares). RSS/JSON Feed sirven como **anuncio** (título + enlace a la ficha + evento estructurado); iCal permite **suscribir el calendario** directamente.

## Preguntas abiertas

- ¿Los `events` del feed van **completos** o en forma reducida (resumen + enlace a la ficha)? ¿Mixto según tamaño?
- ¿`scope` es solo informativo o las herramientas deben **validar** que el contenido lo respeta?
- ¿Estandarizar paginación (`next`) o delegar en el transporte (HTTP `Link`)?
- ¿Feeds de **CFP** como tipo aparte, o un feed normal con `?hasCfp=true`?
- ¿Soporte de "tiempo real" (WebSub/hubs, como JSON Feed) o solo polling?
- **¿Cómo se descubre un feed OTE desde una web?** RSS resuelve esto con *autodiscovery*. Opciones a evaluar (no excluyentes):
  - **HTML `<link rel="alternate">`** en el `<head>`, símil RSS: `<link rel="alternate" type="application/ote+json" href="https://eventos.example/feeds/ia-es.json">`. Falta decidir el `type` (MIME propio vs. `application/feed+json`).
  - **`.well-known/`** a nivel de dominio (p.ej. `/.well-known/ote-feed`) para descubrir sin parsear HTML.
  - **JSON-LD / `schema.org` `Event`** embebido en la página, reaprovechando lo que ya detectan crawlers (dev.events, Google). Ver [research/findings/analysis.md](../research/findings/analysis.md).
