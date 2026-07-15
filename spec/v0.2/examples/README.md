# Ejemplos — OTE Spec v0.1

Todos **se validan en CI** contra [`../event.schema.json`](../event.schema.json) y [`../feed.schema.json`](../feed.schema.json). Si dejan de validar, el build falla. Cópialos con confianza.

| Fichero | Qué ilustra |
| --- | --- |
| [`event-minimal.json`](event-minimal.json) | Lo mínimo que la spec exige. Nada más. |
| [`event-from-ics.json`](event-from-ics.json) | Evento **importado de un `.ics`**: sin `url`, con `source` y **sin `attendanceMode`** — porque iCalendar no sabe expresarlo, y callarse es más honesto que inventar. Muestra los campos que la v0.2 añade desde iCal: `tags` (← `CATEGORIES`), `location.geo` (← `GEO`) y `updatedAt` (← `LAST-MODIFIED`). |
| [`event-all-day.json`](event-all-day.json) | Evento de **varios días completos**: `startDate`/`endDate` como fechas, sin hora. |
| [`event-meetup.json`](event-meetup.json) | Meetup híbrido, con extensiones (ver abajo). |
| [`event-conference-cfp.json`](event-conference-cfp.json) | Conferencia con **CFP abierto** y precio, ambos como extensiones. |
| [`feed.json`](feed.json) | Un **feed**: sus eventos heredan `specVersion` y `license` del feed. |
| [`invalid/`](invalid/) | Documentos que **deben ser rechazados**. El CI falla si el validador los acepta: un schema que solo acepta no es un schema. |

## Campos en discusión (extensiones)

`event-meetup.json` y `event-conference-cfp.json` usan campos que **NO forman parte de la v0.2**:

| Campo | Estado |
| --- | --- |
| `cfp` | 🗣️ En discusión — [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) |
| `offers` (precio, aforo, registro) | 🗣️ En discusión |
| `community` | 🗣️ En discusión |
| `image` | 🗣️ En discusión |

> `tags` **ya es normativo en la v0.2** (mapea a `CATEGORIES` de iCal). Entró justo por esta vía: un campo que un consumidor real —el agregador— ya usaba. Ver el [CHANGELOG](../../../CHANGELOG.md).

**Y aun así esos documentos son válidos.** No es un descuido: **los schemas de OTE no prohíben campos adicionales**, a propósito. Si tu comunidad necesita `tags` hoy, los pones y tu feed sigue validando; un consumidor que no los entienda puede ignorarlos sin romperse.

Esa es la vía por la que la spec debe crecer: **campos que alguien ya usa de verdad**, no campos que imaginamos que harán falta. Los nombres y las formas que ves aquí son **una propuesta**, no un compromiso — pueden cambiar al estandarizarse.

👉 **Si los usas, dilo en el [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5)**. El uso real es el argumento que hace avanzar un campo; una petición sin caso detrás, no.

## Validar los tuyos

```bash
npm install
npm run validate -- mi-feed.json
```
