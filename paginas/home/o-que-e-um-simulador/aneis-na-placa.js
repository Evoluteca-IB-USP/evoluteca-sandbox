/* As marcas desenhadas por cima da placa, num canvas do tamanho da seção:
   o anel no ponto que o quadro de perto mostra e o anel em volta da
   colônia das amarelas, com quanto da borda elas ocupam. */

function preparar(canvas, secao) {
  const dpr = window.devicePixelRatio || 1, LW = secao.clientWidth, LH = secao.clientHeight;
  if (canvas.width !== Math.round(LW * dpr) || canvas.height !== Math.round(LH * dpr)) {
    canvas.width = Math.round(LW * dpr); canvas.height = Math.round(LH * dpr);
  }
  const h = canvas.getContext("2d");
  h.setTransform(dpr, 0, 0, dpr, 0, 0);
  h.clearRect(0, 0, LW, LH);
  return h;
}

/* um anel branco com contorno escuro, para aparecer sobre qualquer cor */
function anel(h, x, y, r) {
  h.strokeStyle = "rgba(9, 16, 45, .55)"; h.lineWidth = 5;
  h.beginPath(); h.arc(x, y, r, 0, Math.PI * 2); h.stroke();
  h.strokeStyle = "rgba(255, 255, 255, .95)"; h.lineWidth = 1.6;
  h.beginPath(); h.arc(x, y, r, 0, Math.PI * 2); h.stroke();
}

export function desenharAnel(canvas, secao, foco, agora) {
  const h = preparar(canvas, secao);
  if (foco) anel(h, foco[0], foco[1], 20 * (1 + .12 * Math.sin(agora / 380)));
}

/* `medida` vem da lupa das amarelas: o raio da colônia, em células, e a parte amarela da borda agora e no começo */
export function cercarColonia(canvas, secao, foco, medida, celula) {
  const h = preparar(canvas, secao);
  if (!foco || !medida) return;
  const [x, y] = foco, r = (medida.raio + .5) * celula + 12, pct = (v) => `${Math.round(v * 100)}%`;
  anel(h, x, y, r);
  const rotulo = `amarelas na borda: ${pct(medida.amarelo0)} → ${pct(medida.amarelo)}`;
  h.font = "600 13px 'Open Sans', sans-serif"; h.textAlign = "center"; h.textBaseline = "bottom";
  h.lineWidth = 4; h.strokeStyle = "rgba(9, 16, 45, .9)"; h.strokeText(rotulo, x, y - r - 8);
  h.fillStyle = "#fff"; h.fillText(rotulo, x, y - r - 8);
}
