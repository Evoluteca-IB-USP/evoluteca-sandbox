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

/* A distribuição exata do número de cópias de A, sem sorteio: a chance de a
   população ter 0, 1, …, 2N cópias em cada geração, de 0 até `geracoes`.
   É a cadeia de Wright–Fisher: de i cópias, a geração seguinte tem j com
   probabilidade dbinom(j, 2N, i/2N). Custa (2N+1)² contas por geração. */
export function distribuicaoExata({ N, p0, geracoes }) {
  const n = 2 * N;
  const logFat = [0];
  for (let k = 1; k <= n; k++) logFat[k] = logFat[k - 1] + Math.log(k);
  const passo = Array.from({ length: n + 1 }, (_, i) => {
    const p = i / n, linha = new Array(n + 1).fill(0);
    if (p === 0) linha[0] = 1;
    else if (p === 1) linha[n] = 1;
    else for (let j = 0; j <= n; j++) linha[j] = Math.exp(logFat[n] - logFat[j] - logFat[n - j] + j * Math.log(p) + (n - j) * Math.log(1 - p));
    return linha;
  });
  let x = new Array(n + 1).fill(0);
  x[Math.round(p0 * n)] = 1;
  const todas = [x];
  for (let g = 1; g <= geracoes; g++) {
    const y = new Array(n + 1).fill(0);
    for (let i = 0; i <= n; i++) {
      if (x[i] < 1e-15) continue;
      const linha = passo[i];
      for (let j = 0; j <= n; j++) y[j] += x[i] * linha[j];
    }
    todas.push((x = y));
  }
  return todas;
}
