# CLAUDE.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.6/`](spec/v0.6/README.md), publicada e inmutable en npm (`@opentechevents/schema@0.6.0`).

Tres tracks conviven en el repo, y mezclarlos es el fallo que su separación existe para evitar. **Cuál es el tuyo lo dice lo que te piden, no este fichero**; lo que sigue es dónde vive cada uno.

| Track | Qué toca | Dónde está su estado |
| --- | --- | --- |
| **Spec** | `spec/vN.N/` (sólo la versión en desarrollo), `CHANGELOG.md`, `ERRATA.md` | `DECISIONS.md` de la versión vigente; [`ERRATA.md`](ERRATA.md) para lo ya publicado |
| **Sitio y herramientas** | `docs/`, `scripts/` — **no toca ninguna versión de `spec/`** | [`proposals/`](proposals/) |
| **Auditoría de integración** | `integration-audit/` | [`INTEGRATION-AUDIT.log`](INTEGRATION-AUDIT.log), formato `HALLAZGO` / `REVISION` |

Una auditoría de schema previa (33 rondas, `P001`–`P033`) ya revisó validación e inconsistencias internas; su histórico es [`docs/history/`](docs/history/README.md) (`CHANGES.log`), y no hay que repetirla.

## Cómo trabajar

1. **Verifica tú mismo, no aceptes de oficio.** Un informe —de un integrador externo, de otro agente, de un issue— no es un diagnóstico. Ejecuta el comando que cita contra el documento que cita, lee tú la prosa de la spec a la que apunta, y comprueba si el problema es real antes de darle la razón. En la última ronda, dos de tres informes traían premisas falsas y uno proponía un mecanismo que rompía la regla dura de sustitución de versión.
2. **Clasifica la fricción antes de actuar**, explícitamente, en una de tres:
   1. **Hueco real de la spec** — debería haber dicho algo y no lo dijo, o el mapeo hacia/desde otro formato es genuinamente ambiguo y dos personas razonables elegirían distinto.
   2. **Complejidad inherente**, no un fallo — mapear entre modelos distintos siempre pierde o exige inventar algo en alguna dirección; no es un hueco si la spec ya lo advierte, aunque sea en otro sitio.
   3. **Malentendido del lector** — la respuesta SÍ está en la spec y quien informa, sin el contexto de las decisiones previas, no la vio. Verifícalo leyendo la misma prosa.
3. **Un hueco real no se arregla en una versión publicada.** Va a la siguiente como candidato a `DNNN` en su `DECISIONS.md`, y si no puede esperar, a [`ERRATA.md`](ERRATA.md). Ver la regla de congelado en [`spec/README.md`](spec/README.md#a-published-version-is-frozen) — la comprueba `npm run validate`.
4. **Deja la evidencia reunida, no las conclusiones solas.** El comando exacto, su salida, y qué premisa del informe sobrevive. Quien retome el trabajo no debería tener que volver a derivarlo; es más caro que leerlo.
5. **El código de las herramientas no está protegido.** Importadores, exportadores y scripts de verificación se editan libremente para comprobar un hallazgo. Lo protegido son las versiones publicadas de `spec/`.
6. **Termina con `npm run validate` en 0.** Y si añades una puerta, pruébala en negativo: hay que ver el `FAIL`.

## Principio de proyecto: la vía determinista (aplica a cualquier misión)

OTE es una especificación determinista, y el repo está construido sobre esa propiedad. **Siempre que exista una vía determinista, se elige esa**, aunque cueste más código que la alternativa.

- **Derivar, no redactar.** La tabla de campos, las páginas `/spec/vN.N/`, los `reference.<lang>.md`, `llms.txt`, los ids de ancla (`<schema>-<path>`) y los enums salen de los schemas vía `scripts/`. Una prosa escrita a mano que repita lo que ya dice un schema es una segunda fuente de verdad, y la segunda siempre es la que se queda obsoleta. Si algo se puede generar, se genera y se declara generado (ver el slot `<!-- generated:fields -->` de `docs/spec/index.html`).
- **La validez la decide el validador, no un modelo leyendo prosa.** Un documento declara su `specVersion`; se valida con ajv contra el schema de *esa* versión (`/schema/vN.N/event.schema.json`, `$id` con granularidad de minor). Publicar una tabla en markdown para que un agente "compruebe" validez es sustituir una comprobación exacta por una aproximación.
- **Puerta automática, no revisión humana.** Todo artefacto generado tiene su `--check` en `npm run validate`, y el caso negativo se prueba: hay que ver el `FAIL` cuando el artefacto está stale. Un gate que nunca se ha visto fallar no es un gate (ej.: `actions/checkout` sin `fetch-depth: 0` hace vacuo cualquier check contra tags).
- **La versión vigente no se escribe de memoria, se averigua.** Nunca la deduzcas de lo que diga un markdown — es justo lo que se desactualiza. Fuentes deterministas, en este orden: `node -e "console.log(require('./package.json').version)"`, la tabla de [`spec/README.md`](spec/README.md) (la marca `**Current**`), o `publishedVersions()` de `scripts/schema-model.mjs`, que es la que usan los generadores.
- **Un markdown que nombre la versión vigente tiene que estar gateado.** `npm run validate` comprueba que `README.md`, `spec/README.md`, `CLAUDE.md`, `AGENTS.md` y `CONTRIBUTING.md` presentan como current la última, y que todo `spec/vN.N/...` que citan existe. Si añades una afirmación de ese tipo en otro fichero, añade su patrón a `claims` en `scripts/validate.mjs`; si puedes escribirla sin fijar el número (`spec/vN.N/`, o un enlace a `spec/README.md`), mejor eso que un gate. Lo que no vale es un recordatorio: ya hubo uno, y aun así `AGENTS.md` anunció v0.5 y `CONTRIBUTING.md` v0.4 con v0.6 publicada.
- **Nada inventado en un artefacto publicado.** Si la fuente no lo dice, el importador no lo rellena: declara la pérdida. Fabricar datos plausibles es el fallo más caro de esta clase de herramientas.

## El papel de la IA en este proyecto

La IA aquí **nunca es autoridad sobre la spec**. Juega tres papeles distintos, y conviene no confundirlos:

1. **Consumidor de primera clase.** Agentes y crawlers leen el sitio y los feeds, y son el lector que no puede ejecutar JavaScript ni adivinar. De ahí el trabajo de `docs/spec/`: la página servía 0 campos antes de que corriera JS, así que un agente concluía que `speakers` no existía mientras un humano veía el campo en el navegador — ambos con evidencia, ambos equivocados sobre el otro. **Lo que un agente no puede leer en los bytes servidos, para él no existe.**
2. **Integrador ciego.** Otro modelo (ver [`AGENTS.md`](AGENTS.md)) implementa importadores/exportadores leyendo sólo la spec publicada, sin `DECISIONS.md` ni el histórico, y anota en `INTEGRATION-AUDIT.log` cada punto donde tuvo que adivinar. Su valor está precisamente en no tener contexto.
3. **Revisor con disciplina de evidencia** (tu papel por defecto). Un informe de fricción no es un diagnóstico: verifica cada premisa tú mismo ejecutando los comandos y leyendo la prosa citada antes de darle la razón. En la revisión de 2026-11-06, dos de tres informes traían premisas falsas y el mecanismo propuesto por uno violaba la regla dura de sustitución de versión.

## Regla dura de proyecto (aplica a cualquier misión)

**Nunca sustituyas la cadena de versión "en masa" al crear `spec/vN.N/`.** Los enums generados (SPDX, ISO 4217, ISO 3166, tz, BCP 47) contienen números de versión de una autoridad externa: un `0.3.0` dentro de un `enum` es un dato, no la versión de OTE. Al publicar 0.4.0 un reemplazo global convirtió `copyleft-next-0.3.0` en `copyleft-next-0.4.0`, un id inexistente en la SPDX License List — habría invalidado feeds con licencia real y validado un id inventado.

El procedimiento completo (qué editar a mano, regenerar con `--tag` fijo, diffear los cuatro schemas, rehacer las copias derivadas) está en [`AGENTS.md`](AGENTS.md#regla-dura-nunca-sustituyas-la-versión-en-masa-al-crear-specvnn). Léelo antes de bifurcar una versión.

## Regla dura: una versión publicada no se toca

**Cuando `@opentechevents/schema@X.Y.0` está en npm, ningún byte de `spec/vX.Y/` cambia nunca más** — tampoco una `description`, tampoco prosa que alguien llame no normativa, tampoco para corregir un error demostrable. El razonamiento completo (granularidad de minor del `$id`, por qué un patch es peor que el error) está en [`spec/README.md`](spec/README.md#a-published-version-is-frozen), y `npm run validate` lo comprueba contra los tags de publicación desde v0.4.

Corolario que incomoda y es correcto: hay un párrafo falso en `spec/v0.6/README.md` y se queda ahí. Está registrado en [`ERRATA.md`](ERRATA.md), que es el único mecanismo para esto: añade, no modifica.
