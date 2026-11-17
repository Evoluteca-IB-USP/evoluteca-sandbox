/* Um campo de texto cujo sublinhado é uma trajetória de deriva: tracejada
   enquanto vazia, ela se pinta de teal conforme se escreve e ganha a
   cabecinha âmbar quando o que foi escrito serve. `medir(valor)` devolve
   { parte: 0..1, serve }. Visual em aparencia/salas/entrada.css. */

import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";

const PONTOS = 60, ALTURA = 22;

function trajetoria(semente) {
  const rng = criarRng(semente);
  let lento = 0, rapido = 0;
  const pts = [];
  for (let i = 0; i <= PONTOS; i++) {
    lento += -0.1 * lento + rnorm(0, 1.2, rng);
    rapido += -0.4 * rapido + rnorm(0, 1, rng);
    pts.push([(i / PONTOS) * 1000, ALTURA / 2 + Math.tanh((lento + rapido) / 5) * ALTURA * 0.4]);
  }
  return pts;
}

export function campoComTrajetoria({ semente, medir, classe = "", depois = null, ...atributos }) {
  const pts = trajetoria(semente);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const campo = criar("input", { type: "text", class: "trajeto-campo", autocomplete: "off", spellcheck: "false", ...atributos });
  const linha = criar("span", { class: "trajeto-linha", "aria-hidden": "true", html:
    `<svg viewBox="0 0 1000 ${ALTURA}" preserveAspectRatio="none"><path class="trajeto-vazio" pathLength="1" d="${d}"/><path class="trajeto-cheio" pathLength="1" d="${d}"/></svg>` +
    `<span class="trajeto-cabeca" style="top: ${((pts.at(-1)[1] / ALTURA) * 100).toFixed(1)}%"></span>` });
  const caixa = criar("span", { class: `trajeto ${classe}` }, campo, linha, depois);

  const atualizar = () => {
    const { parte, serve } = medir(campo.value);
    linha.style.setProperty("--parte", serve ? 1 : Math.min(parte, 0.92));
    caixa.classList.toggle("trajeto-serve", serve);
  };
  campo.addEventListener("input", atualizar);
  atualizar();
  return { caixa, campo };
}
