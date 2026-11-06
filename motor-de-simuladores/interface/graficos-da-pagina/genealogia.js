/* O gráfico do coalescente, à moda das figuras dos livros. À esquerda, a
   população geração a geração — o presente embaixo, o passado em cima —,
   cada cópia do gene ligada à mãe na geração de cima. Quando uma geração
   mais antiga aparece, um gameta desce de cada mãe até cada filha levando o
   alelo, e só então a ligação é traçada.
     navy / âmbar   o alelo da cópia: A / a
     esmaecida      a cópia não deixou descendentes na população de hoje
     teal           a amostra e as suas ancestrais; o anel cheio é um
                    encontro de linhagens, uma coalescência
     ✕              uma mutação: a cópia tem alelo diferente da mãe
   Quando as linhagens da amostra chegam ao ancestral comum, o resto da
   população se apaga, a janela recua até hoje e fica só a genealogia, no
   lugar onde ela aconteceu, com as mutações que caíram nela. À direita, a
   mesma genealogia como árvore, na escala de todas as gerações.

   A ficha passa `genealogia: (r) => …` no formato do simular() do
   coalescente: { copias, amostra, pais, linhagens, vivas, alelos, mutacoes,
   nos, raiz, tmrca, k }. */

import { texto, traco, pretty, numero } from "./pecas.js";
import { NAVY, TEAL, AMARELO, FANTASMA, TINTA_SUAVE } from "../cores.js";

const JANELA = 12;          // gerações à vista antes da extração
const EXTRACAO = 1400;      // ms para o resto da população se apagar
const PULSO = 3;            // gerações que o halo de um encontro dura
const HALO = "rgba(16, 148, 171, .25)";
const QUANTAS = ["", "uma", "duas", "três", "quatro", "cinco", "seis"];
const ALELO = [AMARELO, NAVY];   // alelos[g][c]: 0 é a, 1 é A

const arvores = new WeakMap();
const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const suave = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const entre = (v, a, b) => Math.max(a, Math.min(b, v));

/* A árvore, calculada uma vez por rodada: o x de cada nó (0 a 1), com as
   pontas numa ordem em que nenhum ramo se cruza e cada encontro no meio dos
   filhos, e o nó a que pertence cada cópia que é linhagem da amostra. */
function arvore(gen) {
  if (!arvores.has(gen)) {
    const { nos, pais } = gen, G = pais.length, ordem = [], x = [];
    const media = (i) => (nos[i].filhos.length ? nos[i].filhos.reduce((s, f) => s + media(f), 0) / nos[i].filhos.length : nos[i].copia);
    const visitar = (i) => {
      if (!nos[i].filhos.length) ordem.push(i);
      else nos[i].filhos.slice().sort((a, b) => media(a) - media(b)).forEach(visitar);
    };
    nos.map((no, i) => i).filter((i) => nos[i].pai === null).sort((a, b) => media(a) - media(b)).forEach(visitar);
    ordem.forEach((i, k) => { x[i] = ordem.length > 1 ? k / (ordem.length - 1) : 0.5; });
    nos.forEach((no, i) => { if (no.filhos.length) x[i] = no.filhos.reduce((s, f) => s + x[f], 0) / no.filhos.length; });
    const dono = Array.from({ length: G + 1 }, () => new Map());
    nos.forEach((no, i) => {
      const fim = no.pai !== null ? nos[no.pai].t : G + 1;
      for (let g = no.t, c = no.copia; g < fim; c = pais[g]?.[c], g++) dono[g].set(c, i);
    });
    arvores.set(gen, { x, dono });
  }
  return arvores.get(gen);
}

/* A extração anda no relógio da tela, não no da simulação: leva o mesmo
   tempo com qualquer velocidade de reprodução, e volta se o aluno arrasta
   a linha do tempo para antes do ancestral comum. */
function extracao(g, gen, alvo) {
  const e = (g.extracao ??= { u: alvo, gen: null, quando: 0, animando: false, pedido: 0 });
  const agora = performance.now();
  if (e.gen !== gen || reduzMovimento()) e.u = alvo;
  else if (e.u !== alvo) {
    const passo = e.animando ? (agora - e.quando) / EXTRACAO : 0;
    e.u = alvo > e.u ? Math.min(alvo, e.u + passo) : Math.max(alvo, e.u - passo);
  }
  e.gen = gen;
  e.quando = agora;
  e.animando = e.u !== alvo;
  if (e.animando && !e.pedido) e.pedido = requestAnimationFrame(() => { e.pedido = 0; g.redesenhar(); });
  return suave(e.u);
}

/* a frase que conta o que está acontecendo agora */
function legenda(gen, t) {
  if (gen.tmrca !== null && t >= gen.tmrca) return "Todas as linhagens da amostra se encontraram: esta é a genealogia dela.";
  const perto = (ger) => t - ger > -1 && t - ger < 2;
  const encontro = gen.nos.find((no) => no.t > 0 && perto(no.t));
  if (encontro) return `${QUANTAS[encontro.filhos.length] ?? encontro.filhos.length} linhagens vieram da mesma mãe: uma coalescência.`.replace(/^./, (l) => l.toUpperCase());
  if (gen.mutacoes.some((m) => perto(m.t + 1) && gen.linhagens[m.t].includes(m.copia))) return "Uma mutação numa linhagem da amostra: a filha tem alelo diferente da mãe.";
  if (t < 1) return "Hoje. De que cópia da geração anterior veio cada uma?";
  return "Cada cópia veio de um gameta de uma cópia da geração de cima, com o alelo dela.";
}

function ponto(ctx, x, y, r, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function anel(ctx, x, y, r, cor, largura = 2) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

/* a marca de uma mutação: um ✕ sobre fundo branco */
function mutacao(ctx, x, y, r = 4) {
  ponto(ctx, x, y, r + 1.5, "#fff");
  ctx.strokeStyle = "#3d3d3d";
  ctx.lineWidth = 1.8;
  traco(ctx, x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7);
  traco(ctx, x - r * 0.7, y + r * 0.7, x + r * 0.7, y - r * 0.7);
}

export function desenharGenealogia(g, spec, { res, par, t, fantasmas = [] }) {
  const { ctx, m } = g, gen = spec.genealogia(res), G = gen.pais.length;
  t = Math.min(t, G);
  const u = extracao(g, gen, gen.tmrca !== null && t >= gen.tmrca ? 1 : 0);

  /* as duas caixas: a população e a árvore */
  const cima = m.topo + 22, baixo = g.H - m.base - 14;
  const gx0 = m.esq + 30, gx1 = m.esq + (g.W - m.esq - m.dir) * 0.6;
  const ax0 = gx1 + (g.W - m.dir - gx1) * 0.22, ax1 = g.W - m.dir;

  /* a janela: JANELA gerações que sobem com o tempo; extraída a genealogia, de hoje até agora */
  const hi = Math.max(JANELA, t + 1), lo = (hi - JANELA) * (1 - u);
  const y = (ger) => baixo - ((ger - lo) / (hi - lo)) * (baixo - cima);
  const coluna = (gx1 - gx0) / gen.copias, alto = (baixo - cima) / (hi - lo);
  const x = (c) => gx0 + (c + 0.5) * coluna;
  const raio = entre(Math.min(coluna, alto) * 0.26, 1, 7);
  const g0 = Math.max(0, Math.floor(lo) - 1), g1 = Math.min(G, Math.floor(t) + 1);

  /* Uma geração aparece enquanto t vai de ger − 1 a ger: as cópias surgem,
     um gameta desce de cada mãe até cada filha, e a ligação é traçada. */
  const surgiu = (ger) => entre(t - ger + 1, 0, 1);
  const surgem = (ger) => entre(surgiu(ger) / 0.2, 0, 1);
  const descem = (ger) => entre((surgiu(ger) - 0.15) / 0.5, 0, 1);
  const liga = (ger) => entre((surgiu(ger) - 0.6) / 0.4, 0, 1);
  const resto = 1 - 0.92 * u;                            // o que não é genealogia se apaga na extração
  const naAmostra = (ger, c) => gen.linhagens[ger].includes(c);

  /* o eixo do tempo: o passado em cima, hoje embaixo */
  for (const v of pretty(lo, hi, 5)) {
    if (v < 0 || v > g1 || v !== Math.round(v)) continue;
    texto(ctx, v ? String(v) : "hoje", gx0 - 12, y(v), "right", g.cores.texto, v ? "11px" : "italic 11px");
  }
  ctx.save();
  ctx.strokeStyle = g.cores.eixo;
  ctx.fillStyle = g.cores.eixo;
  traco(ctx, m.esq, baixo, m.esq, cima + 6);
  ctx.beginPath();
  ctx.moveTo(m.esq - 4, cima + 8);
  ctx.lineTo(m.esq, cima);
  ctx.lineTo(m.esq + 4, cima + 8);
  ctx.fill();
  ctx.restore();
  texto(ctx, "passado", m.esq, cima - 10, "center", g.cores.texto, "italic 11px");
  texto(ctx, `GERAÇÕES ATRÁS · ${gen.copias} CÓPIAS DO GENE EM CADA UMA`, gx0, 8, "left", g.cores.texto, "600 10px", 1.2);
  texto(ctx, legenda(gen, t), gx0, 26, "left", NAVY, "italic 12px");

  ctx.save();
  ctx.beginPath();
  ctx.rect(gx0 - 10, cima - 10, gx1 - gx0 + 20, baixo - cima + 20);
  ctx.clip();

  /* as ligações de toda a população, cada filha à sua mãe */
  ctx.lineWidth = 1;
  ctx.strokeStyle = TINTA_SUAVE;
  for (let ger = g0; ger < g1; ger++) {
    const f = liga(ger + 1);
    if (!f) continue;
    ctx.globalAlpha = 0.4 * resto;
    ctx.beginPath();
    gen.pais[ger].forEach((mae, c) => {
      ctx.moveTo(x(c), y(ger));
      ctx.lineTo(x(c) + (x(mae) - x(c)) * f, y(ger) + (y(ger + 1) - y(ger)) * f);
    });
    ctx.stroke();
  }

  /* as linhagens da amostra, por cima das outras ligações */
  ctx.globalAlpha = 1;
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = entre(alto * 0.1, 2, 3);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let ger = g0; ger < g1; ger++) {
    const f = liga(ger + 1);
    for (const c of gen.linhagens[ger]) {
      const mae = gen.pais[ger][c];
      ctx.moveTo(x(c), y(ger));
      ctx.lineTo(x(c) + (x(mae) - x(c)) * f, y(ger) + (y(ger + 1) - y(ger)) * f);
    }
  }
  ctx.stroke();

  /* as cópias, na cor do alelo; esmaecidas se não deixaram descendentes hoje.
     Uma mãe só se decide quando os gametas dela chegam embaixo. */
  for (let ger = g0; ger <= g1; ger++) {
    const decidida = ger === 0 || liga(ger) > 0;
    for (let c = 0; c < gen.copias; c++) {
      const daAmostra = naAmostra(ger, c) && (ger === 0 || liga(ger) > 0);
      ctx.globalAlpha = surgem(ger) * (daAmostra ? 1 : resto * (!decidida || gen.vivas[ger][c] ? 1 : 0.28));
      ponto(ctx, x(c), y(ger), raio, ALELO[gen.alelos[ger][c]]);
      if (daAmostra) anel(ctx, x(c), y(ger), raio + 2.5, TEAL, 2);
    }
  }

  /* os gametas da geração que está aparecendo: um desce de cada mãe até cada filha, com o alelo */
  const nova = Math.floor(t) + 1, d = suave(descem(nova));
  if (nova <= G && d > 0 && d < 1 && alto > 14) {
    ctx.globalAlpha = 1;
    gen.pais[nova - 1].forEach((mae, c) => {
      const gx = x(mae) + (x(c) - x(mae)) * d, gy = y(nova) + (y(nova - 1) - y(nova)) * d;
      ponto(ctx, gx, gy, 3, ALELO[gen.alelos[nova - 1][c]]);
      if (naAmostra(nova - 1, c)) anel(ctx, gx, gy, 5, TEAL, 1.5);
    });
  }

  /* as mutações, no meio da ligação; na extração, só as da genealogia ficam */
  ctx.globalAlpha = 1;
  for (const mu of gen.mutacoes) {
    if (mu.t < g0 || mu.t >= g1 || liga(mu.t + 1) < 1) continue;
    const daGenealogia = naAmostra(mu.t, mu.copia);
    ctx.globalAlpha = daGenealogia ? 1 : resto;
    const mae = gen.pais[mu.t][mu.copia];
    mutacao(ctx, (x(mu.copia) + x(mae)) / 2, (y(mu.t) + y(mu.t + 1)) / 2, daGenealogia ? 4 : 3);
  }
  ctx.globalAlpha = 1;

  /* os encontros */
  gen.nos.forEach((no, i) => {
    if (no.t && no.t <= t && no.t >= g0) encontro(ctx, x(no.copia), y(no.t), raio, t - no.t, i === gen.raiz, ALELO[gen.alelos[no.t][no.copia]]);
  });
  ctx.restore();

  if (gen.raiz !== null && t >= gen.tmrca) {
    const no = gen.nos[gen.raiz];
    texto(ctx, "ancestral comum", x(no.copia) + raio + 12, y(no.t), "left", TEAL, "600 11px");
  }

  /* a chave, no pé */
  let kx = gx0;
  const chave = (desenhar, rotulo) => {
    desenhar(kx + 5, g.H - 8);
    texto(ctx, rotulo, kx + 14, g.H - 8, "left", g.cores.texto);
    kx += 14 + ctx.measureText(rotulo).width + 16;
  };
  chave((cx, cy) => ponto(ctx, cx, cy, 4.5, NAVY), "A");
  chave((cx, cy) => ponto(ctx, cx, cy, 4.5, AMARELO), "a");
  chave((cx, cy) => { ctx.globalAlpha = 0.28; ponto(ctx, cx, cy, 4.5, NAVY); ctx.globalAlpha = 1; }, "sem descendentes hoje");
  chave((cx, cy) => anel(ctx, cx, cy, 4.5, TEAL, 2), "amostra e ancestrais");
  chave((cx, cy) => encontro(ctx, cx, cy, 3, Infinity, false), "coalescência");
  chave((cx, cy) => mutacao(ctx, cx, cy, 3.5), "mutação");

  /* a árvore, na escala de todas as gerações */
  const yArv = (ger) => baixo - (ger / G) * (baixo - cima);
  texto(ctx, "A GENEALOGIA DA AMOSTRA", ax0, 8, "left", g.cores.texto, "600 10px", 1.2);
  const k = gen.k[Math.floor(t)];
  texto(ctx, `${k} ${k === 1 ? "linhagem" : "linhagens"}`, ax0, 26, "left", TEAL, "italic 12px");
  for (const v of pretty(0, G, 5)) {
    ctx.strokeStyle = g.cores.grade;
    ctx.lineWidth = 1;
    traco(ctx, ax0, yArv(v), ax1, yArv(v));
    texto(ctx, String(v), ax1 + 6, yArv(v), "left", g.cores.texto);
  }
  const ref = spec.referencia?.(par);
  if (ref && ref.y <= G) {
    ctx.save();
    ctx.strokeStyle = g.cores.texto;
    ctx.setLineDash([4, 4]);
    traco(ctx, ax0, yArv(ref.y), ax1, yArv(ref.y));
    ctx.restore();
    texto(ctx, ref.rotulo, ax1, yArv(ref.y) - 9, "right", g.cores.texto, "italic 11px");
  }
  for (const f of fantasmas) {
    const antiga = spec.genealogia(f.res);
    desenharArvore(ctx, antiga, Math.min(antiga.pais.length, G), { x0: ax0, x1: ax1, y: yArv }, { cor: FANTASMA, largura: 1.5 });
  }
  desenharArvore(ctx, gen, t, { x0: ax0, x1: ax1, y: yArv }, { largura: 2.2, raio: 4, detalhes: true });
}

/** a árvore da amostra até a geração t, numa caixa { x0, x1, y(geração) → px };
    com `detalhes`, as pontas na cor do alelo, as mutações e os halos dos encontros */
export function desenharArvore(ctx, gen, t, { x0, x1, y }, { cor = TEAL, largura = 2, raio = 0, detalhes = false } = {}) {
  const { x: xNo, dono } = arvore(gen), G = gen.pais.length;
  const px = (i) => x0 + xNo[i] * (x1 - x0);
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineCap = "round";
  gen.nos.forEach((no, i) => {
    if (no.t > t) return;
    const ate = no.pai !== null ? Math.min(t, gen.nos[no.pai].t) : Math.min(t, G);
    ctx.globalAlpha = i === gen.raiz ? 0.4 : 1;    // acima do ancestral comum, a linhagem segue sem história para contar
    if (ate > no.t) traco(ctx, px(i), y(no.t), px(i), y(ate));
    ctx.globalAlpha = 1;
    if (no.filhos.length) {
      const xs = no.filhos.map(px);
      traco(ctx, Math.min(...xs), y(no.t), Math.max(...xs), y(no.t));
    }
  });
  if (detalhes) {
    for (const mu of gen.mutacoes) {
      const i = dono[mu.t].get(mu.copia);
      if (i !== undefined && mu.t + 1 <= t) mutacao(ctx, px(i), y(mu.t + 0.5), 3.5);
    }
    gen.nos.forEach((no, i) => {
      if (no.t > t) return;
      if (no.t === 0) ponto(ctx, px(i), y(0), raio, ALELO[gen.alelos[0][no.copia]]);
      else encontro(ctx, px(i), y(no.t), raio * 0.8, t - no.t, i === gen.raiz);
      if (no.pai === null && i !== gen.raiz && t > no.t) ponto(ctx, px(i), y(t), raio * 0.6, cor);   // a ponta de cada linhagem que ainda procura a mãe
    });
    if (gen.raiz !== null && t >= gen.tmrca) {
      texto(ctx, `geração ${numero(gen.tmrca, 0)}`, px(gen.raiz), y(gen.tmrca) - raio - 12, "center", cor, "600 11px");
    }
  }
  ctx.restore();
}

/* um encontro de linhagens: o anel teal grosso (na população, em volta do
   alelo da mãe); o halo pulsa por PULSO gerações e, no ancestral comum, fica */
function encontro(ctx, cx, cy, r, idade, ehRaiz, centro = TEAL) {
  if (idade < PULSO || ehRaiz) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ehRaiz ? Math.min(1, idade) : 1 - idade / PULSO);
    ponto(ctx, cx, cy, r * (ehRaiz ? 3.4 : 2 + 2.5 * (idade / PULSO)) + 2, HALO);
    ctx.restore();
  }
  ponto(ctx, cx, cy, r + 1, centro);
  anel(ctx, cx, cy, r + 3, TEAL, 3);
}
