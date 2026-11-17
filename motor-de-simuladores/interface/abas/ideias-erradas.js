/* Ferramenta "Ideias erradas comuns": frases que muita gente pensa sobre o
   assunto. Cada uma abre o que a simulação mostra e leva o painel a uma
   rodada que serve de teste. Nenhuma depende da outra. */

import { criar } from "escrever-html";
import { linkDeTeste } from "./testar-no-painel.js";

function ideia(painel, item) {
  const resposta = criar("p", { class: "ideia-resposta", texto: item.resposta, hidden: true });
  const abrir = criar("button", { type: "button", class: "ensino-link", "aria-expanded": "false", texto: "o que a simulação mostra →" });
  abrir.addEventListener("click", () => {
    resposta.hidden = !resposta.hidden;
    abrir.setAttribute("aria-expanded", String(!resposta.hidden));
    abrir.textContent = resposta.hidden ? "o que a simulação mostra →" : "esconder";
  });
  return criar("li", { class: "ideia" },
    criar("p", { class: "ideia-frase" }, criar("span", { class: "ideia-quem", texto: "Muita gente pensa: " }), criar("q", { texto: item.frase })),
    resposta,
    criar("p", { class: "ideia-acoes" }, abrir, item.valores ? linkDeTeste(painel, "teste aqui", item) : null));
}

export function montarIdeiasErradas(painel, no) {
  no.append(
    criar("p", { class: "abas-nota", texto: "Pense na frase antes de abrir a resposta. Depois, teste no simulador." }),
    criar("ol", { class: "ideias" }, ...painel.ficha.ideiasErradas.map((item) => ideia(painel, item))));
  return { atualizar() {} };
}
