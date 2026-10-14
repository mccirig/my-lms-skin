# UI Contract: BubbleSkin Now Playing Display

**Feature**: specs/002-vertical-ui-polish

This contract defines the interface between the renderer and the HTML/CSS structure of the now-playing screen. It is used by the implementation phase to keep DOM selectors, CSS classes and JavaScript data contracts aligned.

## DOM Structure

The `index.html` must contain at least the following hierarchy of IDs and classes:

```html
<div id="app" class="orientation-vertical">
  <div class="np-cover-area">
    <img id="np-cover" class="np-cover" alt="" />
  </div>

  <div class="np-metadata">
    <div id="np-title" class="np-title"></div>
    <div id="np-artist" class="np-artist np-dim"></div>
    <div id="np-album" class="np-album np-dim"></div>
    <div id="np-tech" class="np-tech np-dim"></div>
  </div>

  <div class="np-progress">
    <div class="np-progress-bar">
      <div id="np-progress-fill" class="np-progress-fill"></div>
    </div>
    <div class="np-progress-times">
      <span id="np-elapsed" class="np-dim"></span>
      <span id="np-duration" class="np-dim"></span>
    </div>
  </div>

  <div class="np-status">
    <div id="np-status-title" class="np-status-title np-dim"></div>
    <div id="np-status-body" class="np-status-body">
      <!-- playing-next: thumbnail + title + artist -->
      <!-- other modes: empty or message -->
    </div>
  </div>
</div>
```

## CSS Classes

| Class | Purpose |
|---|---|
| `.orientation-vertical` | Applied to `#app` when viewport aspect ratio is portrait. |
| `.orientation-horizontal` | Applied to `#app` when viewport aspect ratio is landscape. |
| `.np-cover-area` | Container for the main cover. |
| `.np-cover` | The cover image. Must preserve aspect ratio. |
| `.np-metadata` | Group for title, artist, album and technical line. |
| `.np-title` | Track title, 100% opacity. |
| `.np-artist`, `.np-album`, `.np-tech` | Secondary lines, 50% opacity. |
| `.np-dim` | Utility to apply 50% opacity. |
| `.np-progress-bar` | Track background of the progress bar. |
| `.np-progress-fill` | Filled portion of the progress bar. |
| `.np-progress-times` | Container for elapsed/duration times. |
| `.np-status` | Bottom status box. |
| `.np-status-title` | Title of the status box. |
| `.np-status-body` | Body of the status box. |

## JavaScript Contract

`display.js` exposes the following API used by `boot.js`:

```javascript
// Update the full now-playing screen.
display.update(playerStatus);

// playerStatus object shape:
{
  connected: boolean,        // true if JSON-RPC/CometD reachable
  current: CurrentTrack,     // see data-model.md
  next: NextTrack|null       // see data-model.md
}
```

When `playerStatus.current` is `null`, the renderer must show the `stopped` status state.
When `connected` is `false`, the renderer must show the `disconnected` status state regardless of other fields.

## Color Tokens

| Token | Value |
|---|---|
| `--bg-page` | `#252f3c` |
| `--text-primary` | `#ffffff` |
| `--text-dim` | `rgba(255, 255, 255, 0.5)` |
| `--progress-fill` | `#4e8dca` |
| `--progress-bg` | `#3a4046` |
| `--status-bg` | `#263036` |

## Internationalization Tokens

New tokens to be added to `strings.txt` (EN + ES):

| Token | EN | ES |
|---|---|---|
| `BUBBLESKIN_BY` | by | por |
| `BUBBLESKIN_FROM` | from | de |
| `BUBBLESKIN_COMING_UP` | Coming up | A continuación |
| `BUBBLESKIN_NOTHING_NEXT` | Nothing up next | Nada que reproducir |
| `BUBBLESKIN_NO_CONNECTION` | No connection to server | Sin conexión con el servidor |
| `BUBBLESKIN_NOTHING_PLAYING` | Nothing playing | Nada en reproducción |

The renderer reads the resolved strings from the frontend i18n layer (`lang/*.json` or equivalent) using the token keys above.
