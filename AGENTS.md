# AGENTS.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.6/`](spec/v0.6/README.md) — schemas ejecutables (JSON Schema 2020-12) + prosa normativa + ejemplos validados en CI.

Una auditoría previa (33 rondas, `P001`–`P033`, ver `RESUME-SCHEMA-AUDIT.md` si hace falta el histórico) ya revisó el schema línea a línea buscando fallos de validación e inconsistencias entre prosa y schema. Esa auditoría **no es tu misión** y no debes repetirla. Lo que queda por comprobar es distinto: **si alguien que solo tiene la spec publicada, sin el porqué detrás de cada decisión, puede producir y consumir documentos OTE reales sin adivinar.** Un schema puede ser internamente perfecto y aun así ser inconsumible en la práctica — mapeos ambiguos, campos sin traducción limpia hacia o desde otros formatos, decisiones que solo tienen sentido si conoces la discusión que las produjo.

## Instrucciones operativas para agentes

- Antes de actuar, lee [`CLAUDE.md`](CLAUDE.md) si todavía no lo has leído en esta sesión.
- No uses la skill `ship` en este repo. Para commits y pushes, sigue el flujo manual del proyecto y revisa explícitamente qué ficheros se van a incluir.
- Si vas a crear una versión nueva de la spec (`spec/vN.N/`), aplica la regla dura de abajo. Es independiente de la misión que tengas asignada.

## Regla dura: nunca sustituyas la versión "en masa" al crear `spec/vN.N/`

Al publicar 0.4.0 se hizo un reemplazo global de la cadena de versión sobre los schemas copiados de v0.3, y eso convirtió el identificador SPDX `copyleft-next-0.3.0` en `copyleft-next-0.4.0` — un id que no existe en la SPDX License List. Consecuencia: un feed con licencia real se habría reportado inválido y un id inventado habría validado.

**Los schemas contienen valores que llevan números de versión ajenos a la spec.** Los enums generados (SPDX, ISO 4217, ISO 3166, tz, BCP 47) son datos de una autoridad externa: cualquier `0.3.0` dentro de un `enum` es un dato, no la versión de OTE. Un `sed`/replace global no sabe distinguirlos y nunca lo sabrá.

Procedimiento obligatorio para bifurcar una versión:

1. Copia `spec/vANTERIOR/` a `spec/vNUEVA/` y edita **solo** lo que es realmente la versión: `$id`, `specVersion` (`const` y `examples`), y los `$ref` entre schemas. Nada dentro de un `enum`, nunca.
2. Regenera los enums con su script y **fijando el release** que ya declara el `$comment` correspondiente — p. ej. `node scripts/update-licenses.mjs --tag v3.28.0`. Fijar el tag es lo que convierte esto en una comprobación de integridad; sin `--tag` traes datos nuevos y el diff deja de significar nada.
3. `diff spec/vANTERIOR/X.schema.json spec/vNUEVA/X.schema.json` para **los cuatro** schemas (`event`, `feed`, `event.recommended`, `feed.recommended`), y justifica línea a línea cada diferencia. Si una diferencia no está en tu lista de cambios intencionados, es un error de esta clase.
4. Regenera lo derivado y valida: `npm run publish-schemas && npm run build-llms && npm run validate`. Las copias de `docs/schema/`, `docs/llms/` y `docs/llms-full.txt` arrastran el mismo error si no se rehacen.

Los scripts `update-*.mjs` resuelven por sí solos la versión más alta de `spec/`, así que no hay que tocarlos en cada bump; usa `--spec vN.N` solo si necesitas corregir una versión ya congelada.

## Tu rol: implementador ciego

Actúas como un integrador externo real, en dos papeles distintos (haz los dos, no solo uno):

1. **Quien importa**: alguien que solo tiene un `.ics` real, una exportación de Meetup, o un feed RSS/Atom de una comunidad, y necesita producir un documento OTE válido a partir de eso. La propia spec reconoce este caso como real y frecuente (`source`, el ejemplo `event-from-ics.json`, la pregunta abierta sobre `id` de un evento importado sin URL propia) — es probablemente donde encuentres más fricción.
2. **Quien exporta**: alguien a quien han encargado construir un exportador de eventos OTE a **schema.org `Event`** (JSON-LD), **iCalendar** (RFC 5545) y **RSS/Atom**.

En ambos casos, llegas a este repo sin más contexto que el que cualquier tercero tendría al descubrir la spec.

**Regla dura de la que depende todo lo demás: NO leas `docs/history/CHANGES.log` ni `DECISIONS.md`.** Esos ficheros contienen el porqué de cada decisión de diseño, y ese conocimiento es precisamente lo que un integrador real no tiene. Si los lees, tu trabajo deja de medir lo que se supone que mide. Tu universo de lectura permitida es:

Sin fijar la versión a mano: el ejercicio corre contra **la vigente**, y cuál es se averigua sin preguntar — la tabla de [`spec/README.md`](spec/README.md) la marca como `**Current**`, y `node -e "console.log(require('./package.json').version)"` la da como versión npm. Llámala `vN.N` abajo y sustitúyela por la que leas:

1. [`README.md`](README.md) (raíz) — visión general.
2. `spec/vN.N/README.md` — normativa.
3. Los schemas: `event.schema.json`, `feed.schema.json`, `event.recommended.schema.json`, `feed.recommended.schema.json`.
4. `spec/vN.N/reference.en.md` / `reference.es.md` — referencia de campos generada.
5. `spec/vN.N/examples/` — documentos de ejemplo reales.

## Qué construir

Código real, ejecutable, en el lenguaje que prefieras (recomendado: el mismo Node/JS del repo, para poder reutilizar `event.schema.json` y validar tus salidas). Dos piezas:

**Importador** (`.ics` / Meetup / RSS-Atom → OTE):
- Consigue al menos un `.ics` REAL (expórtalo de Google Calendar, de un calendario público conocido, o de cualquier herramienta real — no te lo inventes desde cero) y, si puedes, una exportación real de un evento de Meetup y un ítem de RSS real de una web de eventos.
- Produce un documento OTE válido (que pase `event.schema.json`) a partir de cada uno.
- Presta atención especial a: cómo acuñas `id` cuando la fuente no tiene URL propia, qué pones en `license` cuando la fuente no dice nada, cómo derivas `attendanceMode`/`location` de un formato que no modela esa distinción (iCalendar no la tiene en absoluto), y qué haces con campos que la fuente no tiene ni forma de tener.

**Exportador** (OTE → schema.org / iCalendar / RSS-Atom):
- Lee un documento OTE (evento o feed) válido y produce: un `Event` de schema.org (JSON-LD), un `VEVENT` de iCalendar, y un ítem de RSS o Atom.
- Cubrir al menos los campos marcados como recomendados en `reference.*.md`, y al menos un ejemplo de cada campo opcional "interesante" (`offers`, `cfp`, `eligibility`, `partOf`, `translations`, `image[]` con y sin `alt`).
- Corre contra varios `examples/*.json` reales del repo, no solo contra un caso inventado por ti.

## Qué reportar

Cada vez que tengas que **adivinar, elegir entre alternativas igual de razonables, o dejar un campo sin mapeo limpio** — en cualquiera de las dos direcciones — es un hallazgo. Escribe una entrada `HALLAZGO` en **`INTEGRATION-AUDIT.log`** (mismo mecanismo de *hand-off* que el histórico `docs/history/CHANGES.log`, formato definido en su encabezado) — una por hallazgo, con:

- La dirección (importar/exportar) y el campo o la situación concreta.
- Qué tuviste que decidir sin que la spec te lo dijera, y qué alternativas consideraste.
- El documento real que dispara el caso (el `.ics`/Meetup/RSS de origen si es importación, o el `examples/*.json` de OTE si es exportación).
- Tu mejor intento de mapeo, aunque no estés seguro de que sea el correcto.

No hace falta "una a la vez" como en la auditoría anterior — este es un ejercicio exploratorio, documenta todo lo que encuentres a medida que avanzas construyendo. Sí evita repetir un hallazgo ya registrado por otro campo si la causa raíz es idéntica (cítalo en vez de duplicarlo).

## Qué NO es un hallazgo

- Que un campo sea opcional y por tanto tu código tenga que manejar su ausencia — eso es el diseño funcionando, no un fallo.
- Complejidad inherente a mapear entre formatos con modelos distintos (algo va a perderse siempre yendo a RSS, por ejemplo; un `.ics` real casi nunca tendrá `license`) — solo repórtalo si la spec no te avisa de esa pérdida/ausencia en ningún sitio y tú tuviste que descubrirla construyendo.
