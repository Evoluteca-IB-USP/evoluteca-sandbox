/* Ferramenta "No mundo real": casos estudados de verdade, cada um com a fonte
   e uma rodada parecida para carregar no painel. */

import { criar } from "escrever-html";
import { linkDeTeste } from "./testar-no-painel.js";

export function montarCasosReais(painel, no) {
  no.append(
    criar("p", { class: "abas-nota", texto: "O simulador simplifica, mas a mesma coisa acontece com populações de verdade." }),
    criar("div", { class: "casos" }, ...painel.ficha.casos.map((caso) => criar("article", { class: "caso" },
      criar("p", { class: "caso-lugar", texto: caso.lugar }),
      criar("h3", { class: "caso-titulo", texto: caso.titulo }),
      criar("p", { class: "caso-texto", texto: caso.texto }),
      caso.valores ? linkDeTeste(painel, "carregar algo parecido", caso) : null,
      criar("p", { class: "caso-fonte", texto: caso.fonte })))));
  return { atualizar() {} };
}
