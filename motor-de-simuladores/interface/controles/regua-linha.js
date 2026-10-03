/* Controle A — a régua-linha. O trilho é a linha de deriva do catálogo:
   contínua até a cabecinha âmbar, pontilhada depois dela. */

import { criar } from "escrever-html";
import { paraFracao, deFracao, formatar } from "../escala.js";

const PASSOS = 1000;

export function reguaLinha(p, valor, aoMudar) {
  const entrada = criar("input", { type: "range", class: "rl-entrada", min: 0, max: PASSOS, step: 1, "aria-label": p.rotulo });
  const saida = criar("output", { class: "rl-valor" });
  const no = criar("label", { class: "rl", "data-nome": p.nome },
    criar("span", { class: "rl-topo" }, criar("span", { class: "rl-rotulo", texto: p.rotulo }), saida),
    entrada,
    criar("span", { class: "rl-limites" }, criar("span", { texto: formatar(p, p.min) }), criar("span", { texto: formatar(p, p.max) })));

  const pintar = (v) => {
    entrada.style.setProperty("--cheio", `${(paraFracao(p, v) * 100).toFixed(2)}%`);
    saida.textContent = formatar(p, v);
  };
  entrada.addEventListener("input", () => {
    const v = deFracao(p, entrada.value / PASSOS);
    pintar(v);
    aoMudar(v);
  });
  no.definir = (v) => { entrada.value = Math.round(paraFracao(p, v) * PASSOS); pintar(v); };
  no.definir(valor);
  return no;
}
