/* A aposta das elefantas: dez sobreviventes para pintar. Cada clique troca
   uma de "com presa" (navy) para "sem presa" (âmbar), nas cores da figura.
   Começa com duas pintadas, a proporção de antes da guerra. */

import { criar } from "escrever-html";
import { numero } from "portugues";
import { partesDaAposta } from "./partes-da-aposta.js";

const fileira = (n, pintadas, rotulo, clicar) => criar("div", { class: "elefantas" },
  criar("span", { class: "elefantas-rotulo", texto: rotulo }),
  ...Array.from({ length: n }, (_, i) => {
    const b = criar(clicar ? "button" : "span", { class: "elefanta", "data-sem": String(pintadas[i]), ...(clicar ? { type: "button", "aria-label": `elefanta ${i + 1}` } : {}) });
    if (clicar) b.addEventListener("click", () => clicar(i, b));
    return b;
  }));

/** aoApostar(k), k = quantas das n não têm presa */
export function elefantasParaPintar({ n = 10, inicio = 2, aoApostar }) {
  const sem = Array.from({ length: n }, (_, i) => i < inicio);
  const conta = () => sem.filter(Boolean).length;
  const texto = (k) => `${k} de ${n} sem presa`;
  const p = partesDaAposta(() => aoApostar(conta()));
  let travada = false;
  const sua = fileira(n, sem, "sua aposta", (i, b) => {
    if (travada) return;
    sem[i] = !sem[i]; b.dataset.sem = String(sem[i]); p.ler(texto(conta()));
  });
  const doModelo = criar("div", { hidden: true });
  p.ler(texto(conta()));
  return {
    no: criar("div", { class: "aposta" },
      criar("p", { class: "aposta-instrucao", html: `Pense em ${n} das que sobraram e <em>clique nas que não têm presa</em>. Antes da guerra, seriam ${inicio}.` }),
      sua, doModelo, p.lido, p.botao),
    valor: conta,
    travar() { travada = true; sua.querySelectorAll("button").forEach((b) => { b.disabled = true; }); p.travar(); },
    revelar(pct, perto) {
      const k = Math.round(pct * n / 100);
      doModelo.replaceChildren(fileira(n, Array.from({ length: n }, (_, i) => i < k), "o modelo"));
      doModelo.hidden = false;
      p.revelar(texto(conta()), `${numero(pct)}% sem presa`, perto);
    },
  };
}
