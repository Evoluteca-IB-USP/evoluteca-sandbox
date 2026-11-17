/* O desenho de um vidro: um círculo com as cópias do gene em pontos,
   espalhados em espiral (o miolo do girassol). Cada ponto tem lugar fixo; de
   uma geração para a outra só trocam de cor os que precisam, então nada
   pisca. Com muitas cópias, cada ponto passa a valer algumas. */

import { NAVY, AMARELO } from "../cores.js";

export const CINZA = "#c9cfdb";
const ANGULO = Math.PI * (3 - Math.sqrt(5));
const VALORES = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

const espirais = new Map();
function espiral(m) {
  if (!espirais.has(m)) espirais.set(m, Array.from({ length: m }, (_, j) => {
    const r = Math.sqrt((j + 0.5) / m), a = j * ANGULO;
    return [r * Math.cos(a), r * Math.sin(a)];
  }));
  return espirais.get(m);
}

/* a ordem em que os pontos de um vidro viram A: embaralhada, mas sempre a mesma para o mesmo vidro */
const ordens = new Map();
function ordem(vidro, m) {
  const chave = `${vidro}|${m}`;
  if (!ordens.has(chave)) {
    let s = (vidro + 1) * 2654435761 % 4294967296;
    const aleatorio = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const o = [...Array(m).keys()];
    for (let i = m - 1; i > 0; i--) { const j = Math.floor(aleatorio() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    ordens.set(chave, o);
  }
  return ordens.get(chave);
}

/** onde fica cada ponto de um vidro, pela ordem: os `a` primeiros são da cor cheia (posições num círculo de raio 1) */
export function lugaresDoVidro(indice, m) {
  const l = espiral(m), o = ordem(indice, m);
  return o.map((j) => l[j]);
}

/** quantas cópias cada ponto vale para caber num vidro de raio R sem os pontos se tocarem */
export function copiasPorPonto(total, R, espaco = 4.2) {
  const cabem = Math.max(6, Math.floor((Math.PI * (0.86 * R) ** 2) / espaco ** 2));
  return VALORES.find((k) => total / k <= cabem) ?? Math.ceil(total / cabem);
}

/** os pontos de um vidro: quantos há e quantos são da cor cheia; uma mistura nunca parece fixada */
export function pontos({ cheio, total }, k) {
  const m = Math.max(1, Math.round(total / k));
  let a = Math.round(cheio / k);
  if (cheio > 0 && cheio < total) a = Math.min(m - 1, Math.max(1, a));
  return { m, a };
}

/** um vidro em (cx, cy); `foco` é "escolha" (anel âmbar), "sobre" (contorno navy) ou nada */
export function vidro(ctx, cx, cy, R, contagem, k, { indice, foco = null, pontoMinimo = 1.3 } = {}) {
  const { m, a } = pontos(contagem, k);
  const fixou = contagem.cheio >= contagem.total, perdeu = contagem.cheio <= 0;
  ctx.save();
  if (fixou || perdeu) {
    ctx.fillStyle = fixou ? "rgba(20, 37, 96, .08)" : "rgba(252, 180, 33, .16)";
    circulo(ctx, cx, cy, R);
    ctx.fill();
  }
  ctx.strokeStyle = fixou ? NAVY : perdeu ? AMARELO : CINZA;
  ctx.lineWidth = fixou || perdeu ? 1.8 : 1;
  circulo(ctx, cx, cy, R);
  ctx.stroke();
  if (foco === "escolha") {
    ctx.strokeStyle = AMARELO;
    ctx.lineWidth = 2.5;
    circulo(ctx, cx, cy, R + 4);
    ctx.stroke();
  } else if (foco === "sobre") {
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 1.4;
    circulo(ctx, cx, cy, R + 3);
    ctx.stroke();
  }
  const lugares = espiral(m), o = ordem(indice, m);
  const raio = Math.max(pontoMinimo, Math.min(R * 0.2, 0.86 * R * Math.sqrt(Math.PI / m) * 0.36));
  for (let c = 0; c < 2; c++) {
    ctx.fillStyle = c ? NAVY : AMARELO;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      if ((j < a) !== Boolean(c)) continue;
      const [dx, dy] = lugares[o[j]], x = cx + dx * R * 0.84, y = cy + dy * R * 0.84;
      ctx.moveTo(x + raio, y);
      ctx.arc(x, y, raio, 0, 2 * Math.PI);
    }
    ctx.fill();
  }
  ctx.restore();
}

/** a vaga de um vidro a mais: contorno pontilhado com um + no meio */
export function vagaDeVidro(ctx, cx, cy, R, acesa) {
  ctx.save();
  ctx.strokeStyle = acesa ? NAVY : CINZA;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  circulo(ctx, cx, cy, R);
  ctx.stroke();
  ctx.setLineDash([]);
  const b = Math.min(6, R * 0.35);
  ctx.beginPath();
  ctx.moveTo(cx - b, cy); ctx.lineTo(cx + b, cy);
  ctx.moveTo(cx, cy - b); ctx.lineTo(cx, cy + b);
  ctx.stroke();
  ctx.restore();
}

/** a grade que deixa os vidros maiores na área W × H */
export function grade(n, W, H, maximo = 70) {
  let colunas = 1, lado = 0;
  for (let c = 1; c <= n; c++) {
    const l = Math.min(W / c, H / Math.ceil(n / c));
    if (l > lado) { lado = l; colunas = c; }
  }
  lado = Math.min(lado, maximo);
  const linhas = Math.ceil(n / colunas);
  const x0 = (W - lado * colunas) / 2, y0 = 0;
  return {
    lado, R: lado * 0.4,
    centro: (i) => [x0 + (i % colunas + 0.5) * lado, y0 + (Math.floor(i / colunas) + 0.5) * lado],
    onde: (x, y) => {
      const c = Math.floor((x - x0) / lado), l = Math.floor((y - y0) / lado);
      return c >= 0 && c < colunas && l >= 0 && l < linhas ? l * colunas + c : -1;
    },
    altura: linhas * lado,
  };
}

function circulo(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); }
