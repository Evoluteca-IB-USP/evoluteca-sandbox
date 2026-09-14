/* A emenda: cada seção principal da home e cada tema do catálogo CORTA a
   seção de cima numa trajetória sorteada — a mesma receita da aresta que
   separa a abertura do resto da página, repetida em cada junta. O fundo e
   tudo que há na seção vão até o dente da serra; a linha teal e a cabecinha
   âmbar correm pela crista. O respiro em volta é o padding do CSS.

   Escolhido entre as variantes de 2026-09 ("V · estratos", com a solução de
   legibilidade "sombra"). Ver aparencia/home/emenda-entre-secoes.css. */

import { criarRng, rnorm } from "r";

const SVG = "http://www.w3.org/2000/svg";
const ALTURA = 118;          // px — precisa bater com o 118px do CSS

/* passeio em dois ritmos, comprimido por tanh — a mesma receita da
   trajetória em destaque do gráfico da abertura. Devolve N+1 valores
   em [-1, 1]. */
function passeio(semente, N, lentoK = 0.08, rapidoK = 0.35, sLento = 1.4, sRapido = 1.1, escala = 5) {
  const rng = criarRng(semente);
  let lento = 0, rapido = 0;
  const v = [];
  for (let i = 0; i <= N; i++) {
    lento += -lentoK * lento + rnorm(0, sLento, rng);
    rapido += -rapidoK * rapido + rnorm(0, sRapido, rng);
    v.push(Math.tanh((lento + rapido) / escala));
  }
  return v;
}

export function recortar(secao, semente) {
  const A = ALTURA, W = 1440, N = 72;
  const ys = passeio(semente, N).map((z) => A * 0.45 + z * A * 0.34);
  secao.classList.add("recortado");
  secao.style.clipPath = `polygon(${
    ys.map((y, i) => `${(i / N * 100).toFixed(2)}% ${y.toFixed(1)}px`).join(", ")
  }, 100% 100%, 0% 100%)`;

  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${A}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("recorte-linha");
  const linha = document.createElementNS(SVG, "polyline");
  linha.setAttribute("points",
    ys.map((y, i) => `${(i * W / N).toFixed(1)},${(y + 1.4).toFixed(1)}`).join(" "));
  const cabeca = document.createElementNS(SVG, "circle");
  cabeca.setAttribute("cx", W);
  cabeca.setAttribute("cy", (ys[N] + 1.4).toFixed(1));
  cabeca.setAttribute("r", "4.5");
  svg.append(linha, cabeca);
  secao.prepend(svg);
}
