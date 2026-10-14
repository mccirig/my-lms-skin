/* boot.js — arranque del display.
 * Contratos: contracts/url-contract.md (parámetro ?player=), data-model.md. */
'use strict';

(function () {

  var SERVER_RETRY_MS = 5000;
  var currentPlayer = null;

  function playerFromUrl() {
    var m = /[?&]player=([0-9a-fA-F:]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null; // parámetros desconocidos: ignorados
  }

  function loadDict(lang) {
    return fetch('html/lang/' + lang + '.json').then(function (r) {
      if (!r.ok) throw new Error('lang ' + lang + ' ' + r.status);
      return r.json();
    });
  }

  function chooseLanguage() {
    // 1º idioma configurado en el servidor; 2º idioma del navegador; 3º 'en'
    return BUBBLE.lms.getServerLanguage()
      .then(function (res) {
        return (res && res._p2) ? String(res._p2).toLowerCase() : null;
      })
      .catch(function () {
        return (navigator.language || 'en').slice(0, 2).toLowerCase();
      });
  }

  function loadI18n(lang) {
    return loadDict(lang).catch(function () { return loadDict('en'); })
                         .catch(function () { return {}; });
  }

  /* ---------- selección de reproductor (US5) ---------- */

  function choosePlayer(serverStatus) {
    var players = (serverStatus && serverStatus.players_loop) || [];
    var wanted = playerFromUrl();

    if (wanted) {
      var found = players.filter(function (p) { return p.playerid === wanted; })[0] || null;
      if (!found) { return { error: 'no_player' }; }                            // inexistente
      if (String(found.connected) === '0') { return { error: 'no_player_available' }; } // desconectado
      return { player: found };
    }

    var first = players.filter(function (p) { return String(p.connected) !== '0'; })[0] || null;
    if (!first) { return { error: 'no_player' }; }                              // ninguno conectado
    return { player: first };
  }

  /* ---------- arranque / resincronización ---------- */

  function resync() {
    if (!currentPlayer) return Promise.resolve();
    return BUBBLE.lms.getPlayerStatus(currentPlayer)
      .then(function (res) { BUBBLE.display.update(res, currentPlayer); })
      .catch(function () { BUBBLE.display.setConnected(false); });
  }

  function updateOrientationClass() {
    var np = document.getElementById('np');
    if (!np) return;
    var isHorizontal = window.innerWidth > window.innerHeight;
    np.classList.toggle('orientation-horizontal', isHorizontal);
    np.classList.toggle('orientation-vertical', !isHorizontal);
  }

  var listenersBound = false;

  function startWithPlayer(pid) {
    currentPlayer = pid;
    BUBBLE.display.setPlayer(pid);

    resync().then(function () {
      if (!listenersBound) {
        listenersBound = true;
        console.log('[bubble] binding cometd listeners');
        BUBBLE.cometdClient.on('status', function (data) {
          console.log('[bubble] status event mode=', data && data.mode, 'keys=', data ? Object.keys(data).join(',') : '-');
          if (data && data.mode !== undefined) { BUBBLE.display.update(data, pid); }
        });
        BUBBLE.cometdClient.on('offline', function () { console.log('[bubble] offline event'); BUBBLE.display.setConnected(false); });
        BUBBLE.cometdClient.on('online', function () { console.log('[bubble] online event'); resync(); }); // re-sincronizar al volver
      }

      console.log('[bubble] init cometd for player', pid);
      if (!BUBBLE.cometdClient.init(pid)) {
        // lib ausente o init falló: reintento silencioso
        setTimeout(function () { startWithPlayer(pid); }, SERVER_RETRY_MS);
      }
    });
  }

  function boot() {
    BUBBLE.display.setState('loading');
    updateOrientationClass();

    chooseLanguage()
      .then(loadI18n)
      .then(function (dict) {
        BUBBLE.display.bind(dict);
        return BUBBLE.lms.getServerStatus();
      })
      .then(function (status) {
        var choice = choosePlayer(status);
        if (choice.error) {
          BUBBLE.display.setState('noplayer', choice.error);
          return;
        }
        startWithPlayer(choice.player.playerid);
      })
      .catch(function () {
        // servidor inalcanzable → estado Offline y reintento silencioso
        BUBBLE.display.setConnected(false);
        setTimeout(boot, SERVER_RETRY_MS);
      });
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('resize', updateOrientationClass);
  window.addEventListener('orientationchange', updateOrientationClass);
})();
