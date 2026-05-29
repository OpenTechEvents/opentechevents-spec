# Ejemplos — OTE Spec

> ⚠️ **Borrador inicial generado por IA, sin revisión humana todavía.**
> Ejemplos ilustrativos con **datos semi-inventados** (comunidades, personas, URLs y lugares ficticios o usados como muestra). Sirven solo para visualizar la pinta que tendría un evento en OTE Spec; ni los datos ni el formato son definitivos.

Ejemplos pensados para acompañar a [../data-model.md](../data-model.md) y cubrir casos distintos:

| Fichero | Caso | Qué muestra |
| --- | --- | --- |
| [minimal.json](minimal.json) | Evento online mínimo | Solo campos obligatorios + ubicación online. Lo mínimo viable. |
| [meetup.json](meetup.json) | Una sesión de un meetup híbrido | Ubicación física + online, referencia a comunidad con registro, `offers` gratis, `promotion`, `governance`. Es **una ocurrencia** concreta (el 29 de mayo), no la serie mensual. |
| [conference-cfp.json](conference-cfp.json) | Conferencia de varios días | Co-organización (lista de comunidades), módulo `cfp`, `speakers`, entradas de pago, `sponsors`, accesibilidad. |
| [feed.json](feed.json) | **Feed** suscribible | Colección de eventos con `scope` (pre-filtrado por `tag`/país) y paginación. Ver [../feed.md](../feed.md). |

Todos declaran `specVersion: "0.1.0"`.

## Notas

- Los dominios usan `.example` (reservado por RFC 2606) precisamente por ser ficticios.
- La identidad de la comunidad (`community.uri`) es un **URI global** (su URL canónica); el enlace a un registro como Community Builders es **opcional** (`registries`). Ver [../data-model.md](../data-model.md#separación-de-responsabilidades-evento-vs-comunidad).
