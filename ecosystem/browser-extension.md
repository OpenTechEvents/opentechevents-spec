# Extensión de navegador — captura de eventos a OTE (propuesta)

> ⚠️ **Propuesta, no compromiso.** Diseño para discutir. Nada está implementado todavía.

Extensión que, estando en la página de un evento (Meetup, Eventbrite, Luma, una web propia…), **lee el `schema.org/Event` en JSON-LD que la página ya expone**, lo mapea a OTE Spec y ofrece dos salidas:

1. **Darlo de alta en el directorio** — rellena el [Issue Form del agregador](aggregator.md#alta-de-fuentes-y-eventos-issue-form--pr), que ya existe.
2. **Descargarte el `events.json`** para publicarlo en tu propia web.

Es la cara visible del *«Extractor de `schema.org`/JSON-LD»* de la [lista de ideas](README.md): la misma capacidad, pero en el sitio donde la gente ya está mirando su evento, en lugar de en una CLI.

## Por qué esta herramienta y no un scraper

La tentación es obvia: si Meetup publica JSON-LD, rasquémoslo entero. **No.** El [principio rector del agregador](aggregator.md#principio-rector-todo-dato-es-open-data) es que ningún dato entra "porque está en internet", y los Términos de Servicio de estas plataformas **restringen la reutilización aunque el JSON-LD sea público**.

La extensión resuelve eso por la vía buena: **no captura datos, acompaña a una persona que decide publicar los suyos**. Es un asistente de alta, no una fuente de ingesta. Esa diferencia es toda la herramienta.

## Las dos reglas que la definen

### 1. Solo publica quien puede publicar

Antes de nada, la extensión pregunta y **exige una respuesta explícita**:

- **«Soy organizador/a de este evento»** → sigue el flujo completo.
- **«Tengo permiso del organizador»** → sigue, pero el alta pide que se indique **quién** lo concedió y **dónde consta** (el bloque `permission` que ya define el agregador).
- **«Ninguna de las dos»** → **la extensión no da de alta nada.** Ofrece, como mucho, un texto listo para copiar con el que avisar al organizador de que puede publicar sus eventos en abierto. Nada de "propón el evento igualmente": eso llena el directorio de eventos cuyos titulares no saben que están ahí.

Esta declaración **viaja hasta el issue** y queda registrada, igual que el checkbox de licencia obligatorio del Issue Form. Sin trazabilidad no hay permiso: hay una casilla marcada por alguien anónimo.

### 2. La extensión no adivina: propone y la persona confirma

**Proceso de dos pasos, siempre.** La extensión nunca envía nada directamente:

```
[1] Captura            [2] Revisión                     [3] Alta
página del evento ──▶  borrador OTE editable       ──▶  Issue Form prerrelleno
  JSON-LD              (campos dudosos marcados,          │
  schema.org/Event      obligatorios que faltan,          └─▶ workflow → PR → revisión humana
                        permiso declarado)
                              │
                              └─▶ descargar events.json (salida alternativa)
```

El paso 2 **no se puede saltar**. El borrador se presenta con los campos rellenos, los que faltan marcados como obligatorios, y **los ambiguos señalados en vez de resueltos a la brava**. La persona revisa, completa y solo entonces se genera el issue.

El motivo no es cortesía, es calidad del dato: el JSON-LD de estas plataformas es **incompleto y a veces engañoso** para lo que OTE necesita.

## Qué se puede sacar del JSON-LD, y qué no

Mapeo de `schema.org/Event` → OTE (mismo ejercicio que el [mapeo iCal](aggregator.md) del agregador, y por eso mismo otra prueba de fuego del modelo):

| `schema.org/Event` | OTE | Notas |
| --- | --- | --- |
| `name` | `name` | Directo. |
| `startDate` / `endDate` | `startDate` / `endDate` | ISO 8601. Suelen traer *offset* (`+02:00`), **no zona IANA**. |
| — | `timezone` | ⚠️ **No deducible de un offset.** Se infiere del lugar y **se pide confirmación**. |
| `description` | `description` | A menudo HTML → convertir a Markdown. |
| `url` | `url`, y semilla del `id` | La URL canónica del evento en la plataforma. |
| `eventAttendanceMode` | `attendanceMode` | ⚠️ Ver abajo. |
| `location` (`Place`) | `location.venue` | `name`, `address`, `city`, `country`. |
| `location` (`VirtualLocation`) | `location.online` | La URL real suele estar **tras el registro**, no en el JSON-LD. |
| `keywords` | `tags` | Cuando existen. Muchas plataformas no las exponen. |
| `offers` | `offers` | `price`, `currency`, `isFree`, `registrationUrl`. |
| `organizer` / `Organization` | `community` | ⚠️ La plataforma da un nombre, no una **URI global**. Hay que preguntarla. |
| `image` | `image` | Directo. |
| — | `source` | La plataforma de origen, con su `url` y `retrievedAt`. **Siempre**. |
| — | `license` | ⚠️ **No la da nadie.** La declara quien publica, en el paso 2. |

**Los campos que hay que preguntar sí o sí** son justo los que la spec considera núcleo o críticos para la reutilización: `timezone`, `community.uri`, `license` — y `id`, que se deriva de la URL canónica pero que el organizador debería poder apuntar **a su propia web** si la tiene (es la diferencia entre depender de Meetup para siempre o no).

### El caso `attendanceMode`

Mismo problema que el `X-GOOGLE-CONFERENCE` del agregador, distinto disfraz: muchas plataformas marcan `MixedEventAttendanceMode` por defecto en cuanto adjuntan un enlace de videollamada, o dejan el campo directamente ausente. **Nadie decidió que ese evento fuera híbrido: lo decidió una casilla.**

La extensión **no lo resuelve por su cuenta**: lo marca y pregunta. Y esto vuelve a exigirle lo mismo a la spec — que `attendanceMode` **pueda quedar sin declarar** («no lo sé») en vez de tener `in-person` por defecto. Ver el [debate del núcleo de la v0.1](https://github.com/OpenTechEvents/opentechevents-spec/issues/5).

## La salida que hace que esto no sea un scraper con buenos modales

Si la extensión solo empuja eventos de Meetup al directorio, refuerza la dependencia de la plataforma — justo lo contrario de lo que predica el estándar.

Por eso **el botón de "descargar `events.json`" es tan importante como el de dar de alta**: entras por comodidad (ya tienes el evento en Eventbrite) y sales con un feed propio que puedes publicar en tu web. Es una **rampa de salida**, no una correa. Misma lógica que la vía `.ics` de la web: te lo damos hecho, tú decides si te quedas.

Extensión natural (post-MVP): acumular varios eventos capturados y exportarlos como **un feed OTE completo**, no como documentos sueltos.

## Alcance del MVP

- **Un solo formato de entrada**: `schema.org/Event` en JSON-LD embebido en la página. Nada de parsear el HTML de cada plataforma (frágil, y hoy por hoy innecesario).
- **Sin backend.** Todo ocurre en el navegador. El alta se hace **abriendo el Issue Form de GitHub con los campos prerrellenos** vía URL — sin tokens, sin servidor, sin cuentas.
- **Solo bajo clic.** La extensión no lee páginas de fondo ni observa la navegación: actúa cuando la persona pulsa el botón, sobre la pestaña activa. Sin telemetría.
- **Un evento cada vez.** La captura masiva queda fuera: es exactamente la funcionalidad que convertiría esto en el scraper que no queremos.
- Manifest V3, y publicarla en las tiendas de Chrome y Firefox.

## Lo que esto le exige a la spec

Igual que el agregador, esta herramienta es un banco de pruebas y saca a la luz decisiones abiertas:

- **`attendanceMode` opcional y sin valor por defecto** (ausente = *desconocido*).
- **`license` y `source` en el núcleo**: sin ellos, un evento capturado de una plataforma no es republicable ni trazable.
- **`id` estable y elegible**: la URL de la plataforma sirve como semilla, pero el organizador debe poder anclar su evento a su propio dominio.
- **`timezone` IANA obligatoria**, y por tanto la extensión tiene que preguntarla: un offset no es una zona horaria.

## Preguntas abiertas

- **¿Y las plataformas cuyos TdS prohíben esto incluso al propio organizador?** Que el evento sea tuyo no siempre implica que sus TdS te dejen reutilizar la ficha. Hace falta el análisis por plataforma que sigue [pendiente en `research/`](../research/README.md) antes de recomendar la extensión sobre un sitio concreto.
- **¿Alta directa por API de GitHub en vez de Issue Form prerrelleno?** Más cómodo, pero exige token y convierte la extensión en algo que escribe en el repo. El Issue Form mantiene a una persona revisando y no requiere permisos.
- **¿Qué hacer cuando la página no tiene JSON-LD?** ¿Formulario manual asistido, o simplemente no ofrecer nada?
- **¿Debería avisar al organizador si otra persona ya publicó ese evento?** Roza el problema de deduplicación, que el agregador deja fuera de su MVP.

---

¿Te interesa construirla, o ves algo mal planteado? Abre un *issue*. Ver [Cómo contribuir](../CONTRIBUTING.md).
