# Investigación

Esta carpeta recoge la investigación previa al diseño de la especificación **OpenTechEvents (OTE Spec)** (nombre provisional).

## Objetivo

Antes de diseñar el estándar necesitamos saber **qué datos usan hoy** las plataformas, directorios y estándares de eventos tecnológicos: qué campos requieren, cuáles son opcionales, cómo se contribuye y en qué formatos se pueden consumir. El estándar debe poder cubrir las necesidades de todos ellos y ser fácilmente convertible a los formatos que ya usan.

Los hallazgos de esta carpeta alimentan directamente el diseño de la spec (modelo de datos, campos núcleo vs. módulos opcionales, reglas de compatibilidad).

## Qué extraemos de cada fuente

Plantilla común que aplicamos a cada plataforma/proyecto analizado, para poder comparar:

- **Qué soporta**: eventos, call for papers/speakers (CFP), ponentes, etc.
- **Datos y tipos**: qué campos maneja cada formato soportado y de qué tipo son.
- **Obligatorio vs. opcional**: qué exige y qué es opcional.
- **Formas de contribuir**: manual (formulario, issue, PR) o automatizable (API).
- **Consumo estándar**: si ya expone los datos en algún formato estándar (JSON, iCal, RSS, JSON-LD…).
- **Licencia de los datos** 🔲: bajo qué licencia/términos publica sus datos la fuente y qué permite (reutilización, redistribución, atribución requerida). **Crítico**: determina si las herramientas del ecosistema pueden legalmente **ingerir y re-publicar** esos eventos. Pendiente de revisar en todas las fuentes.
- **¿Es agregador?**: si a su vez recopila datos de otras fuentes (y cuáles).
- **URLs relevantes**: de dónde se extrajo la información (verificable), dónde se envían los datos (formulario/endpoint), etc.

Para los **estándares** existentes (iCal, RSS, schema.org…) el enfoque cambia: nos interesa su modelo de datos, campos y cómo mapear hacia/desde ellos, no el "alta de evento".

## Inventario de fuentes

### Plataformas — [findings/platforms.md](findings/platforms.md)

| Fuente | URL | Estado |
| --- | --- | --- |
| Meetup | https://www.meetup.com/ | ✅ |
| Sessionize | https://sessionize.com/ | ✅ |
| Luma | https://luma.com/ | ✅ |
| joind.in | https://joind.in/ | ✅ |
| Papercall.io | https://www.papercall.io/ | ✅ |
| Guild | https://guild.host/ | 🔲 |
| Saraos.tech | https://saraos.tech/ | 🔲 |
| Eventos de Linkedin | https://www.linkedin.com/help/linkedin/answer/a552496 | 🔲 |

### Directorios y agregadores — [findings/directories.md](findings/directories.md)

| Fuente | URL | Estado |
| --- | --- | --- |
| EventosWiki | https://github.com/achamorro-dev/eventoswiki | ✅ |
| Event Garden | https://eventgarden.io/ | ✅ |
| developers.events (Developers-Conferences-Agenda) | https://github.com/scraly/developers-conferences-agenda | ✅ |
| Confs.tech | https://github.com/tech-conferences/confs.tech | ✅ |
| CallingAllPapers | https://callingallpapers.com/ | ✅ |
| CFP Tracker (bendechrai/cfps) | https://github.com/bendechrai/cfps | ✅ |
| TechConf.Directory | https://github.com/DeclanChidlow/techconf.directory | ✅ |
| dev.events | https://dev.events/ | ✅ |
| Developer Events.org | https://www.developerevents.org/ | ✅ |
| Sesamers | https://sesamers.com/ | 🔲 |
| Vendelux | https://www.vendelux.com/ | 🔲 |
| LegalTechConference.com | https://www.legaltechnologyconference.com/ | 🔲 |
| iotevents.org / marketing-events.net (TechForge) | — | 🔲 |

### Estándares — [findings/standards.md](findings/standards.md)

| Estándar | Referencia | Estado |
| --- | --- | --- |
| iCalendar | RFC 5545 | ✅ |
| RSS 2.0 | https://www.rssboard.org/rss-specification | ✅ |
| schema.org / `Event` (JSON-LD) | https://schema.org/Event | ✅ |
| hCalendar / microformats | http://microformats.org/wiki/h-event | ✅ |
| JSON Feed | https://www.jsonfeed.org/ | ✅ |

## Análisis y conclusiones

- [findings/analysis.md](findings/analysis.md) — comparación, patrones comunes y conclusiones para el diseño del estándar.

## Índice de ficheros

- [findings/platforms.md](findings/platforms.md) — plataformas que crean/gestionan eventos.
- [findings/directories.md](findings/directories.md) — directorios y agregadores que listan eventos.
- [findings/standards.md](findings/standards.md) — estándares existentes y cómo mapear hacia/desde ellos *(pendiente)*.
- [findings/analysis.md](findings/analysis.md) — comparación, patrones y conclusiones.
