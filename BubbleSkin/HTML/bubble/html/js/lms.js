/* lms.js — cliente JSON-RPC mínimo para LMS.
 * Constitución IV: única vía síncrona de datos (el push es Cometd).
 * Contratos: specs/001-now-playing-display/contracts/status-query.md */
'use strict';

window.BUBBLE = window.BUBBLE || {};

BUBBLE.lms = (function () {

  function rpc(playerId, command) {
    return fetch('/jsonrpc.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        method: 'slim.request',
        params: [playerId || '-', command]
      })
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('HTTP ' + res.status);
        err.code = 'HTTP';
        throw err;
      }
      return res.json();
    }).then(function (data) {
      if (data && data.error) {
        var err = new Error(String(data.error));
        err.code = 'RPC';
        throw err;
      }
      return data.result;
    });
  }

  function getServerStatus() {
    return rpc('-', ['serverstatus', 0, 100]);
  }

  function getPlayerStatus(playerId) {
    // 2 ítems de playlist desde la pista actual ('-'): actual + siguiente
    return rpc(playerId, ['status', '-', 2, 'tags:adiJloqrtTux']);
  }

  function getServerLanguage() {
    // CLI nativa: ["pref", "language"] → { _p2: "<idioma>" }
    return rpc('-', ['pref', 'language']);
  }

  return {
    rpc: rpc,
    getServerStatus: getServerStatus,
    getPlayerStatus: getPlayerStatus,
    getServerLanguage: getServerLanguage
  };
})();
