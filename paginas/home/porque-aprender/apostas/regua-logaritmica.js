/* A régua das perguntas de "quanto tempo?" e "quantas rodadas?": o mesmo
   slider dos parâmetros do simulador (componentes/regua-linha.css), em
   escala logarítmica, com o degrau "nunca" à parte, na ponta. O cursor
   começa no meio da escala, longe de qualquer resposta. */

import { criar } from "escrever-html";
import { numero } from "portugues";
import { partesDaAposta } from "./partes-da-aposta.js";

const PASSOS = 1000;

/** formatar(v) → texto; marcas: [[valor, rótulo]]; aoApostar(v), com v = Infinity para "nunca" */
export function reguaLogaritmica({ min, max, marcas, formatar, aoApostar }) {
  const L = Math.log, fr = (v) => Math.max(0, Math.min(1, (L(v) - L(min)) / (L(max) - L(min))));
  const de = (f) => Math.exp(L(min) + f * (L(max) - L(min)));
  let valor = de(0.5);
  const texto = (v) => (v === Infinity ? "nunca" : formatar(v));
  const p = partesDaAposta(() => aoApostar(valor));
  const entrada = criar("input", { type: "range", class: "rl-entrada", min: "0", max: String(PASSOS), value: String(PASSOS / 2), "aria-label": "sua aposta" });
  const saida = criar("output", { class: "rl-valor" });
  const nunca = criar("button", { type: "button", class: "regua-log-nunca", texto: "nunca", "aria-pressed": "false" });
  const modelo = criar("div", { class: "regua-log-modelo", hidden: true }, criar("span"));
  const escolher = (v) => {
    valor = v;
    nunca.setAttribute("aria-pressed", String(v === Infinity));
    entrada.toggleAttribute("data-apagada", v === Infinity);
    entrada.style.setProperty("--cheio", `${(100 * +entrada.value / PASSOS).toFixed(2)}%`);
    saida.textContent = texto(v);
  };
  entrada.addEventListener("input", () => escolher(de(+entrada.value / PASSOS)));
  nunca.addEventListener("click", () => escolher(valor === Infinity ? de(+entrada.value / PASSOS) : Infinity));
  escolher(valor);
  const no = criar("div", { class: "aposta" },
    criar("span", { class: "rl-topo" }, criar("span", { class: "rl-rotulo", texto: "sua aposta" }), saida),
    criar("div", { class: "regua-log" },
      criar("div", { class: "regua-log-trilho" },
        entrada,
        criar("div", { class: "regua-log-camada" }, modelo, ...marcas.map(([v, t]) => criar("span", { class: "regua-log-marca", style: `left:${100 * fr(v)}%`, texto: t })))),
      nunca),
    p.lido, p.botao);
  return {
    no,
    valor: () => valor,
    travar() { p.travar(); entrada.disabled = true; nunca.disabled = true; },
    revelar(v, perto) {
      modelo.firstChild.textContent = texto(v);
      modelo.style.left = `${100 * fr(v)}%`;
      modelo.hidden = false;
      p.revelar(texto(valor), texto(v), perto);
    },
  };
}

export const MARCAS_DE_TEMPO = [[1, "1 dia"], [30.4, "1 mês"], [365, "1 ano"], [3650, "10 anos"], [36500, "100 anos"]];

/** dias → texto de gente: "11 dias", "12 semanas", "6 meses", "40 anos" */
export function tempo(d) {
  if (d < 1.5) return "1 dia";
  if (d < 14) return `${Math.round(d)} dias`;
  if (d < 120) return `${Math.round(d / 7)} semanas`;
  if (d < 548) return `${Math.round(d / 30.4)} meses`;
  return `${numero(Math.round(d / 365))} anos`;
}
