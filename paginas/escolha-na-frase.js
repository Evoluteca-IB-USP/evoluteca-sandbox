/* Um menu no meio da frase: a opção que vale, sublinhada e com uma setinha;
   o clique abre a lista das opções logo abaixo, e escolher uma fecha a lista.
   É o que a placa de colônias (seção 02) usa para mudar a regra.

   API: criarEscolha(opcoes, atual, aoEscolher)
        opcoes: [[valor, texto], …] · atual: o valor que vale · aoEscolher(valor) */

import { criar, icone } from "escrever-html";

export function criarEscolha(opcoes, atual, aoEscolher) {
  const rotulo = criar("span", {});
  const botao = criar("button", { type: "button", class: "escolha-botao", "aria-haspopup": "listbox" }, rotulo, icone("seta"));
  const itens = opcoes.map(([valor, texto]) => {
    const item = criar("button", { type: "button", class: "escolha-item", role: "option", texto });
    item.addEventListener("click", () => { fechar(); marcar(valor); aoEscolher(valor); botao.focus(); });
    return item;
  });
  const lista = criar("span", { class: "escolha-lista", role: "listbox", hidden: true }, ...itens);
  const escolha = criar("span", { class: "escolha" }, botao, lista);

  function marcar(valor) {
    opcoes.forEach(([v, texto], k) => {
      itens[k].setAttribute("aria-selected", String(v === valor));
      if (v === valor) rotulo.textContent = texto;
    });
  }
  function fechar() { lista.hidden = true; botao.setAttribute("aria-expanded", "false"); }

  marcar(atual);
  fechar();
  botao.addEventListener("click", () => {
    lista.hidden = !lista.hidden;
    botao.setAttribute("aria-expanded", String(!lista.hidden));
  });
  escolha.addEventListener("keydown", (e) => { if (e.key === "Escape") { fechar(); botao.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (!escolha.contains(e.target)) fechar(); });
  return escolha;
}
