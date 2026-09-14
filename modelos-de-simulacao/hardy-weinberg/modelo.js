import { seq } from "r";

export const meta = {
  titulo: "Equilíbrio de Hardy–Weinberg",
  descricao:
    "Sorteie uma amostra real de genótipos e compare com as proporções p², 2pq e q². Quanto menor a amostra, maior o desvio.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "10 min",
  parametros: [
    { nome: "p", rotulo: "Frequência do alelo A", min: 0.02, max: 0.98, valor: 0.5, passo: 0.01 },
    { nome: "N", rotulo: "Tamanho da amostra",    min: 10,   max: 5000, valor: 100, escala: "log" },
  ],
  cenarios: [
    { rotulo: "Amostra pequena", valores: { N: 20 },
      dica: "Vinte indivíduos: as barras da amostra fogem bastante do esperado — sem nenhuma evolução acontecendo." },
    { rotulo: "Amostra grande", valores: { N: 5000 },
      dica: "Com milhares de indivíduos, amostra e esperado quase coincidem: é a lei dos grandes números." },
    { rotulo: "Alelo raro", valores: { p: 0.9, N: 1000 },
      dica: "q = 0,1: só 1% dos indivíduos é aa, mas 18% são portadores Aa. Alelo raro vive em heterozigoto." },
  ],
  saida: {
    tipo: "barras", y: "frequência genotípica", ylim: [0, 1],
    alelos: ["A", "a"],          // liga a lupa da amostra (bolinhas = indivíduos, coloridos por genótipo)
  },
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

export function resumo(resultado, { p, N }) {
  const [fAA, fAa] = resultado.grupos[1].valores;
  const pObs = fAA + fAa / 2;
  const fmt = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return `p esperado = ${fmt(p)} · p̂ estimado na amostra = ${fmt(pObs)} · desvio = ${fmt(Math.abs(pObs - p))}`;
}
