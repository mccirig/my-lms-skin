# Data Model — Now Playing kiosk display

Modelo del lado display (lectura). Todo proviene de la respuesta de `status`
(JSON-RPC inicial y pushes Cometd); ver [contracts/status-query.md](contracts/status-query.md)
para el mapeo campo a campo.

## Player (Reproductor)

| Campo | Tipo | Fuente | Validación |
|---|---|---|---|
| id | string (MAC) | selección `?player=` o 1º del servidor | formato MAC o vacío → estado "reproductor no encontrado" |
| name | string | `serverstatus.players_loop[].name` | solo informativo (no se muestra en v1.0) |
| mode | enum: play/pause/stop | `status.mode` | gobierna los estados de pantalla |
| connected | bool | `serverstatus.players_loop[].connected` | 0 → estado "reproductor no disponible" |

## TrackNow (Track actual)

| Campo | Tipo | Fuente (tag) | Validación / reglas |
|---|---|---|---|
| title | string | `playlist_loop[0].title` (`t`) | ticker si desborda (FR-012) |
| artist | string | `…[0].artist` (`a`) | idem |
| album | string | `…[0].album` (`l`) | idem |
| duration | number (s) \| null | `…[0].duration` (`d`) | null/0 → sin barra porcentual (FR-005) |
| codec | string \| null | `…[0].type` (`o`) | ausente → omitir campo |
| bitrate | string \| null | `…[0].bitrate` (`r`) | ausente → omitir |
| samplerate | number \| null | `…[0].samplerate` (`T`) | presentar formateado (p. ej. "96 kHz") |
| samplesize | number \| null | `…[0].samplesize` (`I`) | presentar como bits ("24-bit") |
| remote | bool | `…[0].remote` (`x`) | 1 → origen "remoto", 0 → "local" |
| trackId | string \| null | `…[0].artwork_track_id` (`J`) | carátula local |
| artworkUrl | string \| null | `…[0].artwork_url` (`K`) | carátula remota (ya proxied) |
| changeKey | string | `…[0].id` (`i`) o url | cambio de valor → reiniciar ticker y vistas |

## Progress (Progreso)

| Campo | Tipo | Fuente | Reglas |
|---|---|---|---|
| elapsed | number (s) | `status.time` | avanza visiblemente mientras `mode=play`; congelado en pause |
| duration | number (s) \| null | TrackNow.duration | si null → solo tiempo transcurrido |
| paused | bool | `mode !== 'play'` | indicación visual obligatoria (FR-010) |

## NextTrack (Siguiente track)

| Campo | Tipo | Fuente | Reglas |
|---|---|---|---|
| title | string | `playlist_loop[1].title` | bloque oculto si no existe |
| artist | string | `playlist_loop[1].artist` | — |
| cover | url | `J`/`K` del segundo ítem | placeholder si falta |

## DisplayState (máquina de estados de la pantalla)

```text
Loading ──ok──► Playing ──pause──► Paused ──play──► Playing
   │               │  └─stop/cola vacía─► NothingPlaying ──play──► Playing
   │               └─server down──► Offline ──server up──► Loading
   ├─sin player──► NoPlayer (parámetro inválido / ninguno conectado)
   └─error carga─► Offline
```

Transiciones disparadas por cada evento Cometd/JSON-RPC. Reglas:
- `NothingPlaying` y `NoPlayer` muestran estados presentables (FR-009, US5-AS3).
- `Offline` muestra estado discreto y reintenta solo (edge case sin conexión).
- En `Playing`/`Paused`, `Progress` se deriva del último push + reloj local entre pushes
  (re-sincronizado a cada evento; nunca drifta más de la cadencia de subscribe).

## Validaciones transversales

- Todo string visible pasa por el diccionario i18n (constitución V).
- Números técnicos: formato local fijo EN/ES (p. ej., separador de miles), sin unidades
  inventadas cuando el dato falta.
- URLs de carátula: siempre relativas al origen LMS (offline, constitución II).
