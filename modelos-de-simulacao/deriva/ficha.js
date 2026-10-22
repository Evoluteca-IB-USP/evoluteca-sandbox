/* Ficha da página do simulador de deriva (simulador.html?modelo=deriva).
   O modelo em si é o `simular` de modelo.js, o mesmo que a home usa; a
   ficha diz o que a página mostra: as réguas, o gráfico, a derivação das
   fórmulas, o que se vê por dentro e o que o caderno anota. */

import { mean } from "r";
import { simular } from "./modelo.js";

const perda = (N) => 1 - 1 / (2 * N);
const H = ({ N, p0 }, t) => 2 * p0 * (1 - p0) * perda(N) ** t;
const porGeracao = (series, f) => series[0].map((_, t) => f(series.map((s) => s[t])));
const variancia = (v) => { const m = mean(v); return mean(v.map((x) => (x - m) ** 2)); };
const comUmAlelo = (r, t) => r.series.filter((s) => s[t] === 0 || s[t] === 1).length;
const soComA = (r, t) => r.series.filter((s) => s[t] === 1).length;

export default {
  titulo: "Deriva genética",
  arquivo: "deriva-genetica",
  parametros: [
    { nome: "N", rotulo: "Tamanho da população", simbolo: "N", min: 10, max: 5000, valor: 100, escala: "log" },
    { nome: "p0", rotulo: "Frequência inicial", simbolo: "p_0", min: 0.02, max: 0.98, passo: 0.01, valor: 0.5, casas: 2 },
    { nome: "replicas", rotulo: "Réplicas", min: 1, max: 100, valor: 20 },
    { nome: "geracoes", rotulo: "Gerações", min: 10, max: 1000, passo: 10, valor: 200, tempo: true },
  ],

  simular(par, rng) {
    const series = simular(par, rng);
    return {
      series,
      h: porGeracao(series, (v) => mean(v.map((p) => 2 * p * (1 - p)))),
      v: porGeracao(series, variancia),
    };
  },

  graficos: [
    {
      id: "freq", tipo: "replicas", titulo: "frequência do alelo A", ylim: [0, 1],
      series: (r) => r.series,
      referencia: ({ p0 }) => ({ y: p0, rotulo: "p₀" }),
      /* a faixa p₀ ± 2σ prevista pela fórmula da variância */
      faixa: ({ N, p0, geracoes }) => {
        const dp = Array.from({ length: geracoes + 1 }, (_, t) => 2 * Math.sqrt(p0 * (1 - p0) * (1 - perda(N) ** t)));
        return { inf: dp.map((d) => Math.max(0, p0 - d)), sup: dp.map((d) => Math.min(1, p0 + d)) };
      },
      distribuicao: true,
    },
    { id: "heterozigosidade", tipo: "curva", titulo: "heterozigosidade média", ylim: [0, 0.5], serie: (r) => r.h },
  ],

  derivados: {
    H0: { simbolo: "H_0", calcular: ({ p0 }) => 2 * p0 * (1 - p0), casas: 3 },
    Ht: { simbolo: "H_t", calcular: (par, t) => H(par, t), casas: 3 },
  },

  derivacoes: [
    {
      titulo: "Por que a variação cai",
      passos: [
        {
          texto: "Sorteie dois alelos da geração seguinte. A chance de os dois serem cópias do mesmo alelo da geração anterior é",
          formula: "[1|2{N}]", valor: ({ N }) => 1 / (2 * N), casas: 4,
        },
        {
          texto: "Cópias do mesmo alelo são iguais; só os outros pares podem ser diferentes. De uma geração para a seguinte, então,",
          formula: "H_(t+1) = (1 − [1|2{N}]){Ht}", valor: (par, t) => H(par, t + 1),
        },
        {
          texto: "Repetindo a conta geração após geração, desde o começo:",
          formula: "H_t = {H0}(1 − [1|2{N}])^({t})", valor: (par, t) => H(par, t), medido: (r, t) => r.h[t],
        },
        {
          texto: "Metade da variação se perde quando esse fator chega a 1/2, o que acontece em",
          formula: "t_(1/2) = [ln 2|−ln(1 − [1|2{N}])] ≈ 2{N} ln 2", valor: ({ N }) => Math.log(2) / -Math.log(perda(N)), casas: 0,
        },
      ],
    },
    {
      titulo: "Por que as populações se afastam",
      passos: [
        {
          texto: "A variação que cada população perde por dentro reaparece como diferença entre as populações. A variância entre elas é o que falta:",
          formula: "σ^2_t = {p0}(1 − {p0}) − [{Ht}|2]", valor: (par, t) => par.p0 * (1 - par.p0) - H(par, t) / 2, medido: (r, t) => r.v[t],
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro de uma população",
    legenda: ({ N }, t) => `Os ${(2 * N).toLocaleString("pt-BR")} alelos da população da linha azul-marinho, na geração ${t}.`,
    contar: (r, { N }, t) => {
      const nA = Math.round(r.series[0][t] * 2 * N);
      return [{ rotulo: "alelos A", n: nA, cor: "navy" }, { rotulo: "alelos a", n: 2 * N - nA, cor: "amarelo" }];
    },
  },

  resumo: [
    { rotulo: "só com A", valor: (r, par) => `${soComA(r, par.geracoes)} de ${par.replicas}` },
    { rotulo: "só com a", valor: (r, par) => `${comUmAlelo(r, par.geracoes) - soComA(r, par.geracoes)} de ${par.replicas}` },
    { rotulo: "variação que resta", valor: (r, par) => `${Math.round((r.h[par.geracoes] / r.h[0]) * 100)}%` },
  ],
};
