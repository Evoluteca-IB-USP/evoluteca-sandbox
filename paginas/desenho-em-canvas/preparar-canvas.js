/** ajusta o canvas à densidade de pixels da tela e devolve o contexto */
export function preparar(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 300, H = canvas.clientHeight || 200;
  const w = Math.round(W * dpr), h = Math.round(H * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  return { ctx, W, H };
}

/** cria (ou recria) o canvas que ocupa um palco inteiro */
export function canvasNo(palco) {
  const c = document.createElement("canvas");
  palco.replaceChildren(c);
  const ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const W = palco.clientWidth, H = palco.clientHeight;
  c.width = W * dpr; c.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, ctx, W, H };
}
