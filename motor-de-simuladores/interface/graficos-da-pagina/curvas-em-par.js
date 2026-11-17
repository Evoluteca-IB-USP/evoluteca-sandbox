/* Uma aba com duas curvas (`curvas` na ficha): uma fica grande no centro e a
   outra, miúda, no quadro ao lado. Clicar no quadro troca as duas de lugar.
   Cada curva tem o seu título, a sua escala, as suas fórmulas e a sua legenda. */

import { criar } from "escrever-html";
import { grafico, linha, cabeca, valorEm, numero } from "./pecas.js";
import { desenharSaida, curvasDe } from "./tipos.js";
import { eixosMiudos } from "./miniaturas.js";
import { legendaEmFrase } from "./legenda-em-frase.js";

const MARGEM_MIUDA = { esq: 22, dir: 10, topo: 8, base: 16 };

export function montarCurvasEmPar(painel, spec, numeroDaFigura, estado) {
  const curvas = curvasDe(spec);
  let centro = 0;
  const lado = () => 1 - centro;

  const canvas = criar("canvas");
  const grande = grafico(canvas, {
    xlim: [0, 1], ylim: curvas[0].ylim, margem: { dir: 20, esq: 46 },
    desenhar: (g) => {
      const e = estado();
      if (!e.res) return;
      g.ylim = curvas[centro].ylim;
      desenharSaida(g, curvas[centro], e);
    },
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!painel.avancado) return;
    const r = canvas.getBoundingClientRect();
    painel.mira = { x: e.clientX - r.left, y: e.clientY - r.top };
    grande.redesenhar();
  });
  canvas.addEventListener("pointerleave", () => { painel.mira = null; grande.redesenhar(); });

  const titulo = criar("p", { class: "miniatura-titulo" });
  const quadro = criar("canvas", { class: "miniatura-canvas" });
  const nota = criar("p", { class: "miniatura-nota" });
  const trocar = criar("button", { type: "button", class: "miniatura miniatura-trocavel", title: "Trazer este gráfico para o centro" }, titulo, quadro, nota);
  const miudo = grafico(quadro, {
    xlim: [0, 1], ylim: [0, 1], margem: MARGEM_MIUDA,
    desenhar: (g) => {
      const { res, par } = estado();
      if (!res || !g.W) return;
      const c = curvas[lado()], s = c.serie(res), t = painel.t;
      titulo.textContent = c.rotulo ?? c.titulo;
      g.xlim = [0, s.length - 1];
      g.ylim = c.ylim;
      eixosMiudos(g, c.ylim.map((v) => numero(v, 2, 0)), `geração ${Math.floor(t)}`);
      const prev = painel.avancado && c.previsao?.(par);
      if (prev) linha(g, prev, { cor: g.cores.previsao, largura: 1.2, tracejado: [4, 3] });
      linha(g, s, { cor: c.cor, largura: 1.6, ate: t });
      cabeca(g, t, valorEm(s, t));
      nota.textContent = `${c.nota ?? ""} Clique para ver em grande.`.trim();
    },
  });

  const legendas = curvas.map((c) => legendaEmFrase(c, numeroDaFigura));
  const legenda = criar("div", {}, ...legendas);
  const mostrar = () => legendas.forEach((l, k) => { l.hidden = k !== centro; });
  mostrar();

  trocar.addEventListener("click", () => {
    centro = lado();
    painel.mira = null;
    mostrar();
    grande.redesenhar();
    miudo.redesenhar();
  });

  const no = criar("div", { class: "painel-principal painel-com-lado" }, canvas, trocar);
  return { no, legenda, redesenhar: () => { grande.redesenhar(); miudo.redesenhar(); } };
}
