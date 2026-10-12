# Implementation Plan: Pantalla "Now Playing" para display dedicado (kiosk)

**Branch**: sin rama (extensión git no instalada) | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-now-playing-display/spec.md` + contexto técnico
y decisiones aportados por el usuario (Cometd fijado, `?player=<mac>`, retiro de la demo).

## Summary

Convertir la página principal de BubbleSkin en una pantalla única de "now playing" de solo
lectura, pensada para displays kiosk 16:9 y verticales (9:16, 3:4), con carátula prominente,
metadatos, datos técnicos, progreso, bloque "a continuación" y ticker animado en textos
desbordados. Estado inicial vía JSON-RPC (`status` con tags técnicos verificados en el código
del servidor) y actualizaciones en ≤ 2 s vía suscripción Cometd (`/slim/subscribe` →
`playerstatus`), sin controles, 100 % offline, sin build step.

## Technical Context

**Language/Version**: JavaScript ES2020 (sin transpilar) + Perl 5.32+ (hosteado en LMS ≥ 8.0)

**Primary Dependencies**: sin frameworks. **Vendor local** de `libcometd.min.js`
(Apache-2.0, misma librería usada en producción por Material Skin) — ver Complexity Tracking.

**Storage**: N/A. La pantalla no persiste nada; las prefs existentes del plugin
(`albumsPageSize`, `accentColor`) no aplican a esta pantalla (fuera de alcance).

**Testing**: verificación guiada por `quickstart.md` (checklist de escenarios por FR/SC en
navegador real/emulado) + gates de sintaxis de la constitución VIII (`node --check`,
`perl -c`, parseo XML/YAML/TSV). No hay framework de tests unitarios (KISS).

**Target Platform**: navegador moderno (Chrome/Firefox) en displays kiosk, servido por LMS.

**Project Type**: skin web de LMS (plugin con SPA estática).

**Performance Goals**: SC-001 ≤ 2 s de latencia visible ante eventos del servidor;
animación de ticker fluida (~60 fps) sin bloquear el hilo principal.

**Constraints**: 100 % offline (sin CDN); paquete sin node_modules; una sola pantalla;
solo lectura; LMS ≥ 8.0; herencia de plantillas EN/Default intacta.

**Scale/Scope**: 1 pantalla, 2 familias de layout (H/V), ~4 módulos JS + 1 CSS + shell
`index.html`; backend Perl sin lógica nueva.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Compatibilidad LMS | Se sirve desde `HTML/bubble/` instalada vía repo; sin rutas reservadas; fallback EN/Default intacto | PASS |
| II. SPA sin build step | JS/CSS estáticos; cero CDN; cero node_modules en el paquete | PASS |
| III. Backend Perl mínimo | Sin lógica nueva; único cambio: retirar el comando demo 'hello' (patrón núcleo ya en uso) | PASS |
| IV. JSON-RPC única vía | Estado inicial por `jsonrpc.js`; push por Cometd (canal oficial del servidor) | PASS |
| V. i18n obligatoria | Etiquetas del display por `html/lang/{en,es}.json` (mecanismo frontend); strings.txt para lo que el servidor renderiza (título de página) | PASS |
| VI. Herencia de plantillas | No se copia nada del núcleo; skinconfig.yml intacto | PASS |
| VII. Releases deterministas | Sin cambios en el flujo: release.py + tag + workflow con SHA-1 | PASS |
| VIII. Validación pre-commit | Gates listados en quickstart.md | PASS |
| X. KISS | Una librería vendored requiere justificación → Complexity Tracking | JUSTIFICADA abajo |

**Resultado pre-Phase 0: PASS.** Sin violaciones no justificadas.

## Project Structure

### Documentation (this feature)

```text
specs/001-now-playing-display/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisiones verificadas contra fuentes reales)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    ├── cometd-playerstatus.md   # contrato del canal push que la pantalla consume
    ├── status-query.md          # contrato JSON-RPC: campos usados de `status`
    └── url-contract.md          # contrato de la URL del display (?player=)
```

### Source Code (repository root)

```text
BubbleSkin/
├── HTML/
│   └── bubble/
│       ├── index.html           # shell TT mínimo: carga css/js, sin lógica
│       └── html/
│           ├── css/display.css  # ambas familias de layout vía media queries aspect-ratio
│           ├── js/
│           │   ├── boot.js      # parsea ?player=, carga inicial JSON-RPC, arranca cometd
│           │   ├── lms.js       # cliente JSON-RPC mínimo + query status
│           │   ├── cometd.js    # wrapper de libcometd: handshake/subscribe/reconnect/backoff
│           │   ├── display.js   # render + actualización incremental por campo
│           │   └── ticker.js    # animación derecha→izquierda, pausa, salto, reset por pista
│           ├── lang/
│           │   ├── en.json      # etiquetas base (constitución V)
│           │   └── es.json
│           ├── lib/libcometd.min.js   # vendored (Apache-2.0)
│           └── images/cover-placeholder.svg
├── Plugin.pm              # único cambio: retirar comando demo 'bubbleskin hello'
├── Settings.pm            # sin cambios
├── strings.txt            # sin cambios funcionales (tokens del plugin)
└── install.xml            # sin cambios (versión la fija release.py)
```

**Structure Decision**: SPA estática dentro del skin (estructura existente `HTML/bubble/`);
módulos ES sin imports dinámicos ni build — se cargan por `<script>` en orden. La demo
anterior (`app.js`, lista de álbumes y controles) se elimina.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Vendored `libcometd.min.js` (~40 KB) | El protocolo Bayeux de Cometd (handshake, `/meta/connect` long-polling, advice de reconexión, gestión de clientId) es fácil de implementar mal a mano; el requisito SC-001 (≤ 2 s) y la recuperación automática de desconexiones (edge case) dependen de que ese protocolo sea correcto | Cliente Bayeux propio sobre `fetch` (~120 líneas): menor dependencia, pero reimplementa handshake/reconexión/advice sin el margen de pruebas que tiene libcometd en producción (Material Skin la usa desde 2018). Riesgo de bugs en el caso de fallo justo donde la spec exige resiliencia |

## Phase 0 y Phase 1

Ver `research.md` (decisiones verificadas contra el código del servidor),
`data-model.md`, `contracts/` y `quickstart.md`.

## Constitution Check (post-design re-eval)

Re-evaluado tras Phase 1: ninguna decisión de diseño introduce violaciones nuevas.
Los contratos usan exclusivamente los canales oficiales documentados del servidor
(en línea con el principio IV); el vendor de libcometd queda justificado arriba (X).
**Resultado post-Phase 1: PASS.**
