# Contract: Canal push Cometd `playerstatus`

La pantalla consume el mecanismo oficial Cometd/Bayeux de LMS (`Slim/Web/Cometd.pm`).
Verificado tambíen en el código de Material Skin (`html/js/server.js`).

## Handshake y conexión

```
POST /cometd  (transporte long-polling)
[{"channel":"/meta/handshake","version":"1.0",
  "supportedConnectionTypes":["long-polling"]}]
→ successful + clientId ("<8-hex>")
```

Después se mantienen `/meta/connect` abiertos (long-polling) y el servidor empuja eventos.

## Suscripción al estado del reproductor

```json
[{
  "channel": "/slim/subscribe",
  "id": "<n único>",
  "clientId": "<clid>",
  "data": {
    "response": "/<clid>/slim/playerstatus/<playerMac>",
    "request": ["<playerMac>", ["status", "-", 2, "tags:adiJloqrtTux", "subscribe:30"]]
  }
}]
```

(Regla del servidor: el canal `response` DEBE contener el clid de 8 hex.)

Tags usados (`adiJloqrtTux`): artist, duration, trackId, artwork ids/URLs, album, codec,
bitrate (pretty), title, samplerate, url, remote — detalle en [research.md](../research.md)
§2. `subscribe:30` = push con latencia baja y heartbeat ≤ 30 s.

## Mensajes entrantes

Los resultados de la query llegan continuamente en:

```json
{ "channel": "/<clid>/slim/playerstatus/<playerMac>",
  "data": { /* resultado de status igual al del JSON-RPC, ver status-query.md */ } }
```

El cliente además escucha `/<clid>/**` (catch-all).

## Errores y reconexión

- Si el reproductor no está conectado, el servidor responde en `/slim/subscribe` con
  `error` + `advice.reconnect = "retry"`: el cliente DEBE respetarlo (reintentar según
  advice, con backoff) — cubre el edge case "reproductor no disponible".
- Tras `/meta/reconnect` (caída de red, sleep del dispositivo), las suscripciones se
  re-emiten limpias.
- Si el handshake falla repetidamente → estado de pantalla `Offline`.

## Qué NO forma parte del contrato

- Ningún control (play/pausa/volumen): la pantalla es solo lectura (FR-013).
- Canales `serverstatus`/`menustatus` del skin Default: no se usan en v1.0.
