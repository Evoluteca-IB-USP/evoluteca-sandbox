/* A grade e os letreiros que aparecem quando a poeira já é figura. A grade
   vai ANTES da poeira; os letreiros, DEPOIS — desenhados antes, o véu branco
   fica por baixo dos pontos e o texto some. */

import { numero } from "portugues";
import { NAVY, SUAVE, OCRE, FONTE, rotulo } from "../../desenho-em-canvas/__pacote__.js";
import { area } from "./poeira/__pacote__.js";

/* escreve com um véu branco atrás: os rótulos caem sobre a poeira */
function comVeu(ctx, texto, x, y, { alinhar = "center", cor = NAVY, peso = "600", tam = 12 } = {}) {
  ctx.font = `${peso} ${tam}px ${FONTE}`;
  const larg = ctx.measureText(texto).width;
  const x0 = alinhar === "center" ? x - larg / 2 : alinhar === "right" ? x - larg : x;
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fillRect(x0 - 7, y - tam * 0.86, larg + 14, tam * 1.72);
  rotulo(ctx, texto, x, y, { alinhar, base: "middle", cor, peso, tam });
}

/* a grade, ANTES da poeira */
export function moldura(ctx, W, H, eixos, a) {
  const m = area(W, H);
  ctx.globalAlpha = a;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(20,37,96,.16)";
  ctx.setLineDash([2, 6]);
  for (const v of [0.25, 0.5, 0.75]) {
    const y = m.b - v * (m.b - m.t);
    ctx.beginPath(); ctx.moveTo(m.e, y); ctx.lineTo(m.d, y); ctx.stroke();
    rotulo(ctx, numero(v, 2), m.e - 8, y, { alinhar: "right", base: "middle" });
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(20,37,96,.28)";
  ctx.beginPath(); ctx.moveTo(m.e, m.b); ctx.lineTo(m.d, m.b); ctx.stroke();
  ctx.globalAlpha = 1;
}

/* os letreiros, DEPOIS da poeira — desenhados antes, o véu branco fica por
   baixo dos pontos e o texto some */
export function letreiros(ctx, W, H, eixos, a) {
  const m = area(W, H);
  ctx.globalAlpha = a;
  for (const [i, c] of (eixos.colunas || []).entries()) {   // Hardy–Weinberg: o esperado sobre o observado
    const larg = (m.d - m.e) / 3, xc = m.e + (i + 0.5) * larg;
    const y = m.b - c.esp * (m.b - m.t);
    ctx.strokeStyle = "rgba(20,37,96,.75)";
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(xc - larg * 0.34, y); ctx.lineTo(xc + larg * 0.34, y); ctx.stroke();
    ctx.setLineDash([]);
    comVeu(ctx, `esperado ${numero(c.esp * 100, 0)}%`, xc + larg * 0.34, y, { alinhar: "right", cor: SUAVE, peso: "", tam: 11 });
    comVeu(ctx, `${c.r} · ${numero(c.obs * 100, 0)}%`, xc, m.b + 16, { tam: 13 });
  }
  for (const n of eixos.notas || [])                       // seleção: qual rodada é qual
    comVeu(ctx, n.rotulo, n.x, n.y, { alinhar: n.alinhar, cor: n.ultimo ? OCRE : SUAVE, tam: 12 });
  if (eixos.x) rotulo(ctx, eixos.x, (m.e + m.d) / 2, m.b + (eixos.colunas ? 32 : 12), { alinhar: "center" });
  if (eixos.y) {
    ctx.save();
    ctx.translate(16, (m.t + m.b) / 2); ctx.rotate(-Math.PI / 2);
    rotulo(ctx, eixos.y, 0, 0, { alinhar: "center", base: "middle" });
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
