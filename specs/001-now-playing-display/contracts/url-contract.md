# Contract: URL del display

El skin `bubble` se sirve en `http://<lms>:9000/bubble/` (la página principal del skin ES
la pantalla kiosk).

## Parámetros de entrada

| Parámetro | Valor | Comportamiento |
|---|---|---|
| `player` | MAC del reproductor (`aa:bb:cc:dd:ee:ff`) | La pantalla muestra ese reproductor |
| *(ausente)* | — | Primer reproductor conectado según el orden de `serverstatus` |

## Comportamiento de errores de entrada

| Entrada | Resultado |
|---|---|
| `player` con MAC inexistente | estado `NoPlayer` ("reproductor no encontrado"), sin error técnico |
| `player` de reproductor desconectado | estado `NoPlayer`/"reproductor no disponible" |
| parámetros extra desconocidos | se ignoran sin efecto |

## Qué NO hay

- Ningún parámetro de controles, layout ni volumen.
- Ninguna otra página propia en v1.0 (fuera de alcance: ajustes del display).

## Recursos servidos (todos originados en LMS — SC-004)

| Ruta | Contenido |
|---|---|
| `/bubble/` (o `/bubble/index.html`) | shell de la pantalla (TT: inyecta `webroot`) |
| `/bubble/html/css/display.css` | estilos, ambas familias de layout |
| `/bubble/html/js/{boot,lms,cometd,display,ticker}.js` | lógica de la pantalla |
| `/bubble/html/lib/libcometd.min.js` | librería vendored |
| `/bubble/html/lang/{en,es}.json` | diccionarios |
| `/bubble/html/images/cover-placeholder.svg` | placeholder de carátula |
