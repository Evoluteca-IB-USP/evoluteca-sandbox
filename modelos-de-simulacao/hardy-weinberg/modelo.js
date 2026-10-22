import { seq } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Equilíbrio de Hardy–Weinberg",
  descricao:
    "Sorteie uma amostra real de genótipos e compare com as proporções p², 2pq e q². Quanto menor a amostra, maior o desvio.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "10 min",
  parametros: [
    { nome: "p", rotulo: "Frequência do alelo A", valor: 0.5 },
    { nome: "N", rotulo: "Tamanho da amostra",    valor: 100 },
  ],
  saida: { tipo: "barras", y: "frequência genotípica" },
};

export function simular({ p, N }, rng) {
  // cada indivíduo recebe dois alelos sorteados de forma independente
  const contagem = { AA: 0, Aa: 0, aa: 0 };
  const individuos = [];          // genótipo de cada indivíduo, na ordem do sorteio (índice em `rotulos`)
  for (const i of seq(1, N)) {
    const alelos = (rng() < p ? 1 : 0) + (rng() < p ? 1 : 0);
    if (alelos === 2) contagem.AA++;
    else if (alelos === 1) contagem.Aa++;
    else contagem.aa++;
    individuos.push(2 - alelos);  // 0 = AA, 1 = Aa, 2 = aa
  }
  const q = 1 - p;
  return {
    rotulos: ["AA", "Aa", "aa"],
    grupos: [
      { nome: "esperado (HW)", valores: [p * p, 2 * p * q, q * q] },
      { nome: `amostra (N = ${N})`, valores: [contagem.AA / N, contagem.Aa / N, contagem.aa / N] },
    ],
    individuos,
  };
}
