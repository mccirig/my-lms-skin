/* display.js — render y actualización incremental de la pantalla.
 * Modelo y reglas: specs/001-now-playing-display/data-model.md */
'use strict';

window.BUBBLE = window.BUBBLE || {};

BUBBLE.display = (function () {

  var E = {};        // elementos cacheados por id
  var tickers = {};  // tickers por id de campo
  var dict = {};
  var playerId = null;

  var state = 'loading';
  var mode = 'stop';
  var baseElapsed = 0;     // segundos reportados en el último dato del servidor
  var baseElapsedAt = 0;   // instante local de ese dato
  var duration = null;     // null → stream sin duración (FR-005)
  var progressTimer = null;
  var lastTrackKey = null;

  var TICKER_FIELDS = ['title', 'artist', 'album', 'tech', 'status-title', 'coming-title', 'coming-artist'];

  function qs(id) { return document.getElementById(id); }
  function t(key) { return dict[key] || key; }

  /* ---------------- infraestructura ---------------- */

  function bind(i18nDict) {
    dict = i18nDict || {};

    ['cover', 'title', 'artist', 'album', 'tech', 'progress', 'progress-fill',
     'time-elapsed', 'time-total', 'status', 'status-title', 'status-body',
     'state-msg']
      .forEach(function (id) { E[id] = qs(id); });

    TICKER_FIELDS.forEach(function (id) {
      var target = E[id].closest('.ticker-target') || E[id];
      tickers[id] = BUBBLE.createTicker(target);
    });

    E['cover'].onerror = function () {
      E['cover'].src = 'html/images/cover-placeholder.svg';
      E['cover'].onerror = null; // placeholder: sin bucle
    };

    // Re-medición de tickers al rotar/redimensionar (families H/V cambian anchos)
    window.addEventListener('resize', function () {
      TICKER_FIELDS.forEach(function (id) { tickers[id].refresh(); });
    });
  }

  function setState(name, msgKey) {
    state = name;
    document.body.setAttribute('data-state', name);
    if (!E['state-msg']) { return; }
    if (name === 'noplayer') E['state-msg'].textContent = t(msgKey || 'no_player');
    else if (name === 'offline') E['state-msg'].textContent = t('no_connection');
    else if (name === 'nothing') E['state-msg'].textContent = t('nothing_playing');
    else if (name === 'paused') E['state-msg'].textContent = t('paused');
    else E['state-msg'].textContent = '';
  }

  function setText(id, txt) {
    if (tickers[id]) { tickers[id].setText(txt || ''); }
    else if (E[id]) { E[id].textContent = txt || ''; }
  }

  function setPlayer(pid) { playerId = pid; }

  function setConnected(connected) {
    if (!connected) {
      stopClock();
      setState('offline');
      renderStatus({ mode: 'disconnected' });
    }
  }

  function fmtTime(secs) {
    secs = Math.max(0, Math.floor(secs || 0));
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }

  function fmtSampleRate(sr) {
    var khz = (Number(sr) / 1000);
    // 44100 → "44.1 kHz" (quita .0), 96000 → "96 kHz"
    return (Math.round(khz * 10) / 10).toString().replace(/\.0$/, '') + ' ' + t('khz');
  }

  /* ---------------- renders parciales ---------------- */

  function renderCover(trackKey) {
    var url = '/music/current/cover_600x600_f.jpg?player=' + encodeURIComponent(playerId) +
              '&_=' + encodeURIComponent(trackKey); // bust de caché al cambiar de pista
    E['cover'].onerror = function () {
      E['cover'].src = 'html/images/cover-placeholder.svg';
      E['cover'].onerror = null;
    };
    E['cover'].src = url;
  }

  function formatMetadata(track) {
    var sep = ' \u00b7 '; // punto medio con espacios
    var lines = {};

    var titleParts = [];
    if (track.tracknum) { titleParts.push(String(track.tracknum)); }
    if (track.title) { titleParts.push(track.title); }
    lines.title = titleParts.join(sep);

    lines.artist = track.artist ? t('by') + ' ' + track.artist : '';

    var albumParts = [];
    if (track.album) { albumParts.push(track.album); }
    if (track.year) { albumParts.push('(' + track.year + ')'); }
    lines.album = albumParts.length ? t('from') + ' ' + albumParts.join(' ') : '';

    return lines;
  }

  function renderMetadata(track) {
    var lines = formatMetadata(track);
    setText('title', lines.title);
    setText('artist', lines.artist || t('unknown_artist'));
    setText('album', lines.album || t('unknown_album'));
  }

  function renderTech(track) {
    var parts = [];
    if (track.type) parts.push(String(track.type).toUpperCase());
    if (track.bitrate) parts.push(String(track.bitrate));
    if (track.samplerate) parts.push(fmtSampleRate(track.samplerate));
    if (track.samplesize) parts.push(String(track.samplesize) + t('bit'));
    // posición en playlist "N de M" si hay datos
    var idx = Number(track.playlist_index);
    var total = Number(track.playlist_total);
    if (!isNaN(idx) && !isNaN(total) && total > 0) {
      parts.push((idx + 1) + ' ' + t('of') + ' ' + total);
    }
    setText('tech', parts.join(' \u00b7 '));
  }

  function renderProgress() {
    var hasDuration = !!duration;
    E['progress'].classList.toggle('np-progress--noduration', !hasDuration);

    var elapsed = currentElapsed();
    E['time-elapsed'].textContent = fmtTime(elapsed);
    E['time-total'].textContent = hasDuration ? fmtTime(duration) : '';

    var pct = hasDuration ? Math.min(100, (elapsed / duration) * 100) : 0;
    E['progress-fill'].style.width = pct + '%';
  }

  function renderStatus(status) {
    // status = { mode: 'playing-next'|'playing-last'|'stopped'|'disconnected', next: NextTrack|null }
    var titleKey = '';
    var bodyHtml = '';

    if (!status || status.mode === 'disconnected') {
      titleKey = 'no_connection';
    } else if (status.mode === 'stopped') {
      titleKey = 'nothing_playing';
    } else if (status.mode === 'playing-last') {
      titleKey = 'nothing_next';
    } else {
      titleKey = 'coming_up';
    }

    E['status-title'].textContent = t(titleKey);

    if (status && status.mode === 'playing-next' && status.next) {
      var next = status.next;
      var cover = 'html/images/cover-placeholder.svg';
      if (next.artwork_track_id) {
        cover = '/music/' + next.artwork_track_id + '/cover_300x300_f.jpg';
      } else if (next.artwork_url) {
        cover = next.artwork_url;
      }
      bodyHtml = '<img class="np-coming-cover" src="' + escapeHtml(cover) + '" alt="" onerror="this.src=\'html/images/cover-placeholder.svg\';this.onerror=null;">' +
                 '<div class="np-coming-meta">' +
                   '<div class="np-coming-title">' + escapeHtml(next.title || '') + '</div>' +
                   '<div class="np-coming-artist np-dim">' + escapeHtml(next.artist || '') + '</div>' +
                 '</div>';
      E['status-body'].innerHTML = '<div class="np-comingup">' + bodyHtml + '</div>';
      // Medir tickers del contenido dinámico recién insertado
      if (tickers['coming-title']) { tickers['coming-title'].refresh(); }
      if (tickers['coming-artist']) { tickers['coming-artist'].refresh(); }
    } else {
      E['status-body'].innerHTML = '';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- progreso ---------------- */

  function currentElapsed() {
    if (mode !== 'play') { return baseElapsed; }
    return baseElapsed + (Date.now() - baseElapsedAt) / 1000;
  }

  function updateProgress() {
    var hasDuration = !!duration;
    E['progress'].classList.toggle('np-progress--noduration', !hasDuration);

    var elapsed = currentElapsed();
    E['time-elapsed'].textContent = fmtTime(elapsed);
    E['time-total'].textContent = hasDuration ? fmtTime(duration) : '';

    var pct = hasDuration ? Math.min(100, (elapsed / duration) * 100) : 0;
    E['progress-fill'].style.width = pct + '%';
  }

  function startClock() {
    stopClock();
    progressTimer = setInterval(function () { updateProgress(); }, 1000);
  }

  function stopClock() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  }

  /* ---------------- actualización principal ---------------- */

  // Recibe el objeto resultado de `status` (idéntico en JSON-RPC y en push Cometd)
  function update(res, pid) {
    if (!res) return;
    if (pid) playerId = pid;

    var items = res.playlist_loop || [];
    var now = items[0] || null;
    var next = items[1] || null;

    mode = res.mode || 'stop';
    baseElapsed = Number(res.time || 0);
    baseElapsedAt = Date.now();

    if (mode === 'stop' || !now) {
      stopClock();
      lastTrackKey = null;
      setState('nothing');
      renderStatus({ mode: 'stopped' });
      return;
    }

    var trackKey = String(now.id || now.url || now.title || '');
    var trackChanged = trackKey !== lastTrackKey;
    lastTrackKey = trackKey;

    var prevState = state;
    setState(mode === 'pause' ? 'paused' : 'playing');

    if (trackChanged) {
      renderCover(trackKey);
      renderMetadata(now);
    }
    renderTech(now);

    duration = now.duration ? Number(now.duration) : null;
    renderProgress();
    if (mode === 'play') { startClock(); } else { stopClock(); }

    var statusMode = next ? 'playing-next' : 'playing-last';
    renderStatus({ mode: statusMode, next: next });

    // Re-medir tickers solo cuando hay cambio de pista O cambio de estado
    if (trackChanged || prevState !== state) {
      TICKER_FIELDS.forEach(function (id) { tickers[id].refresh(); });
    }
  }

  return {
    bind: bind,
    setState: setState,
    setConnected: setConnected,
    setPlayer: setPlayer,
    update: update
  };
})();
