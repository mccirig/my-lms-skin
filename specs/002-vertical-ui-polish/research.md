# Research Notes: UI/UX polish del modo vertical

**Feature**: specs/002-vertical-ui-polish

## Decisiones de diseño

### Cover adaptativo en modo vertical

- **Decision**: En modo vertical el cover debe ocupar el ancho disponible (con márgenes) y limitar su alto al 60% del viewport, preservando la relación de aspecto.
- **Rationale**: La referencia visual (`refs/vertical.png`, iPad Mini 744x1133) muestra un cover cuadrado grande que no llega a ocupar toda la pantalla. Limitar el alto al 60% del viewport y usar `object-fit: contain` (o equivalente con `max-height` + `width: 100%`) garantiza que no se deforme en viewports más altos o más anchos.
- **Implementación esperada**: CSS con `width: 100%`, `max-height: 60vh`, `object-fit: contain`, y posiblemente `aspect-ratio: 1 / 1` como hint. El contenedor del cover usa flexbox o grid para distribuir el espacio restante entre metadatos, progreso y status.

### Paleta de colores unificada

- **Decision**: Aplicar la paleta #252f3c / #ffffff / #4e8dca / #3a4046 / #263036 a ambas orientaciones.
- **Rationale**: El usuario confirmó que los colores aplican tanto a vertical como a horizontal; el modo horizontal solo no se rediseña en layout. Esto evita inconsistency visual.
- **Implementación esperada**: redefinir variables CSS o colores directos en `display.css` para body, texto, barra de progreso, fondo de barra y fondo de status.

### Tipografía Roboto sin CDN

- **Decision**: Usar Roboto con fallback a sans-serif del sistema, servida de forma autocontenida.
- **Rationale**: Principio II de la constitución prohíbe CDN. Roboto es de licencia Apache 2.0; se pueden incluir los archivos WOFF2 en `BubbleSkin/HTML/bubble/html/fonts/` o usar un stack de fuentes del sistema (Roboto, "Helvetica Neue", Arial, sans-serif) si no se incluyen archivos. Para mantener el paquete ligero y evitar nuevos assets, se prefiere un **font stack CSS** que pida Roboto primero y caiga en system-ui/sans-serif si no está instalada localmente.
- **Alternativas consideradas**: Incluir fuentes en el plugin → rechazada porque aumenta el zip sin beneficio crítico para un kiosk controlado por el usuario. Usar solo system-ui/sans-serif → rechazada porque el diseño pide Roboto explícitamente.

### Caja de status con título variable

- **Decision**: El título de la caja de status cambia según el estado ("A continuación", "Nada que reproducir", "Sin conexión con el servidor", "Nada en reproducción").
- **Rationale**: La referencia `refs/status.png` muestra los labels como título de la caja, y la aclaración del usuario confirmó este comportamiento.
- **Implementación esperada**: `display.js` recibe el estado (online/offline/no-player/no-track) y elige el label a renderizar en la cabecera de la caja. El contenido debajo cambia: miniatura + metadatos del siguiente track, o el mensaje de vacío.

### Formato de metadatos

- **Decision**:
  - Título: "01 · Título" (tracknum + punto medio + título). Sin tracknum, solo título.
  - Artista: "por Artista".
  - Álbum: "de Álbum (año)". Sin año, "de Álbum".
  - Línea técnica: "TIPO · BITRATE · SAMPLERATE · N DE M". Sin componentes omitibles.
- **Rationale**: El usuario definió el formato exacto en la descripción original. Los separadores son " · " (punto medio con espacios).
- **Implementación esperada**: función de formateo en `display.js` que reciba el objeto de datos del track y devuelva las cuatro líneas. Las palabras "por" y "de" deben ser tokens internacionalizados.

### Opacidades

- **Decision**: Título de canción 100% opaco; artista, álbum, info técnica, tiempos y labels de status 50% opacos.
- **Rationale**: Definido por el usuario.
- **Implementación esperada**: clases CSS o estilos inline con `opacity: 0.5`/`1`. Preferiblemente clases reutilizables (`.np-dim`, `.np-bright`).

## Notas técnicas

- No se modifica el contrato CometD/JSON-RPC. Los datos necesarios ya están disponibles vía el canal `playerstatus` y `getPlayerStatus` de la feature 001.
- Para la siguiente pista, `display.js` puede inferir el track siguiente consultando `playlist_loop[1]` si está presente en el push de playerstatus. Si no, puede quedar vacío/nada que reproducir.
- El placeholder de cover existente se reutiliza sin cambios.
- El ticker/marquee de textos largos se reutiliza sin cambios funcionales.

## Archivos a modificar

- `BubbleSkin/HTML/bubble/index.html`: ajustes menores de estructura (clases, contenedores) si es necesario.
- `BubbleSkin/HTML/bubble/html/css/display.css`: paleta, layout vertical, cover adaptativo, opacidades, tipografía.
- `BubbleSkin/HTML/bubble/html/js/display.js`: render de metadatos formateados, lógica de estados de status.
- `BubbleSkin/HTML/bubble/html/js/boot.js`: binding de estados si cambia la API de `display.setState`.
- `BubbleSkin/strings.txt`: nuevos tokens EN/ES para "por", "de", "A continuación", "Nada que reproducir", "Sin conexión con el servidor", "Nada en reproducción".
- `BubbleSkin/HTML/bubble/html/lang/en.json` y `es.json`: posibles nuevas cadenas si el frontend las lee directamente (aunque la constitución privilegia `strings.txt`).
- `docs/`: actualización de la guía visual/UX.
