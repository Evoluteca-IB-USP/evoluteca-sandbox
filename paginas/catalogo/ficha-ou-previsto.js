import { criar } from "escrever-html";

/* Uma ficha PREVISTA (modelos-de-simulacao/previstos.js) aparece como as
   outras, mas não abre: vira um <span> no lugar do <a>. Quando o simulador
   existir, a ficha some de previstos.js e ela volta a ser um link como
   qualquer outro. */
export function elo(classe, e, href, ...filhos) {
  return e.meta.previsto
    ? criar("span", { class: classe, "data-previsto": "" }, ...filhos)
    : criar("a", { class: classe, href }, ...filhos);
}

/* hover curto não rouba o palco por engano; o teclado troca na hora */
const ATRASO_HOVER = 110;           // ms parado sobre uma linha antes de trocar o palco

export function aoPousar(no, fn) {
  let espera = null;
  no.addEventListener("mouseenter", () => { espera = setTimeout(fn, ATRASO_HOVER); });
  no.addEventListener("mouseleave", () => clearTimeout(espera));
  no.addEventListener("focus", fn, true);
}
