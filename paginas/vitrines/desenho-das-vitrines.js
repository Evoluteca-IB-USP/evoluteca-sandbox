/* O que as três vitrines desenham igual: a grade tracejada com rótulos, a
   cabeça do traço que está se desenhando e o próprio traço até um instante. */

import { formatar } from "../../motor-de-simuladores/graficos/__pacote__.js";
import { ESCURA } from "./paletas.js";

/* gráficos maiores pedem traços e pontos um pouco mais grossos */
export const escalaDe = (area) => Math.min(1.6, Math.max(1, (area.b - area.t) / 360));

/* grade tracejada com rótulos, nas cores da paleta PAL */
export function grelhaEscura(ctx, familia, area, { y = [], x = [], ylim = [0, 1], xlim = [0, 1] }, PAL = ESCURA) {
  ctx.font = `${escalaDe(area) > 1.25 ? 12 : 11}px ${familia}`;
  ctx.lineWidth = 1;
  ctx.fillStyle = PAL.texto;
  ctx.strokeStyle = PAL.grade;
  ctx.setLineDash([2, 6]);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const v of y) {
    const py = area.b - ((v - ylim[0]) / (ylim[1] - ylim[0])) * (area.b - area.t);
    ctx.beginPath(); ctx.moveTo(area.e, py); ctx.lineTo(area.d, py); ctx.stroke();
    ctx.fillText(formatar(v), area.e - 8, py);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = PAL.eixo;
  ctx.beginPath(); ctx.moveTo(area.e, area.b); ctx.lineTo(area.d, area.b); ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const v of x) {
    const px = area.e + ((v - xlim[0]) / (xlim[1] - xlim[0])) * (area.d - area.e);
    ctx.fillText(formatar(v), px, area.b + 8);
  }
}

/* a cabeça de um traço que se desenha: ponto branco com miolo colorido (e halo pulsante) */
export function cabeca(ctx, x, y, cor, pulso = null, esc = 1, PAL = ESCURA) {
  if (pulso != null) {
    ctx.fillStyle = "rgba(252,180,33,.22)";
    ctx.beginPath(); ctx.arc(x, y, (8 + 4 * pulso) * esc, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = PAL.aro;
  ctx.beginPath(); ctx.arc(x, y, 3.8 * esc, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.arc(x, y, 2.3 * esc, 0, 2 * Math.PI); ctx.fill();
}

export function tracarAte(ctx, px, py, serie, ate, { cor, largura, alpha }) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let g = 0; g <= ate; g++) g ? ctx.lineTo(px(g), py(serie[g])) : ctx.moveTo(px(g), py(serie[g]));
  ctx.stroke();
  ctx.globalAlpha = 1;
}
