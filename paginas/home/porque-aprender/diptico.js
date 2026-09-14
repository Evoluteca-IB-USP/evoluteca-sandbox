/* O "Por que aprender evolução?" em díptico: a cabeça e a trilha do índice
   entram na coluna do texto, ao lado do palco, que fica fixo. */
export function diptico(secao) {
  secao.querySelector(".perguntas-coluna").prepend(
    secao.querySelector(".perguntas-cabeca"),
    secao.querySelector(".perguntas-trilha"));
}
