/* Os tipos de gráfico que uma ficha pode pedir, montados com as peças de
   pecas.js:
     replicas  várias séries no tempo, todas iguais até alguém escolher uma (no gráfico ou nos vidros)
     curva     uma série no tempo (uma média, uma proporção); com `curvas`, duas que se revezam no centro (curvas-em-par.js)
     barras    categorias, com o esperado (contorno tracejado) e o medido (cheio)
     genealogia  a população geração a geração, como é e desembaraçada, com legenda em texto (genealogia.js)
   Todos aceitam a rodada anterior em cinza, para comparar. */

import { grafico, eixos, linha, faixa, cabeca, referencia, agora, valorEm, texto, numero, formula, trechoDeTempo, traco } from "./pecas.js";
import { areaDaGenealogia } from "./genealogia.js";
import { FANTASMA, TEAL, TEAL_CLARO, TEAL_ESCURO, AMARELO, NAVY, FONTE } from "../cores.js";

/** a área do gráfico; `estado()` devolve { res, par, t, fantasmas } na hora de desenhar */
export function areaDeSaida(canvas, spec, estado) {
  if (spec.tipo === "genealogia") return areaDaGenealogia(canvas, spec, estado);
  return grafico(canvas, {
    xlim: [0, 1], ylim: spec.ylim,
    margem: { dir: 20, esq: spec.arrastar ? 52 : 46 },
    desenhar: (g) => { const e = estado(); if (e.res) desenharSaida(g, spec, e); },
  });
}

export function desenharSaida(g, spec, e) {
  const { res, par, t, fantasmas = [], escolha = null, sobre = null, avancado = true, puxador = false, trechos = [], mira = null } = e;
  if (spec.tipo === "barras") return desenharBarras(g, spec, res, par, fantasmas);
  g.xlim = [0, total(spec, res)];
  eixos(g, { tituloY: spec.titulo, tituloX: "geração" });
  trechos.forEach((tr) => trechoDeTempo(g, tr));
  const fx = avancado && spec.faixa?.(par);
  if (fx) faixa(g, fx.inf, fx.sup, { alfa: 0.1 });
  const ref = spec.referencia?.(par);
  if (ref) referencia(g, ref.y, ref.rotulo);
  const prev = avancado && spec.previsao?.(par);
  if (prev) linha(g, prev, { cor: g.cores.previsao, largura: 1.5, tracejado: [5, 4] });

  for (const f of fantasmas) {
    if (spec.tipo === "replicas") spec.series(f.res).forEach((s) => linha(g, s, { cor: FANTASMA, alfa: 0.45 }));
    else linha(g, spec.serie(f.res), { cor: FANTASMA, largura: 2 });
  }

  if (spec.tipo === "replicas") {
    const series = spec.series(res), foco = escolha ?? sobre;
    const focado = foco !== null && foco < series.length;
    agora(g, t);
    series.forEach((s, i) => { if (i !== foco) linha(g, s, { cor: focado ? TEAL_CLARO : TEAL, ate: t, alfa: focado ? 0.4 : 0.6, largura: 1.2 }); });
    series.forEach((s, i) => { if (i !== foco) pontinho(g, t, valorEm(s, t), focado); });
    if (focado) {
      linha(g, series[foco], { cor: g.cores.destaque, largura: escolha === foco ? 2.4 : 1.8, ate: t });
      cabeca(g, t, valorEm(series[foco], t));
    }
    if (avancado && spec.fixacoes) spec.fixacoes(res).forEach((f, i) => { if (f && f.t <= t) marcaDeFixacao(g, f, i === foco); });
    if (spec.arrastar) puxadorDoComeco(g, par[spec.arrastar], puxador);
  } else {
    const s = spec.serie(res);
    linha(g, s, { cor: spec.cor ?? g.cores.destaque, largura: 2.2, ate: t });
    if (s.length > 1) agora(g, t);
    cabeca(g, t, valorEm(s, t));
  }
  if (avancado && spec.formulas) spec.formulas(par, t, res).forEach((f, k) => formula(g, f, `${spec.id}-${k}`));
  if (avancado && mira) miraNoGrafico(g, mira);
}

/** as linhas de um gráfico `curva`: ele mesmo, ou cada uma de `curvas` com a sua cor */
export function curvasDe(spec) {
  if (!spec.curvas) return [spec];
  return spec.curvas.map((c, k) => ({ ...c, tipo: "curva", cor: CORES_DAS_CURVAS[k % CORES_DAS_CURVAS.length] }));
}

const CORES_DAS_CURVAS = [NAVY, TEAL];

/* a geração em que a população ficou com um só alelo: um tracinho na parede */
function marcaDeFixacao(g, { t, y }, emFoco) {
  const { ctx } = g, x = g.x(t), py = g.y(y), dir = y >= 1 ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = emFoco ? NAVY : TEAL_ESCURO;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, py);
  ctx.lineTo(x, py + dir * 7);
  ctx.stroke();
  ctx.restore();
}

/* a mira do modo avançado: linhas finas até os eixos e a leitura exata */
function miraNoGrafico(g, { x, y }) {
  const { ctx } = g;
  if (x < g.m.esq || x > g.W - g.m.dir || y < g.m.topo || y > g.H - g.m.base) return;
  const ger = Math.round(g.xInv(x)), v = g.yInv(y);
  ctx.save();
  ctx.strokeStyle = "rgba(20, 37, 96, .35)";
  ctx.setLineDash([2, 3]);
  traco(ctx, g.m.esq, y, g.W - g.m.dir, y);
  traco(ctx, x, g.m.topo, x, g.H - g.m.base);
  ctx.restore();
  const rotulo = `geração ${ger} · ${numero(v, 2)}`;
  ctx.font = `600 11px ${FONTE}`;
  const w = ctx.measureText(rotulo).width, px = Math.min(x + 8, g.W - g.m.dir - w - 4), py = Math.max(g.m.topo + 10, y - 12);
  ctx.fillStyle = "rgba(255, 255, 255, .9)";
  ctx.fillRect(px - 3, py - 8, w + 6, 16);
  texto(ctx, rotulo, px, py, "left", NAVY, "600 11px");
}

/* onde cada população está agora: o ponto que corresponde ao vidro dela */
function pontinho(g, t, v, apagado) {
  const { ctx } = g;
  ctx.fillStyle = apagado ? TEAL_CLARO : TEAL;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(g.x(t), g.y(v), 2.8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

/* o ponto do começo, que se arrasta para mudar o valor inicial */
function puxadorDoComeco(g, v, aceso) {
  const { ctx } = g, x = g.x(0), y = g.y(v);
  ctx.save();
  if (aceso) {
    ctx.fillStyle = "rgba(252, 180, 33, .3)";
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = AMARELO;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (aceso) texto(ctx, "arraste", x + 12, y - 12, "left", TEAL_ESCURO, "italic 11px");
}

function total(spec, res) {
  return (spec.tipo === "replicas" ? spec.series(res)[0] : curvasDe(spec)[0].serie(res)).length - 1;
}

/* barras: por categoria, o esperado em contorno tracejado e o medido cheio, lado a lado */
function desenharBarras(g, spec, res, par, fantasmas) {
  const { ctx } = g, categorias = spec.categorias, n = categorias.length;
  const { esperado, medido } = spec.valores(res, par);
  g.xlim = [0, n];
  eixos(g, { tituloY: spec.titulo, marcasX: [] });
  const largura = (g.x(1) - g.x(0)) * 0.26, base = g.y(g.ylim[0]);
  categorias.forEach((nome, i) => {
    const centro = g.x(i + 0.5);
    const barra = (x, v, estilo) => {
      const topo = g.y(v);
      ctx.save();
      if (estilo === "esperado") {
        ctx.strokeStyle = TEAL_ESCURO;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x, topo, largura, base - topo);
      } else {
        ctx.fillStyle = estilo === "fantasma" ? FANTASMA : g.cores.destaque;
        ctx.fillRect(x, topo, largura, base - topo);
      }
      ctx.restore();
    };
    for (const f of fantasmas) {
      const v = spec.valores(f.res, f.par).medido[i];
      ctx.save();
      ctx.strokeStyle = FANTASMA;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centro + 2, g.y(v));
      ctx.lineTo(centro + 2 + largura, g.y(v));
      ctx.stroke();
      ctx.restore();
    }
    barra(centro - largura - 2, esperado[i], "esperado");
    barra(centro + 2, medido[i], "medido");
    texto(ctx, numero(esperado[i], 2), centro - largura / 2 - 2, g.y(esperado[i]) - 9, "center", TEAL_ESCURO, "600 11px");
    texto(ctx, numero(medido[i], 2), centro + largura / 2 + 2, g.y(medido[i]) - 9, "center", g.cores.destaque, "700 11px");
    texto(ctx, nome, centro, base + 14, "center", g.cores.destaque, "600 13px");
  });
  texto(ctx, "esperado", g.W - g.m.dir - 90, 8, "right", TEAL_ESCURO, "italic 11px");
  texto(ctx, "na amostra", g.W - g.m.dir, 8, "right", g.cores.destaque, "italic 11px");
}
