/* As miniaturas ao lado das abas do painel: a mesma população (o vidro
   escolhido) vista de outro ângulo.
     corte                   a distribuição da conta na geração mostrada, com os vidros da rodada em pontos
   Cada uma devolve { no, redesenhar }. */

import { criar } from "escrever-html";
import { grafico, texto, traco } from "./pecas.js";
import { NAVY, AMARELO, TEAL, TEAL_CLARO, TINTA_SUAVE } from "../cores.js";

const MARGEM = { esq: 22, dir: 10, topo: 8, base: 16 };

export function montarMiniatura(painel, tipo) {
  const { ficha, sessao } = painel, trajetorias = ficha.graficos[0];
  const titulo = criar("p", { class: "miniatura-titulo" });
  const canvas = criar("canvas", { class: `miniatura-canvas miniatura-${tipo}` });
  const nota = criar("p", { class: "miniatura-nota" });
  const no = criar("div", { class: "miniatura" }, titulo, canvas, nota);
  const foco = () => { const i = painel.escolha ?? painel.sobre, n = sessao.res ? trajetorias.series(sessao.res).length : 0; return i !== null && i < n ? i : null; };
  const t = () => Math.floor(painel.t);

  const desenhos = {
    corte: (g) => {
      titulo.textContent = `Na geração ${t()}: a conta e a rodada`;
      const alturas = ficha.relevo.corte(sessao.par, t()), n = alturas.length, maior = Math.max(...alturas.slice(1, -1), 0.0001);
      const teto = Math.max(maior, ...[alturas[0], alturas[n - 1]].map((v) => Math.min(v, maior * 1.6)));
      const base = g.H - 30, alto = base - 8, larg = (g.W - 4) / n;
      alturas.forEach((v, k) => {
        g.ctx.fillStyle = k === 0 ? AMARELO : k === n - 1 ? NAVY : TEAL_CLARO;
        const h = Math.min(1, v / teto) * alto;
        g.ctx.fillRect(2 + k * larg + 1, base - h, larg - 2, h);
      });
      g.ctx.strokeStyle = "#cfcfcf";
      traco(g.ctx, 2, base, g.W - 2, base);
      const series = trajetorias.series(sessao.res), pilha = new Array(n).fill(0), i0 = foco();
      series.forEach((s, i) => {
        const p = s[Math.min(t(), s.length - 1)], k = p <= 0 ? 0 : p >= 1 ? n - 1 : 1 + Math.min(n - 3, Math.floor(p * (n - 2)));
        const x = 2 + (k + 0.5) * larg, y = base + 6 + pilha[k]++ * 5;
        if (y > g.H - 2) return;
        g.ctx.fillStyle = i === i0 ? AMARELO : TEAL;
        g.ctx.beginPath(); g.ctx.arc(x, y, 2.2, 0, 2 * Math.PI); g.ctx.fill();
      });
      nota.textContent = "Barras: a fração de populações que a conta prevê em cada frequência. Pontos: as populações desta rodada" + (i0 !== null ? "; em âmbar, a escolhida." : ".");
    },
  };

  const g = grafico(canvas, { xlim: [0, 1], ylim: [0, 1], margem: tipo === "corte" ? { esq: 0, dir: 0, topo: 0, base: 0 } : MARGEM, desenhar: (g) => {
    if (sessao.res && g.W) desenhos[tipo](g);
  } });
  return { no, redesenhar: () => g.redesenhar() };
}

export function eixosMiudos(g, [baixo, alto], rotuloX) {
  const { ctx, m } = g;
  ctx.strokeStyle = "#e5e5e5";
  traco(ctx, m.esq, g.y(g.ylim[0]), g.W - m.dir, g.y(g.ylim[0]));
  traco(ctx, m.esq, g.y(g.ylim[1]), g.W - m.dir, g.y(g.ylim[1]));
  texto(ctx, baixo, m.esq - 5, g.y(g.ylim[0]), "right", TINTA_SUAVE, "10px");
  texto(ctx, alto, m.esq - 5, g.y(g.ylim[1]), "right", TINTA_SUAVE, "10px");
  texto(ctx, "0", m.esq, g.H - 5, "left", TINTA_SUAVE, "10px");
  texto(ctx, String(g.xlim[1]), g.W - m.dir, g.H - 5, "right", TINTA_SUAVE, "10px");
  texto(ctx, rotuloX, (m.esq + g.W - m.dir) / 2, g.H - 5, "center", NAVY, "600 10px");
}
