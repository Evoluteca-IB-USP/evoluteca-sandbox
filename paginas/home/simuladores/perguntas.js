/* A pergunta de cada simulador e o que a figura mostra. O resto — título,
   parâmetros, tipo de saída — vem do bloco `meta` do próprio modelo.
   `ajuste` muda os valores padrão; `rodadas` roda o mesmo modelo várias
   vezes, para a figura ser uma comparação.

   Para um simulador entrar na seção, escreva a pergunta dele aqui: a ordem
   das chaves é a ordem da seção. Sem pergunta, o simulador fica só no
   catálogo — o que entra na home é escolha editorial, como os `destaques`
   de modelos-de-simulacao/__pacote__.js. */

import { PONTOS } from "./poeira/__pacote__.js";

export const PERGUNTAS = {
  "hardy-weinberg": {
    pergunta: "Quanto uma amostra de verdade se afasta do previsto?",
    ajuste: { p: 0.6, N: PONTOS },
    mostra: "Uma amostra de quatro mil indivíduos, sorteados um a um: cada ponto é um deles, e o tracejado é o esperado.",
  },
  deriva: {
    pergunta: "Um alelo pode desaparecer sem que nada o desfavoreça?",
    mostra: "Uma rodada com vinte populações ao mesmo tempo, todas partindo da mesma frequência.",
  },
  "selecao-1-locus": {
    pergunta: "Quanto tempo um alelo vantajoso leva para tomar conta?",
    ajuste: { geracoes: 300 },
    rodadas: [{ s: 0.3 }, { s: 0.1 }, { s: 0.05 }, { s: 0.02 }],
    mostra: "Quatro rodadas guardadas lado a lado, mudando só a força da seleção — de 30% a 2%.",
  },
};

export const FECHO = {
  texto: "Perguntas diferentes, o mesmo instrumento.",
  ficha: "Todos funcionam do mesmo jeito: você mexe nos números e a simulação corre geração a geração. Junto " +
         "vêm a derivação das fórmulas com os números da rodada, um caderno para comparar as rodadas e os dados " +
         "para levar ao R.",
};
