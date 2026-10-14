# Tasks: UI/UX polish del modo vertical

**Input**: Design documents from `specs/002-vertical-ui-polish/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`, `quickstart.md`

**Tests**: No se generan tests automatizados; la feature se valida visualmente según `quickstart.md`.

**Organization**: Las tareas se agrupan por user story para permitir implementación y validación independiente.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la rama, revisar el estado actual del skin y asegurar que las herramientas de validación funcionan.

- [ ] T001 [P] Verificar que la rama actual es `002-vertical-ui-polish` y que el working tree está limpio excepto por los artefactos del plan.
- [ ] T002 [P] Ejecutar `node --check` sobre todos los archivos de `BubbleSkin/HTML/bubble/html/js/` para asegurar baseline válido.
- [ ] T003 [P] Ejecutar validación de XML sobre `install.xml` y `public.xml`, y validar formato TSV de `strings.txt`.

**Checkpoint**: Baseline del skin validado. Se puede empezar la implementación.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tareas compartidas que bloquean cualquier user story.

- [X] T004 Agregar nuevos tokens de internacionalización a `BubbleSkin/strings.txt` para `BUBBLESKIN_BY`, `BUBBLESKIN_FROM`, `BUBBLESKIN_COMING_UP`, `BUBBLESKIN_NOTHING_NEXT`, `BUBBLESKIN_NO_CONNECTION`, `BUBBLESKIN_NOTHING_PLAYING` con traducciones EN y ES.
- [X] T005 [P] Reflejar los nuevos tokens en `BubbleSkin/HTML/bubble/html/lang/en.json` y `es.json` con las claves `by`, `from`, `coming_up`, `nothing_next`, `no_connection`, `nothing_playing`.
- [X] T006 [P] Definir variables CSS de paleta y tipografía en `BubbleSkin/HTML/bubble/html/css/display.css`: `--bg-page: #252f3c`, `--text-primary: #ffffff`, `--text-dim: rgba(255,255,255,0.5)`, `--progress-fill: #4e8dca`, `--progress-bg: #3a4046`, `--status-bg: #263036`, y font stack `Roboto, system-ui, sans-serif`.

**Checkpoint**: Tokens y variables base listos. Las user stories pueden avanzar en paralelo.

---

## Phase 3: User Story 1 - Pantalla vertical completa con pista activa (Priority: P1) 🎯 MVP

**Goal**: Renderizar correctamente en modo vertical el cover adaptativo, metadatos formateados, barra de progreso y caja de status con la siguiente pista.

**Independent Test**: Abrir `http://<lms>:9000/bubble/` en un viewport vertical con una pista en reproducción y una playlist de 2+ tracks. Deben verse: cover adaptativo, título con tracknum, artista, álbum, línea técnica, barra de progreso y caja "A continuación".

### Implementation for User Story 1

- [X] T007 [US1] Actualizar `BubbleSkin/HTML/bubble/html/index.html` para incluir la estructura DOM del contrato UI (`#app`, `.np-cover-area`, `.np-metadata`, `.np-progress`, `.np-status`, etc.).
- [X] T008 [P] [US1] Implementar en `BubbleSkin/HTML/bubble/html/css/display.css` el layout vertical: `#app.orientation-vertical` con flex vertical, cover con `width: 100%`, `max-height: 60vh`, `object-fit: contain`, metadatos centrados y status al final.
- [X] T009 [US1] Implementar en `BubbleSkin/HTML/bubble/html/js/display.js` la función `formatMetadata(current)` que devuelva título ("01 · Título" o solo título), artista ("por Artista"), álbum ("de Álbum (año)" o "de Álbum") y línea técnica omitiendo componentes ausentes.
- [X] T010 [US1] Implementar en `BubbleSkin/HTML/bubble/html/js/display.js` la función `renderProgress(elapsed, duration)` que actualice el ancho de `.np-progress-fill` y los tiempos con formato mm:ss.
- [X] T011 [US1] Implementar en `BubbleSkin/HTML/bubble/html/js/display.js` la función `renderStatus(mode, next)` que muestre el título "A continuación" con miniatura, título y artista del siguiente track.
- [X] T012 [US1] Actualizar `BubbleSkin/HTML/bubble/html/js/display.js` para que `display.update(playerStatus)` orqueste cover, metadatos, progreso y status cuando hay pista activa y siguiente track.
- [X] T013 [US1] Ajustar `BubbleSkin/HTML/bubble/html/js/boot.js` para detectar orientación (vertical/horizontal) aplicando `.orientation-vertical` o `.orientation-horizontal` a `#app` en resize/load.

**Checkpoint**: User Story 1 funciona visualmente en modo vertical con pista activa y siguiente track.

---

## Phase 4: User Story 2 - Estados de error y vacío dentro de la caja de status (Priority: P2)

**Goal**: La caja de status renderiza el estado correcto cuando no hay conexión, no hay reproducción o no hay siguiente track.

**Independent Test**: Probar tres condiciones: desconectar LMS ("Sin conexión con el servidor"), detener reproducción sin playlist ("Nada en reproducción"), y playlist con una sola pista ("Nada que reproducir").

### Implementation for User Story 2

- [ ] T014 [US2] Implementar en `BubbleSkin/HTML/bubble/html/js/display.js` la máquina de estados de status: `disconnected`, `stopped`, `playing-next`, `playing-last`, eligiendo el título de status según `StatusState.titleToken`.
- [ ] T015 [US2] Actualizar `BubbleSkin/HTML/bubble/html/js/boot.js` para enviar la señal de conectividad (`connected: false`) al renderer cuando falle la conexión con JSON-RPC/CometD.
- [ ] T016 [US2] Actualizar `BubbleSkin/HTML/bubble/html/js/display.js` para que `renderStatus` oculte o vacíe el cuerpo de la caja cuando `mode` no es `playing-next`.
- [ ] T017 [US2] Añadir estilos en `BubbleSkin/HTML/bubble/html/css/display.css` para la caja de status con fondo `#263036`, bordes redondeados y título/body consistentes en los cuatro estados.

**Checkpoint**: User Story 2 funciona en las cuatro condiciones de status.

---

## Phase 5: User Story 3 - Paleta de colores en modo horizontal (Priority: P3)

**Goal**: El modo horizontal usa la nueva paleta de colores sin rediseñar su layout.

**Independent Test**: Rotar/redimensionar el viewport a landscape; verificar fondo `#252f3c`, texto blanco, barra `#4e8dca`, sin elementos desaparecidos.

### Implementation for User Story 3

- [ ] T018 [US3] Revisar y ajustar `BubbleSkin/HTML/bubble/html/css/display.css` para que las reglas de modo horizontal (`#app.orientation-horizontal`) usen los nuevos tokens de color sin modificar la estructura existente.
- [ ] T019 [US3] Verificar en `BubbleSkin/HTML/bubble/html/js/display.js` que el renderizado de metadatos y status funciona igual en horizontal (no se requiere lógica nueva).
- [ ] T020 [US3] Probar viewport horizontal y corregir regresiones visuales (elementos ocultos, colores antiguos, overflow).

**Checkpoint**: User Story 3 aplica la paleta sin regresiones en horizontal.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finales, documentación, validación de gates y release.

- [ ] T021 [P] Actualizar `docs/` para reflejar el nuevo diseño vertical, la paleta y los estados de status (Principio IX).
- [ ] T022 [P] Ejecutar `node --check` sobre todos los JS modificados, validar XML y TSV de `strings.txt`.
- [ ] T023 [P] Ejecutar manualmente los escenarios de `quickstart.md` en viewports vertical y horizontal.
- [ ] T024 Ejecutar `python3 tools/release.py 0.2.0`, verificar zip y SHA-1, commitear y pushear con tag `v0.2.0`.

**Checkpoint**: Feature lista para release y validación por el usuario.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende de Setup. Bloquea todas las user stories.
- **User Story 1 (P1)**: Depende de Foundational.
- **User Story 2 (P2)**: Depende de Foundational; puede trabajarse en paralelo a US1 una vez que `renderStatus` existe.
- **User Story 3 (P3)**: Depende de Foundational y de que US1/2 no hayan roto el modo horizontal.
- **Polish (Phase 6)**: Depende de las user stories completadas.

### User Story Dependencies

- **US1 (P1)**: No depende de otras stories. Es el MVP.
- **US2 (P2)**: Requiere la estructura de status creada en US1, pero puede desarrollarse en paralelo si se define la API `renderStatus(mode, next)` primero.
- **US3 (P3)**: Requiere que el layout horizontal existente siga intacto tras US1/US2.

### Within Each User Story

1. CSS/estructura DOM (si aplica).
2. Lógica de render en `display.js`.
3. Wiring en `boot.js`.
4. Validación visual.

### Parallel Opportunities

- T001, T002, T003 (Setup) en paralelo.
- T005, T006 (Foundational) en paralelo.
- T008 (CSS vertical) y T009 (formatter de metadatos) en paralelo dentro de US1.
- T014, T015, T016, T017 de US2 pueden avanzar en paralelo una vez definida la API de `renderStatus`.
- T018, T019, T020 de US3 en paralelo.
- T021, T022, T023 de Polish en paralelo.

---

## Parallel Example: User Story 1

```bash
# En paralelo:
Task: "Actualizar index.html con estructura DOM del contrato UI"
Task: "Implementar CSS del layout vertical y cover adaptativo"
Task: "Implementar formatter de metadatos en display.js"

# Luego:
Task: "Orquestar render en display.update(playerStatus)"
Task: "Detectar orientación en boot.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3 (US1).
3. **STOP and VALIDATE**: probar viewport vertical con pista activa y siguiente track.
4. Solo entonces continuar con US2 y US3.

### Incremental Delivery

1. Setup + Foundational.
2. US1 → validación visual vertical básica.
3. US2 → estados de status.
4. US3 → paleta en horizontal.
5. Polish → documentación, gates, release 0.2.0.

### Parallel Team Strategy

Con varios desarrolladores:

1. Un dev hace Phase 1 y Phase 2.
2. Otro dev implementa US1 mientras otro prepara US2 (sobre la API de `renderStatus` que se acuerda).
3. Revisión conjunta del modo horizontal (US3).

---

## Notes

- `[P]` indica tareas paralelizables (archivos diferentes, sin dependencias de tareas incompletas).
- `[US1]`, `[US2]`, `[US3]` etiquetan la user story a la que pertenece cada tarea.
- No se incluyen tests automatizados porque la validación es visual; `quickstart.md` documenta los escenarios.
- Antes del release se debe ejecutar `tools/release.py 0.2.0` y actualizar `docs/`.
- No se generan tareas de backend porque la feature es pura UI/UX frontend.

---

## Task Count Summary

| Phase | Tasks |
|---|---|
| Setup | 3 |
| Foundational | 3 |
| User Story 1 (P1) | 7 |
| User Story 2 (P2) | 4 |
| User Story 3 (P3) | 3 |
| Polish | 4 |
| **Total** | **24** |
