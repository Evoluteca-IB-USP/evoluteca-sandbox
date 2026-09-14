/** requestAnimationFrame em laço, contando os segundos desde o primeiro
    quadro. Para quando `fn` devolve false, ou quando se chama o que ele
    devolve — as figuras trocam de cena e precisam desligar a anterior. */
export function laco(fn) {
  let vivo = true, t0 = null;
  function quadro(agora) {
    if (!vivo) return;
    if (t0 === null) t0 = agora;
    if (fn((agora - t0) / 1000) !== false) requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  return () => { vivo = false; };
}
