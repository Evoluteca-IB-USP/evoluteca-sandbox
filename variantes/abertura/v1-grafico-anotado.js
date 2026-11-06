/* v1 · o gráfico anotado: a abertura é uma figura de verdade, com eixo das
   gerações no pé, rótulo do eixo vertical e uma anotação presa à cabeça da
   linha âmbar, dizendo quanto daquela população tem a variante agora. */

import { animarFundo } from "./comum/fundo-de-deriva.js";
import { montarPagina } from "./comum/montar-pagina.js";

const rotulo = document.getElementById("rotulo");
const pct = rotulo.querySelector("[data-pct]");

animarFundo(document.getElementById("fundo"), {
  eixoGeracoes: true,
  aoQuadro({ cabeca }) {
    if (!cabeca) return;
    rotulo.style.transform = `translate(${cabeca.x - rotulo.offsetWidth}px, ${cabeca.y - 64}px)`;
    pct.textContent = `${Math.round(cabeca.p * 100)}%`;
  },
});
montarPagina();
