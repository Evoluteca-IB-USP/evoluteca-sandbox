import { rbinom, seq } from "r";

export const meta = {
  titulo: "Deriva genética",
  descricao:
    "O acaso muda a frequência de um alelo, geração após geração. Veja populações pequenas fixarem ou perderem alelos sem nenhuma seleção.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  parametros: [
    { nome: "N",        rotulo: "Tamanho da população", min: 10, max: 5000, valor: 100, escala: "log" },
    { nome: "p0",       rotulo: "Frequência inicial",   min: 0.02, max: 0.98, valor: 0.5, passo: 0.01, simbolo: "p₀" },
    { nome: "replicas", rotulo: "Réplicas",             min: 1,  max: 100,  valor: 20, simbolo: "réplicas" },
    { nome: "geracoes", rotulo: "Gerações",             min: 10, max: 1000, valor: 200, avancado: true },
  ],
  /* cenários de um clique: partem dos valores padrão e mudam só o que está em `valores` */
  cenarios: [
    { rotulo: "Ponto de partida", valores: {},
      dica: "Vinte populações que começam iguais. O feixe se abre só pelo acaso — nenhuma seleção aqui." },
    { rotulo: "População pequena", valores: { N: 10 },
      dica: "Com N = 10, em poucas gerações quase todas as populações já fixaram ou perderam A." },
    { rotulo: "População grande", valores: { N: 2000 },
      dica: "A deriva não some com N grande — só fica lenta. Repare no tamanho das oscilações." },
    { rotulo: "Alelo raro", valores: { N: 50, p0: 0.1 },
      dica: "Probabilidade de fixação = frequência inicial: espere A fixar em cerca de 1 a cada 10 populações." },
  ],
  saida: {
    tipo: "linhas", x: "geração", y: "frequência do alelo A", ylim: [0, 1],
    alelos: ["A", "a"],          // liga a lupa da população (bolinhas = alelos)
    N: "N",                      // parâmetro com o tamanho da população (2N alelos na lupa)
    referencias: [{ parametro: "p0", rotulo: "p₀ (média esperada)" }],
  },
};

export function simular({ N, p0, geracoes, replicas }, rng) {
  const series = [];
  for (const r of seq(1, replicas)) {
    const p = [p0];
    for (const g of seq(1, geracoes)) {
      p[g] = rbinom(2 * N, p[g - 1], rng) / (2 * N);
    }
    series.push(p);
  }
  return series;
}

export function resumo(series, { p0 }) {
  const fixou = series.filter((s) => s[s.length - 1] >= 1).length;
  const perdeu = series.filter((s) => s[s.length - 1] <= 0).length;
  return (
    `A fixou em ${fixou} de ${series.length} populações · perdeu-se em ${perdeu} · ` +
    `esperado a longo prazo: fixação em ~${Math.round(p0 * 100)}%`
  );
}
