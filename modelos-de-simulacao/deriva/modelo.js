import { rbinom, seq } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Deriva genética",
  descricao:
    "O acaso muda a frequência de um alelo, geração após geração. Veja populações pequenas fixarem ou perderem alelos sem nenhuma seleção.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  parametros: [
    { nome: "N",        rotulo: "Tamanho da população", valor: 100 },
    { nome: "p0",       rotulo: "Frequência inicial",   valor: 0.5 },
    { nome: "replicas", rotulo: "Réplicas",             valor: 20 },
    { nome: "geracoes", rotulo: "Gerações",             valor: 200, avancado: true },
  ],
  saida: { tipo: "linhas", y: "frequência do alelo A" },
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
