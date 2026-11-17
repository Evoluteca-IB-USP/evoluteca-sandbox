/* A árvore da amostra, sozinha: a miniatura que acompanha a linha do tempo
   quando ela flutua no pé da janela. As pontas ficam numa ordem em que
   nenhum ramo se cruza, e cada encontro, no meio dos seus filhos. */

import { traco } from "./pecas.js";
import { TEAL } from "../cores.js";

const arvores = new WeakMap();

/* o x de cada nó (0 a 1), calculado uma vez por rodada */
function posicoes(gen) {
  if (!arvores.has(gen)) {
    const { nos } = gen, ordem = [], x = [];
    const media = (i) => (nos[i].filhos.length ? nos[i].filhos.reduce((s, f) => s + media(f), 0) / nos[i].filhos.length : nos[i].copia);
    const visitar = (i) => {
      if (!nos[i].filhos.length) ordem.push(i);
      else nos[i].filhos.slice().sort((a, b) => media(a) - media(b)).forEach(visitar);
    };
    nos.map((no, i) => i).filter((i) => nos[i].pai === null).sort((a, b) => media(a) - media(b)).forEach(visitar);
    ordem.forEach((i, k) => { x[i] = ordem.length > 1 ? k / (ordem.length - 1) : 0.5; });
    nos.forEach((no, i) => { if (no.filhos.length) x[i] = no.filhos.reduce((s, f) => s + x[f], 0) / no.filhos.length; });
    arvores.set(gen, x);
  }
  return arvores.get(gen);
}

/** a árvore até a geração t, numa caixa { x0, x1, y(geração) → px } */
export function desenharArvore(ctx, gen, t, { x0, x1, y }, { cor = TEAL, largura = 2 } = {}) {
  const x = posicoes(gen), G = gen.pais.length, px = (i) => x0 + x[i] * (x1 - x0);
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineCap = "round";
  gen.nos.forEach((no, i) => {
    if (no.t > t) return;
    const ate = Math.min(t, no.pai !== null ? gen.nos[no.pai].t : G);
    ctx.globalAlpha = i === gen.raiz ? 0.4 : 1;    // para lá do ancestral comum, a linhagem segue sem história para contar
    if (ate > no.t) traco(ctx, px(i), y(no.t), px(i), y(ate));
    ctx.globalAlpha = 1;
    if (no.filhos.length) {
      const xs = no.filhos.map(px);
      traco(ctx, Math.min(...xs), y(no.t), Math.max(...xs), y(no.t));
    }
  });
  ctx.restore();
}
