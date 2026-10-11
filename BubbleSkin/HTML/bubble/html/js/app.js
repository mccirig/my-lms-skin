'use strict';

/*
 * BubbleSkin - cliente SPA mínimo para LMS.
 *
 * Toda la comunicación con el servidor se hace con POST JSON a /jsonrpc.js:
 *   { id, method: "slim.request", params: [playerId, [comando, args...]] }
 * Usa "-" como playerId para comandos de servidor (ver docs/05-api-servidor.md).
 */

const RPC = '/jsonrpc.js';

async function rpc(playerId, command) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      method: 'slim.request',
      params: [playerId, command],
    }),
  });
  const data = await res.json();
  return data.result;
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

let currentPlayer = null;
let pageSize = 20;

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Reproductores
// ---------------------------------------------------------------------------

async function loadPlayers() {
  const status = await rpc('-', ['serverstatus', 0, 100]);
  const players = status.players_loop || [];

  const select = $('player');
  select.innerHTML = '';
  players.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.playerid;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  if (players.length) {
    currentPlayer = players[0].playerid;
    select.value = currentPlayer;
  }
}

// ---------------------------------------------------------------------------
// Now playing + transporte
// ---------------------------------------------------------------------------

async function refreshStatus() {
  if (!currentPlayer) return;

  // tags: a=artista, l=álbum, t=título
  const s = await rpc(currentPlayer, ['status', '-', 1, 'tags:alt']);

  const track = (s.playlist_loop || [])[0];
  $('track-title').textContent = track ? (track.title || '—') : '—';
  $('track-artist').textContent = track && track.artist ? track.artist : '';
  $('track-album').textContent = track && track.album ? track.album : '';
  $('cover').src = '/music/current/cover_200x200_f.jpg?player=' + encodeURIComponent(currentPlayer);

  $('btn-play').innerHTML = s.mode === 'play' ? '&#x23F8;' : '&#x25B6;';
  $('volume').value = s['mixer volume'] ?? 50;
}

async function transport(cmd) {
  if (!currentPlayer) return;
  if (cmd === 'toggle') {
    const s = await rpc(currentPlayer, ['status', '-', 1, 'tags:']);
    await rpc(currentPlayer, [s.mode === 'play' ? 'pause' : 'play']);
  } else if (cmd === 'prev') {
    await rpc(currentPlayer, ['playlist', 'index', '-1']);
  } else if (cmd === 'next') {
    await rpc(currentPlayer, ['playlist', 'index', '+1']);
  }
  setTimeout(refreshStatus, 300);
}

// ---------------------------------------------------------------------------
// Biblioteca
// ---------------------------------------------------------------------------

async function loadAlbums() {
  if (!currentPlayer) return;

  // tags: a=artista, l=álbum
  const data = await rpc(currentPlayer, ['albums', 0, pageSize, 'tags:al']);

  const list = $('albums');
  list.innerHTML = '';
  (data.albums_loop || []).forEach((album) => {
    const li = document.createElement('li');
    li.className = 'album';
    li.innerHTML =
      '<span class="album-name"></span> <span class="album-artist"></span>';
    li.querySelector('.album-name').textContent = album.album;
    li.querySelector('.album-artist').textContent = album.artist || '';
    li.addEventListener('click', async () => {
      await rpc(currentPlayer, ['playlistcontrol', 'cmd:load', 'album_id:' + album.id]);
      setTimeout(refreshStatus, 500);
    });
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Preferencias del plugin (demo de comando CLI propio)
// ---------------------------------------------------------------------------

async function loadPluginPrefs() {
  try {
    const r = await rpc('-', ['bubbleskin', 'hello']);
    if (r.albumsPageSize) pageSize = Number(r.albumsPageSize) || pageSize;
    if (r.accentColor) document.documentElement.style.setProperty('--accent', r.accentColor);
    console.log('[bubbleskin]', r.mensaje);
  } catch (e) {
    console.warn('Comando bubbleskin no disponible (¿plugin activado?)', e);
  }
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

async function init() {
  await loadPlayers();
  await loadPluginPrefs();
  await loadAlbums();
  await refreshStatus();

  $('player').addEventListener('change', async (e) => {
    currentPlayer = e.target.value;
    await loadAlbums();
    await refreshStatus();
  });
  $('btn-play').addEventListener('click', () => transport('toggle'));
  $('btn-prev').addEventListener('click', () => transport('prev'));
  $('btn-next').addEventListener('click', () => transport('next'));
  $('volume').addEventListener('change', async (e) => {
    if (currentPlayer) await rpc(currentPlayer, ['mixer', 'volume', Number(e.target.value)]);
  });

  // Refresco por polling simple. Para actualizaciones en tiempo real mira
  // el canal Cometd (/cometd), documentado en docs/05-api-servidor.md.
  setInterval(refreshStatus, 5000);
}

init();
