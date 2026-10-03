/* A linha que fecha o banner: uma trajetória de deriva que atravessa a
   página, cheia até a cabecinha âmbar e pontilhada depois dela. */

import { criarRng, rnorm } from "r";

const ALTURA = 70, PONTOS = 72, CABECA = 0.86;

export function linhaDeFecho(semente) {
  const rng = criarRng(semente);
  let lento = 0, rapido = 0;
  const pts = [];
  for (let i = 0; i <= PONTOS; i++) {
    lento += -0.08 * lento + rnorm(0, 1.4, rng);
    rapido += -0.35 * rapido + rnorm(0, 1.1, rng);
    pts.push([i / PONTOS, ALTURA / 2 + Math.tanh((lento + rapido) / 5) * ALTURA * 0.4]);
  }
  const k = Math.round(CABECA * PONTOS), [x, y] = pts[k];
  const tracar = (trecho) => trecho.map(([px, py], i) => `${i ? "L" : "M"}${(px * 1000).toFixed(1)} ${py.toFixed(1)}`).join(" ");

  const no = document.createElement("div");
  no.className = "fecho";
  no.setAttribute("aria-hidden", "true");
  no.innerHTML =
    `<svg viewBox="0 0 1000 ${ALTURA}" preserveAspectRatio="none">` +
    `<path d="${tracar(pts.slice(0, k + 1))}"/><path class="fecho-resto" d="${tracar(pts.slice(k))}"/></svg>` +
    `<span class="fecho-cabeca" style="left: ${(x * 100).toFixed(2)}%; top: ${y.toFixed(1)}px"></span>`;
  return no;
}
