# Ecosistema de herramientas — ideas

> 💡 **Lluvia de ideas, no compromisos.** Lista abierta de herramientas que *podrían* construirse sobre OTE Spec. Sirve para imaginar el potencial e invitar a contribuir. Nada está priorizado ni asignado; las propuestas y los voluntarios son bienvenidos.

El [roadmap](../README.md#roadmap) prioriza primero una **buena especificación**; este ecosistema viene después (y sobre él, la difusión). Las herramientas son lo que convierte el estándar en algo útil: ver [De qué depende el éxito](../README.md#de-qué-depende-el-éxito).

Las ideas se agrupan por el ciclo de vida del dato: **crear/validar → ingerir → transformar → publicar → consumir**.

## Crear y validar

- **Validador de esquema** (JSON Schema): CLI, versión web y *GitHub Action* para validar en CI los eventos de un repo.
- **Linter** de buenas prácticas (avisos más allá del esquema: fechas coherentes, zona horaria presente, enlaces vivos…).
- **Editor / generador de eventos**: formulario web que produce el JSON/YAML OTE válido (para quien no quiera escribir a mano).
- **Bot conversacional (Telegram o similar)** _(propuesto por [@qwor01](https://github.com/qwor01))_: el dinamizador "suelta" la idea de un evento en lenguaje natural; el bot genera el borrador en formato OTE Spec y responde con una **URL** donde terminar de concretarlo (completar campos, revisar, publicar).
- **Soporte en editores**: esquema para autocompletado y validación en VS Code (JSON/YAML).

## Ingerir (importar hacia OTE)

> 📄 **[Agregador OTE](https://github.com/OpenTechEvents/opentechevents-data)** (repo `opentechevents-data`, **en construcción**): conectores como plugins, alta de fuentes por Issue Form, feed publicado a diario. Arranca por el importador de `.ics`. El [diseño del MVP](aggregator.md) documenta las decisiones.
>
> 🧩 **[Extensión de navegador — captura de eventos a OTE](browser-extension.md)**: propuesta concreta. Lee el `schema.org/Event` que Meetup, Eventbrite o Luma ya exponen, lo mapea a OTE y prerrellena el alta — **solo si eres el organizador o tienes permiso**, y siempre con revisión humana de los datos antes de enviar. En discusión.

- **Importadores desde plataformas**: Meetup, Luma, Sessionize, Eventbrite, joind.in… (vía sus APIs).
- **Extractor de `schema.org`/JSON-LD**: leer la web de un evento y deducir un documento OTE.
- **Importador iCalendar (.ics)** y **RSS** a OTE.
- **Adaptadores de directorios**: confs.tech, developers.events, EventosWiki, TechConf.Directory…

## Transformar / exportar

- **OTE → iCalendar** (`.ics`/`VCALENDAR`) para suscripción en apps de calendario.
- **OTE → RSS / JSON Feed** para lectores de feeds.
- **OTE → JSON-LD `schema.org/Event`**: *snippet* para incrustar en la web del evento (SEO + detección automática por agregadores como dev.events).
- **OTE → Markdown**: lista/tabla para los directorios basados en README.

## Publicar / automatizar

- **Auto-publicador** a plataformas (Meetup, LinkedIn, Eventbrite…).
- **Bot de Pull Requests** para enviar eventos a directorios que aceptan PRs (confs.tech, developers.events, EventosWiki…).
- **Rellenado de formularios** para sitios que solo aceptan alta manual.

## Consumir / suscribirse

- **Agregador / hub de feeds**: combina varios feeds OTE con *dedupe* y filtros.
- **Servicio de suscripción y notificaciones**: el usuario fija condiciones (tema, ciudad, modalidad, distancia…) y recibe avisos (email, Telegram, webhook).
- **Endpoint de calendario**: feed `.ics` filtrable para suscribir.
- **Widget embebible / *web component*** para mostrar los eventos en cualquier web.
- **Generador de *badge*/logo** "suscríbete al feed" (símil botón RSS) que enlaza a la URL del feed — pieza clave de difusión.

## Registro y comunidades

- **Resolver de comunidades**: dado un `community.uri`, obtener sus datos desde el registro o la propia web.
- **Generador de sitio**: página estática de eventos de una comunidad a partir de sus documentos OTE.

## Librerías de desarrollo

- **SDKs de referencia** (JS/TS, Python…) para leer, escribir y validar OTE.
- ***Playground*** online para probar el formato y las conversiones.

---

¿Tienes una idea o quieres construir alguna de estas? Abre un *issue* para proponerla o reclamarla. Ver [Cómo contribuir](../README.md#cómo-contribuir).
