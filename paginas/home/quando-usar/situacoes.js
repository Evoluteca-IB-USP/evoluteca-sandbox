/* O roteiro da seção: três situações em que o simulador ajuda, uma em que
   ele não alcança (o que de fato aconteceu) e o convite para o acervo. Cada
   situação é um painel da figura e um trecho da legenda, na ordem do array.

   `slug` é o modelo que empresta o `simular()`; `ajuste` muda os valores
   padrão; `rodadas` roda o mesmo modelo várias vezes; `limite: true` desenha
   onde cada uma de quinhentas histórias possíveis terminou, em cinza.
   `curto` abre o trecho da legenda, `letra` marca o painel, `nota` é a
   anotação da figura. */

export const SITUACOES = [
  {
    slug: "hardy-weinberg",
    curto: "o acaso pesa",
    letra: "A",
    pergunta: "Quanto uma amostra se afasta do previsto?",
    ajuste: { p: 0.6, N: 120 },
    semente: 23,
    explica: "A conta dá o esperado, o tracejado. Uma amostra depende do sorteio: " +
             "estes são 120 indivíduos sorteados agora.",
    nota: "o previsto",
  },
  {
    slug: "deriva",
    curto: "uma rodada não basta",
    letra: "B",
    pergunta: "Um alelo pode sumir sem que nada o desfavoreça?",
    semente: 97,
    explica: "Com o acaso no meio, cada população segue um caminho, e a resposta está " +
             "no conjunto: populações iguais, que saem do mesmo ponto e terminam longe umas das outras.",
    nota: "esta perdeu o alelo",
  },
  {
    slug: "selecao-1-locus",
    curto: "e se…?",
    letra: "C",
    pergunta: "E se a vantagem do alelo fosse menor?",
    ajuste: { geracoes: 300 },
    rodadas: [{ s: 0.3 }, { s: 0.1 }, { s: 0.05 }, { s: 0.02 }],
    semente: 11,
    explica: "Muda-se uma coisa só e compara-se: o experimento que a natureza não deixa " +
             "repetir. A mesma população, com vantagem de 30% a 2%.",
    nota: "vantagem de 2%",
  },
  {
    slug: "deriva",
    limite: true,
    curto: "o que aconteceu",
    letra: "D",
    pergunta: "O que aconteceu, de fato, com uma população real?",
    ajuste: { N: 60, replicas: 500, geracoes: 25 },
    semente: 41,
    explica: "Isso o simulador não diz. Ele mostra quinhentas histórias possíveis; qual " +
             "delas foi a real, só os dados dizem: DNA, fósseis, campo.",
    nota: "a real é uma destas. Qual?",
  },
];

export const CONVITE = {
  convite: true,
  curto: "a sua pergunta",
  letra: "E",
  pergunta: "Qual é a sua pergunta?",
  explica: "Cada simulador do acervo nasceu de uma pergunta assim.",
};

/** as situações cujo modelo está no acervo, com o módulo junto, e o convite no fim */
export function passosDaSecao(entradas) {
  const modulo = (slug) => entradas.find((e) => e.slug === slug)?.modulo;
  return [...SITUACOES.map((s) => ({ ...s, modulo: modulo(s.slug) })).filter((s) => s.modulo), CONVITE];
}
