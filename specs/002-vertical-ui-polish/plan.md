# Implementation Plan: UI/UX polish del modo vertical

**Branch**: `002-vertical-ui-polish` | **Date**: 2026-10-14 | **Spec**: [specs/002-vertical-ui-polish/spec.md](spec.md)

**Input**: Feature specification from `/specs/002-vertical-ui-polish/spec.md`

## Summary

Ajustar la presentación del skin BubbleSkin en modo vertical para que se alinee con el diseño de referencia (`refs/vertical.png` y `refs/status.png`): cover adaptativo con límite del 60% del viewport, metadatos formateados con opacidades diferenciadas, paleta de colores unificada para vertical y horizontal, y caja de status con título variable según el estado. No se modifica la comunicación con LMS ni se añaden dependencias nuevas.

## Technical Context

**Language/Version**: JavaScript vanilla (ES5-ish para compatibilidad LMS 8.0+), CSS3, HTML con plantillas Template Toolkit; backend Perl 5.14+.

**Primary Dependencies**: Ninguna nueva. Se reutiliza el código existente de la feature 001 (`lms.js`, `realtime.js`, `display.js`, `ticker.js`, `boot.js`).

**Storage**: N/A.

**Testing**: Validación visual en navegador sobre viewports verticales y horizontales; `node --check` para JS; verificación de tokens en `strings.txt`.

**Target Platform**: Navegadores modernos y LMS 8.0+ en redes locales.

**Project Type**: Web skin plugin para Lyrion Music Server.

**Performance Goals**: Sin objetivos nuevos. Mantener renderizado fluido sin animaciones; actualización instantánea.

**Constraints**: Sin CDN (Principio II). Sin build step. Todo texto internacionalizado vía tokens. Sin cambios en JSON-RPC/CometD.

**Scale/Scope**: Un skin de pantalla única, usado en 1–N pantallas kiosk/tablet simultáneas; sin estado de servidor.

## Constitution Check

| Principio | Estado | Notas |
|---|---|---|
| I. Compatibilidad LMS Primero | ✅ | No se tocan URLs reservadas ni el mecanismo de repositorio. |
| II. Frontend SPA sin Build Step | ✅ | Solo CSS/JS vanilla; sin CDN ni bundlers. Roboto se servirá autocontenida. |
| III. Backend Perl Mínimo | ✅ | No se requiere backend adicional. |
| IV. JSON-RPC | ✅ | Sin cambios en endpoints o lógica de comunicación. |
| V. Internacionalización | ✅ | Nuevos labels se añaden como tokens EN/ES en `strings.txt`. |
| VI. Herencia de Plantillas | ✅ | Solo se modifica la plantilla propia `index.html`. |
| VII. Releases Deterministas | ✅ | Se usará `tools/release.py`. |
| VIII. Validación Antes de Commit | ✅ | Gates: `node --check`, validación XML/TSV. |
| IX. Documentación Viva | ⚠️ | Se debe actualizar `docs/` si cambia comportamiento visible o flujo de release. |
| X. KISS | ✅ | Solo ajustes de CSS/JS/estructura; sin frameworks nuevos. |

**Acción derivada**: actualizar `docs/` junto con la implementación para cumplir el Principio IX.

## Project Structure

### Documentation (this feature)

```text
specs/002-vertical-ui-polish/
├── plan.md              # Este archivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (si aplica)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
BubbleSkin/
├── HTML/bubble/index.html            # posibles ajustes de estructura
├── HTML/bubble/html/css/display.css # estilos verticales, horizontales, paleta, tipografía
├── HTML/bubble/html/js/display.js   # render de metadatos, status, cover adaptativo
├── HTML/bubble/html/js/boot.js      # binding de estados (si cambia)
├── HTML/bubble/html/lang/en.json    # cadenas de UI actuales (posibles nuevas)
├── HTML/bubble/html/lang/es.json
└── strings.txt                      # tokens EN/ES para labels fijos
```

**Structure Decision**: Se mantiene la estructura actual de la feature 001. Los cambios se concentran en `display.css`, `display.js`, `index.html` y los archivos de internacionalización.

## Complexity Tracking

Sin violaciones a la constitución. No se requiere justificación de complejidad adicional.
