# Data Model: UI/UX polish del modo vertical

**Feature**: specs/002-vertical-ui-polish

## Entities

### CurrentTrack

Representa la pista en reproducción.

| Field | Type | Required | Notes |
|---|---|---|---|
| title | string | sí | Nombre de la pista. |
| artist | string | no | Nombre del artista. |
| album | string | no | Nombre del álbum. |
| year | number/string | no | Año de lanzamiento. |
| tracknum | number | no | Número de pista en el álbum. |
| contentType | string | no | Tipo de contenido (MP3, FLAC, AAC, etc.). |
| bitrate | string | no | Bitrate formateado (ej. "320 kbps"). |
| samplerate | string | no | Sample rate formateado (ej. "44.1 kHz"). |
| duration | number | sí | Duración total en segundos. |
| elapsed | number | sí | Segundos transcurridos. |
| coverUrl | string | no | URL de la portada. |
| playlistIndex | number | sí | Posición en la playlist (base 0 o 1 según LMS). |
| playlistTotal | number | sí | Total de pistas en la playlist. |

### NextTrack

Representa la siguiente pista en la playlist.

| Field | Type | Required | Notes |
|---|---|---|---|
| title | string | sí | Nombre de la siguiente pista. |
| artist | string | no | Nombre del artista. |
| coverUrl | string | no | URL de la miniatura de portada. |

### StatusState

Estado renderizado en la caja de status.

| Field | Type | Required | Notes |
|---|---|---|---|
| mode | enum | sí | Valores: `playing-next`, `playing-last`, `stopped`, `disconnected`. |
| titleToken | stringToken | sí | Token de internacionalización del título de la caja. |
| nextTrack | NextTrack | no | Datos de la siguiente pista; presente cuando `mode == playing-next`. |

### ColorPalette

Constantes de la paleta visual.

| Token | Value | Uso |
|---|---|---|
| --bg-page | #252f3c | Fondo de toda la página. |
| --text-primary | #ffffff | Texto principal y títulos (100% opaco). |
| --text-dim | rgba(255,255,255,0.5) | Texto secundario, tiempos, labels (50% opaco). |
| --progress-fill | #4e8dca | Barra de progreso activa. |
| --progress-bg | #3a4046 | Fondo de la barra de progreso. |
| --status-bg | #263036 | Fondo de la caja de status. |

## Validation rules

- Si `tracknum` es nulo, el título no lleva prefijo numérico.
- Si `year` es nulo, se omite "(año)" del álbum.
- Si `artist` es nulo, se omite la línea "por Artista".
- Si `album` es nulo, se omite la línea "de Álbum".
- Los componentes de la línea técnica (`contentType`, `bitrate`, `samplerate`, `playlistIndex/total`) se omiten individualmente si faltan; los separadores " · " solo aparecen entre componentes presentes.
- El cover nunca se deforma; se limita a `max-height: 60vh` con `object-fit: contain`.

## State transitions

```
+-------------+      no next track      +------------------+
| playing-next| ----------------------> | playing-last     |
+-------------+                         +------------------+
       ^                                         |
       | next track available                    | playlist empty
       +-----------------------------------------+

any state --disconnect--> disconnected
any state --stop/no current track--> stopped
```

La transición se evalúa en cada actualización de playerstatus:
1. Si la conexión CometD/JSON-RPC está caída → `disconnected`.
2. Si no hay pista activa (modo stop y playlist vacía, o sin datos de track) → `stopped`.
3. Si hay pista activa y hay siguiente pista → `playing-next`.
4. Si hay pista activa y no hay siguiente pista → `playing-last`.

## Relationships

- `StatusState` depende de `CurrentTrack` (para saber si hay reproducción) y de `NextTrack`.
- La paleta es global y no depende de entidades dinámicas.
- Los tokens de internacionalización se resuelven en runtime por el frontend a partir de `strings.txt`.
