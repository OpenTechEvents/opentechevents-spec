# Hallazgos — Directorios y agregadores

Proyectos que **listan/recopilan** eventos o CFP (no son la plataforma origen). Ver criterio común en [../README.md](../README.md).

## EventosWiki (eventoswiki)

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Repositorio en GitHub que recopila eventos tecnológicos hispanohablantes; las contribuciones se realizan mediante issues. |  |
| **Campos necesarios** | El template YAML para solicitar un nuevo evento incluye campos obligatorios: `event-name`, `event-website`, `short-description`, `start-date`, `end-date` y `location`[raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |
| **Campos opcionales** | `cover-image` (imagen de portada), `social-networks` y `details` para ampliar información[raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |
| **Contribución** | Manual: se abre un issue con el template completado y los mantenedores lo revisan. No se indica API. |  |
| **Consumible estándar** | No se proporciona exportación; el valor está en la página web generada desde GitHub. |  |
| **Agregador** | No. |  |
| **URL relevantes** | [Plantilla de solicitud de evento](https://github.com/achamorro-dev/eventoswiki/blob/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml) [raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |

## Event Garden

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Directorio comunitario en español para eventos y conferencias tecnológicas. |  |
| **Campos necesarios** | Formulario de alta de evento incluye campos: título (requerido), descripción en Markdown, idiomas (español/inglés), si es gratuito o de pago, fechas de inicio y fin con selección de hora, ubicación (remoto o país/ciudad), etiquetas principales (hay que elegir al menos una) y correo de contacto opcional[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **Campos opcionales** | Enlace a página principal del evento, imagen (subida o URL), etiquetas personalizadas y correo de contacto[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **Contribución** | Se realiza mediante formulario web; la página indica que el equipo revisa cada envío antes de publicarlo[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **Consumible estándar** | No se observó una API pública; el directorio muestra los datos en la web. |  |
| **Agregador** | No. |  |
| **URL relevantes** | [Formulario de nuevo evento](https://eventgarden.io/new-event) [eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |

## developers.events (Scraly/Developers‑Conferences‑Agenda)

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Repositorio colaborativo que lista conferencias con un enfoque comunitario y sus llamadas a ponencias. |  |
| **Campos necesarios y formato** | Las conferencias se añaden en el `README.md` usando el formato `* fecha: [Nombre de la conferencia](URL) – Ciudad, estado (País)`[raw.githubusercontent.com](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/master/CONTRIBUTING.md#:~:text=format%3A%20%60%60%60%20,Remove%20any%20trailing). El CSV `METADATA.csv` puede añadir el número de asistentes (`YYYY-MM-DD-Conference Name,attendees:NUMBER`)[raw.githubusercontent.com](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/master/CONTRIBUTING.md#:~:text=format%3A%20%60%60%60%20,Remove%20any%20trailing). |  |
| **JSON de eventos** | El sitio genera `all-events.json`, donde cada evento contiene campos: `name`, `date` (array de timestamps de inicio/fin), `hyperlink`, `location`, `city`, `country`, `misc`, objeto `cfp` (con URL y fechas), `closedCaptions`, `scholarship`, `sponsoringBadge`, `status` y `tags`[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta). El archivo `all-cfps.json` lista llamadas a ponencias con campos: `link`, `until` (cadena de cierre), `untilDate` (timestamp) y un objeto `conf` con nombre, fechas, URL y ubicación[developers.events](https://developers.events/all-cfps.json#:~:text=%5B%7B%22link%22%3A%22https%3A%2F%2Fhashiconfeu.hashicorp.com%2F%23submit,31). |  |
| **Contribución** | A través de Pull Request siguiendo las reglas de `CONTRIBUTING.md`; se requiere que el evento sea una conferencia comunitaria y que tenga CFP. |  |
| **Consumible estándar** | JSON (all‑events.json y all‑cfps.json), además del README. |  |
| **Agregador** | No, aunque los datos pueden utilizarse en otros proyectos (CFP Tracker, CallingAllPapers). |  |
| **URL relevantes** | [directorio en GitHub](https://github.com/scraly/developers-conferences-agenda) y [all-events.json](https://developers.events/all-events.json) [developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta). |  |

## CFP Tracker (bendechrai/cfps)

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Aplicación web que permite a los ponentes hacer seguimiento de CFP y envío de propuestas. |  |
| **Fuentes de datos** | Agrega CFP de **Codosaurus**, Confs.tech, developers.events, joind.in, Leon Adato y Papercall.io[raw.githubusercontent.com](https://raw.githubusercontent.com/bendechrai/cfps/main/README.md#:~:text=desktop%20and%20mobile%20,0%20or%20later). |  |
| **Campos requeridos** | La documentación pública no detalla el formato; el proyecto es un agregador que consume los feeds de las fuentes mencionadas. |  |
| **Contribución** | No se ofrecen formularios; los datos provienen de otras fuentes. |  |
| **Consumible estándar** | Presenta la información en interfaz web y permite guardar el estado de las presentaciones localmente (en el navegador). |  |
| **Agregador** | Sí; es un agregador de múltiples fuentes de CFP[raw.githubusercontent.com](https://raw.githubusercontent.com/bendechrai/cfps/main/README.md#:~:text=desktop%20and%20mobile%20,0%20or%20later). |  |
| **URL relevantes** | [Repositorio CFP Tracker](https://github.com/bendechrai/cfps) y [web](https://cfp.bendechr.ai/). |  |

## Confs.tech

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Directorio de conferencias de tecnología de código abierto. |  |
| **Campos obligatorios (formulario)** | El formulario web para añadir conferencia solicita: idioma, temas (uno o varios), nombre de la conferencia (sin el año), URL, fechas de inicio y fin, tipo de evento (presencial/online/híbrido), país, URL de la llamada a ponencias (si existe), fecha de cierre del CFP, URL del código de conducta, casilla de interpretación en lengua de signos o subtítulos, cuentas de redes sociales (Bluesky, Mastodon, Twitter) y nombre de usuario de GitHub para contacto. _(Fuente: captura del formulario de alta; pendiente de URL verificable.)_ |  |
| **Campos opcionales** | Algunos campos como redes sociales, código de conducta y fechas de CFP se pueden dejar vacíos. |  |
| **Datos en JSON** | En el repositorio, cada conferencia se almacena en archivos JSON con campos `name`, `url`, `startDate`, `endDate`, `city`, `country`, `cfpUrl`, `cfpEndDate`, `bluesky`, `mastodon`, `twitter`[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the). |  |
| **Contribución** | Vía formulario web (genera un Pull Request) o directamente mediante PR en GitHub. |  |
| **Consumible estándar** | JSON (dentro del repositorio). |  |
| **Agregador** | No, aunque es utilizado por otros agregadores. |  |
| **URL relevantes** | Formulario nuevo, [README del repositorio](https://github.com/tech-conferences/confs.tech) [raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the). |  |

## CallingAllPapers

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Sitio que recopila llamadas a ponencias abiertas y publica recordatorios en redes sociales. |  |
| **Fuentes de datos** | Extrae información rastreando **joind.in**, Confs.tech, Papercall.io y Sessionize[callingallpapers.com](https://callingallpapers.com/#:~:text=To%20retrieve%20the%20list%20we,basis%20to%20find%20new%20CfPs). |  |
| **Campos disponibles (API)** | Su API pública devuelve una lista de CFP con campos: `name`, `uri` (enlace de presentación), `dateCfpStart`, `dateCfpEnd`, `location`, `latitude`, `longitude`, `description`, `dateEventStart`, `dateEventEnd`, `iconUri`, `eventUri`, `timezone`, `tags`, `sources`, `lastChange` y `_rel`[api.callingallpapers.com](https://api.callingallpapers.com/v1/cfp#:~:text=CFP%20%7BCall%20For%20Papers%7D%20,Edi%C3%A7%C3%A3o%20v21). |  |
| **Contribución** | No acepta envíos manuales; para aparecer hay que listar el CFP en alguna de las fuentes soportadas[callingallpapers.com](https://callingallpapers.com/#:~:text=To%20retrieve%20the%20list%20we,basis%20to%20find%20new%20CfPs). |  |
| **Consumible estándar** | JSON a través de la API pública. El sitio también ofrece un feed iCal. |  |
| **Agregador** | Sí; unifica datos de varias plataformas. |  |
| **URL relevantes** | [API de CallingAllPapers](https://api.callingallpapers.com/v1/cfp) [api.callingallpapers.com](https://api.callingallpapers.com/v1/cfp#:~:text=CFP%20%7BCall%20For%20Papers%7D%20,Edi%C3%A7%C3%A3o%20v21). |  |

## TechConf.Directory

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Repositorio que almacena conferencias y ponentes como archivos YAML. |  |
| **Campos en conferencias** | Cada archivo YAML incluye `title`, `website`, `tags`, y un diccionario `events` donde cada año contiene `dates` (`start` y `end`), `format` (presencial o en línea) y `location` (país y ciudad). También puede haber sección `socials` con cuentas de Bluesky, Fediverse, etc., y lista de etiquetas[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux). |  |
| **Campos en ponentes** | Los archivos de ponentes contienen `name`, `website`, secciones `socials` con identidades (Bluesky DID, YouTube, LinkedIn, etc.) y `location` (país y ciudad)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus). |  |
| **Contribución** | Se aceptan issues para solicitar inclusión de conferencias o ponentes; los mantenedores procesan las solicitudes[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/README.md#:~:text=starting%20a%20local%20development%20server,https%3A%2F%2Fgithub.com%2FDeclanChidlow%2Ftechco). |  |
| **Consumible estándar** | Los datos están en YAML en el repositorio; aún no se ofrecen APIs. |  |
| **Agregador** | No, pero se puede consumir por otros proyectos. |  |
| **URL relevantes** | [Repositorio techconf.directory](https://github.com/DeclanChidlow/techconf.directory) y archivos YAML (p. ej., `afup‑day‑bordeaux.yaml`)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux). |  |

## dev.events

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Portal que lista conferencias, meetups y hackathons de tecnología. |  |
| **Contribución** | Se puede añadir un evento mediante el botón _new event_; tras enviar el formulario, el equipo revisa y aprueba. Para que se agreguen automáticamente, el sitio detecta metadatos estructurados en la web del evento usando JSON‑LD[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |
| **Campos requeridos** | No se muestran públicamente todos los campos del formulario, pero el FAQ indica que un evento debe incluir fecha, ubicación, enlace de registro y algunos ponentes para comprobar la legitimidad[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |
| **Consumible estándar** | dev.events ofrece un feed RSS con las últimas cien conferencias, categorizadas mediante etiquetas[dev.events](https://dev.events/about#:~:text=subscribe%20to%20the%20RSS%20feed%2C,For%20example%2C%20%203%20this). |  |
| **Agregador** | Sí; obtiene aproximadamente 20 % de los eventos de fuentes automáticas y 80 % de contribuciones manuales[dev.events](https://dev.events/about#:~:text=The%20project%20is%20coded%20and,organizers%2C%20tech%20community%2C%20and%20volunteers). |  |
| **URL relevantes** | [FAQ dev.events](https://dev.events/about) [dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |

## Developer Events.org

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Directorio de eventos de TechForge que permite listar conferencias y ferias. |  |
| **Campos requeridos** | El formulario de envío solicita nombre y apellidos del remitente, correo electrónico, teléfono, título del evento, fechas de inicio y fin (MM/DD/AAAA), descripción del evento, URL de registro, enlaces a redes sociales (Twitter, Facebook, Instagram, YouTube, LinkedIn), logotipo del evento, fotos (hasta 50), y la ubicación completa (dirección, ciudad, estado, código postal, país)[developerevents.org](https://www.developerevents.org/submit-event/#:~:text=Name). |  |
| **Contribución** | Manual vía formulario web; los datos se revisan antes de publicar. |  |
| **Consumible estándar** | La información se muestra en la página web; no se indica una API. |  |
| **Agregador** | No. |  |
| **URL relevantes** | [Formulario de Developer Events](https://www.developerevents.org/submit-event/) [developerevents.org](https://www.developerevents.org/submit-event/#:~:text=Name). |  |

## Otros directorios y proyectos para investigar

Surgieron durante la investigación; pendientes de analizar en detalle (estado 🔲 en el inventario):

- **Sesamers** — plataforma comercial que lista eventos de startups/tecnología. Suscribirse permite filtrar por industria; habría que revisar sus campos y API.
- **Vendelu/Vendelux** — directorio de conferencias de marketing y tecnología. Puede ofrecer insights sobre campos de patrocinio.
- **LegalTechConference.com** — especializado en conferencias legales. Podría aportar campos específicos de sector (CLE credits, normativa).
- **StartUpPeople/FinDev Gateway** — ofrecen formularios de eventos con campos financieros.
- **iotevents.org / marketing-events.net** — portales temáticos de TechForge similares a Developer Events.org.
