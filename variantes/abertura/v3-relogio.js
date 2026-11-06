/* v3 · o relógio: a contagem de gerações, que hoje mora na nota de rodapé,
   vira o título. O fundo rola sem linha em destaque; o número é o destaque. */

import { numero } from "portugues";
import { animarFundo } from "./comum/fundo-de-deriva.js";
import { montarPagina } from "./comum/montar-pagina.js";

const MINUTO = 1 / 1440;
const ESPECIES = [
  ["humanos", 25 * 365],
  ["bactérias como a E. coli", 20 * MINUTO],
  ["moscas-das-frutas", 14],
  ["camundongos", 90],
  ["pés de milho", 365],
  ["baleias-da-groenlândia", 50 * 365],
];

function duracao(dias) {
  const plural = (n, um, varios) => `${numero(n)} ${n === 1 ? um : varios}`;
  if (dias < 1 / 24) return plural(Math.floor(dias * 1440), "minuto", "minutos");
  if (dias < 2) return plural(Math.floor(dias * 24), "hora", "horas");
  if (dias < 60) return plural(Math.floor(dias), "dia", "dias");
  if (dias < 730) return plural(Math.floor(dias / 30.4), "mês", "meses");
  return plural(Math.floor(dias / 365), "ano", "anos");
}

const palco = document.querySelector(".ab-relogio-palco");
const geracoes = palco.querySelector("[data-geracoes]");
const especie = palco.querySelector("[data-especie]");
const tempo = palco.querySelector("[data-tempo]");
let k = 0;

palco.querySelector("[data-sortear]").addEventListener("click", () => {
  const outras = ESPECIES.map((_, i) => i).filter((i) => i !== k);
  k = outras[Math.floor(Math.random() * outras.length)];
  especie.textContent = ESPECIES[k][0];
});

animarFundo(document.getElementById("fundo"), {
  populacoes: 18,
  destaque: false,
  grade: null,
  aoQuadro({ geracoes: g }) {
    const n = Math.floor(g);
    geracoes.textContent = numero(n);
    tempo.textContent = duracao(n * ESPECIES[k][1]);
  },
});
montarPagina();
