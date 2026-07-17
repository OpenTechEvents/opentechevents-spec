# OpenTechEvents — OTE Spec

> 🌐 **[opentechevents.org](https://opentechevents.org)** — web del proyecto (código en [`docs/`](docs/)).

Una especificación estándar y abierta para describir, publicar y compartir **eventos de comunidades tecnológicas** (meetups, conferencias, talleres, eventos online y presenciales).

El objetivo es ofrecer un formato único al que cualquier comunidad pueda adherirse, que se adapte a todos los formatos de evento y que sea altamente compatible con estándares y herramientas ya existentes (RSS, iCalendar, etc.), de modo que publicar y descubrir eventos deje de ser un trabajo manual y repetitivo.

La propuesta nace desde [**Community Builders (ComBuildersES)**](https://github.com/ComBuildersES) y vive ya en su propia organización, [**OpenTechEvents**](https://github.com/OpenTechEvents), con vocación internacional: aunque impulsada inicialmente desde la comunidad hispana, la especificación se diseña para ser usable por cualquier comunidad del mundo.

---

## El problema

Cada vez hay **más plataformas, más directorios y más herramientas** para crear y comunicar eventos, y cada vez es más accesible montar herramientas personalizadas. Esto, que en principio es positivo, tiene un contrapunto importante:

- **Los eventos están cada vez más diluidos y dispersos.** La información vive fragmentada en Meetup, Eventbrite, LinkedIn, webs propias, repositorios de GitHub, formularios de terceros, etc.
- **Para quien organiza/dinamiza**, dar difusión a un evento es cada vez más complejo: hay que dar de alta el mismo evento en múltiples plataformas, con formatos distintos, lo que multiplica el esfuerzo y el mantenimiento.
- **Para quien asiste**, mantenerse al día exige monitorizar muchas plataformas y directorios distintos para no perderse nada.

No falta información: falta **interoperabilidad**.

## La propuesta

Una especificación estándar que permita:

1. **Describir un evento una sola vez**, en un formato único y bien definido.
2. **Automatizar la difusión** de ese evento hacia múltiples directorios y plataformas a la vez.
3. **Transformar esos datos** a estándares ya consolidados (RSS, iCalendar…) para que sean compatibles, sin fricción, con las herramientas que la gente ya usa.

La idea: que una comunidad publique sus datos una vez y un ecosistema de herramientas se encargue del resto —ingerir, exportar, transformar y publicar— en cada destino.

## Principios de diseño

- **Universal por formato.** Debe servir igual para un meetup recurrente, una conferencia de varios días, un evento online o uno híbrido.
- **Compatibilidad ante todo.** Pensada para convivir y mapearse fácilmente a estándares existentes (RSS, iCalendar/ICS, JSON-LD / schema.org `Event`, etc.).
- **Fácil de adoptar.** Baja barrera de entrada para comunidades pequeñas; sin imponer herramientas concretas.
- **Reutilizable y automatizable.** Diseñada desde el principio para alimentar un ecosistema de herramientas de import/export y publicación.
- **Abierta.** Sin restricciones de uso, siguiendo la filosofía de estándares como RSS o iCalendar.

## Ecosistema de herramientas (visión)

Una vez estabilizada la especificación, el objetivo es construir un ecosistema que resuelva los problemas anteriores. Casos de uso previstos:

- **Importar / ingerir** eventos desde fuentes existentes hacia el formato OTE.
- **Exportar / transformar** a RSS, iCalendar y otros formatos compatibles.
- **Automatizar la publicación** en múltiples destinos: Meetup, LinkedIn, Eventbrite, repositorios de GitHub que aceptan *Pull Requests*, webs con formularios de alta, etc.

👉 El catálogo vivo de herramientas se mantiene en la [web](https://opentechevents.org/#tools) desde [`docs/data/tools.json`](docs/data/tools.json).

## La especificación

👉 **[OTE Spec v0.1](spec/v0.1/README.md)** — schemas ejecutables (JSON Schema 2020-12), prosa normativa y ejemplos validados en CI.

```bash
npm install @opentechevents/schema
```

```text
https://opentechevents.org/schema/v0.1/event.schema.json
https://opentechevents.org/schema/v0.1/feed.schema.json
```

> 🚧 **`0.x` puede romper sin previo aviso.** Se publica para que existan implementaciones reales —empezando por el importador de `.ics`— y para que rompan lo que esté mal. El debate sigue abierto en los issues [#5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

¿Tienes un feed y quieres comprobarlo? `npm run validate -- mi-feed.json`.

## Estado del proyecto

🚧 **Fase inicial.** Existe una **v0.1 implementable** y el trabajo se centra ahora en **construir sobre ella** (el agregador y su importador de `.ics`) para descubrir qué está mal. El nombre, el alcance y la gobernanza siguen siendo provisionales y abiertos a debate; la [licencia](#licencia) ya está decidida.

## Roadmap

1. ✅ **Investigación inicial** — análisis de estándares existentes (RSS, iCalendar, schema.org/Event…), plataformas y casos de uso reales. → [research/](research/README.md)
2. ✅ **v0.1 de la especificación** — modelo de datos mínimo, JSON Schema ejecutable y ejemplos. → [spec/v0.1/](spec/v0.1/README.md)
3. 🔜 **Validación con implementaciones reales** — el [agregador](https://github.com/OpenTechEvents/opentechevents-data) y su importador de `.ics` son el banco de pruebas: si el modelo no soporta una ingesta real, el modelo está mal. De ahí saldrá la v0.2.
4. 🔜 **Adopción** — comunidades publicando feeds y directorios consumiéndolos. Sin datos reales, el estándar es teoría.
5. 🔜 **Ecosistema de herramientas** — ingesta, transformación y publicación automatizada. → [catálogo en la web](https://opentechevents.org/#tools)

## Estructura del repositorio

> El repositorio crecerá a medida que avance el proyecto. Estructura prevista:

- `README.md` — este documento.
- `CONTRIBUTING.md` — cómo participar en el diseño de la especificación.
- `research/` — resultados de la investigación inicial: análisis de plataformas, directorios y estándares.
- `spec/` — la especificación. Por ahora un **borrador inicial** del modelo de datos para ilustrar la idea.
- `docs/data/` — datos que alimentan la web pública: adoptantes, consumidores y catálogo de herramientas.

## De qué depende el éxito

Un estándar no vale por estar bien escrito, sino por **cuánta gente lo usa**. Es un efecto de red: cada comunidad, herramienta y difusión suma valor para todas las demás. El éxito de OTE depende de:

- **Una buena especificación, definida con apoyo.** Que cubra las necesidades reales de los distintos formatos y comunidades, diseñada de forma abierta y con suficientes manos y puntos de vista. Una spec pobre no la adopta nadie.
- **Adopción por comunidades y plataformas.** Que la implementen de verdad: que publiquen sus eventos en este formato (que expongan el esquema/feed) y que las plataformas y directorios lo acepten como entrada/salida. Sin datos reales, el estándar es teoría.
- **Un ecosistema de herramientas amplio y versátil.** Cuantas más herramientas existan —para ingerir, exportar, transformar, validar y publicar—, más fácil y atractivo es adoptarlo. La cantidad **y** la versatilidad importan: cubrir más plataformas, formatos y casos de uso baja la barrera de entrada.
- **Difusión.** Que se hable de él: blogs, charlas en meetups y conferencias, documentación, ejemplos. Una vía concreta y de bajo coste: que las webs que lo adopten muestren un **logo/badge** enlazando a la URL donde se puede **consumir su feed** (como en su día los botones de RSS), haciendo visible el estándar y facilitando que otros lo descubran y reutilicen.

Estas piezas se refuerzan entre sí: más adopción atrae más herramientas, más herramientas facilitan la adopción, y la difusión alimenta ambas. Por eso el [roadmap](#roadmap) prioriza primero una **buena especificación** y, sobre ella, el **ecosistema** y su **difusión**.

## Organización y gobernanza

Esta propuesta se impulsa desde [Community Builders (ComBuildersES)](https://github.com/ComBuildersES) y tiene ya **casa propia**: la organización [OpenTechEvents](https://github.com/OpenTechEvents) en GitHub y el dominio [opentechevents.org](https://opentechevents.org).

La estructura prevista dentro de la organización:

- este repositorio para **la especificación**, la web y los proyectos/comunidades adheridos a ella,
- posiblemente otro para **los datos**,
- y repositorios independientes para las **diferentes herramientas** del ecosistema.

El reparto exacto de repos y el modelo de gobernanza a largo plazo siguen abiertos: forma parte de lo que queremos consensuar con la comunidad.

## Preguntas frecuentes (FAQ)

**¿Qué es OTE exactamente?**
Una **especificación** (un formato de datos), no una plataforma ni una app. Define cómo describir un evento para que sea reutilizable e interoperable.

**¿Compite con Meetup, Eventbrite, Luma…?**
No. El objetivo es **interoperar** con ellas: describir el evento una vez y poder publicarlo/transformarlo hacia esas plataformas y directorios, no sustituirlas.

**¿Reemplaza a RSS o iCalendar?**
No. OTE se diseña para ser **compatible** y convertible a esos estándares. Un feed OTE puede exportarse a RSS, JSON Feed o iCal para consumirse con las herramientas que ya usas (lector RSS, app de calendario).

**¿Tengo que abandonar mis herramientas actuales?**
No. La idea es justo la contraria: que tus datos fluyan hacia las herramientas y plataformas que ya usas.

**Como comunidad, ¿qué gano adhiriéndome?**
Publicar tus eventos **una sola vez** y automatizar su difusión a múltiples directorios y plataformas, en lugar de dar de alta cada evento manualmente en cada sitio.

**Como asistente/usuario, ¿qué gano?**
Poder **suscribirte a feeds** y filtrar los eventos que te interesan, sin vigilar decenas de plataformas y directorios por separado.

**¿Esto es de Community Builders? ¿Es un estándar oficial ya?**
Lo impulsa [Community Builders](https://github.com/ComBuildersES) con vocación internacional y se desarrolla en su propia organización, [OpenTechEvents](https://github.com/OpenTechEvents), pero **no es un estándar oficial ni estable todavía**: está en fase de diseño y todo es provisional.

**¿Está listo para usarse en producción?**
Todavía no. Estamos diseñando la especificación (versión `0.x`, inestable). El [borrador del modelo](spec/) es ilustrativo y cambiará.

**¿Qué relación tiene con el directorio de comunidades de Community Builders?**
OTE describe **eventos**; el directorio describe **comunidades** (organizadores). Un evento *referencia* a su comunidad por un identificador global, sin acoplarse a ningún directorio concreto. Ese directorio es un **registro compatible** de referencia, no un requisito.

**¿Cómo puedo participar?**
Ver [Cómo contribuir](#cómo-contribuir).

## Cómo contribuir

El proyecto está en fase de diseño y **toda aportación es bienvenida**: experiencias, necesidades de tu comunidad, referencias de estándares y propuestas concretas. Lo que más falta ahora son **casos reales que rompan el modelo** y **comunidades dispuestas a publicar un feed**.

👉 Léete [**CONTRIBUTING.md**](CONTRIBUTING.md): explica cómo debatir la spec, cómo adherirse, cómo aparecer en la web y cómo reclamar una herramienta del ecosistema.

## Contribuidores

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contribuidores)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Gracias a todas las personas que contribuyen a este proyecto ([clave de emojis](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hhkaos"><img src="https://avatars.githubusercontent.com/hhkaos?s=100" width="100px;" alt="hhkaos"/><br /><sub><b>hhkaos</b></sub></a><br /><a href="#ideas-hhkaos" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-hhkaos" title="Research">🔬</a> <a href="#doc-hhkaos" title="Documentation">📖</a> <a href="#projectManagement-hhkaos" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

Este proyecto sigue la especificación [all-contributors](https://github.com/all-contributors/all-contributors): se reconoce **cualquier tipo de contribución**, no solo código.

## Licencia

Dos licencias, ambas permisivas. Detalle y motivos en [LICENSE](LICENSE).

- **La especificación** (prosa, investigación, web): [**CC0-1.0**](LICENSES/CC0-1.0.txt) — dominio público. Implementar un estándar no debería exigir permiso ni atribución a nadie.
- **Los schemas y el código**: [**MIT**](LICENSES/MIT.txt). No van en CC0 porque **CC0 no concede derechos de patente explícitos** y hay políticas corporativas que prohíben consumir código bajo esa licencia — justo la barrera que no queremos delante de quien quiera implementar OTE.

**La licencia de tus datos es otra cosa** y la eliges tú, en el campo `license` de cada evento o feed. La spec recomienda **`CC-BY-4.0`** (cubre el derecho *sui generis* de bases de datos de la UE, cosa que la 3.0 no hace) o **`CC0-1.0`**. Desaconseja las licencias *share-alike* (`CC-BY-SA`, `ODbL`): contagian la obligación a cualquier feed agregado que incluya tus eventos e impiden que otros directorios los reutilicen.
