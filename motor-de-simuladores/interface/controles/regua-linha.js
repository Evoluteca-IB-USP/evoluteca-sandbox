/* Controle A — a régua-linha. O trilho é a linha de deriva do catálogo:
   contínua até a cabecinha âmbar, pontilhada depois dela. O número no alto
   se digita (qualquer valor entre os limites, fora dos degraus da régua), e
   as marcas embaixo, se a ficha der `marcas`, levam direto a um valor. */

import { criar } from "escrever-html";
import { paraFracao, deFracao, formatar } from "../escala.js";

const PASSOS = 1000;

/* "1.000" → 1000, "0,35" → 0.35 */
const lerNumero = (txt) => Number(txt.trim().replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));

function ajustar(p, v) {
  v = Math.max(p.min, Math.min(p.max, v));
  const passo = p.escala === "log" ? 1 : p.passo ?? 1;
  return +(Math.round(v / passo) * passo).toFixed(6);
}

export function reguaLinha(p, valor, aoMudar, { travada = false } = {}) {
  const entrada = criar("input", { type: "range", class: "rl-entrada", min: 0, max: PASSOS, step: 1, "aria-label": p.rotulo });
  const saida = criar("input", { type: "text", class: "rl-valor", inputmode: "decimal", "aria-label": `${p.rotulo}, valor digitado`, size: 5 });
  const marcas = p.marcas
    ? criar("span", { class: "rl-marcas" }, ...p.marcas.map((m) => {
      const b = criar("button", { type: "button", class: "rl-marca", texto: formatar(p, m), style: `left: ${(paraFracao(p, m) * 100).toFixed(2)}%` });
      b.addEventListener("click", (e) => { e.preventDefault(); mudar(m); });
      return b;
    }))
    : criar("span", { class: "rl-limites" }, criar("span", { texto: formatar(p, p.min) }), criar("span", { texto: formatar(p, p.max) }));
  const no = criar("div", { class: "rl", "data-nome": p.nome },
    criar("span", { class: "rl-topo" }, criar("span", { class: "rl-rotulo", texto: p.rotulo }), saida),
    entrada, marcas);

  let atual = valor;
  const pintar = (v) => {
    atual = v;
    entrada.style.setProperty("--cheio", `${(paraFracao(p, v) * 100).toFixed(2)}%`);
    if (document.activeElement !== saida) saida.value = formatar(p, v);
  };
  const mudar = (v) => { if (entrada.disabled) return; entrada.value = Math.round(paraFracao(p, v) * PASSOS); pintar(v); aoMudar(v); };
  entrada.addEventListener("input", () => {
    const v = deFracao(p, entrada.value / PASSOS);
    pintar(v);
    aoMudar(v);
  });
  saida.addEventListener("change", () => {
    const lido = lerNumero(saida.value);
    if (Number.isFinite(lido)) mudar(ajustar(p, lido));
    saida.value = formatar(p, atual);
  });
  saida.addEventListener("keydown", (e) => { if (e.key === "Enter") saida.blur(); });
  saida.addEventListener("blur", () => { saida.value = formatar(p, atual); });

  no.definir = (v) => { entrada.value = Math.round(paraFracao(p, v) * PASSOS); pintar(v); };
  /* régua travada: o aluno vê o valor, mas não mexe (os valores vêm da URL ou da sala) */
  no.travar = (sim = true) => {
    entrada.disabled = sim;
    saida.disabled = sim;
    no.classList.toggle("travada", sim);
    no.title = sim ? "Esta régua foi travada" : "";
  };
  no.definir(valor);
  no.travar(travada);
  return no;
}
