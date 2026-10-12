# Contract: Query JSON-RPC `status` (campos usados)

Endpoint: `POST <lms>/jsonrpc.js` (única vía de datos junto al push Cometd —
constitución IV).

## Petición (carga inicial y re-sincronización)

```json
{
  "id": 1,
  "method": "slim.request",
  "params": ["<playerMac>", ["status", "-", 2, "tags:adiJloqrtTux"]]
}
```

`-` = desde la pista actual; `2` = pista actual + siguiente (NextTrack).

## Campos del resultado que la pantalla usa

Nivel raíz del `result`:

| Campo | Tipo | Notas |
|---|---|---|
| `mode` | "play" / "pause" / "stop" | gobierna DisplayState |
| `time` | number (s) | transcurrido; también en streams |
| `playlist_cur_index` | number | índice actual dentro de la cola |
| `playlist_loop` | array[2] | [0] = actual, [1] = siguiente |

Elemento de `playlist_loop`:

| Campo | tag | Uso |
|---|---|---|
| `title` | t | título |
| `artist` | a | artista |
| `album` | l | álbum |
| `duration` | d | duración; ausente o 0 → stream sin duración (FR-005) |
| `type` | o | codec (mp3/flc/aac…) |
| `bitrate` | r | texto "320 kbps" / "1,411 kbps VBR"… |
| `samplerate` | T | Hz (mostrar kHz) |
| `samplesize` | I | bits por muestra |
| `remote` | x | 1 = remoto |
| `id` | i | clave de cambio de pista |
| `artwork_track_id` | J | carátula local |
| `artwork_url` | K | carátula remota (http proxied por el servidor) |

## Petición auxiliar (solo al arrancar, para elegir reproductor)

```json
{ "id": 1, "method": "slim.request",
  "params": ["-", ["serverstatus", 0, 100]] }
```

Usa `players_loop[].playerid|name|connected`. Sin `?player=` → primer reproductor
**conectado**; con parámetro inválido o ninguno conectado → estado `NoPlayer`
(US5-AS3, edge case).

## Reglas de consumo

- Un campo ausente nunca se muestra vacío: se omite (FR-003).
- Las carátulas se piden con redimensionado de servidor (`cover_600x600_f` /
  `cover_300x300_f`); nunca originales.
- Errores HTTP/JSON-RPC → estado `Offline` con reintento (sin recarga de página).
