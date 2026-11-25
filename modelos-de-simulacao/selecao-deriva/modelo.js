import { rbinom, seq } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Seleção e deriva",
  descricao:
    "Um alelo vantajoso pode se perder por acaso — e um deletério pode se fixar. Veja quando a seleção vence a deriva e quando o acaso domina.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  parametros: [
    { nome: "N",        rotulo: "Tamanho da população", valor: 100 },
    { nome: "s",        rotulo: "Coeficiente de seleção (s)", valor: 0.02 },
    { nome: "p0",       rotulo: "Frequência inicial",   valor: 0.2 },
    { nome: "replicas", rotulo: "Réplicas",             valor: 20 },
    { nome: "geracoes", rotulo: "Gerações",             valor: 250, avancado: true },
  ],
  saida: { tipo: "linhas", y: "frequência do alelo A" },
};

/* Aptidões aditivas (h = 0,5): w_AA = 1 + s · w_Aa = 1 + s/2 · w_aa = 1.
   Com s > 0, A é vantajoso; com s = 0, deriva pura; com s < 0, A é deletério. */
export function passoSelecao(p, s) {
  const q = 1 - p;
  const wAA = 1 + s;
  const wAa = 1 + 0.5 * s;
  const waa = 1;
  const wBar = p * p * wAA + 2 * p * q * wAa + q * q * waa;
  return (p * p * wAA + p * q * wAa) / wBar;
}

export function trajetoriaDeterministica({ p0, s, geracoes }) {
  const p = [p0];
  for (const g of seq(1, geracoes)) {
    p[g] = passoSelecao(p[g - 1], s);
  }
  return p;
}

export function probabilidadeFixacao({ N, s, p0 }) {
  const x = 2 * N * s;
  if (Math.abs(x) < 1e-9) return p0;
  return (1 - Math.exp(-x * p0)) / (1 - Math.exp(-x));
}

export function simular({ N, s, p0, geracoes, replicas }, rng) {
  const M = 2 * N;
  const series = [];
  for (const r of seq(1, replicas)) {
    const p = [p0];
    for (const g of seq(1, geracoes)) {
      const pSel = passoSelecao(p[g - 1], s);
      p[g] = rbinom(M, pSel, rng) / M;
    }
    series.push(p);
  }
  return series;
}
