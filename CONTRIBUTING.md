# Cómo contribuir

Gracias por pasarte. OTE Spec está en **fase de diseño**: nada está cerrado y por eso ahora mismo una opinión vale más que un *pull request*. Si organizas eventos, montas un directorio o mantienes una herramienta, tienes justo el contexto que le falta a este proyecto.

> ⚠️ **Aviso importante.** La especificación es un **borrador (0.x) sin revisión humana completa**. El núcleo de la v0.1 se está decidiendo en el **[issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5)**, y ese hilo **manda sobre los documentos del repo**. Antes de proponer un cambio al modelo de datos, pásate por ahí.

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

No edites `spec/data-model.md` para alinearlo con lo que se debate: **llévalo al issue**. Los documentos se actualizan cuando el debate se cierra, no al revés.

### Adherirse: publicar tus eventos en OTE

Tres pasos, explicados con detalle en [opentechevents.org](https://opentechevents.org#adopt):

1. Publica un archivo JSON con tus eventos en una URL que controles.
2. Enlázalo desde el `<head>` de tu web para que las herramientas lo descubran solas.
3. **Abre un issue con la URL de tu feed** para que lo validemos y te listemos en la web.

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

### Traducir la web

La web está en inglés y español ([`docs/i18n/`](docs/i18n/)). Añadir un idioma es crear `docs/i18n/<código>.json`, registrar el código en `SUPPORTED` dentro de `docs/app.js` y añadir el botón en `index.html`. Instrucciones en [`docs/README.md`](docs/README.md).

## Pull requests

Para cambios pequeños (erratas, enlaces rotos, una entrada en una lista, una traducción), manda el PR directamente.

Para cualquier cosa que toque **la especificación**, abre antes un issue. Un PR al modelo de datos sin debate previo es muy probable que se quede parado, no por burocracia sino porque el acuerdo es justo la parte difícil.

- Una rama por cambio, desde `main`.
- Mensajes de commit en imperativo; si sigues [Conventional Commits](https://www.conventionalcommits.org/), mejor.
- Explica **el porqué** en la descripción del PR. El qué ya se ve en el diff.
- El repo no tiene todavía CI ni linters: no hay nada que ejecutar antes de enviar. Si tocas la web, ábrela en local (`cd docs && python3 -m http.server 8000`) y comprueba que no rompes nada.

## Idioma

El repositorio está en **español**, pero la especificación tiene vocación internacional. **Escribe en el idioma que te resulte cómodo**: si abres un issue en inglés, se te responde en inglés. Los nombres de campo de la spec son en inglés, sin discusión.

## Reconocimiento

Se usa [all-contributors](https://allcontributors.org): se reconoce **cualquier tipo de contribución**, no solo código — ideas, investigación, documentación, traducción, difusión, revisión. Si has aportado algo y no apareces, dilo: es un olvido, no un criterio.

## Licencia de tus contribuciones

> ⚠️ **Provisional.** La licencia del proyecto **está por definir** (ver el [README](README.md#licencia)). La intención es la más abierta posible, en la línea de CC0 / dominio público, para que la spec no limite ningún uso.

Al contribuir, aceptas que tu aportación se publique bajo la licencia que finalmente adopte el proyecto. Si eso te supone un problema, dilo en el issue **antes** de contribuir y lo hablamos.

## Conducta

Todavía no hay un código de conducta formal (falta, y se agradecen propuestas). Mientras tanto, la regla es la obvia: se debate sobre ideas, no sobre personas. Quien organiza comunidades ya sabe de qué va esto.
