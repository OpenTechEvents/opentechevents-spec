# Kit del organizador — repositorio plantilla (propuesta)

> ⚠️ **Propuesta, no compromiso.** Diseño para discutir. Nada está implementado todavía.

Un **repositorio que el organizador forkea** y que le da, funcionando solo con GitHub y GitHub Pages: su feed OTE publicado, una interfaz para crear/editar/borrar eventos sin escribir JSON a mano, exportación automática a ICS/RSS, e utilidades para difundir cada evento en otras plataformas.

**Para quién**: organizadores técnicos (comunidades GitHub-nativas). El kit es **opcional** — la historia mínima de adopción sigue siendo *"un JSON estático en cualquier URL"*. Esto no es *la* forma de adoptar OTE; es una forma de bajar la barrera y añadir ventajas (UI, exports, difusión) para quien ya vive en GitHub.

**Garantía anti *lock-in***: los datos son del organizador, viven en su repo en formato abierto, y el kit exporta a ICS/RSS en cada build. Si mañana quiere volver a Google Calendar o a cualquier otra herramienta, se lleva sus datos sin fricción.

---

## Dónde vive

Tres repositorios, tres responsabilidades:

| Repo | Responsabilidad | Quién lo toca |
| --- | --- | --- |
| `opentechevents-spec` | El estándar + la página de registro de comunidades adoptantes. | Mantenedores de la spec. |
| `ote-template` | **La plantilla que forkea el organizador**: datos + configuración + workflows finos. | El organizador (su fork). |
| `ote-tools` | Monorepo central: dashboard/editor web, conectores (npm), actions reutilizables, herramienta de migración. | Mantenedores del ecosistema. |

## Decisión clave: fork delgado, código central

La tensión estructural del diseño: el organizador necesita **su copia** (con sus datos) *y* recibir **mejoras** (UI, validación, exportadores, schema nuevo). Esas dos cosas pelean:

- Si la plantilla contiene la UI y la lógica, el día que salga la v2 habrá N forks congelados en v1 que nadie migrará. Un ecosistema de copias rotas daña la marca ("probé OTE y estaba desactualizado").
- Si todo es central, el organizador no es dueño de nada.

Resolución: **en el fork solo vive lo que es del organizador** — sus datos y su configuración. Todo lo que evoluciona vive en `ote-tools` y el fork lo consume versionado:

```
ote-template (fork del organizador)
├── events/*.json          ← SUS datos
├── ote.config.json        ← SU configuración
├── docs/index.html        ← dashboard estático mínimo (enlaces, casi nunca cambia)
└── .github/workflows/     ← workflows de ~5 líneas que llaman a
                              reusable workflows de ote-tools@v1:
                              validar · exportar ICS/RSS · build Pages · issue→PR
```

Las mejoras llegan solas (tag flotante `@v1`; *breaking changes* = `@v2`, opt-in). La migración de schema no es código duplicado en N forks: es **una herramienta aparte** en `ote-tools` (`ote migrate`), ejecutable como action o desde el dashboard.

Se elige **fork** (no *template repo* de GitHub): el fork conserva el vínculo con el origen y permite `git pull upstream` para lo poco que sí vive en la plantilla (el dashboard estático, los workflows finos). Con *template repo* ese canal no existe.

## El dashboard: contexto por URL

El Pages del fork sirve una página estática mínima que **enlaza a las herramientas centrales pasando el repo como contexto**:

```
https://tools.opentechevents.org/editor?repo=usuario/mi-comunidad
https://tools.opentechevents.org/import?repo=usuario/mi-comunidad
https://tools.opentechevents.org/publish?repo=usuario/mi-comunidad
```

Cada herramienta lee `?repo=`, hace `fetch` del feed y del `ote.config.json` vía `raw.githubusercontent.com` (CORS abierto) y renderiza. El fork sigue siendo datos + config + una página tonta; las herramientas evolucionan sin tocar ningún fork, y siempre saben qué repositorio están "editando".

## Flujo de escritura: formulario → issue → PR (uniforme)

GitHub Pages puro no puede guardar secretos: OAuth necesita un backend para el intercambio de token. En lugar de montar infraestructura, **el mismo pipeline sirve para el dueño y para la comunidad**:

```
Editor central (formulario) ── genera el JSON del evento
    │
    ├─ botón "Proponer cambio" ──▶ abre issue prefillado en el fork
    │       (JSON en bloque de código, vía URL params;
    │        si excede ~8K chars de URL → fallback "copia y pega")
    │              │
    │              ▼
    │       workflow del fork (on: issues.opened)
    │              ├─ parsea el JSON del cuerpo
    │              ├─ valida contra el JSON Schema
    │              │     └─ inválido → comenta qué falta, no abre PR
    │              └─ abre PR enlazando el issue
    │                     └─ el dueño revisa y mergea
    │
    └─ botón "Editar directo" ──▶ github.dev con el fichero (solo dueño, con push)
```

Por qué así y no de otra forma:

- **El dueño mergea su propio PR en segundos**; un tercero (un ponente, alguien de la comunidad que detecta un error) espera aprobación. Un solo código, revisión humana garantizada por diseño, cero auth, cero backend.
- **No se usan GitHub Issue Forms como formulario de eventos**: son demasiado rígidos (sin campos condicionales, sin arrays — varios ponentes, varias sesiones). El formulario real es la página del editor; el issue es solo el transporte.
- Coste asumido: la latencia (action + PR + rebuild de Pages) se mide en **minutos, no segundos**. Aceptable para el caso de uso; documentarlo para ajustar expectativas.

## Configuración: `ote.config.json`

Todo lo que hoy es "depende del organizador" vive en un único fichero en su fork, que las herramientas centrales leen:

```jsonc
{
  "feed": {
    "title": "Eventos de Mi Comunidad",
    "description": "…",
    "license": "CC-BY-4.0"
  },

  // Qué campos muestra el editor. Presets: "meetup" | "conference" | "all".
  // "all" = formulario completo con secciones colapsables ("Avanzado: CFP, patrocinios…").
  "profile": "meetup",
  // Opcional: perfil personalizado (gana sobre profile)
  "customProfile": { "fields": ["cfp", "sponsors"] },

  // Plataformas donde el organizador difunde (ver Difusión)
  "publish": {
    "meetup": { "groupUrl": "https://meetup.com/mi-grupo" },
    "eventoswiki": { "enabled": true }
  },

  // Vinculación con directorios de comunidades (ver Registro)
  "linking": { "communityId": "combuilders:mi-comunidad" }
}
```

Racional de los presets: un organizador de meetups no necesita ver campos de CFP; uno de conferencias sí. Una matriz de configuración campo a campo sería sobre-ingeniería para el 90% de los casos — presets primero, perfil custom como escotilla de escape.

## Importar desde fuentes existentes

Objetivo: que quien ya tiene sus eventos en Meetup, un `.ics` de Google Calendar, etc., no re-teclee todo.

| Fuente | Cómo | Limitación honesta |
| --- | --- | --- |
| **iCalendar (`.ics`)** | Subir/URL del fichero → seleccionar qué eventos importar (p. ej. solo futuros) → completar a mano lo que falte. | La conversión pierde los metadatos de descubrimiento que ICS no modela (ver [nota en el sitio](../docs/README.md)); el import lo señala campo a campo, no lo disimula. |
| **JSON-LD / schema.org** (Meetup, Eventbrite, Luma…) | Pegar la URL del evento → extraer el `schema.org/Event` que la página ya expone. | ⚠️ **CORS**: el navegador no puede hacer `fetch` de meetup.com desde la herramienta. Fallback: *"pega el HTML de la página"* (textarea) → se parsea el JSON-LD del texto. Feo pero funciona siempre, cero infraestructura. La vía buena a futuro es la [extensión de navegador](browser-extension.md), que sí lee el DOM. |
| **API de Meetup** | — | **Descartada**: hoy requiere plan Pro de pago + aprobación OAuth. No se puede contar con ella para el caso común. |

**Nunca se importa en silencio**: el organizador ve la lista, selecciona, revisa y completa. Mismo principio que el [agregador](aggregator.md): un conector no inventa datos.

### Los conectores son paquetes npm, funciones puras, sin UI

`@opentechevents/import-ics`, `@opentechevents/import-jsonld`, `@opentechevents/export-rss`… — entrada → documento(s) OTE (o el inverso). Toda la UI (selección, completado) vive en el dashboard de `ote-tools`, que los importa. Conectores con interfaz propia serían N UIs que mantener con estilos divergentes.

> Relación con el [agregador](aggregator.md): allí se decidió que sus conectores viven **dentro** de `opentechevents-data` (por seguridad de la Action diaria y cambios atómicos), con la puerta abierta a extraerlos como *"paquete publicado y fijado a una versión"* cuando madure. Ese paquete publicado es exactamente esto. La convergencia natural: los conectores compartidos acaban en npm y ambos proyectos los consumen fijados a versión — nunca un `git clone` de HEAD.

## Difusión: publicar el evento en otras plataformas

Dos niveles, deliberadamente separados por coste:

### 1. *Cheat sheet* copy-paste (barato, pronto)

Registrado el evento, la herramienta `publish` genera, por cada plataforma configurada en `ote.config.json`:

- **Enlace directo** a la interfaz de alta de la plataforma (p. ej., configurada la URL del grupo de Meetup, el enlace a "crear evento" de ese grupo).
- **Los datos ya formateados** como esa plataforma los pide, listos para copiar campo a campo.
- Para directorios GitHub que aceptan issues/PRs (confs.tech, developers.events, EventosWiki…): **issue prefillado** en el repo de destino.

Cero APIs, cero secretos, cero mantenimiento de integraciones. Es la versión manual-asistida de la auto-publicación, y cubre precisamente las plataformas **sin** API abierta gratuita (Meetup, LinkedIn…).

### 2. Auto-publicación vía API (caro, después, pluggable)

Solo para plataformas con API abierta que lo permita — p. ej. **eventos.wiki**, que se ha ofrecido a crear una (y habrá más). Diseño:

- Publicador = conector npm más (`@opentechevents/publish-eventoswiki`).
- Credenciales en **repo secrets** del fork; ejecución vía `workflow_dispatch` desde el dashboard o manualmente.
- Cada plataforma se activa en `ote.config.json`.

Lo que **no** se va a hacer: perseguir APIs de pago o con programas de *partner* restringidos (Meetup Pro, LinkedIn). Para esas, el nivel 1 es la respuesta.

## Registro: "mi comunidad usa OTE"

La documentación del kit guía al organizador, tras publicar su feed, a:

1. Añadir el **meta tag de descubrimiento** en la web de su comunidad/conferencia (si la tiene).
2. **Registrarse como adoptante** en `opentechevents-spec`, para difusión y para que directorios y usuarios encuentren el feed.

Para el paso 2, una página en el sitio de la spec ([docs/](../docs/)): formulario con nombre, web y URL del feed OTE → **issue prefillado** en `opentechevents-spec` vía URL params. Con **vinculación pluggable** a directorios de comunidades:

- El campo de nombre autocompleta contra fuentes registradas. La primera: el [directorio de Community Builders](https://github.com/ComBuildersES/communities-directory) (`fetch` de su `communities.json` vía raw.githubusercontent, CORS abierto).
- Si la comunidad existe en la fuente → el issue incluye su ID, y el registro queda **vinculado** a los datos del directorio.
- Si no existe → se envía igualmente, sin vínculo.

Pluggable y no acoplado a ComBuildersES: la spec tiene vocación internacional; el directorio hispano es la primera fuente de vinculación, no la definición de qué es una comunidad.

## Fases

| Fase | Alcance | Resultado |
| --- | --- | --- |
| **1 (MVP)** | Fork delgado (feed ejemplo + `ote.config.json` + workflows finos: validar, exportar ICS/RSS, Pages) + dashboard estático + docs de adopción + página de registro en la spec. | **Forkear → configurar 3 valores → feed OTE + ICS + RSS publicados.** Esto ya es el producto. |
| **2** | Editor central (presets + colapsables + perfil custom) con flujo issue→PR. Import ICS. | Crear/editar eventos sin escribir JSON. La comunidad puede proponer cambios. |
| **3** | *Cheat sheets* copy-paste + issues prefillados para directorios GitHub. Import JSON-LD (con fallback pega-HTML). | Difundir un evento deja de ser re-tecleo. |
| **4** | Publicadores API pluggables (eventos.wiki primero). Herramienta de migración de schema. Extensión de navegador para captura sin CORS. | Automatización. |

La fase 1 es deliberadamente pequeña: **un fork que en minutos publica un feed válido con exports ICS/RSS ya es un producto útil**, aunque los eventos se editen a mano. Todo lo demás es amplificación de eso.

## Riesgos asumidos y descartes

- **Latencia de escritura en minutos** (action + PR + rebuild Pages). Aceptado a cambio de cero backend.
- **GitHub como dependencia dura** del kit. Aceptado: el público objetivo ya vive ahí, y los *datos* no dependen de GitHub — son JSON portable.
- **Issue Forms como formulario de eventos**: descartado (rígidos). Solo transporte.
- **Proxy CORS para leer plataformas**: descartado (backend, mantenimiento, abuso).
- **API de Meetup**: descartada (de pago).
- **Auto-publicación en plataformas sin API abierta**: descartada; su respuesta es el *cheat sheet*.
