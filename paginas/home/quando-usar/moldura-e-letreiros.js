/* O que o painel desenha além da poeira. Os eixos vão ANTES dela, sempre,
   sobre os pontos do papel; o resto só quando a poeira já é figura, e
   DEPOIS dela, com véu branco para cair por cima dos pontos: títulos,
   valores, o esperado das barras, os rótulos das rodadas e a anotação de
   fio curvo. */

import { numero } from "portugues";
import { NAVY, SUAVE, OCRE, FONTE, rotulo } from "../../desenho-em-canvas/__pacote__.js";

export const PASSO_DO_PAPEL = 24;      // o espaçamento dos pontos do fundo da seção, igual ao do CSS

/** os pontos do papel nas coordenadas do canvas: `x` e `y` arredondam para o ponto mais próximo */
export function papel(tela, secao) {
  const a = tela.getBoundingClientRect(), s = secao.getBoundingClientRect();
  const ox = a.left - s.left, oy = a.top - s.top, P = PASSO_DO_PAPEL;
  return {
    x: (v) => Math.round((v + ox - 1) / P) * P + 1 - ox,
    y: (v) => Math.round((v + oy - 1) / P) * P + 1 - oy,
  };
}

/** a figura fica um pouco para dentro dos eixos */
export const areaDaFigura = (m) => ({ ...m, e: m.e + 10, d: m.d - 6 });

export function eixos(ctx, m) {
  const P = PASSO_DO_PAPEL;
  ctx.save();
  ctx.strokeStyle = "rgba(20,37,96,.38)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(m.e, m.t - 12); ctx.lineTo(m.e, m.b); ctx.lineTo(m.d, m.b); ctx.stroke();
  for (let y = m.b; y >= m.t - 1; y -= P * 2) { ctx.beginPath(); ctx.moveTo(m.e - 4, y); ctx.lineTo(m.e, y); ctx.stroke(); }
  for (let x = m.e; x <= m.d + 1; x += P * 2) { ctx.beginPath(); ctx.moveTo(x, m.b); ctx.lineTo(x, m.b + 4); ctx.stroke(); }
  ctx.restore();
}

function comVeu(ctx, texto, x, y, { alinhar = "center", cor = NAVY, peso = "600", tam = 12 } = {}) {
  ctx.font = `${peso} ${tam}px ${FONTE}`;
  const larg = ctx.measureText(texto).width;
  const x0 = alinhar === "center" ? x - larg / 2 : alinhar === "right" ? x - larg : x;
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.fillRect(x0 - 4, y - tam * 0.75, larg + 8, tam * 1.5);
  rotulo(ctx, texto, x, y, { alinhar, base: "middle", cor, peso, tam });
}

/** os letreiros da figura, com opacidade `a` */
export function moldura(ctx, m, ex, a) {
  ctx.save();
  ctx.globalAlpha = a;
  if (!ex.contagem)
    for (const v of [0, 0.5, 1])
      rotulo(ctx, numero(v, 1), m.e - 10, m.b - v * (m.b - m.t), { alinhar: "right", base: "middle", tam: 10 });
  for (const mx of ex.marcasX || []) rotulo(ctx, mx.rotulo, mx.x, m.b + 8, { alinhar: "center", tam: 10 });
  ctx.letterSpacing = "1.5px";
  rotulo(ctx, (ex.contagem ? "histórias" : ex.y).toUpperCase(), m.e, m.t - 30, { peso: "600", tam: 10, cor: SUAVE });
  ctx.letterSpacing = "0px";
  if (ex.x) rotulo(ctx, ex.x, m.d, m.b + (ex.marcasX ? 24 : 8), { alinhar: "right", tam: 11, cor: SUAVE, peso: "italic 400" });

  const f = areaDaFigura(m);
  for (const [i, c] of (ex.colunas || []).entries()) {
    const larg = (f.d - f.e) / 3, xc = f.e + (i + 0.5) * larg;
    const y = f.b - c.esp * (f.b - f.t);
    ctx.strokeStyle = "rgba(20,37,96,.75)";
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xc - larg * 0.36, y); ctx.lineTo(xc + larg * 0.36, y); ctx.stroke();
    ctx.setLineDash([]);
    comVeu(ctx, `${c.r} · ${numero(c.obs * 100, 0)}%`, xc, f.b + 12, { tam: 11 });
  }
  for (const n of ex.notas || []) comVeu(ctx, n.rotulo, n.x, n.y, { alinhar: n.alinhar, cor: SUAVE, peso: "", tam: 11 });
  ctx.restore();
}

/** a anotação: um anel em `alvo` e um fio ocre curvo até o texto, que fica onde houver espaço */
export function anotar(ctx, alvo, texto, a, W) {
  if (a <= 0) return;
  const [x, y] = alvo;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `italic 400 13px ${FONTE}`;
  const larg = ctx.measureText(texto).width;
  const direita = x + 70 + larg < W - 10;
  const lx = direita ? x + 70 : x - 70 - larg, ly = y - 64 < 30 ? y + 64 : y - 64;
  const x0 = direita ? lx - 6 : lx + larg + 6;
  const ang = Math.atan2(ly - y, x0 - x), xa = x + Math.cos(ang) * 11, ya = y + Math.sin(ang) * 11;
  ctx.strokeStyle = OCRE; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, ly);
  ctx.bezierCurveTo(x0 + (xa - x0) * 0.15, ly + (ya - ly) * 0.75, xa - (xa - x0) * 0.55, ya, xa, ya);
  const comp = Math.hypot(xa - x0, ya - ly) * 1.3;
  ctx.setLineDash([comp]); ctx.lineDashOffset = comp * (1 - a); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillRect(lx - 4, ly - 10, larg + 8, 20);
  rotulo(ctx, texto, lx, ly, { base: "middle", cor: OCRE, peso: "italic 400", tam: 13 });
  ctx.restore();
}
