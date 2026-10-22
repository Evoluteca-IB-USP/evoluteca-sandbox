import { criarRng, rbinom } from "r";
import { formatar, bolinha } from "../../../motor-de-simuladores/graficos/__pacote__.js";
import { fracaoCiclo } from "../../desenho-em-canvas/__pacote__.js";
import { ESCURA } from "../paletas.js";
import { lembrar } from "../lembrar-simulacao.js";
import { escalaDe, grelhaEscura, cabeca, tracarAte } from "../desenho-das-vitrines.js";

/* Hardy–Weinberg: uma amostra se preenchendo indivíduo a indivíduo; ao lado, esperado × observado */
export function vitrineAmostra(ctx, familia, area, semente, t, PAL = ESCURA) {
  const P = 0.6, TOTAL = 120, SUBIDA = 6, ESPERA = 2.5;
  const ciclo = t == null ? 0 : Math.floor(t / (SUBIDA + ESPERA));
  const f = t == null ? 1 : fracaoCiclo(t, SUBIDA, ESPERA);
  const seq = lembrar(`hw:${semente}:${ciclo}`, () => {
    const rng = criarRng(semente * 7919 + ciclo * 104729 + 2);
    return Array.from({ length: TOTAL }, () => {
      const u = rng();
      return u < P * P ? 0 : u < P * P + 2 * P * (1 - P) ? 1 : 2;
    });
  });
  const k = Math.round(f * TOTAL);
  const cores = [PAL.bola, [PAL.bola, PAL.amarelo], PAL.amarelo];   // AA · Aa · aa
  const esc = escalaDe(area);

  // à esquerda, a amostra
  const meio = area.e + (area.d - area.e) * 0.5;
  const grade = { x: area.e, y: area.t, L: meio - area.e - 24, A: area.b - area.t };
  const cols = Math.max(1, Math.round(Math.sqrt((TOTAL * grade.L) / grade.A)));
  const rows = Math.ceil(TOTAL / cols);
  const celula = Math.min(grade.L / cols, grade.A / rows);
  const r = Math.min(16, Math.max(2, celula / 2 - Math.max(1, celula * 0.16)));
  const x0 = grade.x + (grade.L - cols * celula) / 2;
  const y0 = grade.y + (grade.A - rows * celula) / 2;
  for (let i = 0; i < TOTAL; i++) {
    const cx = x0 + (i % cols) * celula + celula / 2;
    const cy = y0 + Math.floor(i / cols) * celula + celula / 2;
    if (i >= k) {                                   // vaga ainda por sortear
      ctx.strokeStyle = PAL.vaga;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, 2 * Math.PI); ctx.stroke();
      continue;
    }
    bolinha(ctx, cx, cy, r, cores[seq[i]]);
    if (i === k - 1 && f < 1) {                     // o indivíduo que acabou de sair
      ctx.strokeStyle = PAL.anel;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r + 2.5, 0, 2 * Math.PI); ctx.stroke();
    }
  }

  // à direita, as barras: esperado (tracejado) e amostra (cheia)
  const barras = { e: meio + 44, d: area.d, t: area.t, b: area.b };
  const ylim = [0, 0.7];
  grelhaEscura(ctx, familia, barras, { y: [0.2, 0.4, 0.6], ylim }, PAL);
  const cont = [0, 0, 0];
  for (let i = 0; i < k; i++) cont[seq[i]]++;
  const esperado = [P * P, 2 * P * (1 - P), (1 - P) * (1 - P)];
  const larguraCat = (barras.d - barras.e) / 3;
  const lb = Math.min(48 * esc, larguraCat * 0.3);
  const alturaDe = (v) => (v / ylim[1]) * (barras.b - barras.t);
  ["AA", "Aa", "aa"].forEach((rotulo, i) => {
    const xc = barras.e + (i + 0.5) * larguraCat;
    let h = alturaDe(esperado[i]);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = PAL.esperadoTraco;
    ctx.fillStyle = PAL.esperadoFundo;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(xc - lb - 3, barras.b - h, lb, h, [3, 3, 0, 0]); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);

    const obs = k ? cont[i] / k : 0;
    h = alturaDe(obs);
    if (h > 0) {
      const cor = cores[i];
      ctx.beginPath(); ctx.roundRect(xc + 3, barras.b - h, lb, h, [3, 3, 0, 0]);
      if (Array.isArray(cor)) {
        ctx.save(); ctx.clip();
        ctx.fillStyle = cor[0]; ctx.fillRect(xc + 3, barras.b - h, lb / 2, h);
        ctx.fillStyle = cor[1]; ctx.fillRect(xc + 3 + lb / 2, barras.b - h, lb / 2, h);
        ctx.restore();
      } else {
        ctx.fillStyle = cor; ctx.fill();
      }
      ctx.font = `600 ${esc > 1.25 ? 12 : 11}px ${familia}`;
      ctx.fillStyle = PAL.valor;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(formatar(+obs.toFixed(2)), xc + 3 + lb / 2, barras.b - h - 4);
    }
    ctx.font = `600 ${esc > 1.25 ? 14 : 13}px ${familia}`;
    ctx.fillStyle = PAL.rotulo;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(rotulo, xc, barras.b + 9);
  });
  ctx.font = `${esc > 1.25 ? 12 : 11}px ${familia}`;
  ctx.fillStyle = PAL.texto;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(`amostra: ${k} de ${TOTAL}`, barras.d, barras.t - 9);
}
