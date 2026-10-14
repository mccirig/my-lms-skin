/* cometd.js — wrapper de libcometd para el canal playerstatus de LMS.
 * Contrato: specs/001-now-playing-display/contracts/cometd-playerstatus.md
 * (patrón verificado en Slim/Web/Cometd.pm y en el código de Material Skin). */
'use strict';

window.BUBBLE = window.BUBBLE || {};

BUBBLE.cometdClient = (function () {

  var STATUS_TAGS = 'adiJloqrtTux';
  var SUBSCRIBE_SECS = 30; // heartbeat del push (subscribe:30)

  var cometd = null;
  var playerId = null;
  var connected = false;
  var listeners = { status: [], online: [], offline: [] };

  function on(event, cb) {
    if (listeners[event]) listeners[event].push(cb);
  }

  function emit(event, arg) {
    listeners[event].slice().forEach(function (cb) {
      try { cb(arg); } catch (e) { console.error('[bubbleskin cometd cb]', e); }
    });
  }

  function subscribePlayerStatus() {
    var clid = cometd.getClientId();
    console.log('[bubble] clientId =', clid, 'playerId =', playerId);
    // catch-all: todos los mensajes dirigidos a este cliente
    cometd.subscribe('/' + clid + '/**', function (message) {
      console.log('[bubble] raw message', message.channel, message.data ? Object.keys(message.data).join(',') : '-');
      emit('status', message.data);
    });
    // suscripción al estado del reproductor (el canal response DEBE contener el clid)
    cometd.subscribe('/slim/subscribe', function () {}, {
      data: {
        response: '/' + clid + '/slim/playerstatus/' + playerId,
        request: [playerId, ['status', '-', 2, 'tags:' + STATUS_TAGS, 'subscribe:' + SUBSCRIBE_SECS]]
      }
    });
  }

  function init(pid) {
    playerId = pid;

    if (typeof org === 'undefined' || !org.cometd || !org.cometd.CometD) {
      console.error('[bubbleskin] libcometd no disponible');
      emit('offline');
      return false;
    }

    cometd = new org.cometd.CometD();
    try {
      // maxBackoff es un campo de configuración (máx. 10 s entre reintentos);
      // init(config) = configure() + handshake()
      // websocketEnabled: false → LMS no expone WebSocket en /cometd, forzamos long-polling
      cometd.init({ url: '/cometd', logLevel: 'off', maxBackoff: 10000, websocketEnabled: false });
    } catch (e) {
      console.error('[bubbleskin] fallo al iniciar cometd', e);
      emit('offline');
      return false;
    }

    cometd.addListener('/meta/handshake', function (message) {
      if (message.successful) {
        cometd.batch(subscribePlayerStatus);
        connected = true;
        emit('online');
      } else {
        connected = false;
        emit('offline');
      }
    });

    // Patrón canónico de libcometd para estado de enlace
    cometd.addListener('/meta/connect', function (message) {
      if (cometd.isDisconnected()) {
        connected = false;
        emit('offline');
        return;
      }
      var wasConnected = connected;
      connected = message.successful === true;
      if (!wasConnected && connected) { emit('online'); }
      else if (wasConnected && !connected) { emit('offline'); }
    });

    cometd.addListener('/meta/disconnect', function () {
      connected = false;
      emit('offline');
    });

    return true;
  }

  return { on: on, init: init };
})();
