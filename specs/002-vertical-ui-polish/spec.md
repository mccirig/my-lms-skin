# Feature Specification: UI/UX polish del modo vertical

**Feature Branch**: `002-vertical-ui-polish`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Feature 002: UI/UX polish del modo vertical de BubbleSkin. Depende de specs/001-now-playing-display. Ajustar el modo vertical al diseño propuesto en refs/vertical.png y refs/status.png. El modo horizontal solo se toca para aplicar la misma paleta de colores."

## Clarifications

### Session 2026-10-14

- **Q**: Cuando la skin muestra un estado de error o vacío, ¿el título de la caja de status debe convertirse en el label de estado o mantenerse siempre "A continuación"?  
  **A**: El título cambia al label del estado, coincidiendo con `refs/status.png`.
- **Aclaración adicional**: Los colores de la paleta aplican a ambas orientaciones, vertical y horizontal. El viewport de 744x1133 es referencia visual; la regla del cover debe basarse en la proporción / aspect ratio, no en esos píxeles exactos. En modo vertical el tamaño del cover es adaptativo: se ajusta al ancho del viewport con márgenes, limita su alto al 60% del viewport y preserva su relación de aspecto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pantalla vertical completa con pista activa (Priority: P1)

Un usuario abre BubbleSkin en una pantalla orientada verticalmente (tablet, monitor girado, etc.) y ve la pista que está sonando. La pantalla muestra la portada grande, el título, artista, álbum, información técnica, barra de progreso y la caja de estado con la siguiente canción.

**Why this priority**: Es el caso de uso principal de esta feature y la base sobre la que se construyen los demás estados.

**Independent Test**: Se puede probar cargando la URL del skin en un viewport vertical con una pista en reproducción. Debe verse el cover, metadatos, progreso y caja "A continuación".

**Acceptance Scenarios**:

1. **Given** una pista en reproducción en el reproductor seleccionado, **When** se abre BubbleSkin en modo vertical, **Then** el cover ocupa el ancho con márgenes y su alto no supera el 60% del viewport.
2. **Given** la misma pantalla, **When** se observan los metadatos, **Then** se lee "título", "por artista", "de álbum (año)" y la línea técnica con tipo, bitrate, samplerate y posición total.
3. **Given** que hay más de una pista en la playlist, **When** se renderiza el status, **Then** la caja inferior muestra "A continuación" con la miniatura, título y artista del siguiente track.

---

### User Story 2 - Estados de error y vacío dentro de la caja de status (Priority: P2)

El usuario debe entender qué ocurre cuando no hay conexión, no hay reproducción o no hay siguiente pista, sin que la caja de status desaparezca o la pantalla se rompa visualmente.

**Why this priority**: Mejora la robustez percibida del skin y evita pantallas vacías o confusas en condiciones no ideales.

**Independent Test**: Se puede probar desconectando LMS, deteniendo la reproducción o vaciando la playlist. La caja de status debe seguir visible con el mensaje adecuado.

**Acceptance Scenarios**:

1. **Given** que el navegador pierde conexión con LMS, **When** el skin detecta el fallo, **Then** la caja de status muestra "Sin conexión con el servidor".
2. **Given** que el reproductor está detenido sin pista activa, **When** se carga la pantalla, **Then** la caja de status muestra "Nada en reproducción".
3. **Given** que la playlist solo tiene la pista actual, **When** se renderiza el status, **Then** la caja mantiene el título "A continuación" y muestra "Nada que reproducir".

---

### User Story 3 - Paleta de colores en modo horizontal (Priority: P3)

Un usuario abre BubbleSkin en una pantalla horizontal y observa que los colores coinciden con la nueva paleta, aunque la disposición general no cambie.

**Why this priority**: Garantiza coherencia visual entre orientaciones sin introducir rediseño en horizontal.

**Independent Test**: Se puede probar rotando o redimensionando el viewport a modo horizontal. El fondo, texto y barra deben usar los nuevos colores.

**Acceptance Scenarios**:

1. **Given** un viewport horizontal, **When** se carga la pantalla, **Then** el fondo es #252f3c, el texto principal es blanco y la barra de progreso usa #4e8dca.
2. **Given** el modo horizontal, **When** se compara con la versión anterior, **Then** no se observan regresiones de layout ni elementos desaparecidos.

### Edge Cases

- ¿Qué ocurre cuando el track actual no tiene portada? Debe mostrarse el placeholder existente o dejarse el espacio del cover.
- ¿Qué ocurre cuando faltan metadatos (tracknum, año, tipo, bitrate o samplerate)? La línea correspondiente se omite o simplifica sin romper la alineación.
- ¿Qué ocurre en viewports muy estrechos (< 360px) o muy altos? El cover sigue limitado al 60% de la altura y el texto permanece legible.
- ¿Qué ocurre cuando la pista cambia mientras se muestra un mensaje de status? El status se actualiza al estado correspondiente sin animaciones.
- ¿Qué ocurre cuando no hay track actual pero sí conexión? La caja de status muestra "Nada en reproducción".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En modo vertical, el cover debe ocupar el ancho disponible respetando los márgenes actuales y su alto máximo debe ser aproximadamente el 60% del alto del viewport, sin deformar la imagen. El viewport de referencia es 744x1133, pero la regla debe basarse en la proporción / aspect ratio, no en esos píxeles exactos.
- **FR-002**: La paleta de colores (#252f3c fondo, texto #ffffff, barra #4e8dca, fondo de barra #3a4046, fondo de status #263036) aplica a ambas orientaciones, vertical y horizontal.
- **FR-003**: El título de la canción debe mostrar el número de pista seguido de un punto medio y el título ("01 · Título"). Si no hay número de pista, solo se muestra el título.
- **FR-004**: Debajo del título debe mostrarse "por Artista".
- **FR-005**: Debajo del artista debe mostrarse "de Álbum (año)". Si no hay año, debe mostrarse "de Álbum".
- **FR-006**: Debajo del álbum debe mostrarse una línea técnica con formato "TIPO · BITRATE · SAMPLERATE · N DE M", sin indicador de remoto.
- **FR-007**: La barra de progreso debe mostrarse debajo de la línea técnica, con el tiempo transcurrido a la izquierda y el tiempo total a la derecha.
- **FR-008**: La caja de status debe permanecer siempre visible al final de la pantalla, con fondo #263036 y bordes redondeados.
- **FR-009**: El título de la caja de status cambia según el estado: "A continuación" cuando hay siguiente track, "Nada que reproducir" cuando no hay siguiente track, "Sin conexión con el servidor" cuando falla la conexión, y "Nada en reproducción" cuando no hay pista activa.
- **FR-010**: Cuando existe una siguiente pista, la caja de status debe mostrar el título "A continuación", una miniatura del cover siguiente del alto de las dos líneas de título/artista, y el título y artista del siguiente track.
- **FR-011**: Cuando no existe siguiente pista, la caja de status debe mostrar el título "Nada que reproducir".
- **FR-012**: Cuando el skin no puede comunicarse con LMS, la caja de status debe mostrar el título "Sin conexión con el servidor".
- **FR-013**: Cuando no hay una pista activa en el reproductor, la caja de status debe mostrar el título "Nada en reproducción".
- **FR-014**: El texto del título de la canción debe ser 100% opaco; artista, álbum, información técnica, tiempos y labels de status deben ser 50% opacos.
- **FR-015**: El modo horizontal debe aplicar la misma paleta de colores que el modo vertical sin rediseñar su layout.
- **FR-016**: La tipografía debe ser Roboto, con fallback a la fuente sans-serif del sistema.
- **FR-017**: Las actualizaciones de pista y datos deben ser instantáneas, sin animaciones de transición.
- **FR-018**: El ticker o marquee para textos largos debe seguir funcionando según lo definido en FR-012 de la feature 001.

### Key Entities

- **Track actual**: representa la pista en reproducción. Atributos relevantes: título, artista, álbum, año, número de pista, tipo, bitrate, samplerate, duración, tiempo transcurrido, índice en playlist, total de pistas, URL de cover.
- **Siguiente track**: representa la pista siguiente en la playlist. Atributos relevantes: título, artista, URL de cover.
- **Estado de conectividad**: indica si el navegador tiene conexión activa con LMS vía JSON-RPC o CometD.
- **Estado de reproducción**: indica si el reproductor tiene una pista activa (modo distinto a "stop" con playlist vacía).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un viewport vertical con proporción similar a 744x1133, el cover no excede el 60% de la altura visible y no presenta deformación de aspecto.
- **SC-002**: Todos los metadatos visibles (título, artista, álbum, año, tipo, bitrate, samplerate, posición y total) se actualizan para coincidir con la pista actual dentro de 1 segundo de recibir un evento de cambio.
- **SC-003**: La caja de status permanece visible y renderiza el estado correcto en al menos cuatro condiciones: pista activa con siguiente track, pista activa sin siguiente track, sin pista activa y sin conexión con el servidor.
- **SC-004**: El diseño vertical mantiene legibilidad y no genera scroll en viewports entre 320px y 1200px de ancho, con altos típicos de tabletas y monitores verticales.
- **SC-005**: En modo horizontal, la misma paleta de colores del modo vertical se aplica correctamente y no se introducen regresiones visuales comparado con la versión anterior.

## Assumptions

- Los datos de número de pista, año, tipo, bitrate y samplerate pueden estar ausentes en algunos tracks; la interfaz se adapta omitiendo esos segmentos sin dejar huecos visuales.
- El modo horizontal no requiere reestructuración de layout en esta iteración; solo se actualizan colores.
- La fuente Roboto se servirá de forma autocontenida (siguiendo el principio II de la constitución: sin CDN) o se usará un stack de fuentes del sistema como fallback.
- El idioma de los labels fijos ("por", "de", "A continuación", "Nada que reproducir", etc.) se define mediante tokens de internacionalización en strings.txt EN/ES.
- El ticker para textos largos se reutiliza sin cambios funcionales de la feature 001.
- No se modifican los contratos de datos ni los canales de comunicación con LMS (JSON-RPC y CometD).
