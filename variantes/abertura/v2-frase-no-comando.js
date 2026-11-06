/* v2 · a frase no comando: o título tem um menu no meio, e o fundo obedece.
   O gráfico ocupa a metade de baixo: todas as populações saem de metade e
   abrem em leque até a borda direita;
   trocar o tamanho da população recomeça o leque com o número novo. */

import { criarEscolha } from "../../paginas/__pacote__.js";
import { animarFundo } from "./comum/fundo-de-deriva.js";
import { montarPagina } from "./comum/montar-pagina.js";

const TAMANHOS = [[10, "10"], [50, "50"], [150, "150"], [1000, "1.000"], [10000, "10.000"]];

const fundo = animarFundo(document.getElementById("fundo"), {
  modo: "leque",
  N: 50,
  populacoes: 24,
  janela: 160,
  velocidade: 14,
  destaque: false,
  margemTopo: 0.56,
  rotulos: { 1: "todos têm a variante", 0.5: "metade", 0: "ninguém tem" },
});
document.getElementById("escolha-n").append(criarEscolha(TAMANHOS, 50, (n) => fundo.definirN(n)));
montarPagina();
