# Ejemplos — OTE Spec

> ⛔ **Superado por [OTE Spec v0.1](../v0.1/README.md).** Este documento es el boceto previo, no normativo. Se conserva por las ideas que aún no han entrado en la spec.

> ⚠️ **Borrador inicial generado por IA, sin revisión humana todavía.**
> Ejemplos ilustrativos con **datos semi-inventados** (comunidades, personas, URLs y lugares ficticios o usados como muestra). Sirven solo para visualizar la pinta que tendría un evento en OTE Spec; ni los datos ni el formato son definitivos.
>
> 🗣️ **Estos ejemplos siguen al [modelo de datos](../data-model.md) actual, que a su vez está en discusión en el [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5).**
> Varios de ellos **dejarán de ser válidos** cuando se cierre ese debate (obligatoriedad de `id`/`license`, `source`, `attendanceMode` sin valor por defecto, forma de las fechas, `camelCase` vs. `snake_case`). No los tomes como referencia normativa ni los alinees a mano: el hilo del issue manda.

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
