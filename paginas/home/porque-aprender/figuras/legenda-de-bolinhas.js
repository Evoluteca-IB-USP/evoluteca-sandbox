import { criar, criarTexto as T } from "escrever-html";

/* a legenda de bolinhas coloridas, no pé de uma figura */
export function legenda(itens) {
  return criar("div", { class: "jogo-legenda" }, ...itens.map(([cor, texto]) =>
    criar("span", { class: "legenda-item" }, criar("i", { style: `background:${cor}` }), T(texto))));
}
