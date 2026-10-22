/* A aposta que se faz em cima da figura (o alfinete da
   paisagem). Aqui ficam só a instrução, a leitura e o botão; quem desenha
   e recebe o gesto é a figura, que avisa por `mudou(v)`. */

import { criar } from "escrever-html";
import { partesDaAposta } from "./partes-da-aposta.js";

/** formatar(v) → texto; aoApostar(v) */
export function apostaNaFigura({ instrucao, formatar, aoApostar }) {
  let valor = null;
  const p = partesDaAposta(() => { if (valor !== null) aoApostar(valor); });
  p.botao.disabled = true;
  p.lido.innerHTML = "sua aposta: <b>—</b>";
  return {
    no: criar("div", { class: "aposta" }, criar("p", { class: "aposta-instrucao", html: instrucao }), p.lido, p.botao),
    valor: () => valor,
    mudou(v) { valor = v; p.botao.disabled = false; p.ler(formatar(v)); },
    travar() { p.travar(); },
    revelar(v, perto) { p.revelar(formatar(valor), formatar(v), perto); },
  };
}
