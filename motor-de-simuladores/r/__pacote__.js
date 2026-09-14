/* O vocabulário do R em JavaScript — funções pensadas para quem escreve
   modelos e pensa em R. Só entra aqui função que existe no R, com o nome
   do R; a única exceção é `criarRng`, que é o `set.seed` do pacote.
   Todas as funções aleatórias recebem `rng` como último argumento. */

export { criarRng } from "./gerador-de-numeros-aleatorios.js";
export { rnorm, rbinom, rpois } from "./distribuicoes-de-probabilidade/__pacote__.js";
export { seq, rep, sample, tabulate } from "./vetores/__pacote__.js";
export { sum, mean, sd } from "./estatisticas/__pacote__.js";
