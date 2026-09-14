/* Lista dos modelos publicados, na ordem em que aparecem no catálogo.
   Hospedagem estática não permite "varrer" a pasta pelo navegador,
   então este arquivo de uma linha é o único índice do projeto:
   criou a pasta do modelo, adicione o slug aqui. */

export const lista = ["deriva", "hardy-weinberg", "selecao-1-locus"];

/* Os simuladores que a home mostra por extenso, na ordem do percurso.
   O catálogo mostra o acervo inteiro; a home mostra só estes — assim a
   rolagem da home continua do mesmo tamanho com 3 ou com 30 simuladores.
   Nada roda em servidor, então não dá para saber quais são os mais usados:
   a escolha é editorial. Troque os slugs aqui (ou apague a linha: sem ela,
   a home pega os primeiros da `lista`). */
export const destaques = ["deriva", "hardy-weinberg", "selecao-1-locus"];

export { NIVEIS, TEMAS } from "./niveis-e-temas.js";
export { previstos } from "./previstos.js";
