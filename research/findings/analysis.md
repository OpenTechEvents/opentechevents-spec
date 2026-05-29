# Análisis — comparación, patrones y conclusiones

Síntesis de los hallazgos de [platforms.md](platforms.md), [directories.md](directories.md) y [standards.md](standards.md), orientada al diseño de OTE Spec.

## Resumen

Se analizaron plataformas populares para anunciar eventos tecnológicos (Meetup, Sessionize y Luma, además de joind.in y Papercall) y varios proyectos/directorios de comunidad (EventosWiki, Event Garden, developers.events, Confs.tech, CallingAllPapers, CFP Tracker, TechConf.Directory, dev.events y Developer Events.org). Las plataformas difieren en el modo de creación de eventos y los datos que requieren, pero comparten un núcleo común de información: nombre del evento, descripción, fechas y horarios (con zonas horarias), ubicación, enlaces de registro y, en su caso, fechas de apertura y cierre de la llamada a propuestas (CFP). Los directorios basados en GitHub utilizan estructuras de datos YAML o JSON, mientras que las plataformas ofrecen APIs (GraphQL o REST) o formularios web.

## Comparación y patrones comunes

1. **Datos imprescindibles**. La mayoría de plataformas exigen, como mínimo, nombre del evento, descripción breve, fechas de inicio y fin, zona horaria y ubicación. Joind.in especifica además la zona geográfica (`tz_continent` y `tz_place`)[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202).

2. **Información de CFP**. En los proyectos que recogen CFP (developers.events, Confs.tech, joind.in, CallingAllPapers), los datos clave incluyen URL de la convocatoria, fecha de apertura y fecha de cierre[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202)[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta).

3. **Imágenes y redes sociales**. Algunos directorios permiten indicar logotipo, imagen de portada y redes sociales (Twitter, Mastodon, Bluesky, etc.)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus). Estos campos suelen ser opcionales, pero enriquecen la ficha.

4. **Etiquetas y categorías**. Muchos repositorios utilizan etiquetas (`tags`) para clasificar las conferencias por temática (AI, cloud, etc.)[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the).

5. **Automatización**. Algunos sitios soportan APIs o feeds que devuelven datos estructurados (Meetup GraphQL, Sessionize JSON/iCal, Luma API, developers.events JSON, joind.in REST, CallingAllPapers API). Otros confían en plantillas YAML/Markdown y en la revisión manual. dev.events menciona la utilización de metadatos **JSON‑LD** en la web del evento para detectar datos automáticamente[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

6. **Proceso de contribución**. Las plataformas como Meetup, Luma y Papercall gestionan eventos desde sus propias interfaces; los directorios comunitarios basados en GitHub (EventosWiki, developers.events, Confs.tech, TechConf.Directory) requieren Pull Requests o issues. dev.events y Developer Events tienen formularios de envío que se revisan manualmente.

7. **Agregadores**. CallingAllPapers y CFP Tracker no permiten alta manual; dependen de otras fuentes. dev.events también funciona como agregador combinando automatización y envíos manuales[dev.events](https://dev.events/about#:~:text=The%20project%20is%20coded%20and,organizers%2C%20tech%20community%2C%20and%20volunteers).

## Conclusiones para el diseño de un nuevo estándar

- **Esquema modular**: El nuevo estándar debería definir un núcleo obligatorio (nombre, descripción, fechas, zona horaria, ubicación) y módulos opcionales para CFP, redes sociales, etiquetas, imágenes y logística. La experiencia de joind.in demuestra que basta con unos pocos campos obligatorios[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202), mientras que otros datos enriquecen la ficha.

- **Compatibilidad con JSON e YAML**: La mayoría de proyectos usan estos formatos. El estándar debería ofrecer ambas serializaciones, e idealmente una representación JSON‑LD para permitir la detección automática por motores como dev.events[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

- **Soporte de CFP**: Incluir campos `cfp_url`, `cfp_start` y `cfp_end` como opcionales pero normalizados; son clave para agregadores[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202).

- **Zonas horarias y localización**: Es recomendable separar los campos de zona horaria (`tz_continent` y `tz_place`) de la ubicación para facilitar la conversión de horarios y permitir eventos online.

- **Extensibilidad de redes sociales**: Un bloque `socials` debería aceptar múltiples plataformas (Twitter, Mastodon, Bluesky, LinkedIn, etc.) con la posibilidad de incluir identificadores descentralizados (DID) como en techconf.directory[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus).

- **Sistema de etiquetas**: Permitir una lista de `tags` normalizada; ello facilita la clasificación por temáticas y la interoperabilidad con motores de búsqueda y agregadores[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the).

- **Licencias y privacidad**: Incluir metadatos sobre derechos de imagen, consentimiento para publicación, enlaces al código de conducta y políticas de privacidad; varios formularios (Confs.tech, Developer Events) contemplan estos elementos.

- **Canales de contribución**: Prever tanto contribución manual (formularios o PRs) como automática mediante API o detección de JSON‑LD[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria).

- **Consumo sencillo**: Publicar un feed unificado (JSON y iCal) y permitir filtros (por fecha, localización, tags) similares a joind.in y developers.events[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202)[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta).

La consolidación de estas prácticas facilitará la adopción del nuevo estándar en distintos ecosistemas y herramientas.

## Interoperabilidad con estándares existentes

Del análisis de [standards.md](standards.md):

- **Modelo de referencia: schema.org/`Event`** (JSON-LD) — el más alineado con OTE (online/híbrido nativo vía `eventAttendanceMode`, ponentes, estado, offers) y detectado automáticamente por buscadores y agregadores como dev.events.
- **iCalendar (`VEVENT`)** — mapeo sólido del núcleo y **única fuente con recurrencia formal** (`RRULE`), clave para meetups periódicos.
- **RSS 2.0 y JSON Feed** — sin modelo de evento; se usan como **formato de difusión** (un evento por `item`, enlace a la ficha), con datos estructurados vía namespace (RSS) o campo `_ote` (JSON Feed).
- **h-event** — marcado opcional en HTML; baja prioridad.
- **Hueco común**: ningún estándar generalista modela el **CFP** → OTE debe definirlo como módulo propio.
