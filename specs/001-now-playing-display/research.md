# Research — Phase 0: Now Playing kiosk display

Todas las decisiones se verificaron contra fuentes reales: el código del servidor
(`LMS-Community/slimserver`, rama `public/9.2`, concretamente `Slim/Control/Queries.pm`,
`Slim/Web/Cometd.pm`, `Slim/Web/Graphics.pm`) y el código de Material Skin
(`CDrummond/lms-material`, `html/js/server.js`).

## 1. Canal de tiempo real: Cometd

**Decision**: suscripción al *playerstatus* del reproductor por Cometd, con librería
`libcometd.min.js` vendored localmente.

**Rationale**: el servidor implementa Cometd (Bayeux, long-polling) en
`Slim/Web/Cometd.pm`. El contrato de suscripción está documentado en el propio código:

```json
POST /cometd
{ "channel": "/slim/subscribe",
  "id": <n>, "clientId": <clid-del-handshake>,
  "data": {
    "response": "/<clid>/slim/playerstatus/<playerMac>",
    "request": ["<playerMac>", ["status", "-", 2, "tags:…", "subscribe:30"]]
  } }
```

- El canal de respuesta **lleva el clientId** embebido (`/<clid>/slim/playerstatus/…`);
  el dispatcher lo valida con `/([0-9a-f]{8})/` (Cometd.pm ~línea 414).
- El parámetro `subscribe:30` hace que el servidor re-ejecute la query y la empuje a ese
  canal cuando hay cambios (con heartbeat ≤ 30 s). Así llegan cambios de pista, pausa,
  progreso, etc., cumpliendo SC-001 sin recarga.
- Material Skin usa este patrón exacto (`server.js` líneas 966-968): suscripción
  `"/<clid>/slim/playerstatus/<id>"` con `["status","-",1,tags,"subscribe:30"]` más un
  catch-all `/<clid>/**`. Nosotros pedimos **2 ítems** de playlist (track actual +
  siguiente).
- El servidor responde con `advice: { reconnect: 'retry' }` cuando el player desconecta;
  el wrapper debe respetar reconexión con backoff (libcometd lo hace de serie).

**Alternativas consideradas**: polling a intervalos (descartado por decisión del usuario);
cliente Bayeux propio sobre fetch (descartado: reimplementar handshake/reconnect/advice es
propenso a errores justo donde la spec exige resiliencia — ver Complexity Tracking del plan).

## 2. Datos técnicos: letras de `tags` en la query `status`

**Decision**: query `["status", "-", 2, "tags:adiJloqrtTux"]` (+ los que precisen UI).
Letras verificadas en el mapa de tags de `Slim/Control/Queries.pm` (LMS 9.2):

| Letra | Campo (result) | Uso en la pantalla |
|---|---|---|
| `a` | `artist` | metadatos |
| `l` | `album` | metadatos |
| `t` | `title` | metadatos |
| `d` | `duration` | barra de progreso / total |
| `i` | `id` (track) | detectar cambio de pista (reset del ticker) |
| `o` | `type` (content_type/codec) | dato técnico: codec |
| `r` | `bitrate` (pretty) | dato técnico |
| `T` | `samplerate` | dato técnico |
| `I` | `samplesize` | dato técnico (bits) |
| `x` | `remote` (0/1) | origen local/remoto |
| `u` | `url` | respaldo/depuración de origen |
| `J` | `artwork_track_id` | carátula local: `/music/<id>/cover` |
| `K` | `artwork_url` | carátula remota (ya viene proxied por el servidor) |

Además la respuesta de `status` incluye (sin tags): `mode` (play/pause/stop), `time`
(segundos transcurridos), `playlist_cur_index` y `playlist_loop` (los 2 ítems pedidos).

**Campo ausente** → se omite sin hueco (FR-003). **Rationale:** es el contrato nativo y
documentado; ningún otro endpoint ofrece todo esto en una respuesta.

**Alternativas consideradas**: `songinfo` por track (más llamadas, misma info); plugin CLI
propio (innecesario — la query nativa ya lo cubre; constitución IV).

## 3. Siguiente track

**Decision**: `playlist_loop[1]` de la misma query `status` con count=2 y `-` (desde la
pista actual). **Rationale**: la posición ya viene (`playlist_cur_index` relativo al
bloque), una sola llamada sirve para actual y siguiente. Radio/colores sin siguiente ítem
→ elemento ausente → bloque oculto (FR-006).

**Alternativa considerada**: query `playlist` aparte (`["playlist","info",…]`) — duplica
tráfico y llega desincronizada; descartada.

## 4. Carátulas

**Decision**:
- Track actual: `/music/current/cover_600x600_f.jpg?player=<mac>`
  (confirmado en `Slim/Web/Graphics.pm` línea ~161: el id `current` resuelve al track en
  curso del player; el sufijo `_600x600_f` activa el redimensionado del servidor).
- Track siguiente: `/music/<artwork_track_id>/cover_300x300_f.jpg` (tag `J`) o
  `artwork_url` (tag `K`, ya proxied si es http(s)).
- Sin carátula → `html/images/cover-placeholder.svg` local (FR-011).

**Rationale**: el redimensionado en servidor evita descargar originales multi-MB en una
pantalla kiosk — rendimiento sin build ni servicios externos.

**Alternativa considerada**: descargar la carátula original y escalarla en CSS — peor
ancho de banda y peor tiempo de carga (SC-005).

## 5. Streams / radio sin duración

**Decision**: si `duration` falta o es 0 → ocultar barra y porcentaje; mostrar `time`
transcurrido si el servidor lo reporta (lo hace también para streams). `remote=1` y
`type`/codec identifican la procedencia; los datos técnicos ausentes se omiten.

**Rationale**: cumple FR-005 con el contrato real; Material resuelve igual (duración
indefinida → sin barra).

**Alternativa considerada**: estimar duración por metadatos remotos — no fiable en LMS;
descartado.

## 6. Idioma del display

**Decision**: `html/lang/en.json` (base) + `es.json`; selección: idioma de LMS
(preferencia `language`, consultable por RPC) con fallback a `navigator.language`, y EN
como última opción. **Rationale**: cumple la constitución V en el frontend; mismo mecanismo
que Material Skin (`html/lang/*.json`).

## Riesgos abiertos supervisados en quickstart

- Rendimiento del ticker con textos muy largos en dispositivos modestos (Raspberry Pi con
  kiosk): validar con animación por `transform` (GPU) y no por `left`/`margin`.
- Comportamiento tras suspensiones del navegador en kiosk: el reconnect advice de Cometd
  debe re-suscribir limpio; caso cubierto en quickstart (sleep/wake del dispositivo).
