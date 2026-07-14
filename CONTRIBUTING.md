# Cómo contribuir

Gracias por pasarte. OTE Spec está en **fase de diseño**: nada está cerrado y por eso ahora mismo una opinión vale más que un *pull request*. Si organizas eventos, montas un directorio o mantienes una herramienta, tienes justo el contexto que le falta a este proyecto.

> ⚠️ **Aviso importante.** La especificación vigente es **[OTE Spec v0.1](spec/v0.1/README.md)** y es un **borrador `0.x`: puede romper sin previo aviso**. Se publicó para que existan implementaciones reales y para que rompan lo que esté mal. El debate sigue abierto en los issues [#5 (evento)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).
>
> Los documentos de `spec/data-model.md` y `spec/feed.md` son el **boceto anterior** y **no son normativos**. No los implementes ni los edites.

## Lo que más falta ahora mismo

En este orden:

1. **Casos reales que rompan el modelo.** Un evento tuyo que no se pueda describir con la spec actual es información valiosísima. Cuéntalo aunque no traigas solución.
2. **Comunidades dispuestas a publicar un feed.** Un estándar sin datos reales es teoría. Ver [adherirse](#adherirse-publicar-tus-eventos-en-ote).
3. **Consumidores.** Directorios, newsletters o bots que lean feeds OTE. Cada consumidor hace que adherirse compense más.
4. **Herramientas del ecosistema.** Lista abierta en [ecosystem/](ecosystem/README.md).
5. **Código y documentación.** Llegará, pero va después de lo anterior.

## Cómo participar

### Debatir la especificación

**Abre un [issue](https://github.com/OpenTechEvents/opentechevents-spec/issues)** (o comenta en uno existente). No hace falta que la propuesta esté pulida ni que sepas de estándares. Lo que sí ayuda a que un cambio avance:

- **El caso real detrás.** «En mi comunidad hacemos X y no sé cómo representarlo» pesa más que «faltaría un campo Y».
- **Qué se rompe si no se arregla.** ¿Se pierde información? ¿Un importador se inventa un dato? ¿Un evento aparece mal en un directorio?
- **Cómo lo resuelven otros.** Si iCalendar, schema.org o RSS ya tienen una solución para eso, dilo: la compatibilidad es un principio de diseño, no un extra.

**Un caso real vale más que una propuesta de campo.** Si tu evento no cabe en la spec, cuéntalo aunque no traigas solución: eso es exactamente lo que necesitamos.

### Cambiar la especificación

Un cambio en la spec **no es solo editar un `.md`**. La v0.1 tiene cuatro piezas que se validan entre sí, y **van en el mismo PR**:

| Pieza | Fichero |
| --- | --- |
| El schema ejecutable | `spec/v0.1/event.schema.json` / `feed.schema.json` |
| La prosa normativa (lo que un validador no puede comprobar) | `spec/v0.1/README.md` |
| Los ejemplos, incluidos los que **deben fallar** | `spec/v0.1/examples/` y `examples/invalid/` |
| Las copias publicadas (los `$id` deben resolver) | `docs/schema/` → `npm run publish-schemas` |

Antes de enviar: `npm run validate`. **Si el cambio no viene con un ejemplo que lo demuestre, no está terminado** — y si relaja una regla, quita el ejemplo de `invalid/` que ya no debe fallar.

**Añadir un campo no requiere cambiar el schema.** Los schemas no prohíben campos adicionales: si tu comunidad necesita `tags` o `cfp` hoy, los pones y tu documento sigue siendo válido. La spec crece con **campos que alguien ya usa de verdad**, no con campos que imaginamos que harán falta. Trae el uso real y hablamos de estandarizarlo.

### Versionado

- **`0.x` puede romper.** No hay compromiso de compatibilidad hasta la 1.0.
- **Una versión publicada no se toca.** Los cambios que rompen van a un directorio nuevo (`spec/v0.2/`), no encima de `spec/v0.1/`. Es lo que permite que un documento diga `specVersion: "0.1.0"` y alguien sepa dentro de tres años contra qué validarlo.
- Correcciones que **no** cambian qué documentos son válidos (una errata en la prosa, una descripción) sí van sobre la versión vigente.

### Adherirse: publicar tus eventos en OTE

Tres pasos, explicados con detalle en [opentechevents.org](https://opentechevents.org#adopt):

1. Publica un archivo JSON con tus eventos en una URL que controles.
2. Enlázalo desde el `<head>` de tu web para que las herramientas lo descubran solas.
3. **Abre un issue con la URL de tu feed** para que lo validemos y te listemos en la web.

**Valida tu feed antes de abrir el issue.** Clona este repo y pásale tu fichero:

```bash
npm install
npm run validate -- mi-feed.json
```

Detecta si es un evento suelto o un feed, y te dice qué falta (`data/events/0 must have required property 'timezone'`). Desde código, con el paquete `@opentechevents/schema`: ver [spec/v0.1/README.md](spec/v0.1/README.md#consumir-los-schemas).

> 🗓️ **¿Ya tienes un `.ics` y no quieres escribir JSON?** Da de alta la URL de tu calendario como **fuente del [agregador](ecosystem/aggregator.md)**: él lo convierte a OTE por ti. Es la vía de entrada más barata y no te compromete a nada. El agregador está en construcción y su MVP arranca precisamente por `.ics`.

Al dar de alta una fuente que no sea tuya, ten en cuenta que el agregador **solo ingiere datos con licencia abierta declarada o con permiso explícito del organizador** — y que un `.ics` público no es automáticamente reutilizable (los TdS de muchas plataformas lo restringen).

### Aparecer en la web

Las listas de la web salen de tres archivos JSON. Añadirte es un PR de una entrada:

| Archivo | Para |
| --- | --- |
| [`docs/data/adopters.json`](docs/data/adopters.json) | Comunidades que publican sus eventos en OTE |
| [`docs/data/consumers.json`](docs/data/consumers.json) | Quien consume feeds OTE (directorios, apps, personas) y sus testimonios |
| [`docs/data/tools.json`](docs/data/tools.json) | Herramientas del ecosistema |

Los textos libres admiten `{ "en": "…", "es": "…" }`. Detalles y ejemplos en [`docs/README.md`](docs/README.md).

### Reclamar o proponer una herramienta

La lista de ideas está en [ecosystem/](ecosystem/README.md), y ninguna tiene dueño. Si te quieres poner con una, **abre un issue diciéndolo** antes de empezar: te ahorra duplicar trabajo y sirve para acordar el alcance.

### Traducir

Inglés y español. Hay **dos sitios distintos**, y no se mezclan:

| Qué | Dónde |
| --- | --- |
| Los textos de la web | [`docs/i18n/`](docs/i18n/) — ver [`docs/README.md`](docs/README.md) |
| Las descripciones de los campos de la spec | [`spec/v0.1/i18n/`](spec/v0.1/i18n/) |

Las `description` **dentro de los schemas se quedan en inglés**: viajan en el paquete npm hacia implementadores de todo el mundo. Las traducciones van aparte, indexadas por campo, y `npm run validate` **falla si falta alguna**. Tras traducir: `npm run build-reference` regenera `reference.<idioma>.md` y la página de referencia.

## Pull requests

Para cambios pequeños (erratas, enlaces rotos, una entrada en una lista, una traducción), manda el PR directamente.

Para cualquier cosa que toque **la especificación**, abre antes un issue. Un PR al modelo de datos sin debate previo es muy probable que se quede parado, no por burocracia sino porque el acuerdo es justo la parte difícil.

- Una rama por cambio, desde `main`.
- Mensajes de commit en imperativo; si sigues [Conventional Commits](https://www.conventionalcommits.org/), mejor.
- Explica **el porqué** en la descripción del PR. El qué ya se ve en el diff.
- Si tocas los **schemas o los ejemplos**, ejecuta `npm run validate` antes de enviar. El CI lo hace igualmente y **falla si un ejemplo deja de validar** — es lo que impide que la spec y sus ejemplos se separen (ya pasó una vez).
- Si añades o cambias un schema, `npm run publish-schemas` copia la versión publicada a `docs/schema/` (las URLs de los `$id` deben resolver). El validador comprueba que no se hayan separado.
- Si tocas la **web**, levántala en local con `npm run dev` (→ <http://localhost:8000>) y comprueba que no rompes nada.

## Publicar una versión (mantenedores)

Los schemas se publican en npm como [`@opentechevents/schema`](https://www.npmjs.com/package/@opentechevents/schema) y se sirven en `https://opentechevents.org/schema/v0.1/…`.

1. `npm run publish-schemas` — sincroniza las copias que sirve la web.
2. Sube la versión en `package.json`.
3. Tag: `git tag schema-v0.1.1 && git push origin schema-v0.1.1`.

El resto lo hace [`publish-schema.yml`](.github/workflows/publish-schema.yml), con dos frenos deliberados: **falla si el tag no coincide con la versión del `package.json`**, y **no publica si los ejemplos no validan** — un schema que rompe sus propios ejemplos no llega a npm. No hay token: npm confía en este repo y en este workflow (*trusted publishing*, OIDC), y el paquete se firma con *provenance*.

## Idioma

El repositorio está en **español**, pero la especificación tiene vocación internacional. **Escribe en el idioma que te resulte cómodo**: si abres un issue en inglés, se te responde en inglés. Los nombres de campo de la spec son en inglés, sin discusión.

## Reconocimiento

Se usa [all-contributors](https://allcontributors.org): se reconoce **cualquier tipo de contribución**, no solo código — ideas, investigación, documentación, traducción, difusión, revisión. Si has aportado algo y no apareces, dilo: es un olvido, no un criterio.

## Licencia de tus contribuciones

Al contribuir aceptas que tu aportación se publique bajo las licencias del proyecto (ver [LICENSE](LICENSE)):

- **prosa** (spec, docs, web, investigación) → [CC0-1.0](LICENSES/CC0-1.0.txt), dominio público;
- **schemas y código** → [MIT](LICENSES/MIT.txt).

No hace falta firmar ningún CLA. Si esto te supone un problema, dilo en el issue **antes** de contribuir y lo hablamos.

## Conducta

Todavía no hay un código de conducta formal (falta, y se agradecen propuestas). Mientras tanto, la regla es la obvia: se debate sobre ideas, no sobre personas. Quien organiza comunidades ya sabe de qué va esto.
