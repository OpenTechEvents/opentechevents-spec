# Agregador OTE — diseño del MVP (propuesta)

> ⚠️ **Propuesta, no compromiso.** Diseño para discutir. Nada está implementado todavía.

Herramienta que **ingiere eventos de fuentes externas, los normaliza a OTE Spec y publica un feed**. Es la primera implementación de referencia del estándar y su mejor banco de pruebas: si el modelo de datos no soporta una ingesta real, es que el modelo está mal.

- **MVP**: una única familia de fuentes, **iCalendar (`.ics`)**.
- **A futuro**: Meetup, Luma, Sessionize, JSON-LD/schema.org, RSS, otros feeds OTE… → por eso la ingesta es **modular** desde el día 1.

## Principio rector: todo dato es open data

El feed publicado solo contiene eventos cuya **licencia es conocida y reutilizable**. No se ingiere nada "porque está en internet". Cada evento del feed viaja con su `source` (de dónde salió) y su `license` (cómo puede reutilizarse). Ver [Puerta de licencia](#puerta-de-licencia-open-data-gate).

---

## Dónde vive

**Repositorio aparte**: `OpenTechEvents/opentechevents-aggregator`.

| Repo | Responsabilidad |
| --- | --- |
| `opentechevents-spec` (este) | El estándar: modelo de datos, feed, JSON Schema, versionado. |
| `opentechevents-aggregator` | Implementación: conectores, GitHub Action, fuentes registradas, feed publicado. |

Motivo: el debate del estándar no debe mezclarse con bugs de implementación, y el agregador debe ser **un consumidor más** de la spec (dogfooding: consume el JSON Schema publicado, no una copia privada).

## Arquitectura

Pipeline determinista. Cada paso es puro y testeable por separado:

```
sources/*.yml
    │
    ▼
[1] discover ── lee y valida el registro de fuentes
    │
    ▼
[2] fetch ───── el conector descarga el dato crudo (HTTP, API…)
    │
    ▼
[3] parse ───── crudo → objetos intermedios del formato (VEVENT, JSON de API…)
    │
    ▼
[4] normalize ─ objetos del formato → Event OTE (aquí vive el mapeo)
    │
    ▼
[5] validate ── ajv contra el JSON Schema de OTE Spec  ── evento inválido = descartado + reportado
    │
    ▼
[6] dedupe ──── por `id` estable (ver más abajo)
    │
    ▼
[7] partition ─ futuros → feed;  pasados → archivo
    │
    ▼
[8] render ──── feed.json (canónico) → .ics, .xml (RSS), .feed.json (JSON Feed)
    │
    ▼
[9] publish ─── commit a main + GitHub Pages
```

Los pasos 2-4 son **lo único que aporta un plugin**. El resto (5-9) es común a todos los formatos y no se toca al añadir una fuente nueva. Ese es todo el truco de la mantenibilidad.

### Interfaz de conector (plugin)

```ts
export interface Connector<Config = unknown> {
  /** Identificador del tipo de fuente: "ics", "meetup", "jsonld"… */
  readonly type: string;

  /** JSON Schema de la config que este conector acepta en sources/*.yml */
  readonly configSchema: JSONSchema;

  /** Descarga + parsea + normaliza. Nunca lanza: acumula errores por evento. */
  ingest(source: Source<Config>, ctx: Ctx): Promise<IngestResult>;
}

interface IngestResult {
  events: OteEvent[];      // ya normalizados a OTE
  warnings: Issue[];       // eventos degradados (p.ej. sin timezone → asumida)
  errors: Issue[];         // eventos descartados, con motivo
}

interface Ctx {
  fetch: typeof fetch;     // inyectado → tests sin red
  now: Date;               // inyectado → tests deterministas
  logger: Logger;
}
```

Registro de conectores: un `Map<type, Connector>` en `src/connectors/index.ts`. Añadir un formato = un fichero nuevo + una línea en el registro + sus fixtures. Sin tocar el core.

**Un conector nunca inventa datos.** Si el ICS no trae zona horaria, el evento se degrada con un *warning*, no se adivina.

## El registro de fuentes: `sources/*.yml`

**Un fichero por fuente** (no un fichero gigante): PRs sin conflictos, `git blame` por fuente, y el CI puede validar solo lo que cambia.

```yaml
# sources/rust-madrid.yml
id: rust-madrid                 # slug único, = nombre de fichero
type: ics                       # qué conector lo procesa
enabled: true

config:                         # validado contra el configSchema del conector "ics"
  url: https://rustmadrid.example/events.ics

# Procedencia y derechos → obligatorio, esto es lo que hace que el feed sea open data
license: CC-BY-4.0              # SPDX o URL
attribution:
  name: Rust Madrid
  url: https://rustmadrid.example
permission:                     # solo si la fuente no declara licencia por sí misma
  grantedBy: "@handle-del-organizador"
  evidence: https://github.com/OpenTechEvents/opentechevents-aggregator/issues/42

# Valores por defecto aplicados a los eventos de esta fuente (no los sobrescriben si vienen)
defaults:
  community:
    uri: https://rustmadrid.example
    name: Rust Madrid
  tags: [rust]
  languages: [es]
  attendanceMode: in-person
```

### Puerta de licencia (open data gate)

El CI **rechaza** un `sources/*.yml` que no cumpla una de las dos vías:

1. **Licencia abierta declarada por la fuente**: `license` ∈ allowlist (`CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `ODbL-1.0`…) y verificable en origen.
2. **Permiso explícito del organizador**: la mayoría de comunidades no ha puesto licencia a su `.ics`. Se admite si el organizador lo concede por escrito → el bloque `permission` enlaza el issue donde consta. El alta por Issue Form (abajo) captura ese permiso de forma natural: **quien da de alta la fuente suele ser el propio organizador**.

Ninguna otra vía. Sin licencia ni permiso, no entra.

> **Meetup, Eventbrite y similares tienen Términos de Servicio que restringen la reutilización**, incluso cuando exponen un `.ics` público. Que un endpoint sea accesible no lo hace reutilizable. Cada plataforma necesita su propio análisis antes de admitirla como fuente — pendiente en [research/](../research/README.md).

El feed agregado se publica como **CC-BY-4.0**, con la atribución de cada evento en su `source`. No se relicencia nada a CC0: no se puede relicenciar lo que no es tuyo.

## Mapeo iCalendar → OTE

El conector `ics` implementa esto. Es, además, el **inverso** del mapeo que ya documenta la spec ([data-model.md](../spec/data-model.md#resumen-de-mapeo-a-estándares)) — validarlo en ambos sentidos es una prueba fuerte del modelo.

| VEVENT | OTE | Notas |
| --- | --- | --- |
| `UID` | `id` | Ver estrategia de identidad abajo. |
| `SUMMARY` | `name` | |
| `DESCRIPTION` | `description` | Suele traer HTML o texto plano; se normaliza a Markdown. |
| `DTSTART` + `TZID` | `startDate` + `timezone` | `DTSTART;VALUE=DATE` → evento de día completo, sin `timezone`. |
| `DTEND` / `DURATION` | `endDate` / `duration` | |
| `URL` | `url` | Si falta, fallback a la URL del propio `.ics` (dudoso: mejor dejar vacío). |
| `LOCATION` (texto) | `location.venue.name` | Texto libre. **No se geocodifica en el MVP.** |
| `LOCATION` (si parsea como URL) | `location.online.url` | Emisores que meten el enlace de la sala ahí. |
| `CONFERENCE` (RFC 7986) | `location.online.url` | La propiedad **estándar**… que casi nadie emite. |
| `X-GOOGLE-CONFERENCE`, `X-MICROSOFT-SKYPETEAMSMEETINGURL` | `location.online.url` | Propiedades propietarias. En la práctica, la fuente real del dato. |
| `GEO` | `location.venue.geo` | Raro en la práctica. |
| `CATEGORIES` | `tags` | Se unen con los `defaults.tags` de la fuente. |
| `STATUS` | `status` | `CONFIRMED`→`scheduled`, `CANCELLED`→`cancelled`, `TENTATIVE`→`postponed`. |
| `LAST-MODIFIED` / `DTSTAMP` | `updatedAt` | |
| `RRULE` | (expandir) | Ver abajo. |
| — | `source` | Inyectado por el agregador: `{name, url, license, retrievedAt}`. |
| — | `license` | De `sources/*.yml`. |
| — | `attendanceMode` | **iCal no lo modela.** Ver [Inferencia de modalidad](#inferencia-de-modalidad-attendancemode). |

**Recurrencia (`RRULE`)**: detalle de implementación del conector, **no afecta a la spec**. Algunos `.ics` de meetups mensuales publican un único `VEVENT` con `RRULE` en lugar de un `VEVENT` por ocurrencia. El conector lo **expande** dentro de la ventana (hoy → +12 meses), respetando `EXDATE` y `RECURRENCE-ID`, y produce un `Event` por ocurrencia con su propio `id`. Coherente con *"un documento = un evento"*: la recurrencia se resuelve en la ingesta y nunca llega al feed.

### Inferencia de modalidad (`attendanceMode`)

**iCalendar no modela la modalidad de asistencia.** Hay que decidir qué hacer con eso, y la respuesta correcta **no** es adivinar.

Lo que sí se puede extraer con confianza son **hechos observados**, no conclusiones:

- **Hay acceso online** si aparece un enlace de sala en una propiedad dedicada: `CONFERENCE` (RFC 7986, estándar pero poco emitido), `X-GOOGLE-CONFERENCE`, `X-MICROSOFT-SKYPETEAMSMEETINGURL`, o un `LOCATION` que parsea como URL. → `location.online.url`.
- **Hay lugar físico** si `LOCATION` es texto y no una URL. → `location.venue.name`.

> **URLs sueltas en `DESCRIPTION`: no se usan.** Ahí conviven enlaces de registro, de la comunidad y de patrocinadores. Demasiado ruido para tratarlas como señal.

De esos dos hechos, la modalidad **solo se afirma cuando la señal es inequívoca**:

| Lugar físico | Enlace online | `attendanceMode` |
| :---: | :---: | --- |
| sí | no | `in-person` |
| no | sí | `online` |
| sí | sí | **se omite** |
| no | no | **se omite** |

El caso "ambos" parece híbrido, pero **no lo es necesariamente**, y el motivo no es rebuscado: **Google Calendar adjunta un enlace de Meet automáticamente** a los eventos que creas (opción activada por defecto en muchas cuentas). El organizador crea su meetup presencial, no toca nada, y su `.ics` público sale con `X-GOOGLE-CONFERENCE`. Nadie decidió que ese evento fuera híbrido: lo decidió una casilla por defecto. El ICS **no contiene** la información que distingue eso de un híbrido real; ningún parser lo puede arreglar.

Simétricamente, la ausencia de enlace no implica presencial: muchas comunidades mandan el enlace por email al registrarse.

**Precedencia**: `defaults.attendanceMode` de `sources/*.yml` **gana siempre** sobre la heurística. El organizador que da de alta su fuente sabe si su meetup es híbrido; el parser no. Esa es la vía buena de conseguir el dato — declararlo en el origen, no deducirlo.

Cuando se omite por ambigüedad, se emite un *warning* a `report.json` ("fuente X: 12 eventos sin `attendanceMode` determinable") para que el mantenedor de esa fuente lo declare en sus `defaults`, en lugar de que el sistema se invente el dato en silencio.

> Esto exige que la spec permita representar *"no lo sé"*: `attendanceMode` **opcional y sin valor por defecto**. Si tuviera `in-person` por defecto, toda ingesta desde `.ics` convertiría los eventos online en presenciales, sin avisar.

### Identidad (`id`) — el punto crítico

Sin `id` estable, cada ejecución diaria duplica el feed entero. Regla:

```
id = source.url + "#" + UID                      (si el VEVENT trae UID)
id = source.url + "#" + sha256(name|startDate)   (fallback, si no lo trae)
```

Para ocurrencias expandidas de un `RRULE`, se sufija la fecha de la ocurrencia (equivalente al `RECURRENCE-ID` de iCal).

Es una URI global, estable entre ejecuciones y sin registro central — coherente con el principio de identidad descentralizada de la spec.

> **Dedupe entre fuentes distintas** (el mismo evento en dos ICS) **queda fuera del MVP**. Requiere *matching* difuso (título+fecha+lugar) y es un problema en sí mismo. El MVP deduplica solo por `id` idéntico. Documentarlo como limitación conocida.

## Alta de fuentes y eventos: Issue Form → PR

Dos plantillas (GitHub Issue Forms, `.github/ISSUE_TEMPLATE/*.yml`). Un workflow parsea el issue y **abre un PR**; una persona revisa y mergea. El bot nunca mergea solo.

```
Issue Form ──▶ workflow (on: issues.opened, label)
                  │
                  ├─ parsea el cuerpo del issue (formato estructurado)
                  ├─ valida (JSON Schema + puerta de licencia)
                  │     └─ inválido → comenta en el issue qué falta, no abre PR
                  └─ abre PR con el fichero nuevo, enlazando el issue
                          │
                          └─ CI del PR: valida + hace un dry-run de la ingesta
                                        y comenta cuántos eventos traería
```

| Plantilla | Produce | Para quién |
| --- | --- | --- |
| **Añadir fuente** (`.ics`) | `sources/<slug>.yml` | Comunidades con calendario publicado. Escala: una fuente = eventos para siempre. |
| **Añadir evento suelto** | `events/<slug>.json` | Comunidades sin `.ics`. Trabajo manual, pero permite arrancar con contenido el día 1. |

Ambas plantillas incluyen un **checkbox de licencia obligatorio** ("declaro que estos datos pueden publicarse como open data bajo CC-BY / soy el organizador y doy permiso"). Ahí es donde el proyecto captura el permiso de forma verificable y trazable.

El *dry-run* en el PR es lo que hace el sistema usable: quien propone una fuente **ve en su PR** cuántos eventos entrarían y con qué pinta, antes de mergear.

## Salidas publicadas

Feed global en el MVP (los feeds pre-filtrados por `scope` vienen después):

| Fichero | Formato | Para qué |
| --- | --- | --- |
| `data/feed.json` | **OTE Feed** ([spec/feed.md](../spec/feed.md)) | **Canónico**. Todo lo demás se deriva de aquí. |
| `data/feed.ics` | iCalendar | Suscripción en Google/Apple/Outlook Calendar. La *killer feature*. |
| `data/feed.xml` | RSS 2.0 | Lectores de feeds. |
| `data/feed.jsonfeed.json` | JSON Feed 1.1 | Lectores modernos. |
| `data/archive/YYYY.json` | OTE Feed | Eventos ya pasados. Dataset histórico. |
| `data/report.json` | — | Salud de la ingesta: por fuente, eventos ok / *warnings* / errores. |

Servidos por GitHub Pages en URLs estables. El `.ics` **debe** tener URL estable para siempre: la gente lo suscribe en su calendario y no vuelve a tocarlo.

### Retención

- `feed.*` → **solo eventos futuros** (`startDate >= hoy`).
- Al pasar la fecha, el evento migra a `archive/YYYY.json`.
- Si un evento **desaparece de su fuente**, desaparece del feed (el feed es un espejo del estado actual). El historial de git preserva que existió.
- Si la fuente lo marca `CANCELLED`, se mantiene con `status: cancelled` → los suscriptores del `.ics` ven la cancelación en su calendario.

## Publicación y ejecución

```yaml
# .github/workflows/aggregate.yml
on:
  schedule: [{ cron: "0 5 * * *" }]   # diario, 05:00 UTC
  workflow_dispatch:                   # ejecución manual
  push: { paths: ["sources/**"] }      # una fuente nueva se ingiere al instante
```

El bot commitea `data/**` a `main` → cada ejecución deja un **diff revisable**: qué evento apareció, cuál cambió, cuál se fue. Auditoría e historial gratis. GitHub Pages sirve `data/`.

**Resiliencia** (una fuente caída no puede tumbar el feed):
- Fallo de red en una fuente → se **conserva el último dato bueno** de esa fuente, se marca en `report.json` y el commit sigue adelante.
- N fallos consecutivos → issue automático avisando al mantenedor de esa fuente.
- La ingesta es **fail-soft por fuente**, nunca *all-or-nothing*.

## Stack

TypeScript + Node. `node-ical`/`ical.js` para parsear, `ajv` para validar contra el JSON Schema de OTE, `vitest` con fixtures `.ics` reales grabados (tests sin red, deterministas: `fetch` y `now` se inyectan).

---

## Lo que esto le exige a la spec

**Aquí está el valor real de construir el agregador ahora**: obliga a decidir cosas que la spec tiene abiertas. El [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) declara como **no-objetivos** de la v0.1 los *identificadores únicos*, la *deduplicación* y los *importadores* — y un agregador es exactamente eso. La tensión hay que resolverla, no esquivarla:

| Campo | Por qué la ingesta lo necesita | Estado en la spec |
| --- | --- | --- |
| `id` | Sin él, **cada ejecución diaria duplica el feed entero**. No es un lujo: es la condición para que exista un agregador. | Ausente en #5, presente en el borrador `data-model.md`. |
| `source` | Procedencia verificable. Sin él no se puede atribuir, ni corregir río arriba, ni auditar de dónde salió un dato. | En el borrador. #5 lo aplaza. |
| `license` | **Sin licencia declarada, el feed no es open data**: es data de origen desconocido. Es el requisito legal duro del proyecto. | En el borrador. #5 lo aplaza. |

Propuesta: **`id`, `source` y `license` entran al núcleo de la v0.1**, justificados por un consumidor real y no por un debate teórico. Si la spec mínima no soporta su primera implementación, la spec mínima está incompleta.

Además, el agregador **presiona** (y por tanto ayuda a cerrar) estas preguntas abiertas:

- **`attendanceMode`**: iCal no lo modela → toda ingesta desde `.ics` se queda sin el dato. Por eso debe ser **opcional y sin valor por defecto**: ausente = desconocido. Si tuviera `in-person` por defecto, un `.ics` convertiría en presenciales todos los eventos online, en silencio.
- **Formato de serialización**: el agregador tiene que elegir un canónico ya. La propuesta de facto es **JSON canónico**, con YAML como sintaxis de autoría (los `sources/*.yml` y los eventos manuales) y el resto (ICS/RSS/JSON Feed) como derivados.
- **`events` completos vs. reducidos en el feed** ([feed.md](../spec/feed.md)): el agregador necesita decidirlo. Propuesta: **completos** (un `.ics` suscribible no puede depender de resolver enlaces).

## Fases

| Fase | Alcance | Resultado |
| --- | --- | --- |
| **0** | JSON Schema de OTE v0.1 publicado en el repo de la spec. | El agregador tiene contra qué validar. **Bloquea todo lo demás.** |
| **1 (MVP)** | Conector `ics` + pipeline + `feed.json`/`.ics` + Action diaria + 3-5 fuentes reales a mano. | **Un `.ics` público y suscribible.** Esto ya es el producto. |
| **2** | Issue Forms (fuente + evento) → PR automático + puerta de licencia en CI + `report.json`. | El proyecto crece sin que tú toques ficheros. |
| **3** | RSS/JSON Feed, archivo histórico, feeds pre-filtrados por `scope`. | Difusión. |
| **4** | Conectores nuevos (JSON-LD, Meetup, otros feeds OTE), dedupe entre fuentes. | Escala. |

La fase 1 es deliberadamente pequeña: **un `.ics` que la gente pueda suscribir en su calendario ya es un producto útil**, aunque solo tenga 3 fuentes. Todo lo demás es amplificación de eso.
