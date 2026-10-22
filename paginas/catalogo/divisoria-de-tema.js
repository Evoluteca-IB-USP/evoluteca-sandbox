/* A divisória entre dois temas: uma trajetória de deriva pontilhada, sorteada
   de novo a cada divisória. */

import { criarRng, rnorm } from "r";

const ALTURA = 36, PONTOS = 90;

export function divisoriaDeTema() {
  const rng = criarRng(Math.floor(Math.random() * 1e9));
  let lento = 0, rapido = 0;
  const pts = [];
  for (let i = 0; i <= PONTOS; i++) {
    lento += -0.06 * lento + rnorm(0, 1.6, rng);
    rapido += -0.4 * rapido + rnorm(0, 1.2, rng);
    pts.push(`${i ? "L" : "M"}${(i / PONTOS * 1000).toFixed(1)} ${(ALTURA / 2 + Math.tanh((lento + rapido) / 6) * ALTURA * 0.42).toFixed(1)}`);
  }
  const no = document.createElement("div");
  no.className = "estante-divisoria";
  no.setAttribute("aria-hidden", "true");
  no.innerHTML = `<svg viewBox="0 0 1000 ${ALTURA}" preserveAspectRatio="none"><path d="${pts.join(" ")}"/></svg>`;
  return no;
}
