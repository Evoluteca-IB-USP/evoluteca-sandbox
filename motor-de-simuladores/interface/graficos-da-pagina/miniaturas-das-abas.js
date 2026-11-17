/* O desenho miúdo de cada aba do painel: o gráfico daquela aba, sem eixos
   nem texto, andando junto com a simulação. Assim dá para ver todas as abas
   ao mesmo tempo e escolher pelo desenho. Tipos sem miniatura (barras,
   genealogia) deixam a aba só com o nome. */

import { criar } from "escrever-html";
import { grafico, valorEm, traco } from "./pecas.js";
import { curvasDe } from "./tipos.js";
import { NAVY, AMARELO, TEAL, TEAL_CLARO, TEAL_ESCURO } from "../cores.js";

const BASE = "#dcdcdc";

/* uma série encolhida até a largura da miniatura: um ponto por pixel, no máximo */
function linhaMiuda(g, ys, { cor, largura = 1, alfa = 1, ate = ys.length - 1, tracejado = null }) {
  const { ctx } = g, fim = Math.min(ate, ys.length - 1), passo = Math.max(1, Math.floor(ys.length / g.W));
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineJoin = "round";
  if (tracejado) ctx.setLineDash(tracejado);
  ctx.beginPath();
  for (let i = 0; i <= fim; i += passo) ctx[i ? "lineTo" : "moveTo"](g.x(i), g.y(ys[i]));
  ctx.lineTo(g.x(fim), g.y(valorEm(ys, fim)));
  ctx.stroke();
  ctx.restore();
}

function chao(g) {
  g.ctx.strokeStyle = BASE;
  g.ctx.lineWidth = 1;
  traco(g.ctx, 0, g.H - 0.5, g.W, g.H - 0.5);
}

const desenhos = {
  replicas(g, spec, { res, t, foco }) {
    const series = spec.series(res);
    g.xlim = [0, series[0].length - 1];
    chao(g);
    series.forEach((s, i) => { if (i !== foco) linhaMiuda(g, s, { cor: TEAL, alfa: foco === null ? 0.55 : 0.3, ate: t }); });
    if (foco !== null && foco < series.length) linhaMiuda(g, series[foco], { cor: NAVY, largura: 1.6, ate: t });
  },

  /* cada população num círculo: a fatia navy é a fração de A₁, o resto é A₂ */
  vidros(g, _spec, { ficha, res, t, foco }) {
    const series = ficha.graficos[0].series(res), n = series.length;
    let colunas = 1, lado = 0;
    for (let c = 1; c <= n; c++) {
      const l = Math.min(g.W / c, g.H / Math.ceil(n / c));
      if (l > lado) { lado = l; colunas = c; }
    }
    lado = Math.min(lado, 22);
    const linhas = Math.ceil(n / colunas), x0 = (g.W - lado * colunas) / 2, y0 = (g.H - lado * linhas) / 2, R = lado * 0.38;
    const { ctx } = g;
    series.forEach((s, i) => {
      const p = valorEm(s, Math.min(t, s.length - 1)), cx = x0 + (i % colunas + 0.5) * lado, cy = y0 + (Math.floor(i / colunas) + 0.5) * lado;
      ctx.fillStyle = AMARELO;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
      if (p > 0) {
        ctx.fillStyle = NAVY;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * 2 * Math.PI); ctx.closePath(); ctx.fill();
      }
      if (i === foco) {
        ctx.strokeStyle = AMARELO;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI); ctx.stroke();
      }
    });
  },

  /* a distribuição da conta na geração mostrada; nas pontas, as que perderam (âmbar) ou fixaram (navy) */
  relevo(g, _spec, { ficha, par, t }) {
    const alturas = ficha.relevo.corte(par, Math.floor(t)), n = alturas.length;
    const teto = Math.max(...alturas.slice(1, -1), 0.0001) * 1.4, larg = g.W / n, { ctx } = g;
    alturas.forEach((v, k) => {
      ctx.fillStyle = k === 0 ? AMARELO : k === n - 1 ? NAVY : TEAL_CLARO;
      const h = Math.min(1, v / teto) * (g.H - 2);
      ctx.fillRect(k * larg + 0.5, g.H - h, Math.max(1, larg - 1), h);
    });
    chao(g);
  },

  curva(g, spec, { res, par, t, avancado }) {
    const curvas = curvasDe(spec), emPar = curvas.length > 1;
    g.xlim = [0, curvas[0].serie(res).length - 1];
    chao(g);
    curvas.forEach((c) => {
      /* com duas curvas, cada uma vai na sua escala, para as duas caberem no desenho miúdo */
      g.ylim = c.ylim ?? [0, 1];
      const escala = emPar && c.relativa ? (ys) => ys.map((y) => y / ys[0]) : (ys) => ys;
      if (emPar && c.relativa) g.ylim = [0, 1];
      const prev = avancado && c.previsao?.(par);
      if (prev) linhaMiuda(g, escala(prev), { cor: TEAL_ESCURO, tracejado: [3, 3] });
      linhaMiuda(g, escala(c.serie(res)), { cor: emPar ? c.cor : NAVY, largura: 1.4, ate: t });
    });
  },
};

/** a miniatura de uma aba, ou null se o tipo dela não tem desenho miúdo */
export function miniaturaDaAba(painel, spec) {
  const desenhar = desenhos[spec.tipo];
  if (!desenhar) return null;
  const no = criar("canvas", { class: "painel-aba-miniatura", "aria-hidden": "true" });
  const g = grafico(no, {
    xlim: [0, 1], ylim: spec.ylim ?? [0, 1], margem: { esq: 0, dir: 0, topo: 2, base: 1 },
    desenhar: (g) => {
      const { ficha, sessao } = painel;
      if (!sessao.res || !g.W) return;
      desenhar(g, spec, { ficha, res: sessao.res, par: sessao.par, t: painel.t, foco: painel.escolha ?? painel.sobre, avancado: painel.avancado });
    },
  });
  return { no, redesenhar: () => { if (no.offsetParent) g.redesenhar(); } };
}
