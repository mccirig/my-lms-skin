/* ticker.js — FR-012 EXACTO:
 * textos que exceden su contenedor se desplazan lentos y constantes de
 * derecha a izquierda; al alcanzar el último carácter, pausa de ~1 s y
 * reaparición instantánea en la posición inicial. Textos que caben: estáticos.
 * NUNCA ellipsis. Reinicio (posición inicial) al cambiar el texto/pista. */
'use strict';

window.BUBBLE = window.BUBBLE || {};

BUBBLE.createTicker = function (el) {
  var span = el.querySelector('span') || el;
  var raf = null;
  var pos = 0;
  var distance = 0;
  var lastTs = null;
  var pauseUntil = 0;

  var SPEED_PX_S = 40; // desplazamiento lento
  var PAUSE_MS = 1000; // pausa al llegar al último carácter

  function cancelLoop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    lastTs = null;
  }

  function step(ts) {
    if (lastTs === null) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (pauseUntil) {
      if (ts < pauseUntil) { raf = requestAnimationFrame(step); return; }
      // Fin de la pausa: salto instantáneo a la posición inicial
      pos = 0;
      pauseUntil = 0;
      span.style.transition = 'none';
      span.style.transform = 'translateX(0)';
      void span.offsetHeight; // reflow: el salto es instantáneo
      span.style.transition = '';
      raf = requestAnimationFrame(step);
      return;
    }

    pos -= SPEED_PX_S * dt;
    if (-pos >= distance) {
      pos = -distance;       // último carácter visible
      pauseUntil = ts + PAUSE_MS;
    }
    span.style.transform = 'translateX(' + pos.toFixed(1) + 'px)';
    raf = requestAnimationFrame(step);
  }

  function measure() {
    cancelLoop();
    pos = 0;
    pauseUntil = 0;
    span.style.transition = 'none';
    span.style.transform = 'translateX(0)';
    void span.offsetHeight;
    span.style.transition = '';

    distance = Math.max(0, span.scrollWidth - el.clientWidth);
    // Solo tick si hay desborde real y el elemento es visible/medible
    if (distance > 1 && el.clientWidth > 0) {
      raf = requestAnimationFrame(step);
    }
  }

  return {
    refresh: measure,                 // re-medir (resize/orientación)
    setText: function (txt) {         // cambiar texto = reiniciar desde el inicio
      var next = txt || '';
      if (span.textContent === next) { return; }
      span.textContent = next;
      measure();
    },
    cancel: cancelLoop
  };
};
