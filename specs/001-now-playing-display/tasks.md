# Tasks: Now Playing kiosk display

**Input**: Design documents from `/specs/001-now-playing-display/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: no se generan tareas de tests automatizados (el spec no los pide; la validación
es la checklist E2E de quickstart.md + gates de sintaxis, constitución VIII).

**Organization**: tareas agrupadas por historia de usuario; cada fase es un incremento
independientemente demostrable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable real (archivos distintos, sin dependencias)
- **[Story]**: [US1]…[US5] según spec.md
- Cada tarea indica su ruta exacta

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: estructura, assets estáticos y limpieza de la demo anterior

- [X] T001 Crear la estructura `BubbleSkin/HTML/bubble/html/{css,js,lang,lib,images}/` y confirmar que el skin sigue sirviéndose en `/bubble/` (LMS reiniciado tras el cambio de archivos no lo requiere; solo recarga)
- [X] T002 [P] Obtener `libcometd.min.js` (familia 4.0.x, licencia Apache-2.0, misma librería que vendoriza Material Skin) y colocarla en `BubbleSkin/HTML/bubble/html/lib/libcometd.min.js` — justificación ya escrita en plan.md Complexity Tracking (constitución X)
- [X] T003 [P] Crear los diccionarios `BubbleSkin/HTML/bubble/html/lang/en.json` (base obligatoria) y `BubbleSkin/HTML/bubble/html/lang/es.json` con, como mínimo, las claves: `nothing_playing`, `paused`, `coming_up`, `no_player`, `no_connection`, `local`, `remote` y las unidades de datos técnicos (`kbps`, `khz`, `bit`) — ningún literal visible en código (constitución V)
- [X] T004 [P] Crear el placeholder neutro de carátula `BubbleSkin/HTML/bubble/html/images/cover-placeholder.svg` (fondo oscuro acorde al tema, forma centrada, sin texto)
- [X] T005 Limpieza de la demo: eliminar `BubbleSkin/HTML/bubble/html/js/app.js` y `BubbleSkin/HTML/bubble/html/css/app.css` (demo descartada) y retirar el comando CLI `bubbleskin hello` de `BubbleSkin/Plugin.pm` (quitar `initCLI` y `_cliHello`; la demo era su único consumidor). Mantener intactos `Settings.pm`, `strings.txt` (tokens de la página de ajustes) e `install.xml`
- [X] T006 Reescribir `BubbleSkin/HTML/bubble/index.html` como shell TT mínimo: `<meta viewport>`, `<title>` con token via `[% "BUBBLE_SKIN" | string %]`, contenedor raíz del display, `<link>` a `[% webroot %]html/css/display.css` y los `<script>` en orden fijo — `lib/libcometd.min.js`, `js/lms.js`, `js/cometd.js`, `js/ticker.js`, `js/display.js`, `js/boot.js` — sin lógica inline ni controles (FR-013)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: núcleo que TODAS las historias necesitan. **⚠️ CRITICAL**: ninguna historia empieza antes de completar esta fase.

- [X] T007 Implementar `BubbleSkin/HTML/bubble/html/js/lms.js`: función `rpc(playerId, command)` con POST JSON a `/jsonrpc.js` devolviendo `result`, y errores HTTP/JSON-RPC lanzados como excepción tipada (para que boot/display mapeen a estado Offline)
- [X] T008 En el mismo `lms.js`: `getServerStatus()` (query `["serverstatus", 0, 100]`) y `getPlayerStatus(playerId)` (query `["status", "-", 2, "tags:adiJloqrtTux"]`) — campos exactos según `contracts/status-query.md`
- [X] T009 Implementar `BubbleSkin/HTML/bubble/html/js/boot.js` (arranque): leer `?player=` (convención LMS); si ausente → primer reproductor **conectado** de `serverstatus`; si el parámetro es inválido o no hay ninguno conectado → estado `NoPlayer`
- [X] T010 En `boot.js`: cargar el diccionario del display — idioma de la preferencia `language` del servidor (RPC) con fallback a `navigator.language` y último fallback a `en`; exponer `t(key)`; si falta el diccionario remoto → mostrar estado Offline traducible o mínimo garantizado
- [X] T011 Crear la base de `BubbleSkin/HTML/bubble/html/css/display.css`: fondo oscuro (alto contraste), tamaños tipográficos escalados al viewport (legible a 2-3 m, SC-002), reset básico, variables CSS; prohibido cualquier selector de elementos interactivos (FR-013)
- [X] T012 Implementar en `BubbleSkin/HTML/bubble/html/js/display.js` el núcleo de estados `DisplayState` (Loading, Playing, Paused, NothingPlaying, NoPlayer, Offline) con las transiciones de `data-model.md`, y el render de cada estado de error/vacío con textos del diccionario (US5-AS3, FR-009)

**Checkpoint**: boot arranca sin errores en consola, elige reproductor por defecto y pinta el estado correcto con datos estáticos de una única query inicial (aún sin push).

---

## Phase 3: User Story 1 - Ver qué suena ahora desde lejos (Priority: P1) 🎯 MVP

**Goal**: pantalla completa con carátula, metadatos, progreso, estados base y ticker

**Independent Test**: escenarios quickstart #1, #3, #4, #6, #7 y #14

- [X] T013 [US1] En `display.js`: render del estado Playing — carátula grande (`/music/current/cover_600x600_f.jpg?player=<mac>`; a placeholder si la imagen falla o el track no tiene cover, FR-011) + título, artista y álbum del `playlist_loop[0]`
- [X] T014 [US1] En `display.js`: barra de progreso con transcurrido (`time`) y total (`duration`) con formato `mm:ss`/`h:mm:ss` (FR-004); si `duration` ausente o 0 → ocultar barra/porcentaje y mostrar solo tiempo transcurrido (FR-005)
- [X] T015 [US1] En `display.js`: estados NothingPlaying (cola vacía/stop) y Paused (barra congelada + indicación de pausa del diccionario, FR-009/FR-010)
- [X] T016 [P] [US1] Implementar `BubbleSkin/HTML/bubble/html/js/ticker.js`: para cualquier texto que exceda su contenedor — desplazamiento lento y constante derecha→izquierda vía `transform` (GPU, no `left`), al llegar al último carácter pausa de ~1 s y reaparición instantánea en posición inicial; textos que caben permanecen estáticos; reinicio al cambiar de pista (changeKey del data-model); NUNCA ellipsis (FR-012 exacto)
- [X] T017 [US1] En `display.css`: las dos familias de layout — horizontal 16:9 (carátula ≥ 40 % del alto visible, FR-001) y vertical cuando alto ≥ ancho (disposición player estándar: carátula arriba a todo ancho con márgenes de seguridad, metadatos debajo, progreso después, bloque de estado inferior, FR-016) — por media queries de aspect-ratio; sin scroll ni elementos cortados en ninguna (SC-007)
- [X] T018 [US1] Verificación US1: ejecutar escenarios quickstart #1, #3, #4, #6, #7, #14 + `node --check` de `display.js` y `ticker.js`

**Checkpoint**: US1 funciona sola con una sola query inicial (sin tiempo real todavía): MVP demostrable.

---

## Phase 4: User Story 2 - La pantalla se actualiza sola (Priority: P2)

**Goal**: eventos del servidor reflejados en ≤ 2 s sin recarga ni interacción

**Independent Test**: escenarios quickstart #2, #3, #13 y #2 repetido tras sleep/wake del dispositivo

- [X] T019 [US2] Implementar `BubbleSkin/HTML/bubble/html/js/cometd.js`: wrapper de libcometd — `init({url:'/cometd'})`, handshake, exposición de `getClientId()`, listeners `/meta/*` para detectar pérdida/recuperación de conexión, reconexión con backoff y respeto del `advice.reconnect:'retry'` del servidor (ver `contracts/cometd-playerstatus.md`)
- [X] T020 [US2] En `cometd.js`: suscripción al playerstatus según contrato — canal `response` `/<clid>/slim/playerstatus/<mac>` (clid de 8 hex embebido, regla del servidor), `request: [<mac>, ["status", "-", 2, "tags:adiJloqrtTux", "subscribe:30"]]`, más catch-all `/<clid>/**`
- [X] T021 [US2] Integrar en `boot.js`: tras la carga inicial JSON-RPC, arrancar Cometd y encaminar cada push al display — actualización incremental por campo (sin re-render completo), detección de cambio de pista por trackId → reinicio de ticker y carátula
- [X] T022 [US2] En `display.js`: avance del progreso entre pushes con reloj local **solo** cuando `mode=play`; re-sincronización exacta en cada evento (regla del data-model: nunca driftar más que la cadencia de subscribe)
- [X] T023 [US2] Estado Offline: servidor caído o fallos `/meta/connect` persistentes → estado "sin conexión" discreto del diccionario y recuperación automática al volver (edge case); tras `/meta/reconnect`, re-emitir la suscripción limpia
- [X] T024 [US2] Verificación US2: escenarios quickstart #2, #3, #13 (parar/rearrancar LMS) + `node --check` de `cometd.js` y `boot.js`

**Checkpoint**: US1 + US2 → la pantalla vive sola, cumple SC-001.

---

## Phase 5: User Story 3 - Conocer la calidad técnica del track (Priority: P3)

**Goal**: bloque de datos técnicos con omisión de ausentes

**Independent Test**: escenario quickstart #6 más archivo local FLAC 24/96: ambos con sus datos disponibles, sin huecos

- [X] T025 [US3] En `display.js`: render del bloque técnico — codec (`type`), bitrate (`bitrate` pretty), samplerate (`samplerate` → "kHz"), samplesize (`samplesize` → "-bit") y origen (`remote` → `local`/`remote` del diccionario); cada dato ausente se omite **sin dejar hueco** (FR-003); bloque presente en estado Playing/Paused
- [X] T026 [P] [US3] En `display.css`: estilos del bloque técnico en ambas familias de layout (línea discreta, alto contraste, legible a distancia)
- [X] T027 [US3] Verificación US3: FLAC local hi-res + emisora de radio + track de Spotify/remoto si hay instalado; confirmar omisiones limpias + `node --check`

**Checkpoint**: US1+US2+US3 completos en ambos layouts.

---

## Phase 6: User Story 4 - Saber qué viene a continuación (Priority: P3)

**Goal**: bloque inferior "a continuación" con el siguiente track de la cola

**Independent Test**: cola con ≥ 2 pistas / cola con 1 / radio en vivo (bloque ausente sin romper layout)

- [X] T028 [US4] En `display.js`: render del bloque "a continuación" desde `playlist_loop[1]` — título + artista + carátula pequeña (`/music/<artwork_track_id>/cover_300x300_f.jpg` por tag `J`, o `artwork_url` tag `K`, o placeholder); si no existe el ítem → bloque oculto (FR-006)
- [X] T029 [P] [US4] En `display.css`: estilos del bloque inferior en horizontal y en vertical (dentro del bloque de estado inferior de FR-016 en vertical)
- [X] T030 [US4] Verificación US4: cola ≥ 2 / cola 1 / radio + `node --check`

**Checkpoint**: US1–US4 verificados; layout intacto con y sin siguiente pista.

---

## Phase 7: User Story 5 - Elegir qué reproductor mostrar (Priority: P3)

**Goal**: selección explícita por `?player=` con errores legibles

**Independent Test**: escenarios quickstart #10 y #11 + player inválido en URL

- [X] T031 [US5] Robustecer `boot.js`: `?player=<mac>` válido → ese reproductor; inválido/inexistente → estado NoPlayer con mensaje "reproductor no encontrado" del diccionario (US5-AS3); player conocido pero desconectado → "reproductor no disponible"; parámetros desconocidos → ignorados sin efecto (contrato url)
- [X] T032 [US5] Verificación US5: escenarios quickstart #10, #11 y cambio de MAC en caliente por URL + `node --check`

**Checkpoint**: las 5 historias funcionan e integran de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: gates, validación E2E y documentación viva

- [X] T033 Gates completos (constitución VIII): `node --check` sobre todo `html/js/*.js`, `perl -c` de `Plugin.pm` (con stubs de `Slim::*`; se tocó en T005), parseo XML de `install.xml`, YAML de `skinconfig.yml`, TSV de `strings.txt`, y YAML del workflow si se tocara (no aplica: sin cambios de release en esta fase)
- [ ] T034 Pasar la checklist E2E completa de `quickstart.md` (15 escenarios) registrando 15/15 y anotando desviaciones si las hubiera
- [X] T035 Actualizar `docs/` (constitución IX): documentar la pantalla kiosk (acceso `/bubble/`, `?player=`, layouts H/V, ticker, datos técnicos mostrados, estados de error) en el documento de uso correspondiente
- [X] T036 Revisión final anti-residuos: confirmar que no queda ninguna referencia a la demo (`app.js`, `app.css`, comando `hello`) ni controles interactivos accesibles por teclado/ratón (SC-003); confirmar strings.txt sin tokens huérfanos de la demo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias
- **Phase 2 (Foundational)**: tras Setup; **bloquea TODAS las historias**
- **Phase 3–7 (US1–US5)**: cada historia tras Foundational; orden recomendado P1 → P2 → P3s (US3/US4/US5 tocan archivos compartidos `display.js`/`display.css`: ejecutarlas **en serie** si las hace una sola persona)
- **Phase 8 (Polish)**: tras todas las historias

### User Story Dependencies

- **US1 (P1)**: solo Foundational. Sin dependencias de otras historias
- **US2 (P2)**: Foundational + base de display de US1 (usa su núcleo de estados)
- **US3 (P3)**: Foundational + render de US1
- **US4 (P3)**: Foundational + render de US1
- **US5 (P3)**: Foundational (boot ya elige player); añade robustez y mensajes

### Parallel Opportunities

- Setup: T002, T003, T004 en paralelo (archivos distintos)
- US1: T016 (ticker.js) en paralelo con T013–T015/T017 (archivo distinto)
- US3: T026 (css) en paralelo con T025 (js)
- US4: T029 (css) en paralelo con T028 (js)
- Historias US3/US4/US5 entre sí: NO en paralelo si tocan `display.js`/`display.css` a la vez

### Parallel Example: User Story 1

```bash
# En paralelo (archivos distintos):
Task: "Implementar ticker.js (T016)"
Task: "Render Playing + progreso + estados en display.js (T013..T015)"
Task: "Layouts H/V en display.css (T017)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 → fundación (boot elige reproductor, estados pintan)
2. Phase 3 (US1) → pantalla estática completa → **validar con escenarios #1/#4/#14**
3. Demo ya usable como display estático

### Incremental Delivery

1. Foundational → base
2. + US1 → display estático (MVP)
3. + US2 → display vivo (SC-001)
4. + US3 → datos técnicos
5. + US4 → "a continuación"
6. + US5 → selección por URL
7. Polish → gates + E2E + docs

### Notas de ejecución

- Sin release en esta fase: la 0.2.0 sale tras `/speckit.implement` + `/speckit.converge` con `tools/release.py` (constitución VII)
- Commit tras cada tarea o grupo lógico; gates de sintaxis tras cada fase
- Cualquier tentación de añadir framework/controles → releer constitución II, X y FR-013
