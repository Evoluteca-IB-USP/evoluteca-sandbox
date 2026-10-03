/* Os tipos de gráfico que uma ficha pode pedir, montados com as peças de
   pecas.js:
     replicas  várias séries no tempo, a primeira em destaque, distribuição ao lado
     curva     uma série no tempo (uma média, uma proporção, uma trajetória)
     barras    categorias, com o esperado (contorno tracejado) e o medido (cheio)
   Todos aceitam a rodada anterior em cinza, para comparar. */

import { grafico, eixos, linha, faixa, cabeca, referencia, agora, histogramaLateral, valorEm, texto, numero } from "./pecas.js";
import { FANTASMA, TEAL_ESCURO } from "../cores.js";

/** a área do gráfico; `estado()` devolve { res, par, t, fantasmas } na hora de desenhar */
export function areaDeSaida(canvas, spec, estado) {
  return grafico(canvas, {
    xlim: [0, 1], ylim: spec.ylim,
    margem: { dir: spec.distribuicao ? 96 : 20 },
    desenhar: (g) => { const e = estado(); if (e.res) desenharSaida(g, spec, e); },
  });
}

export function desenharSaida(g, spec, { res, par, t, fantasmas = [] }) {
  if (spec.tipo === "barras") return desenharBarras(g, spec, res, par, fantasmas);
  g.xlim = [0, total(spec, res)];
  eixos(g, { tituloY: spec.titulo, tituloX: "geração" });
  if (spec.faixa) {
    const { inf, sup } = spec.faixa(par);
    faixa(g, inf, sup, { alfa: 0.1 });
  }
  const ref = spec.referencia?.(par);
  if (ref) referencia(g, ref.y, ref.rotulo);
  if (spec.previsao) linha(g, spec.previsao(par), { cor: g.cores.previsao, largura: 1.5, tracejado: [5, 4] });

  for (const f of fantasmas) {
    if (spec.tipo === "replicas") spec.series(f.res).forEach((s) => linha(g, s, { cor: FANTASMA, alfa: 0.45 }));
    else linha(g, spec.serie(f.res), { cor: FANTASMA, largura: 2 });
  }

  if (spec.tipo === "replicas") {
    const series = spec.series(res);
    for (const s of series.slice(1)) linha(g, s, { ate: t, alfa: 0.65 });
    linha(g, series[0], { cor: g.cores.destaque, largura: 2.2, ate: t });
    agora(g, t);
    cabeca(g, t, valorEm(series[0], t));
    if (spec.distribuicao) histogramaLateral(g, series.map((s) => s[Math.floor(t)]), { largura: 70 });
  } else {
    const s = spec.serie(res);
    linha(g, s, { cor: g.cores.destaque, largura: 2.2, ate: t });
    if (s.length > 1) agora(g, t);
    cabeca(g, t, valorEm(s, t));
  }
}

function total(spec, res) {
  return (spec.tipo === "replicas" ? spec.series(res)[0] : spec.serie(res)).length - 1;
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
