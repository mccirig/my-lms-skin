/* ticker.js:
 * Textos que exceden su contenedor se desplazan lentos y constantes de
 * derecha a izquierda. Al aparecer, esperan 2 s antes de comenzar.
 * Al alcanzar el último carácter, esperan 2 s antes de volver al inicio.
 * Textos que caben: estáticos. NUNCA ellipsis.
 * Reinicio (posición inicial) al cambiar el texto/pista.
 */
'use strict';

window.BUBBLE = window.BUBBLE || {};

BUBBLE.createTicker = function (el) {
  var span = el.querySelector('span') || el;
  var raf = null;
  var pos = 0;
  var distance = 0;
  var lastTs = null;
  var state = 'idle'; // 'idle' | 'start-wait' | 'scrolling' | 'end-wait'
  var waitUntil = 0;

  var SPEED_PX_S = 40; // desplazamiento lento
  var START_WAIT_MS = 2000; // pausa inicial antes de comenzar
  var END_WAIT_MS = 2000;   // pausa al llegar al final antes de volver

  function cancelLoop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    lastTs = null;
  }

  function resetSpan() {
    pos = 0;
    span.style.transition = 'none';
    span.style.transform = 'translateX(0)';
    void span.offsetHeight;
    span.style.transition = '';
  }

  function step(ts) {
    if (lastTs === null) { lastTs = ts; }
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (state === 'start-wait') {
      if (ts < waitUntil) { raf = requestAnimationFrame(step); return; }
      state = 'scrolling';
    }

    if (state === 'end-wait') {
      if (ts < waitUntil) { raf = requestAnimationFrame(step); return; }
      resetSpan();
      state = 'start-wait';
      waitUntil = ts + START_WAIT_MS;
      raf = requestAnimationFrame(step);
      return;
    }

    pos -= SPEED_PX_S * dt;
    if (-pos >= distance) {
      pos = -distance;
      state = 'end-wait';
      waitUntil = ts + END_WAIT_MS;
    }
    span.style.transform = 'translateX(' + pos.toFixed(1) + 'px)';
    raf = requestAnimationFrame(step);
  }

  function measure() {
    cancelLoop();
    resetSpan();
    state = 'idle';
    waitUntil = 0;

    distance = Math.max(0, span.scrollWidth - el.clientWidth);
    // Solo tick si hay desborde real y el elemento es visible/medible
    if (distance > 1 && el.clientWidth > 0) {
      state = 'start-wait';
      waitUntil = performance.now() + START_WAIT_MS;
      lastTs = null;
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
