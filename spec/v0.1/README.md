# OTE Spec v0.1.0

> 🚧 **Borrador. Inestable.** `0.x` significa que **puede romper sin previo aviso**. Se publica para que existan implementaciones reales (empezando por el importador de `.ics`) y para que rompan lo que esté mal. Discusión: [#5 (evento)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

Especificación mínima para describir eventos de comunidades técnicas y publicarlos en un feed reutilizable.

| Artefacto | Qué es |
| --- | --- |
| [`event.schema.json`](event.schema.json) | **Normativo, ejecutable.** JSON Schema (draft 2020-12) de un evento. |
| [`feed.schema.json`](feed.schema.json) | **Normativo, ejecutable.** JSON Schema de una colección de eventos. |
| Este documento | **Normativo, no ejecutable.** Las reglas que un validador no puede comprobar. |
| [`examples/`](examples/) | Ejemplos, **validados en CI**. Si no pasan el validador, el build falla. |

Los `$id` son las URLs bajo las que se publican los schemas:

```text
https://opentechevents.org/schema/v0.1/event.schema.json
https://opentechevents.org/schema/v0.1/feed.schema.json
```

**Una vez publicada, una versión no se toca.** Los cambios van a `spec/v0.2/`. Es lo que permite que un documento diga `specVersion: "0.1.0"` y un consumidor sepa dentro de tres años contra qué validarlo.

## Consumir los schemas

**Como paquete** (recomendado para implementaciones: te ata a una versión, no a lo que hoy haya en una URL):

```bash
npm install @opentechevents/schema
```

```js
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { eventSchema, feedSchema } from "@opentechevents/schema";

const ajv = new Ajv2020({ strict: true, strictRequired: false });
addFormats(ajv);
ajv.addSchema(eventSchema);          // el feed referencia al evento por $id: regístralo antes
const validateFeed = ajv.compile(feedSchema);
```

**Por URL** (para editores, CI de terceros o quien no use npm):

```text
https://opentechevents.org/schema/v0.1/event.schema.json
https://opentechevents.org/schema/v0.1/feed.schema.json
```

## Validar este repo

```bash
npm install
npm run validate
```

## El evento

Obligatorio: `id`, `name`, `startDate`, `timezone` — y, en un documento suelto, `specVersion` y `license`.

Todo lo demás es opcional. **Deliberadamente**: la mayoría de los `.ics` publicados no traen ni URL ni descripción, y una spec que los exija obliga al importador a descartar el evento o a inventarse el dato. Ninguna de las dos cosas es aceptable. `url` y `description` se recomiendan con fuerza; no se exigen.

Ejemplo mínimo real ([`examples/event-minimal.json`](examples/event-minimal.json)):

```json
{
  "specVersion": "0.1.0",
  "id": "https://pyalmeria.example/eventos/2026-06-async",
  "name": "PyAlmería — Introducción a async/await",
  "startDate": "2026-06-11T18:30:00",
  "timezone": "Europe/Madrid",
  "license": "CC-BY-4.0"
}
```

### `id` y `url` empiezan siendo iguales, pero no son lo mismo

`url` es **dónde se describe el evento hoy**. `id` es **qué evento es esto, para siempre**.

Si una comunidad se muda de plataforma a dominio propio, `url` cambia y **`id` no puede cambiar**: es lo que permite a un consumidor *actualizar* el evento que ya tenía en vez de crear un duplicado. Un `id` se acuña una vez, bajo un dominio que controla quien publica (el DNS ya garantiza unicidad: no hace falta registro central), y no se reescribe jamás.

Nadie debería teclear un `id` a mano: las herramientas lo derivan de la URL canónica del evento, o lo acuñan como `<dominio>/events/<comunidad>/<fecha>-<slug>` cuando el evento no tiene página propia.

### Fechas: reloj de pared, no instantes

`startDate` y `endDate` llevan **la hora que aparece en el cartel**, en la zona horaria del evento. **Nunca llevan offset UTC** (`+02:00` ni `Z`): eso lo aporta `timezone`. El schema rechaza un offset dentro de `startDate`.

Dos formas, y **ambas fechas deben usar la misma**:

- **Todo el día**: `"2026-10-15"`.
- **Con hora**: `"2026-10-15T09:00:00"`.

Mezclar (`startDate` fecha, `endDate` fecha-hora) es inválido. Si `endDate` falta, el evento termina el día que empieza.

`timezone` (IANA, `Europe/Madrid`) es **siempre obligatoria**. Con hora, es lo que convierte el reloj de pared en un instante inequívoco. En eventos de todo el día, **contextualiza** la fecha: dice a qué región pertenece ese día — **no la desplaza**. Un consumidor **no debe** convertir un evento de todo el día a otra zona horaria.

La única fecha con offset en toda la spec es `source.retrievedAt` (y `updatedAt` en el feed): son metadatos, instantes reales, no cosas que le pasan a la gente en un sitio.

### `location` y `attendanceMode` no son redundantes

Responden a preguntas distintas:

- **`location`** son **hechos observables**: ¿hay sitio físico?, ¿hay URL para conectarse? Puede estar incompleta.
- **`attendanceMode`** es **la intención de quien organiza**: qué tipo de evento es esto. No depende de que la URL de conexión sea pública todavía.

Casi siempre se podrían derivar el uno del otro, y coinciden. El campo existe para cuando **la derivación falla**. **Si se contradicen, manda `attendanceMode`.**

**`attendanceMode` no tiene valor por defecto.** Ausente significa **desconocido**, no `in-person`. Un valor por defecto dejaría que cualquier productor que simplemente *no tiene* el dato emitiera uno falso sin enterarse: un formulario en blanco, un CMS exportando de una plantilla, un importador leyendo un formato que no sabe expresarlo — **iCalendar, el formato de eventos más publicado del mundo, no modela la modalidad en absoluto**. Callarse y decir `in-person` son afirmaciones distintas, y solo una es honesta.

Si `location` está presente, debe traer al menos `venue` o `onlineUrl`. Un `location: {}` es inválido: no dice nada, y decir nada ya se hace omitiendo el campo.

### `status`: un evento cancelado sigue publicado

`scheduled` (por defecto), `cancelled`, `postponed`, `rescheduled`.

Un evento **cancelado o pospuesto debe seguir en el feed**. Borrarlo en silencio deja a quien se suscribió con un evento muerto en su calendario y sin forma de enterarse. El `status` **es** la forma de enterarse.

### `license` y `source`: qué se puede reutilizar, y de dónde salió

`license` es la licencia de **estos datos**, no del evento. SPDX (`CC0-1.0`, `CC-BY-4.0`) o una URL. Va en SPDX y no en prosa (`CC BY 4.0`) porque un importador tiene que compararla contra una allowlist, y para eso necesita un identificador, no una frase.

`source` es **obligatoria cuando el evento se importó o agregó** de otro sitio (un `.ics`, Meetup, otro directorio). Se omite cuando quien organiza describe su propio evento: **es** la fuente.

`source.license` (lo que la fuente permite) y `license` (lo que este documento permite) son campos distintos y **no tienen por qué coincidir**. Pero los términos de la fuente **restringen lo que puede republicarse**: declarar una `license` no concede derechos que la fuente nunca dio.

## El feed

Obligatorio: `specVersion`, `title`, `license`, `updatedAt`, `events`.

**La `license` del feed es el valor por defecto de sus eventos**: un evento que no declare la suya hereda la del feed. Repetir `"license": "CC-BY-4.0"` en 200 eventos es ruido, no rigor. Un evento *dentro de un feed* tampoco repite `specVersion`: hereda la del feed. Un evento **suelto** (fuera de un feed) sí debe declarar ambas — no tiene de quién heredarlas.

Por eso el schema del evento tiene dos capas: `$defs/event` (lo común) y el documento de nivel superior, que añade `specVersion` y `license` como obligatorios. El feed referencia `$defs/event`.

El feed es un **formato de intercambio, no una API**: sin paginación, sin filtrado, sin autenticación, sin federación.

## Extensiones

Los schemas **no prohíben campos adicionales**. Si tu comunidad necesita `tags`, `image` o `cfp` hoy, ponlos: tu documento sigue siendo válido. Es la vía por la que la spec debe crecer — **campos que alguien ya usa de verdad**, no campos que imaginamos que hará falta usar.

Cuando un campo se estandarice, se le dará un significado normativo. Hasta entonces, un consumidor puede ignorarlos sin miedo.

## Lo que la v0.1 no resuelve

Deduplicación entre fuentes, sincronización, publicación automática en plataformas, modelado de ponentes/agenda/patrocinadores, entradas y registro, CFP.

El objetivo es describir **el evento**, no el registro en una base de datos.

## Preguntas abiertas

### Descubrimiento: cómo se encuentra un feed desde una web

Ver [#6](https://github.com/OpenTechEvents/opentechevents-spec/issues/6). Los tres mecanismos **no son excluyentes**, y probablemente hagan falta los tres:

| Mecanismo | Para quién | Estado |
| --- | --- | --- |
| **`<link rel="alternate">`** en el `<head>`, símil RSS | **Todo el mundo.** Es el único que funciona para quien publica en una ruta cuyo dominio no controla: GitHub Pages de proyecto (`usuario.github.io/repo`), una página dentro de un dominio corporativo, un CMS ajeno. | Propuesto como **mecanismo principal**. Falta decidir el MIME: `application/ote+json` propio vs. reutilizar `application/feed+json`. |
| **`/.well-known/ote-feed`** | Quien **sí controla el apex** de su dominio. Permite descubrir sin parsear HTML — barato para un crawler. | Propuesto como **complemento**. Ver abajo. |
| **JSON-LD `schema.org/Event`** embebido en la página | Reaprovecha lo que ya detectan Google y agregadores como dev.events. | Es una **fuente para importadores** (ver la [extensión de navegador](../../ecosystem/browser-extension.md)), no un feed: describe *un* evento, no una colección. |

> 📌 **Dato relevante sobre `/.well-known/`**: el [registro de IANA](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) **no tiene ninguna entrada para feeds** — ni RSS, ni Atom, ni JSON Feed. Su procedimiento de registro es *«Specification Required»*, y **OTE tiene una especificación**, así que `ote-feed` podría **registrarse formalmente** (aunque sea con estado provisional) en vez de okupar una ruta. Sería, de hecho, el primer well-known de feeds del registro.

### Serialización: ¿solo un fichero, o también metadatos embebidos?

Hoy la spec asume **un fichero JSON en una URL**. La alternativa —o el complemento— es permitir el feed **embebido en la propia página**, al estilo del JSON-LD de schema.org:

```html
<script type="application/ote+json">{ "specVersion": "0.1.0", "kind": "feed", … }</script>
```

- **A favor**: quien usa un CMS o un generador de sitios puede pegar un bloque en su plantilla, pero a menudo **no puede publicar un fichero suelto** ni tocar `/.well-known/`. Baja la barrera de entrada justo para quien menos herramientas tiene.
- **En contra**: obliga a los consumidores a parsear HTML, acopla el feed a una página concreta, y complica servir el mismo dato como `.ics` o RSS.

Pendiente de decidir. Si se acepta, sería una **serialización equivalente** del mismo documento, no un formato distinto — y habría que cambiar la promesa de la web («es un archivo que publicas»).

### Otras

- **`id` de un evento importado de un `.ics` sin URL.** Hoy los ejemplos usan `<url-del-ics>#<UID>`. Funciona y es estable, pero ata el `id` al calendario de origen: si la comunidad se muda, el `id` que acuñó el importador ya no está bajo un dominio que ella controle.
- **Serialización.** El schema es JSON. YAML es cómodo para escribir a mano (los issues usan YAML) y se mapea 1:1. ¿Se declaran ambos normativos?
- **`license` obligatoria en el evento suelto**: ¿es una barrera de entrada demasiado alta para quien solo quiere publicar su meetup?
