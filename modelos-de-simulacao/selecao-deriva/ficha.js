/* Ficha da página do simulador de seleção e deriva
   (simulador.html?modelo=selecao-deriva).
   A cada geração: seleção aditiva (w_AA = 1 + s, w_Aa = 1 + s/2, w_aa = 1)
   seguida de amostragem de Wright–Fisher de 2N cópias gênicas. */

import { mean } from "r";
import { simular, trajetoriaDeterministica, probabilidadeFixacao } from "./modelo.js";

const porGeracao = (series, f) => series[0].map((_, t) => f(series.map((s) => s[t])));
const fixadasA = (r, t) => r.series.filter((s) => s[t] >= 1).length;
const perdidasA = (r, t) => r.series.filter((s) => s[t] <= 0).length;
const fmt = (x, casas = 2) => x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

let cacheDet = { chave: "", p: [] };
function pDet(par, t) {
  const chave = `${par.p0}|${par.s}|${par.geracoes}`;
  if (cacheDet.chave !== chave) cacheDet = { chave, p: trajetoriaDeterministica(par) };
  return cacheDet.p[Math.min(t, par.geracoes)];
}

export default {
  titulo: "Seleção e deriva",
  arquivo: "selecao-e-deriva",
  parametros: [
    { nome: "N", rotulo: "Tamanho da população", simbolo: "N", min: 10, max: 2000, valor: 100, escala: "log" },
    { nome: "s", rotulo: "Coeficiente de seleção", simbolo: "s", min: -0.1, max: 0.1, passo: 0.002, valor: 0.02, casas: 3 },
    { nome: "p0", rotulo: "Frequência inicial", simbolo: "p_0", min: 0.02, max: 0.98, passo: 0.02, valor: 0.2, casas: 2 },
    { nome: "replicas", rotulo: "Réplicas", min: 1, max: 100, valor: 20 },
    { nome: "geracoes", rotulo: "Gerações", min: 50, max: 1000, passo: 10, valor: 250, tempo: true },
  ],

  simular(par, rng) {
    const series = simular(par, rng);
    return {
      series,
      media: porGeracao(series, mean),
    };
  },

  graficos: [
    {
      id: "freq", tipo: "replicas", titulo: "frequência do alelo A", ylim: [0, 1],
      series: (r) => r.series,
      referencia: ({ p0 }) => ({ y: p0, rotulo: "p₀" }),
      previsao: (par) => trajetoriaDeterministica(par),
      distribuicao: true,
    },
    { id: "media", tipo: "curva", titulo: "frequência média de A", ylim: [0, 1], serie: (r) => r.media },
  ],

  derivados: {
    pt: { simbolo: "p_t", calcular: (par, t) => pDet(par, t), casas: 3 },
  },

  derivacoes: [
    {
      titulo: "Quem domina: seleção ou deriva",
      passos: [
        {
          texto: "A disputa entre seleção (força s) e deriva (força 1/2N) depende do produto adimensional 2Ns. Quando |2Ns| ≪ 1 o acaso manda; quando |2Ns| ≫ 1 a seleção prevalece:",
          formula: "2{N}{s}",
          valor: ({ N, s }) => 2 * N * s,
          casas: 2,
        },
        {
          texto: "Numa população infinita (a curva tracejada do gráfico), a mudança de frequência por geração com aptidões aditivas fica perto de:",
          formula: "Δp ≈ [{s}|2]{pt}(1 − {pt})",
          valor: (par, t) => { const p = pDet(par, t); return 0.5 * par.s * p * (1 - p); },
          casas: 4,
        },
      ],
    },
    {
      titulo: "Probabilidade de fixação (Kimura)",
      passos: [
        {
          texto: "Partindo de p₀, a chance de o alelo A vencer o acaso e chegar à fixação é dada pela fórmula de Kimura:",
          formula: "u(p_0) = [1 − e^(−2{N}{s}{p0})|1 − e^(−2{N}{s})]",
          valor: (par) => probabilidadeFixacao(par),
          medido: (r, t, par) => fixadasA(r, t) / par.replicas,
          casas: 3,
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro de uma população",
    legenda: ({ N }, t) => `Os ${(2 * N).toLocaleString("pt-BR")} alelos da população azul-marinho, na geração ${t}.`,
    contar: (r, { N }, t) => {
      const nA = Math.round(r.series[0][t] * 2 * N);
      return [
        { rotulo: "alelos A", n: nA, cor: "navy" },
        { rotulo: "alelos a", n: 2 * N - nA, cor: "amarelo" },
      ];
    },
  },

  resumo: [
    { rotulo: "2Ns", valor: (r, { N, s }) => fmt(2 * N * s, 2) },
    { rotulo: "u(p₀) previsto", valor: (r, par) => `${Math.round(probabilidadeFixacao(par) * 100)}%` },
    { rotulo: "fixaram A", valor: (r, par) => `${fixadasA(r, par.geracoes)} de ${par.replicas}` },
    { rotulo: "perderam A", valor: (r, par) => `${perdidasA(r, par.geracoes)} de ${par.replicas}` },
  ],
};
