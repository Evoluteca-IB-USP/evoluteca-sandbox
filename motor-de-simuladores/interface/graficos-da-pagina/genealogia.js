/* O gráfico do coalescente, como a Figura 3.4 de Rice (2004): a genealogia
   da população desenhada duas vezes, hoje em cima e o passado embaixo.
     (A)  as cópias no lugar delas: cada oval é um indivíduo com as suas duas
          cópias do gene, e cada cópia ligada à cópia de onde veio
     (B)  as mesmas cópias, nas mesmas colunas, mas reordenadas em cada
          geração para nenhuma linha cruzar outra (preparo-da-genealogia.js)
   Escura, a cópia que deixou descendentes hoje; cinza, a que não deixou; o
   círculo, o ancestral comum de todas as cópias de hoje. Nada é escrito por
   cima do desenho: a explicação é a legenda, sob a figura.

   O mouse sobre uma cópia (ou um clique, que a deixa marcada) acende, nos
   dois painéis, de onde ela veio e quem veio dela. A figura começa com
   JANELA gerações e se afasta junto com a linha do tempo. */

import { grafico, texto, traco, pretty } from "./pecas.js";
import { preparar, linhagemDe, PERDIDA, VIVA } from "./preparo-da-genealogia.js";
import { legendaDaGenealogia } from "./legenda-da-genealogia.js";
import { NAVY, AMARELO, FANTASMA, TINTA_SUAVE } from "../cores.js";

const TOPO = 30, BASE = 14, ESQUERDA = 44, DIREITA = 10, VAO = 44, JANELA = 20;
const PAPEL = "#dfe2ea", OVAL = "#f4f5f8", BORDA_DO_OVAL = "#d3d8e2", FIO = "#c5cad5", MARCA_TEXTO = "#fddc93", TINTA = "#3d3d3d";

const entre = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (u) => (u < 0.5 ? 2 * u * u : 1 - (2 - 2 * u) ** 2 / 2);
const mesma = (a, b) => a?.ger === b?.ger && a?.c === b?.c;

/** a área da figura: o canvas e a legenda que vai sob a linha do tempo */
export function areaDaGenealogia(canvas, spec, estado) {
  canvas.classList.add("painel-genealogia");
  let apontada = null, marcada = null, rodada = null;
  const legenda = legendaDaGenealogia();
  const area = grafico(canvas, { xlim: [0, 1], ylim: [0, 1], desenhar: (g) => {
    const { res, t } = estado();
    if (!res || !g.W || !g.H) return;
    const gen = spec.genealogia(res);
    if (gen !== rodada) [rodada, apontada, marcada] = [gen, null, null];
    const foco = apontada ?? marcada;
    legenda.atualizar(gen);
    desenhar(g, gen, t, foco && foco.ger <= t ? foco : null);
  } });

  const sob = (e) => {
    const { res, t } = estado(), caixa = canvas.getBoundingClientRect();
    return res && area.W ? copiaEm(medidas(area, spec.genealogia(res), t), t, e.clientX - caixa.left, e.clientY - caixa.top) : null;
  };
  canvas.addEventListener("pointermove", (e) => {
    const nova = sob(e);
    canvas.style.cursor = nova ? "pointer" : "";
    if (mesma(nova, apontada)) return;
    apontada = nova;
    area.redesenhar();
  });
  canvas.addEventListener("pointerleave", () => { if (apontada) { apontada = null; area.redesenhar(); } });
  canvas.addEventListener("click", (e) => {
    const nova = sob(e);
    marcada = mesma(nova, marcada) ? null : nova;
    area.redesenhar();
  });
  return Object.assign(area, { legenda });
}

/* dois painéis da mesma largura, com as mesmas fileiras; a figura se afasta junto com a linha do tempo, até a última geração */
function medidas(g, gen, t) {
  const { lugar } = preparar(gen), G = gen.pais.length, N = gen.copias / 2;
  const largura = (g.W - ESQUERDA - DIREITA - VAO) / 2, bx0 = ESQUERDA + largura + VAO;
  const cabem = Math.min(G, Math.max(JANELA, t + 1));
  const passo = (g.H - TOPO - BASE) / cabem, individuo = largura / N, coluna = largura / gen.copias;
  return {
    G, N, cabem, passo, individuo, coluna, bx0, lugar,
    raio: entre(Math.min(coluna, passo) * 0.16, 1, 3.4),
    y: (ger) => TOPO + ger * passo,
    xA: (ger, c) => ESQUERDA + ((c >> 1) + 0.5 + (c & 1 ? 0.25 : -0.25)) * individuo,
    xB: (ger, c) => bx0 + (lugar[ger][c] + 0.5) * coluna,
  };
}

/* a cópia desenhada no ponto (px, py), entre as gerações que já apareceram */
function copiaEm(m, t, px, py) {
  const ger = Math.round((py - TOPO) / m.passo);
  if (ger < 0 || ger > Math.min(t, m.cabem) || Math.abs(py - m.y(ger)) > Math.max(6, Math.min(m.passo / 2, 16))) return null;
  const emA = (px - ESQUERDA) / m.individuo, emB = Math.floor((px - m.bx0) / m.coluna);
  if (emA >= 0 && emA < m.N) return { ger, c: 2 * Math.floor(emA) + (emA % 1 < 0.5 ? 0 : 1) };
  if (emB < 0 || emB >= 2 * m.N) return null;
  return { ger, c: m.lugar[ger].indexOf(emB) };
}

function desenhar(g, gen, t, foco) {
  const { ctx } = g, { pais, copias } = gen, { papel, ancestral } = preparar(gen);
  t = entre(t, 0, gen.pais.length);
  const m = medidas(g, gen, t), { G, N, cabem, passo, raio, individuo, y, xA, xB } = m;

  /* até onde a história já apareceu: k gerações inteiras e a seguinte chegando (as ligações descem, depois as cópias ganham tinta) */
  const k = Math.floor(t), chegando = t - k, fundo = Math.floor(cabem);
  const desce = suave(entre(chegando / 0.7, 0, 1)), tinta = entre((chegando - 0.45) / 0.45, 0, 1);

  const ligacoes = (x, filtro, cor, espessura) => {
    ctx.strokeStyle = cor;
    ctx.lineWidth = espessura;
    ctx.beginPath();
    for (let ger = 0; ger < G && ger <= k && ger < fundo; ger++) {
      const parte = ger < k ? 1 : desce;
      for (let c = 0; parte && c < copias; c++) {
        if (!filtro(ger, c)) continue;
        const x0 = x(ger, c);
        ctx.moveTo(x0, y(ger));
        ctx.lineTo(x0 + (x(ger + 1, pais[ger][c]) - x0) * parte, y(ger + parte));
      }
    }
    ctx.stroke();
  };
  const pontos = (x, de, ate, filtro, cor) => {
    ctx.fillStyle = cor;
    ctx.beginPath();
    for (let ger = de; ger <= ate; ger++) for (let c = 0; c < copias; c++) {
      if (!filtro(ger, c)) continue;
      ctx.moveTo(x(ger, c) + raio, y(ger));
      ctx.arc(x(ger, c), y(ger), raio, 0, 2 * Math.PI);
    }
    ctx.fill();
  };
  const fileiras = (fn) => {
    fn(0, Math.min(k, fundo));
    if (k < fundo && tinta > 0) {
      ctx.globalAlpha = tinta;
      fn(k + 1, k + 1);
      ctx.globalAlpha = 1;
    }
  };
  const viva = (ger, c) => papel[ger][c] === VIVA, perdida = (ger, c) => papel[ger][c] === PERDIDA;
  const espessura = entre(passo * 0.09, 0.8, 1.4);

  const painel = (x, noFio, noPonto, forte) => {
    ligacoes(x, (ger, c) => perdida(ger, c) && noFio(ger, c), forte ? TINTA_SUAVE : FIO, espessura * 0.8);
    ligacoes(x, (ger, c) => viva(ger, c) && noFio(ger, c), NAVY, espessura * 1.2);
    fileiras((de, ate) => {
      pontos(x, de, ate, (ger, c) => perdida(ger, c) && noPonto(ger, c), forte ? TINTA_SUAVE : FANTASMA);
      pontos(x, de, ate, (ger, c) => viva(ger, c) && noPonto(ger, c), NAVY);
    });
    for (const mu of gen.mutacoes) {
      if (mu.t >= k || mu.t >= fundo || !viva(mu.t, mu.copia) || !noFio(mu.t, mu.copia)) continue;
      xis(ctx, (x(mu.t, mu.copia) + x(mu.t + 1, pais[mu.t][mu.copia])) / 2, y(mu.t + 0.5), entre(passo * 0.14, 1.8, 3));
    }
    if (ancestral && ancestral.g <= Math.min(k, fundo) && noPonto(ancestral.g, ancestral.c)) {
      anel(ctx, x(ancestral.g, ancestral.c), y(ancestral.g), raio + 5, NAVY, 1.8);
    }
  };

  ctx.save();
  ctx.lineCap = "round";

  texto(ctx, "(A)", ESQUERDA, 10, "left", NAVY, "700 12px");
  texto(ctx, "(B)", m.bx0, 10, "left", NAVY, "700 12px");

  /* o eixo do tempo, na margem; em negrito, a geração do ancestral comum quando ele aparece */
  const marco = ancestral && ancestral.g <= k ? ancestral.g : null;
  for (const v of pretty(0, cabem, 6)) {
    if (v !== Math.round(v) || (marco !== null && Math.abs(y(v) - y(marco)) < 13)) continue;
    texto(ctx, v ? String(v) : "hoje", ESQUERDA - 14, y(v), "right", TINTA_SUAVE, v ? "11px" : "italic 11px");
  }
  if (marco !== null) texto(ctx, String(marco), ESQUERDA - 14, y(marco), "right", NAVY, "700 11px");

  /* o papel: as gerações que ainda não apareceram */
  if (passo >= 6) for (const x of [xA, xB]) pontos(x, k + 1, fundo, () => true, PAPEL);

  /* os indivíduos de (A) */
  const rx = individuo * 0.42, ry = Math.min(passo * 0.32, rx * 0.5, 9);
  if (ry >= 1.5) {
    ctx.fillStyle = OVAL;
    ctx.strokeStyle = BORDA_DO_OVAL;
    ctx.lineWidth = 1;
    fileiras((de, ate) => {
      ctx.beginPath();
      for (let ger = de; ger <= ate; ger++) for (let i = 0; i < N; i++) {
        const cx = ESQUERDA + (i + 0.5) * individuo;
        ctx.moveTo(cx + rx, y(ger));
        ctx.ellipse(cx, y(ger), rx, ry, 0, 0, 2 * Math.PI);
      }
      ctx.fill();
      if (ry >= 4) ctx.stroke();
    });
  }

  const sempre = () => true;
  painel(xA, sempre, sempre, false);
  painel(xB, sempre, sempre, false);

  /* a cópia em foco: um véu clareia o desenho e a linhagem dela volta por cima, sobre uma faixa de marca-texto */
  if (foco) {
    const marca = linhagemDe(gen, foco.ger, foco.c);
    const noPonto = (ger, c) => marca[ger].has(c), noFio = (ger, c) => marca[ger].has(c) && marca[ger + 1].has(pais[ger][c]);
    ctx.fillStyle = "rgba(255, 255, 255, .75)";
    ctx.fillRect(ESQUERDA - 10, TOPO - 10, g.W - ESQUERDA + 10, g.H - TOPO + 10);
    for (const x of [xA, xB]) {
      ligacoes(x, noFio, MARCA_TEXTO, raio * 2 + 5);
      painel(x, noFio, noPonto, true);
      anel(ctx, x(foco.ger, foco.c), y(foco.ger), raio + 4, AMARELO, 2.4);
    }
  }
  ctx.restore();
}

function anel(ctx, x, y, r, cor, espessura) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = espessura;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

function xis(ctx, x, y, s) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, s + 1.6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1.5;
  traco(ctx, x - s, y - s, x + s, y + s);
  traco(ctx, x - s, y + s, x + s, y - s);
}
