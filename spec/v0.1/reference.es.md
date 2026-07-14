# Referencia de campos — OTE Spec 0.1.0

> 🤖 Generado a partir de los schemas — no lo edites a mano. Ejecuta `npm run build-reference`.
>
> Las reglas que un validador no puede comprobar (por qué el `id` no cambia nunca, por qué un evento cancelado sigue publicado) están en [README.md](README.md).

## `event` — Evento

Un evento de una comunidad técnica.

| Campo | Tipo | Oblig. | Descripción | Ejemplos |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.1.0" | **sí** | Versión de OTE Spec a la que se adhiere el documento. | `"0.1.0"` |
| `id` | string (uri) | **sí** | Identificador estable y único a nivel global. Una URI bajo un dominio que controle quien publica. Se acuña una vez y no se reescribe jamás: es lo que permite a un consumidor actualizar el evento en vez de duplicarlo. | `"https://pyalmeria.example/eventos/2026-06-async"`<br>`"https://calendar.example/ics/rust-madrid#a1b2c3d4-uid"` |
| `url` | string (uri) | — | URL canónica donde se describe el evento hoy. Puede cambiar con el tiempo; el `id` no. | `"https://pyalmeria.example/eventos/2026-06-async"` |
| `name` | string | **sí** | Nombre del evento. | `"PyAlmería — Introducción a async/await"` |
| `description` | string | — | Descripción breve. Texto plano o Markdown. | `"Charla introductoria a la programación asíncrona en Python, con ejemplos en vivo."` |
| `timezone` | string | **sí** | Zona horaria IANA (p. ej. `Europe/Madrid`). Convierte un `startDate` de reloj de pared en un instante inequívoco. En eventos de todo el día contextualiza la fecha: no la desplaza. | `"Europe/Madrid"`<br>`"America/Bogota"`<br>`"UTC"` |
| `startDate` | string | **sí** | Inicio en hora de reloj de pared: una fecha (`2026-10-15`) para eventos de todo el día, o una fecha-hora local (`2026-10-15T09:00:00`). Nunca lleva offset UTC: eso lo aporta `timezone`. | `"2026-06-11T18:30:00"`<br>`"2026-10-15"` |
| `endDate` | string | — | Fin en hora de reloj de pared, en la MISMA forma que `startDate` (ambas fechas, o ambas fecha-hora). Si falta, se asume que el evento termina el día que empieza. | `"2026-06-11T20:00:00"`<br>`"2026-10-16"` |
| `license` | string | **sí** | Licencia de ESTOS DATOS, no del evento. Identificador SPDX (`CC0-1.0`, `CC-BY-4.0`…) o una URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `location` | object | — | Qué se SABE de dónde ocurre el evento. Pregunta distinta de `attendanceMode`, que declara la intención de quien organiza. | `{"venue":"El Cable, Almería"}`<br>`{"onlineUrl":"https://meet.example/pyalmeria"}`<br>`{"venue":"Campus Madrid, Calle de Moreno Nieto 2, Madrid","onlineUrl":"https://meet.example/rust-madrid"}` |
| `location.venue` | string | — | Lugar físico, legible por personas. Su presencia significa que el evento tiene sede física. | `"El Cable, Almería"` |
| `location.onlineUrl` | string (uri) | — | URL para asistir en remoto. Su presencia significa que el evento tiene acceso online. | `"https://meet.example/pyalmeria"` |
| `attendanceMode` | enum: in-person | online | hybrid | — | Qué dice quien organiza que es este evento. SIN VALOR POR DEFECTO: ausente significa desconocido, nunca presencial. | `"in-person"`<br>`"online"`<br>`"hybrid"` |
| `languages` | string[] | — | Etiquetas BCP 47, p. ej. `["es","en"]`. Sin valor por defecto: ausente significa desconocido. | `["es"]`<br>`["es","en"]` |
| `status` | enum: scheduled | cancelled | postponed | rescheduled | — | Un evento cancelado o pospuesto DEBE seguir publicado: borrarlo deja un evento muerto en el calendario de quien se suscribió. | `"scheduled"`<br>`"cancelled"` |
| `source` | object | — | Procedencia. Obligatoria cuando el evento se importó o agregó de otro sitio; se omite cuando quien organiza describe su propio evento: es la fuente. | `{"name":"Rust Madrid","url":"https://calendar.example/ics/rust-madrid","license":"CC-BY-4.0","retrievedAt":"2026-06-01T05:00:00Z"}` |
| `source.name` | string | **sí** | Nombre de la fuente (p. ej. «Rust Madrid», «Meetup»). | `"Rust Madrid"`<br>`"Meetup"` |
| `source.url` | string (uri) | — | Enlace a la ficha original, para poder verificar y corregir el dato en origen. | `"https://calendar.example/ics/rust-madrid"` |
| `source.license` | string | — | Licencia bajo la que la FUENTE publica el dato. Restringe lo que puede republicarse: declarar una licencia no concede derechos que la fuente nunca dio. | `"CC-BY-4.0"` |
| `source.retrievedAt` | string | — | Cuándo se obtuvo el dato. | `"2026-06-01T05:00:00Z"` |

## `feed` — Feed

Una colección de eventos OTE publicada en una URL estable. Un formato de intercambio, no una API.

| Campo | Tipo | Oblig. | Descripción | Ejemplos |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.1.0" | **sí** | Versión de OTE Spec a la que se adhiere el feed. Aplica a todos sus eventos. | `"0.1.0"` |
| `title` | string | **sí** | Nombre del feed, legible por personas. | `"Eventos de PyAlmería"` |
| `description` | string | — | Descripción breve del feed. | `"Meetups mensuales de Python en Almería."` |
| `url` | string (uri) | — | URL canónica de la comunidad, directorio u organización que publica el feed. | `"https://pyalmeria.example"` |
| `license` | string | **sí** | Licencia del contenido del feed. Actúa como VALOR POR DEFECTO de todo evento que no declare la suya. Identificador SPDX o URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `licenseUrl` | string (uri) | — | URL del texto completo de la licencia. | `"https://creativecommons.org/licenses/by/4.0/"` |
| `updatedAt` | string | **sí** | Cuándo se generó este feed. | `"2026-07-06T10:00:00Z"` |
| `events` | object[] | **sí** | Los eventos del feed. Cada uno hereda `specVersion` y `license` del feed salvo que declare los suyos. | — |
