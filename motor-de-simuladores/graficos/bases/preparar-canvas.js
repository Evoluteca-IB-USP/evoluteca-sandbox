/* prepara o canvas para a densidade de pixels da tela; retorna o contexto */
export function preparar(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssL = canvas.clientWidth || 600;
  const cssA = canvas.clientHeight || 380;
  const L = Math.round(cssL * dpr), A = Math.round(cssA * dpr);
  if (canvas.width !== L) canvas.width = L;       // realocar só quando muda: é caro em canvas grande
  if (canvas.height !== A) canvas.height = A;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssL, cssA);
  return { ctx, largura: cssL, altura: cssA };
}
