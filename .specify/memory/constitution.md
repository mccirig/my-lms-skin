# BubbleSkin Constitution

## Core Principles

### I. Compatibilidad LMS Primero

El plugin DEBE instalarse y funcionar en LMS >= 8.0 mediante el mecanismo oficial de
repositorio de terceros (public.xml + zip + SHA-1). Ningún cambio puede romper la
instalación desde el repositorio ni el renderizado por herencia del skin base EN. Las URLs
reservadas del servidor (`html/`, `plugins/`, `music/`, `contributor/`, `settings/`,
`firmware/`, `imageproxy/`…) NO se usan como rutas propias del skin.

Racional: un skin que no instala o que rompe el resto de la interfaz no sirve; la
distribución por repositorio es el único canal soportado para usuarios finales.

### II. Frontend SPA sin Build Step

El frontend es JavaScript vanilla y CSS servidos estáticamente desde
`HTML/bubble/html/`. PROHIBIDO cargar recursos desde CDN. NO se usan bundlers ni se
incluye `node_modules/` en el paquete del plugin.

Racional: LMS se ejecuta en redes locales que pueden no tener internet; el paquete debe
ser autocontenido e instalable sin toolchain.

### III. Backend Perl Mínimo y Alineado con LMS

El código Perl sigue las APIs y patrones del núcleo de LMS: `Slim::Web::Pages`,
`Slim::Web::Settings`, `preferences()`, `Slim::Control::Request` y logging con
`addLogCategory`. `use strict` es obligatorio; la indentación usa tabs como el código del
servidor. El backend solo contiene lo que el frontend no puede hacer (preferencias,
comandos CLI, páginas de ajustes).

### IV. Comunicación con el Servidor por JSON-RPC

TODA la comunicación del frontend con el servidor usa JSON-RPC (`/jsonrpc.js`). La lógica
no trivial DEBE vivir en el backend Perl como comandos CLI propios del plugin
(`["bubbleskin", ...]`), nunca duplicada en JavaScript.

Racional: una única vía de comunicación evita divergencias; la lógica en el servidor es
testeable y reutilizable por otros clientes.

### V. Internacionalización Obligatoria

Ningún texto visible puede ser un literal: TODO texto pasa por tokens de `strings.txt`,
con traducción EN obligatoria y ES. `install.xml` y `public.xml` referencian tokens, no
literales.

### VI. Herencia de Plantillas, no Copia

El skin solo redefine las plantillas que necesita; `skinparents: [Default]` y el fallback
a EN resuelven el resto. PROHIBIDO copiar plantillas enteras del núcleo de LMS al plugin.

Racional: las copias divergen con cada versión de LMS; la herencia absorbe los cambios del
servidor gratis.

### VII. Releases Deterministas y SemVer

Toda versión se genera con `tools/release.py X.Y.Z` (fija `install.xml`, crea el zip
determinista en `dist/` y actualiza el SHA-1 en `public.xml`) más el tag `vX.Y.Z` que
dispara el workflow de GitHub. NUNCA se reutiliza un nombre de zip ya publicado (caché de
LMS indexada por nombre de archivo) y NUNCA se publica sin que el workflow verifique que
el SHA-1 del zip coincide con el de `public.xml`.

### VIII. Validación Antes de Commit

Antes de commitear, TODO cambio DEBE pasar: `perl -c` para los `.pm` (con stubs de
`Slim::*`), `node --check` para el JS, parseo de XML/YAML y verificación del formato TSV
de `strings.txt`. Si no valida, no se commitea.

Racional: son las mismas validaciones que luego exige el servidor y el instalador; fallar
rápido en local es más barato que romper una release.

### IX. Documentación Viva

`docs/` (en español) se actualiza en el mismo cambio que modifica comportamiento,
estructura o flujo de release. Un cambio sin su documentación correspondiente está
incompleto.

### X. KISS

La feature mínima viable primero. Incorporar un framework o dependencia nueva REQUIERE
justificación escrita en el plan de la feature. La complejidad añadida sin justificación
es motivo de rechazo en revisión.

## Estándares de Validación

Comandos de gate que todo cambio debe superar antes de commit (principio VIII):

- Perl: `perl -c` sobre `Plugin.pm`, `Settings.pm` y cualquier `.pm` nuevo, con stubs de
  los módulos `Slim::*` (las constantes `main::WEBUI` y similares las define
  `slimserver.pl` en producción).
- JavaScript: `node --check` sobre todo archivo de `HTML/bubble/html/js/`.
- Manifiestos: parseo XML de `install.xml`/`public.xml`, parseo YAML de
  `skinconfig.yml` y del workflow, y formato TSV de `strings.txt`
  (token en columna 0, líneas `IDIOMA<TAB>texto`, token EN siempre presente).
- Release: `.github/workflows/release.yml` rechaza cualquier tag cuyo zip no exista en
  `dist/` o cuyo SHA-1 no coincida con `<sha>` de `public.xml`.

## Flujo de Desarrollo y Publicación

- Cada feature se desarrolla con el ciclo SDD completo: `/speckit.specify` →
  `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` → `/speckit.converge`.
- Versionado semántico: `MAJOR.MENOR.PARCHE`; el tag coincide con la versión (`vX.Y.Z`).
- Publicación: `python3 tools/release.py X.Y.Z`, commit con el zip de `dist/` y
  `public.xml`, tag y push; el workflow crea la GitHub Release y adjunta el zip.
- Los usuarios instalan y actualizan exclusivamente vía la URL del repositorio:
  `https://raw.githubusercontent.com/mccirig/my-lms-skin/main/public.xml`.

## Governance

Esta constitución prevalece sobre cualquier otra práctica del proyecto.

- Enmiendas: modificarla exige documentar el motivo del cambio y revisar su impacto en
  plantillas (`.specify/templates/`), scripts (`.specify/scripts/`) y el workflow de
  release.
- Versionado de la constitución: semántico — MAJOR para redefiniciones o eliminación de
  principios, MINOR para nuevos principios o secciones, PATCH para aclaraciones y correcciones.
- Revisiones de cumplimiento: todo plan (`/speckit.plan`) DEBE superar el Constitution
  Check y toda implementación se revisa contra estos principios; la complejidad adicional
  debe justificarse explícitamente (principio X).
- Guía de desarrollo en tiempo de ejecución: `docs/README.md` y la serie `docs/01`–`10`.

**Version**: 1.0.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-12
