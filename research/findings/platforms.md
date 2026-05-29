# Hallazgos — Plataformas

Plataformas que **crean y gestionan** eventos o llamadas a ponencias (CFP). Ver criterio común en [../README.md](../README.md).

## Meetup

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Meetup sirve para organizar eventos de grupos. Permite crear eventos sencillos y, para clientes Pro, gestionar llamadas a ponencias. | Artículo de ayuda de Meetup[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |
| **Campos necesarios (formulario)** | Al crear un evento desde la interfaz web se requieren: título (máx. 80 caracteres), fecha y hora de inicio, duración, descripción y ubicación (física u online). Para cuentas Pro se añade información de ponentes[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). | Documentación de Meetup[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |
| **Campos opcionales** | Imagen destacada, temas del grupo, anfitriones adicionales, cuotas de asistencia, recurrencia, lista de espera y preguntas a los asistentes[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |  |
| **API/formatos** | La API de Meetup usa GraphQL. La mutación `createEvent` requiere `groupUrlname`, `title`, `description`, `startDateTime`, `venueId`, `duration` y `publishStatus`[meetup.com](https://www.meetup.com/graphql/guide/#graphQl-guide#:~:text=mutation%28%24input%3A%20CreateEventInput%21%29%20,). Permite crear, editar, buscar y anunciar eventos[help.meetup.com](https://help.meetup.com/hc/en-us/articles/41455194927373-What-can-I-achieve-through-Meetup-s-API-and-what-are-its-limitations#:~:text=Meetup%E2%80%99s%20API%20allows%20Pro%20customers,and%20keep%20the%20platform%20secure). |  |
| **Contribución** | Se realiza vía interfaz web o mediante la API GraphQL si se dispone de credenciales (sobre todo para clientes Pro). |  |
| **Consumible estándar** | Meetup no ofrece un exportador estandarizado, pero la API devuelve objetos JSON a través de GraphQL. |  |
| **Agregador** | No, es una plataforma de eventos propia. |  |
| **URL relevantes** | Ayuda de Meetup — descripción de campos[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title); [Documentación GraphQL](https://www.meetup.com/meetup_api/) — mutación de creación[meetup.com](https://www.meetup.com/graphql/guide/#graphQl-guide#:~:text=mutation%28%24input%3A%20CreateEventInput%21%29%20,). |  |

## Sessionize

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Plataforma de gestión de ponencias y agenda para conferencias. Gestiona llamadas a ponentes (CFP), sesiones y ponentes. | Guía de Sessionize[sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page). |
| **Campos obligatorios** | En una llamada a ponentes se exigen por defecto: título de la sesión, descripción, nombre del ponente, correo electrónico, lema y biografía[sessionize.com](https://sessionize.com/playbook/fields-explained#:~:text=Some%20Submission%20fields%20are%20predefined,information%20would%20make%20little%20sense). Para añadir sesiones manualmente se requiere título de sesión, propietario y datos del ponente[sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page). |  |
| **Campos opcionales** | Los organizadores pueden añadir campos personalizados y marcarlos como obligatorios u opcionales[sessionize.com](https://sessionize.com/playbook/fields-explained#:~:text=Some%20Submission%20fields%20are%20predefined,information%20would%20make%20little%20sense). |  |
| **API/formatos** | Sessionize ofrece un API de solo lectura que devuelve sesiones, ponentes y salas en JSON o XML; también se puede exportar a iCalendar. Los endpoints se generan desde la página del evento y no suelen requerir autenticación[sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |
| **Contribución** | Las sesiones se aportan a través de formularios de CFP o manualmente. No hay API pública para crear eventos; la plataforma se centra en recolectar sesiones y ponentes. |  |
| **Consumible estándar** | JSON, XML e iCalendar[sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |
| **Agregador** | No, es una plataforma de gestión de conferencias. |  |
| **URL relevantes** | Guía para añadir sesiones [sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page); API de Sessionize [sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |

## Luma

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Plataforma orientada a eventos en línea e híbridos. Permite crear eventos, gestionar registros y comunicaciones. Ofrece API abierta. |  |
| **Campos necesarios (formulario)** | El formulario de Luma solicita: título, fecha y hora (con zona horaria), tipo de evento (presencial, en línea o híbrido), imagen de portada, ubicación física, descripción del evento, tema/área, calendario asociado y visibilidad (público/privado)[help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events). |  |
| **Campos opcionales** | Configuración de preguntas para el registro, co‑anfitriones, precios y capacidad, lista de espera y correo de confirmación[help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events). |  |
| **API/formatos** | El endpoint `POST /v1/event/create` de la API de Luma exige `name`, `start_at` y `timezone` como campos obligatorios; el resto (fin, descripción en Markdown, URL de portada, capacidad máxima, dirección, enlace de reunión, etc.) son opcionales[docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). La autenticación se realiza mediante cabecera `x-luma-api-key`[docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). |  |
| **Contribución** | Se pueden crear eventos vía interfaz web o mediante la API oficial. |  |
| **Consumible estándar** | La API devuelve JSON; la plataforma también expone eventos en iCalendar y webhooks. |  |
| **Agregador** | No. |  |
| **URL relevantes** | Guía para crear eventos en Luma [help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events); Especificación API [docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). |  |

## joind.in

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Plataforma comunitaria para eventos y charlas técnicas. Permite publicar eventos, charlas y recoger comentarios. |  |
| **Campos necesarios (API)** | Para enviar un evento a través del API se requieren: `name`, `description`, `location`, `start_date`, `end_date`, `tz_continent` y `tz_place`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **Campos opcionales** | `href` (URL del evento), `cfp_url`, `cfp_start_date`, `cfp_end_date` y `tags[]`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=You%20may%20also%20add%20any,all%20of%20these%20additional%20fields). |  |
| **Formato de evento (respuesta)** | La API devuelve JSON con campos como `name`, `url_friendly_name`, fechas, `description`, `stub`, `href`, `attendee_count`, `event_comments_count`, `tracks_count`, `talks_count`, `icon` y varias URIs (comentarios, charlas, tracks, asistentes, etc.)[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). En modo _verbose_ añade `latitude`, `longitude`, `tz_continent`, `tz_place`, `location`, `hashtag`, datos de CFP y `tags`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **Contribución** | Se realiza mediante la API REST autenticada; los eventos enviados por usuarios no administradores quedan pendientes de aprobación[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **Consumible estándar** | JSON (con posibilidad de ampliar campos con `verbose=yes`). |  |
| **Agregador** | No, pero es fuente de datos para otros. |  |
| **URL relevantes** | [Documentación de la API (eventos)](https://docs.joind.in/joindin-api/events.html) [docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |

## Papercall.io

| Aspecto | Información | Fuentes |
| --- | --- | --- |
| **Soporte** | Plataforma dedicada a gestionar llamadas a ponencias (Call for Proposals). |  |
| **Campos necesarios** | La guía de Papercall indica que al crear un CFP se deben elegir un nombre de evento, subir un logotipo e introducir los datos de la llamada (fechas de apertura y cierre). También ofrece una opción para anonimizar envíos y un campo para especificar si se cubren gastos de viaje[papercall.zendesk.com](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals#:~:text=Creating%20a%20New%20Call%20for,Proposals). |  |
| **Campos opcionales** | Se pueden añadir detalles adicionales del evento y configurar la visibilidad; la documentación pública no ofrece un listado completo de campos. |  |
| **Contribución** | Solo a través de la plataforma web; no hay API pública para crear eventos. |  |
| **Consumible estándar** | Los eventos se consumen desde la web; no hay exportación oficial, aunque algunos servicios extraen datos con scraping. |  |
| **Agregador** | No, pero es una fuente importante de CFP para varios agregadores. |  |
| **URL relevantes** | [Artículo "Creating a New Call for Proposals"](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals) [papercall.zendesk.com](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals#:~:text=Creating%20a%20New%20Call%20for,Proposals). |  |
