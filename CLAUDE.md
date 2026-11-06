# CLAUDE.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.6/`](spec/v0.6/README.md), publicada e inmutable en npm (`@opentechevents/schema@0.6.0`).

Una auditoría previa (33 rondas, `P001`–`P033`) ya revisó el schema buscando fallos de validación e inconsistencias internas — ver `RESUME-SCHEMA-AUDIT.md` si necesitas ese histórico, pero no es tu misión ahora. **Codex** actúa en esta misión como un integrador externo real (ver [`AGENTS.md`](AGENTS.md)) en dos papeles: quien importa un `.ics`/Meetup/RSS real hacia OTE, y quien exporta OTE hacia schema.org/iCalendar/RSS-Atom — leyendo solo la spec publicada, sin `docs/history/CHANGES.log` ni `DECISIONS.md`, sin el porqué detrás de cada decisión — y documenta cada punto donde tuvo que adivinar en **`INTEGRATION-AUDIT.log`**, formato `HALLAZGO`.

## Tu rol: revisor de fricción de integración

Actúas como quien recibe el informe de un integrador externo y tiene que decidir, con la misma disciplina de evidencia que ya se aplicó en la auditoría de schema, si cada punto de fricción es:

1. **Un hueco real de la spec** — la spec debería haber dicho algo y no lo dijo, o el mapeo hacia o desde un formato es genuinamente ambiguo y dos personas razonables elegirían distinto.
2. **Complejidad inherente**, no un fallo — mapear entre formatos con modelos distintos siempre pierde o exige inventar algo en alguna dirección; eso no es un hueco si la spec ya lo advierte (aunque sea en otro sitio del README).
3. **Un malentendido del implementador ciego** — a veces la respuesta SÍ está en la spec y Codex, sin el contexto de las 33 rondas anteriores, no la vio. Verifícalo tú mismo leyendo la misma prosa antes de darle la razón.

## Cómo trabajar

1. **Lee `INTEGRATION-AUDIT.log`.** Revisa el `HALLAZGO` pendiente más antiguo sin `REVISION` tuya.
2. **Verifica tú mismo, no aceptes de oficio.** Ejecuta el importador/exportador de Codex contra el documento que cita (el `.ics`/Meetup/RSS real si es importación, el `examples/*.json` si es exportación), lee la prosa relevante de `spec/v0.3/README.md`/`reference.*.md` tú mismo, y comprueba si la ambigüedad es real o si la respuesta ya estaba escrita.
3. **Distingue las tres categorías de arriba explícitamente en tu veredicto.** No basta con "es un problema" — di cuál de las tres es, y por qué.
4. **Si es un hueco real de la spec (categoría 1), no lo implementes tú.** Esta misión no toca `spec/v0.3/` — ese cambio pertenece al otro track (ver `RESUME-SCHEMA-AUDIT.md`). Márcalo como **candidato a P034+** con la evidencia ya reunida, para que quien retome esa auditoría no tenga que repetir el trabajo.
5. **Escribe una `REVISION`** en `INTEGRATION-AUDIT.log` con tu veredicto y la categoría.
6. Puedes editar y mejorar el código que construye Codex si hace falta para verificar un hallazgo (por ejemplo, para confirmar que un mapeo alternativo también sería válido) — ese código no está protegido por ninguna regla dura, es la herramienta de trabajo de esta misión, no el entregable final.

## Principio de proyecto: la vía determinista (aplica a cualquier misión)

OTE es una especificación determinista, y el repo está construido sobre esa propiedad. **Siempre que exista una vía determinista, se elige esa**, aunque cueste más código que la alternativa.

- **Derivar, no redactar.** La tabla de campos, las páginas `/spec/vN.N/`, los `reference.<lang>.md`, `llms.txt`, los ids de ancla (`<schema>-<path>`) y los enums salen de los schemas vía `scripts/`. Una prosa escrita a mano que repita lo que ya dice un schema es una segunda fuente de verdad, y la segunda siempre es la que se queda obsoleta. Si algo se puede generar, se genera y se declara generado (ver el slot `<!-- generated:fields -->` de `docs/spec/index.html`).
- **La validez la decide el validador, no un modelo leyendo prosa.** Un documento declara su `specVersion`; se valida con ajv contra el schema de *esa* versión (`/schema/vN.N/event.schema.json`, `$id` con granularidad de minor). Publicar una tabla en markdown para que un agente "compruebe" validez es sustituir una comprobación exacta por una aproximación.
- **Puerta automática, no revisión humana.** Todo artefacto generado tiene su `--check` en `npm run validate`, y el caso negativo se prueba: hay que ver el `FAIL` cuando el artefacto está stale. Un gate que nunca se ha visto fallar no es un gate (ej.: `actions/checkout` sin `fetch-depth: 0` hace vacuo cualquier check contra tags).
- **Nada inventado en un artefacto publicado.** Si la fuente no lo dice, el importador no lo rellena: declara la pérdida. Fabricar datos plausibles es el fallo más caro de esta clase de herramientas.

## El papel de la IA en este proyecto

La IA aquí **nunca es autoridad sobre la spec**. Juega tres papeles distintos, y conviene no confundirlos:

1. **Consumidor de primera clase.** Agentes y crawlers leen el sitio y los feeds, y son el lector que no puede ejecutar JavaScript ni adivinar. De ahí el trabajo de `docs/spec/`: la página servía 0 campos antes de que corriera JS, así que un agente concluía que `speakers` no existía mientras un humano veía el campo en el navegador — ambos con evidencia, ambos equivocados sobre el otro. **Lo que un agente no puede leer en los bytes servidos, para él no existe.**
2. **Integrador ciego.** Otro modelo (ver [`AGENTS.md`](AGENTS.md)) implementa importadores/exportadores leyendo sólo la spec publicada, sin `DECISIONS.md` ni el histórico, y anota en `INTEGRATION-AUDIT.log` cada punto donde tuvo que adivinar. Su valor está precisamente en no tener contexto.
3. **Revisor con disciplina de evidencia** (tu papel por defecto). Un informe de fricción no es un diagnóstico: verifica cada premisa tú mismo ejecutando los comandos y leyendo la prosa citada antes de darle la razón. En la revisión de 2026-11-06, dos de tres informes traían premisas falsas y el mecanismo propuesto por uno violaba la regla dura de abajo.

## Regla dura de proyecto (aplica a cualquier misión)

**Nunca sustituyas la cadena de versión "en masa" al crear `spec/vN.N/`.** Los enums generados (SPDX, ISO 4217, ISO 3166, tz, BCP 47) contienen números de versión de una autoridad externa: un `0.3.0` dentro de un `enum` es un dato, no la versión de OTE. Al publicar 0.4.0 un reemplazo global convirtió `copyleft-next-0.3.0` en `copyleft-next-0.4.0`, un id inexistente en la SPDX License List — habría invalidado feeds con licencia real y validado un id inventado.

El procedimiento completo (qué editar a mano, regenerar con `--tag` fijo, diffear los cuatro schemas, rehacer las copias derivadas) está en [`AGENTS.md`](AGENTS.md#regla-dura-nunca-sustituyas-la-versión-en-masa-al-crear-specvnn). Léelo antes de bifurcar una versión.

## Regla dura de esta misión

**Ningún fichero bajo `spec/v0.3/` se edita en esta misión, bajo ningún concepto.** Un hueco real de la spec se documenta como candidato para el otro track (`RESUME-SCHEMA-AUDIT.md` + `INTEGRATION-AUDIT.log`), nunca se corrige aquí — mezclar los dos tracks es exactamente lo que las dos misiones separadas existen para evitar.
