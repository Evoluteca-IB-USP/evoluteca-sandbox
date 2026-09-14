/* A vinheta de um simulador: o gráfico dele em miniatura, sem eixos nem
   rótulos, para a folha de contato do catálogo e os cards. Determinística
   por semente; com `t` (segundos), anima em ciclos. */

import { criarRng, rbinom } from "r";
import { lerAparencia } from "../../motor-de-simuladores/graficos/__pacote__.js";
import { preparar, suavizar, fracaoCiclo } from "../desenho-em-canvas/__pacote__.js";

const cacheDeriva = new Map();
function trajetoriasMini(semente) {
  if (!cacheDeriva.has(semente)) {
    const rng = criarRng(semente);
    const trilhas = [];
    for (let r = 0; r < 7; r++) {
      const p = [0.5];
      for (let g = 1; g < 60; g++) p[g] = rbinom(40, p[g - 1], rng) / 40;
      trilhas.push(p);
    }
    cacheDeriva.set(semente, trilhas);
  }
  return cacheDeriva.get(semente);
}

/** Vinheta decorativa dos cards (determinística por semente).
    t = segundos decorridos → quadro da animação; sem t, desenha o quadro final. */
export function miniatura(canvas, tipo, semente = 1, t = null) {
  const C = lerAparencia();
  // data-tom="escuro": vinheta sobre navy (cards da home) — nada de navy nas séries
  const paleta = canvas.dataset.tom === "escuro"
    ? ["#64c4d2", "#fcb421", "#ffffff", "#1094ab"]
    : C.series;
  const { ctx, W: largura, H: altura } = preparar(canvas);
  const folga = 12;
  const estatico = t == null;

  if (tipo === "barras") {                          // reamostragem periódica
    const conjunto = (i) => {
      const rng = criarRng(semente * 1000 + i);
      return Array.from({ length: 6 }, () => 0.3 + rng() * 0.65);
    };
    let alturas = conjunto(0);
    if (!estatico) {
      const periodo = 2.6, i = Math.floor(t / periodo);
      const f = suavizar(Math.min(1, (t - i * periodo) / 0.8));
      const a = conjunto(i), b = conjunto(i + 1);
      alturas = a.map((v, k) => v + (b[k] - v) * f);
    }
    const n = alturas.length;
    const lb = (largura - folga * 2) / n;
    alturas.forEach((a, i) => {
      ctx.fillStyle = paleta[i % 3];
      const h = a * (altura - folga * 2);
      ctx.beginPath();
      ctx.roundRect(folga + i * lb + 3, altura - folga - h, lb - 6, h, [4, 4, 0, 0]);
      ctx.fill();
    });
    return;
  }

  if (tipo === "curva") {                           // curvas logísticas (seleção) se desenhando
    const f = estatico ? 1 : fracaoCiclo(t);
    const nPontos = 90, ate = Math.round(f * (nPontos - 1));
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    [0.12, 0.06, 0.03].forEach((s, k) => {
      ctx.strokeStyle = paleta[k];
      ctx.beginPath();
      let p = 0.02;
      for (let g = 0; g <= ate; g++) {
        p = (p * (1 + s)) / (p * (1 + s) + (1 - p));
        const x = folga + (g / (nPontos - 1)) * (largura - folga * 2);
        const y = altura - folga - p * (altura - folga * 2);
        g === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    return;
  }

  // padrão: trajetórias de deriva se desenhando
  const f = estatico ? 1 : fracaoCiclo(t);
  const trilhas = trajetoriasMini(semente);
  const ate = Math.round(f * 59);
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.85;
  trilhas.forEach((p, r) => {
    ctx.strokeStyle = paleta[r % paleta.length];
    ctx.beginPath();
    for (let g = 0; g <= ate; g++) {
      const x = folga + (g / 59) * (largura - folga * 2);
      const y = folga + (1 - p[g]) * (altura - folga * 2);
      g === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}
