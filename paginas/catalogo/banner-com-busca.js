/* O banner: o título em varredura, a busca escrita como frase ("Procuro um simulador
   sobre ___"), a urna de sorteio ao lado e a linha de fecho embaixo.
   `aoBuscar(texto)` filtra a estante e devolve quantos cartões ficaram. */

import { criar } from "escrever-html";
import { criarUrna } from "./urna-de-sorteio.js";
import { linhaDeFecho } from "./linha-de-fecho.js";
import { tituloEmVarredura } from "./titulo-em-varredura.js";

export function criarBanner({ entradas }, aoBuscar) {
  const total = entradas.length;
  const campo = criar("input", { type: "search", class: "busca-campo", placeholder: "deriva, seleção, epidemia…", "aria-label": "Buscar simulador", autocomplete: "off" });
  const conta = criar("p", { class: "busca-conta", "aria-live": "polite", texto: `${total} simuladores no acervo` });

  campo.addEventListener("input", () => {
    const texto = campo.value.trim();
    const n = aoBuscar(texto);
    conta.textContent = !texto ? `${total} simuladores no acervo` : n === 0 ? "Nenhum simulador encontrado" : `${n} de ${total} simuladores`;
    conta.classList.toggle("busca-conta-filtrando", !!texto);
  });

  return criar("section", { class: "banner-catalogo" },
    criar("div", { class: "container banner-grade" },
      criar("div", {},
        tituloEmVarredura(),
        criar("label", { class: "busca" },
          criar("span", { class: "busca-frase", texto: "Procuro um simulador sobre" }),
          criar("span", { class: "busca-caixa" }, campo, criar("span", { class: "busca-lupa", "aria-hidden": "true" }))),
        conta),
      criarUrna(entradas)),
    linhaDeFecho(17));
}
