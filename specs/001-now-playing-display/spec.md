# Feature Specification: Pantalla "Now Playing" para display dedicado

**Feature Branch**: sin rama (extensión git no instalada) · **Feature Directory**: `specs/001-now-playing-display`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "BubbleSkin v1.0: pantalla 'Now Playing' para display dedicado (modo kiosk). Skin de una sola pantalla, de solo lectura, para mostrar en una pantalla fija qué está sonando en un reproductor de Lyrion Music Server, con información técnica del track, barra de progreso, carátula, tiempo transcurrido y bloque 'a continuación', con actualización en tiempo real y sin controles. La página principal del skin pasa a ser esta pantalla; la UI demo actual se descarta."

## Clarifications

### Session 2026-10-12

- Q: ¿Qué comportamiento tienen los textos que superan el ancho del viewport (título, álbum, datos técnicos, etc.)? → A: ticker animado: se desplazan lentamente de derecha a izquierda; cuando alcanzan el último carácter esperan unos milisegundos y reaparecen instantáneamente en la posición inicial (primer carácter visible a la izquierda).
- Q: ¿Debe soportar formato vertical y con qué disposición de componentes? → A: sí, formatos verticales (9:16, 3:4, etc.) con distribución tipo player estándar: portada arriba ocupando el ancho del viewport con márgenes de seguridad, nombre del track y álbum debajo, barra de progreso debajo, y bloque inferior de información/estado que muestra entre otras cosas "a continuación".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver qué suena ahora desde lejos (Priority: P1)

Una persona sentada en el sofá mira la pantalla dedicada y ve de inmediato la carátula
grande del álbum, el título del track, el artista, el álbum, y una barra de progreso con
el tiempo transcurrido y la duración total. La pantalla tiene fondo oscuro, alto contraste
y tipografía grande, legible a 2-3 metros.

**Why this priority**: Es la función esencial del producto. Sin ella el skin no tiene
valor; con solo ella ya existe un MVP demostrable.

**Independent Test**: Con un track sonando en el reproductor, abrir la pantalla en un
navegador y comprobar visualmente que todos los elementos son visibles y legibles a
distancia; entrega valor por sí sola como "display de reproducción estático".

**Acceptance Scenarios**:

1. **Given** un reproductor reproduciendo un track con carátula, **When** se abre la
   pantalla, **Then** se ven carátula prominente (≥ 40 % del alto visible), título,
   artista, álbum y barra de progreso con tiempos.
2. **Given** un track sin carátula, **When** se abre la pantalla, **Then** se muestra un
   placeholder neutro en el lugar de la carátula y el resto de elementos intactos.
3. **Given** un track con título o artista muy largos, **When** se muestra la pantalla,
   **Then** esos textos se desplazan lentamente como ticker (derecha→izquierda), sin romper
   el layout; los textos que caben permanecen estáticos.
4. **Given** una pantalla en vertical (9:16, 3:4…), **When** se muestra la pantalla,
   **Then** la disposición es tipo player estándar: carátula arriba ocupando el ancho del
   viewport con márgenes de seguridad, nombre del track y álbum debajo, barra de progreso
   después, y bloque inferior de información/estado que incluye "a continuación".

---

### User Story 2 - La pantalla se actualiza sola (Priority: P2)

La pantalla refleja en tiempo real lo que ocurre en el servidor: cambios de pista,
pausa/reanudación y avance del tiempo de reproducción aparecen sin recargar la página y
sin que nadie toque la pantalla, en menos de ~2 segundos.

**Why this priority**: Un display que se queda congelado pierde su propósito. Es la
segunda pieza de valor tras mostrar el estado, y convierte la pantalla en un display vivo.

**Independent Test**: Con la pantalla abierta, cambiar de pista (o pausar) desde el
servidor u otro cliente, y comprobar que la pantalla refleja el cambio en ≤ 2 segundos.

**Acceptance Scenarios**:

1. **Given** la pantalla mostrando un track, **When** otro cliente cambia de pista,
   **Then** en ≤ 2 s la pantalla muestra la nueva pista sin recarga.
2. **Given** un track sonando, **When** se pausa el reproductor, **Then** la barra de
   progreso se detiene y aparece una indicación visual de pausa en ≤ 2 s.
3. **Given** el reproductor detenido con cola vacía, **When** se abre la pantalla,
   **Then** se muestra un estado "nada en reproducción" presentable.

---

### User Story 3 - Conocer la calidad técnica del track (Priority: P3)

Un oyente técnico ve en pantalla los datos del archivo o stream en curso: codec, bitrate,
sample rate, profundidad de bits, y si es contenido local o remoto.

**Why this priority**: Diferenciador clave del producto (los displays habituales no lo
muestran), pero la pantalla ya es útil sin este bloque.

**Independent Test**: Reproducir un archivo local de alta resolución y una emisora de
radio, y comprobar que cada uno muestra sus datos técnicos disponibles y que los datos
ausentes simplemente no aparecen.

**Acceptance Scenarios**:

1. **Given** un archivo local FLAC 24/96 sonando, **When** se muestra la pantalla,
   **Then** se ven codec, bitrate, sample rate, bits y origen "local".
2. **Given** una emisora de radio, **When** se muestra la pantalla, **Then** se ven los
   datos técnicos disponibles (p. ej. codec, bitrate, origen "remoto") y se omiten los
   no reportados por el servidor, sin huecos rotos en el layout.

---

### User Story 4 - Saber qué viene a continuación (Priority: P3)

En la parte inferior aparece un bloque discreto "a continuación" con el siguiente track
de la cola, cuando existe.

**Why this priority**: Complemento agradable pero prescindible; la pantalla funciona sin él.

**Independent Test**: Con una cola de ≥ 2 pistas, comprobar que se muestra el siguiente
track; con cola de 1 pista (o radio), comprobar que el bloque no aparece y el layout no
queda roto.

**Acceptance Scenarios**:

1. **Given** una cola con más pistas, **When** se muestra la pantalla, **Then** el bloque
   "a continuación" muestra título y artista del siguiente track.
2. **Given** radio en directo o cola sin siguiente pista, **When** se muestra la pantalla,
   **Then** el bloque "a continuación" no se muestra.

---

### User Story 5 - Elegir qué reproductor mostrar (Priority: P3)

El administrador del display decide qué reproductor muestra la pantalla mediante un
parámetro en la URL; no hay ninguna UI de configuración.

**Why this priority**: El caso principal (un display por sala) funciona con el valor por
defecto; la selección por URL cubre hogares con varios reproductores sin añadir UI.

**Independent Test**: Abrir la pantalla con el parámetro de cada reproductor y comprobar
que muestra el correcto; abrirla sin parámetro y comprobar el comportamiento por defecto.

**Acceptance Scenarios**:

1. **Given** dos reproductores conectados, **When** se abre la pantalla con el parámetro
   URL del segundo, **Then** la pantalla muestra el estado del segundo reproductor.
2. **Given** ningún parámetro en la URL, **When** se abre la pantalla, **Then** muestra el
   primer reproductor disponible según el orden del servidor.
3. **Given** un parámetro con identificador inexistente, **When** se abre la pantalla,
   **Then** se muestra un estado de "reproductor no encontrado" legible, sin error técnico.

---

### Edge Cases

- **Servidor inalcanzable o pantalla desconectada temporalmente**: se muestra un estado de
  "sin conexión" discreto y la pantalla se recupera sola al volver la conexión.
- **Stream de radio sin duración conocida**: no se muestra barra/porcentaje de progreso;
  se muestra el tiempo transcurrido si el servidor lo reporta; el bloque "a continuación"
  puede no existir.
- **Pausa prolongada**: la barra de progreso permanece detenida con la indicación de pausa
  visible; no hay parpadeos ni re-renderizados visibles.
- **Datos técnicos parcialmente ausentes** (p. ej. bitrate desconocido): el campo se omite;
  nunca se muestra un valor vacío, "null", "0 kbps" ni similar.
- **Reproductor apagado o desconectado tras abrir la pantalla**: estado presentable de
  "reproductor no disponible".
- **Carátula remota lenta**: placeholder mientras carga; sin saltos bruscos de layout.
- **Cambio de pista con ticker activo**: el desplazamiento de textos se reinicia a la
  posición inicial con el nuevo texto; no continúa desde el estado del texto anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla DEBE mostrar la carátula del álbum con prominencia visual
  (≥ 40 % del alto visible en la resolución de referencia).
- **FR-002**: La pantalla DEBE mostrar título, artista y álbum del track actual.
- **FR-003**: La pantalla DEBE mostrar los datos técnicos disponibles del track: codec,
  bitrate, sample rate, profundidad de bits y origen (local/remoto). Los datos no
  reportados por el servidor se omiten sin dejar huecos.
- **FR-004**: Para tracks con duración conocida, la pantalla DEBE mostrar una barra de
  progreso con tiempo transcurrido y duración total.
- **FR-005**: Para streams sin duración conocida, la pantalla NO DEBE mostrar progreso
  porcentual; DEBE mostrar el tiempo transcurrido si el servidor lo reporta.
- **FR-006**: La pantalla DEBE mostrar un bloque inferior "a continuación" con título y
  artista del siguiente track cuando la cola contenga uno, y ocultarlo en caso contrario.
- **FR-007**: La pantalla DEBE reflejar los cambios del servidor (nueva pista,
  pausa/reanudación, detención) en ≤ 2 segundos, sin recarga de página ni interacción del
  usuario, y el tiempo de reproducción DEBE avanzar visiblemente en pantalla.
- **FR-008**: La pantalla DEBE seleccionar el reproductor mostrado mediante un parámetro
  de la URL; sin parámetro, muestra el primer reproductor disponible según el orden del
  servidor.
- **FR-009**: Con el reproductor detenido o la cola vacía, la pantalla DEBE mostrar un
  estado "nada en reproducción" presentable.
- **FR-010**: En pausa, la barra de progreso DEBE detenerse y DEBE existir una indicación
  visual de pausa.
- **FR-011**: La pantalla DEBE mostrar un placeholder neutro cuando el track no tenga
  carátula.
- **FR-012**: TODO texto mostrado que exceda el ancho disponible (título, artista, álbum,
  datos técnicos, bloque "a continuación") DEBE comportarse como un ticker animado:
  desplazamiento lento y constante de derecha a izquierda; al alcanzar el último carácter,
  pausa de unos milisegundos y reaparición instantánea en la posición inicial (primer
  carácter visible a la izquierda). Los textos que caben NO se desplazan y NUNCA se usa
  ellipsis. Al cambiar de pista, el ticker vuelve a la posición inicial.
- **FR-013**: La pantalla NO DEBE contener ningún control interactivo visible ni accesible
  por teclado o ratón (sin transporte, volumen ni navegación).
- **FR-014**: TODOS los recursos de la pantalla DEBEN ser servidos por el propio servidor
  local; la pantalla DEBE funcionar sin acceso a internet.
- **FR-015**: La pantalla DEBE ser legible a 2-3 metros: tipografía grande, alto contraste
  y fondo oscuro.
- **FR-016**: La pantalla DEBE soportar dos familias de relación de aspecto, seleccionadas
  según el viewport (vertical cuando alto ≥ ancho, horizontal en caso contrario):
  - **Horizontal (referencia 16:9)**: la disposición original de esta especificación.
  - **Vertical (9:16, 3:4, etc.)**: disposición tipo player estándar — carátula en la parte
    superior ocupando el ancho del viewport con márgenes de seguridad (sin tocar los bordes);
    nombre del track y álbum debajo de la carátula; barra de progreso debajo; y en la parte
    inferior un bloque de información/estado que incluye como mínimo el "a continuación".
  En ambas familias NO debe haber scroll ni elementos cortados.

### Key Entities *(include if feature involves data)*

- **Reproductor**: identidad (id, nombre), estado de reproducción (play/pausa/stop),
  disponibilidad. La pantalla muestra exactamente uno.
- **Track actual**: metadatos (título, artista, álbum), duración, posición, datos técnicos
  (codec, bitrate, sample rate, bits), referencia de carátula, origen (local/remoto).
- **Siguiente track**: metadatos básicos (título, artista); existe solo si la cola tiene
  un ítem tras el actual.
- **Cola/estado de reproducción**: posición dentro de la cola y modo del reproductor;
  relaciona track actual con el siguiente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los cambios de pista, pausa o detención hechos desde otro
  cliente se reflejan en la pantalla en ≤ 2 segundos, sin recarga ni interacción.
- **SC-002**: El título y el artista del track son legibles sin esfuerzo a 3 metros en una
  pantalla 16:9 de 24" o mayor, verificado con prueba visual.
- **SC-003**: Un recorrido de tabulación completa no encuentra ningún elemento
  interactivo (verificación del requisito "sin controles").
- **SC-004**: La pantalla carga y funciona al 100 % con el dispositivo desconectado de
  internet (todos los recursos servidos localmente).
- **SC-005**: Todos los casos especiales documentados (detenido, pausa, sin carátula,
  radio sin duración, textos largos con ticker activo, sin siguiente pista, sin conexión)
  se renderizan sin romper el layout.
- **SC-006**: El plugin instalado desde el repositorio oficial en LMS 8.0 o superior sirve
  la pantalla en la URL del skin.
- **SC-007**: En viewports verticales 9:16 y 3:4, la pantalla presenta la disposición
  definida en FR-016 (carátula arriba a todo ancho con márgenes, metadatos, progreso y
  bloque inferior de estado) sin scroll, solapes ni elementos cortados.

## Assumptions

- Sin parámetro de reproductor en la URL, se usa el primer reproductor listado por el
  servidor; el orden es el que el servidor ya define (no se inventa uno propio).
- Los datos técnicos provienen de los metadatos que ya expone el servidor para el track en
  curso; cuando un dato no existe, su campo se omite (regla FR-003).
- El usuario abre la pantalla en un navegador a pantalla completa por sí mismo; el arranque
  del equipo del kiosk y el auto-arranque del navegador quedan fuera del producto.
- El placeholder de carátula y cualquier etiqueta visible usan textos traducibles con
  idioma inglés como base (EN) y español (ES) incluido.
- Los tiempos se formatean `mm:ss` (o `h:mm:ss` si la duración supera la hora).
- Fuera de alcance en v1.0: controles de transporte y volumen, navegación de biblioteca,
  búsqueda, gestión de cola y playlists, ajustes en pantalla, visualización
  multi-reproductor simultánea, y cualquier UI de configuración.
- La UI demo actual (controles y lista de álbumes) se retira: la página principal del skin
  pasa a ser esta pantalla.
