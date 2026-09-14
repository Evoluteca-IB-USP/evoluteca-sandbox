/* "O que é um simulador": a placa de colônias como fundo da seção inteira,
   de borda a borda, com a escada de quatro degraus por cima. Veio da rodada
   de variantes de 2026-09.

   A placa continua sendo a figura; o que muda é o que o texto faz com ela.
   Em vez de descrever o fenômeno, o texto sobe uma escada — e as frases dos
   degraus são os controles da placa. */

import { criar } from "escrever-html";
import { criarPlacaDeColonias } from "./placa-de-colonias.js";
import { criarDegraus } from "./degraus.js";

export function montar(secao, opcoes = {}) {
  const linkCatalogo = opcoes.linkCatalogo || "catalogo.html";
  secao.className = "secao";

  /* a placa é o fundo; o texto, por cima */
  const tela = criar("canvas", { class: "fundo-tela", "aria-hidden": true });
  const estado = criar("p", { class: "vivo-nota explica-estado" });
  const placa = criarPlacaDeColonias(secao, tela);

  function elo(texto, acao) {
    const b = criar("button", { type: "button", class: "vivo-elo", texto });
    b.addEventListener("click", acao);
    return b;
  }
  const eloRecomecar = elo("recomece do zero", () => placa.recomecarNovo());
  const eloDeNovo = elo("rode de novo", () => placa.recomecarMesmo());
  const eloSelecao = elo("ligue a seleção", () => {
    placa.regra.selecao = !placa.regra.selecao; atualizar(); placa.recomecarMesmo();
  });
  const eloMutacao = elo("ligue a mutação", () => {
    placa.regra.mutacao = !placa.regra.mutacao; atualizar(); placa.recomecarMesmo();
  });

  const container = criar("div", { class: "container" },
    criar("h2", { class: "titulo-secao", texto: "O que é um simulador" }),
    criar("div", { class: "frente-cabeca" },
      criar("p", { class: "vivo-frase", html: "Uma regra só, <b>aplicada milhares de vezes</b>." }),
      criar("p", { class: "vivo-texto", html:
        "Cada célula copia a cor da mãe. É toda a regra deste modelo — e é o bastante para a " +
        "colônia se dividir em setores que ninguém desenhou. <em>Clique em qualquer lugar do " +
        "fundo</em> para semear outra colônia; onde duas se encontram, as duas param." })),
    criar("div", { class: "fundo-espaco", "aria-hidden": true }),
    estado,
    criarDegraus({ recomecar: eloRecomecar, deNovo: eloDeNovo, selecao: eloSelecao, mutacao: eloMutacao }, linkCatalogo));

  secao.replaceChildren(tela, container);

  function atualizar() {
    const { selecao, mutacao } = placa.regra;
    eloSelecao.textContent = selecao ? "desligue a seleção" : "ligue a seleção";
    eloMutacao.textContent = mutacao ? "desligue a mutação" : "ligue a mutação";
    eloSelecao.setAttribute("aria-pressed", String(selecao));
    eloMutacao.setAttribute("aria-pressed", String(mutacao));
    const partes = ["cada célula copia a cor da mãe"];
    if (selecao) partes.push("a cor escura divide 30% mais rápido");
    if (mutacao) partes.push("uma em 300 nasce de outra cor");
    estado.innerHTML = `<b>Regra em vigor:</b> ${partes.join(" · ")}.`;
  }

  atualizar();
  placa.comecar();
}
