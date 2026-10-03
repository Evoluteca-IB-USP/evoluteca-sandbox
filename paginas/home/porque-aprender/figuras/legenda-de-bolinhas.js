import { criar, criarTexto as T } from "escrever-html";

/* a legenda de bolinhas coloridas, no pé de uma figura; [cor, texto, "aro"] desenha só o contorno */
export function legenda(itens) {
  return criar("div", { class: "jogo-legenda" }, ...itens.map(([cor, texto, aro]) =>
    criar("span", { class: "legenda-item" }, criar("i", { style: aro ? `border:1.5px solid ${cor}` : `background:${cor}` }), T(texto))));
}
