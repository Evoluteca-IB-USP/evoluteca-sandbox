/* As peças dos gráficos da página do simulador. Um gráfico é uma área com
   limites e margens; os desenhos (eixos, linhas, faixas, cabeça)
   são funções soltas que recebem essa área, e os tipos de gráfico
   (tipos.js) se montam juntando peças. */

import { NAVY, AMARELO, TEAL_CLARO, TEAL_ESCURO, TINTA_SUAVE as SUAVE, FONTE } from "../cores.js";
import { acender } from "../sessao.js";

const CORES = { grade: "#ececec", eixo: "#cfcfcf", texto: SUAVE, replica: TEAL_CLARO, destaque: NAVY, previsao: TEAL_ESCURO, agora: "rgba(20, 37, 96, .25)", barras: NAVY };

export function grafico(canvas, { xlim, ylim, margem = {}, desenhar = () => {} }) {
  const m = { esq: 46, dir: 14, topo: 26, base: 30, ...margem };
  const g = { canvas, ctx: canvas.getContext("2d"), xlim, ylim, m, W: 0, H: 0, desenhar, cores: CORES };
  g.x = (v) => m.esq + ((v - g.xlim[0]) / (g.xlim[1] - g.xlim[0])) * (g.W - m.esq - m.dir);
  g.y = (v) => m.topo + (1 - (v - g.ylim[0]) / (g.ylim[1] - g.ylim[0])) * (g.H - m.topo - m.base);
  g.xInv = (px) => g.xlim[0] + ((px - m.esq) / (g.W - m.esq - m.dir)) * (g.xlim[1] - g.xlim[0]);
  g.yInv = (py) => g.ylim[0] + (1 - (py - m.topo) / (g.H - m.topo - m.base)) * (g.ylim[1] - g.ylim[0]);
  g.regioes = [];
  g.redesenhar = () => {
    g.ctx.clearRect(0, 0, g.W, g.H);
    g.regioes = [];
    g.desenhar(g);
  };
  /* passar o mouse numa fórmula troca as letras pelos números de agora e acende as réguas ligadas a ela */
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const achada = g.regioes.find((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
    const id = achada?.id ?? null;
    if (id === g.formulaSobre) return;
    const antes = g.regioes.find((q) => q.id === g.formulaSobre);
    antes?.liga?.forEach((n) => acender(n, false));
    achada?.liga?.forEach((n) => acender(n, true));
    g.formulaSobre = id;
    g.redesenhar();
  });
  canvas.addEventListener("pointerleave", () => {
    if (g.formulaSobre === null || g.formulaSobre === undefined) return;
    g.regioes.find((q) => q.id === g.formulaSobre)?.liga?.forEach((n) => acender(n, false));
    g.formulaSobre = null;
    g.redesenhar();
  });
  new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    g.W = canvas.clientWidth;
    g.H = canvas.clientHeight;
    canvas.width = Math.round(g.W * dpr);
    canvas.height = Math.round(g.H * dpr);
    g.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.redesenhar();
  }).observe(canvas);
  return g;
}

/** marcas "redondas" entre a e b, à moda do pretty() do R */
export function pretty(a, b, n = 5) {
  const passo0 = (b - a) / n, mag = 10 ** Math.floor(Math.log10(passo0));
  const passo = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((p) => p >= passo0);
  const marcas = [];
  for (let v = Math.ceil(a / passo) * passo; v <= b + passo * 1e-9; v += passo) marcas.push(+v.toFixed(10));
  return marcas;
}

export const numero = (v, casas = 2, minimo = casas) => v.toLocaleString("pt-BR", { minimumFractionDigits: minimo, maximumFractionDigits: casas });

/* o título do eixo y fica deitado no alto, em versalete, como os rótulos do site */
export function eixos(g, { tituloY = "", tituloX = "", formatoY = (v) => numero(v, 2, 0), formatoX = String, marcasX, marcasY } = {}) {
  const { ctx, m } = g;
  ctx.lineWidth = 1;
  for (const v of marcasY ?? pretty(...g.ylim, 4)) {
    ctx.strokeStyle = g.cores.grade;
    traco(ctx, m.esq, g.y(v), g.W - m.dir, g.y(v));
    texto(ctx, formatoY(v), m.esq - 8, g.y(v), "right", g.cores.texto);
  }
  ctx.strokeStyle = g.cores.eixo;
  traco(ctx, m.esq, g.H - m.base, g.W - m.dir, g.H - m.base);
  for (const v of marcasX ?? pretty(...g.xlim, 6)) texto(ctx, formatoX(v), g.x(v), g.H - m.base + 13, "center", g.cores.texto);
  if (tituloY) texto(ctx, tituloY.toUpperCase(), m.esq, 8, "left", g.cores.texto, `600 10px`, 1.2);
  if (tituloX) texto(ctx, tituloX, g.W - m.dir, g.H - m.base - 9, "right", g.cores.texto, "italic 11px");
}

/** uma série y[0..], em x = índice; `ate` pode ser fracionário (a ponta interpola) */
export function linha(g, ys, { cor = g.cores.replica, largura = 1.2, alfa = 1, tracejado = null, ate = ys.length - 1 } = {}) {
  const { ctx } = g, fim = Math.min(ate, ys.length - 1), k = Math.floor(fim);
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineJoin = "round";
  if (tracejado) ctx.setLineDash(tracejado);
  ctx.beginPath();
  for (let i = 0; i <= k; i++) ctx[i ? "lineTo" : "moveTo"](g.x(i), g.y(ys[i]));
  if (fim > k) ctx.lineTo(g.x(fim), g.y(valorEm(ys, fim)));
  ctx.stroke();
  ctx.restore();
}

/** a área entre duas séries */
export function faixa(g, inf, sup, { cor = TEAL_CLARO, alfa = 0.18, ate = inf.length - 1 } = {}) {
  const { ctx } = g, k = Math.min(Math.floor(ate), inf.length - 1);
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = cor;
  ctx.beginPath();
  for (let i = 0; i <= k; i++) ctx[i ? "lineTo" : "moveTo"](g.x(i), g.y(sup[i]));
  for (let i = k; i >= 0; i--) ctx.lineTo(g.x(i), g.y(inf[i]));
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alfa * 3);
  ctx.strokeStyle = cor;
  ctx.setLineDash([3, 4]);
  for (const serie of [inf, sup]) {
    ctx.beginPath();
    for (let i = 0; i <= k; i++) ctx[i ? "lineTo" : "moveTo"](g.x(i), g.y(serie[i]));
    ctx.stroke();
  }
  ctx.restore();
}

/** a cabeça da série em destaque: o ponto âmbar com halo do resto do site */
export function cabeca(g, xv, yv, cor = AMARELO) {
  const { ctx } = g;
  ctx.fillStyle = "rgba(252, 180, 33, .28)";
  ctx.beginPath();
  ctx.arc(g.x(xv), g.y(yv), 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(g.x(xv), g.y(yv), 4.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

/** linha horizontal de referência com rótulo na ponta direita */
export function referencia(g, yv, rotulo = "", cor = g.cores.texto) {
  const { ctx } = g;
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.setLineDash([4, 4]);
  traco(ctx, g.m.esq, g.y(yv), g.W - g.m.dir, g.y(yv));
  ctx.restore();
  if (rotulo) texto(g.ctx, rotulo, g.W - g.m.dir, g.y(yv) - 9, "right", cor, "italic 11px");
}

/** a régua vertical do instante que a linha do tempo está mostrando */
export function agora(g, xv) {
  g.ctx.strokeStyle = g.cores.agora;
  g.ctx.lineWidth = 1;
  traco(g.ctx, g.x(xv), g.m.topo, g.x(xv), g.H - g.m.base);
}

/** uma fórmula pequena, em itálico, colada à linha que ela desenha; sob o mouse mostra os números */
export function formula(g, { letras, numeros, liga, x, y, alinhar = "left", acima = false }, id) {
  const { ctx } = g, sob = g.formulaSobre === id && numeros;
  const t = sob ? numeros : letras, fonte = sob ? "600 11.5px" : "italic 11.5px";
  ctx.font = `${fonte} ${FONTE}`;
  const w = ctx.measureText(t).width;
  let px = g.x(x), py = g.y(y) + (acima ? -11 : 11);
  py = Math.max(g.m.topo + 8, Math.min(g.H - g.m.base - 8, py));
  let x0 = alinhar === "right" ? px - w : alinhar === "center" ? px - w / 2 : px;
  x0 = Math.max(g.m.esq + 2, Math.min(g.W - g.m.dir - w - 2, x0));
  ctx.fillStyle = "rgba(255, 255, 255, .85)";
  ctx.fillRect(x0 - 3, py - 8, w + 6, 16);
  if (sob) { ctx.fillStyle = "rgba(252, 180, 33, .25)"; ctx.fillRect(x0 - 3, py - 8, w + 6, 16); }
  texto(ctx, t, x0, py, "left", numeros ? TEAL_ESCURO : SUAVE, fonte);
  if (numeros) g.regioes.push({ id, liga, x0: x0 - 3, x1: x0 + w + 3, y0: py - 9, y1: py + 9 });
}

/** um trecho do tempo marcado no fundo (o gargalo), com o nome no alto */
export function trechoDeTempo(g, { de, ate, rotulo }) {
  const { ctx } = g, x0 = g.x(de), x1 = g.x(ate);
  ctx.fillStyle = "rgba(252, 180, 33, .14)";
  ctx.fillRect(x0, g.m.topo, Math.max(2, x1 - x0), g.H - g.m.topo - g.m.base);
  texto(ctx, rotulo, x0 + 4, g.m.topo + 8, "left", "#9a7318", "italic 10.5px");
}

export function valorEm(ys, t) {
  const k = Math.floor(t);
  return k + 1 < ys.length ? ys[k] + (ys[k + 1] - ys[k]) * (t - k) : ys[ys.length - 1];
}

export function traco(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

export function texto(ctx, t, x, y, alinhar, cor = SUAVE, fonte = "11px", espaco = 0) {
  ctx.font = `${fonte} ${FONTE}`;
  ctx.fillStyle = cor;
  ctx.textAlign = alinhar;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${espaco}px`;
  ctx.fillText(t, x, y);
  ctx.letterSpacing = "0px";
}
