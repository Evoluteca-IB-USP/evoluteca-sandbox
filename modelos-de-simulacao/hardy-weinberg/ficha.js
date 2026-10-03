/* Ficha da página do simulador de Hardy–Weinberg
   (simulador.html?modelo=hardy-weinberg). Não anda no tempo: cada rodada é
   uma amostra de indivíduos, sorteada pelo `simular` de modelo.js. */

import { simular } from "./modelo.js";

const fmt = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const amostra = (r) => r.grupos[1].valores;

export default {
  titulo: "Equilíbrio de Hardy–Weinberg",
  arquivo: "hardy-weinberg",
  parametros: [
    { nome: "p", rotulo: "Frequência do alelo A", simbolo: "p", min: 0.02, max: 0.98, passo: 0.01, valor: 0.5, casas: 2 },
    { nome: "N", rotulo: "Tamanho da amostra", simbolo: "N", min: 10, max: 5000, valor: 100, escala: "log" },
  ],

  simular,

  graficos: [
    {
      id: "genotipos", tipo: "barras", titulo: "frequência dos genótipos", ylim: [0, 1],
      categorias: ["AA", "Aa", "aa"],
      valores: (r) => ({ esperado: r.grupos[0].valores, medido: amostra(r) }),
    },
  ],

  derivados: {
    fAA: { simbolo: "f_(AA)", calcular: (par, t, r) => amostra(r)[0], casas: 2 },
    fAa: { simbolo: "f_(Aa)", calcular: (par, t, r) => amostra(r)[1], casas: 2 },
  },

  derivacoes: [
    {
      titulo: "De onde vêm p², 2pq e q²",
      passos: [
        {
          texto: "Cada indivíduo recebe dois alelos, sorteados um independente do outro. A chance de os dois serem A é",
          formula: "f_(AA) = {p}^2", valor: ({ p }) => p * p,
        },
        {
          texto: "Um A e um a podem vir em duas ordens (A depois a, ou a depois A), por isso o 2:",
          formula: "f_(Aa) = 2{p}(1 − {p})", valor: ({ p }) => 2 * p * (1 - p),
        },
        {
          texto: "E os dois serem a:",
          formula: "f_(aa) = (1 − {p})^2", valor: ({ p }) => (1 - p) ** 2,
        },
        {
          texto: "As três somam 1, qualquer que seja p — é só o quadrado de p + q:",
          formula: "({p} + (1 − {p}))^2 = {p}^2 + 2{p}(1 − {p}) + (1 − {p})^2", valor: () => 1, casas: 0,
        },
      ],
    },
    {
      titulo: "Voltando da amostra para p",
      passos: [
        {
          texto: "Na amostra, cada AA carrega dois A e cada Aa carrega um. A frequência de A estimada a partir dela é",
          formula: "p_(amostra) = {fAA} + [{fAa}|2]", valor: (par, t, r) => amostra(r)[0] + amostra(r)[1] / 2,
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro da amostra",
    legenda: ({ N }) => `Os ${N.toLocaleString("pt-BR")} indivíduos sorteados, por genótipo.`,
    contar: (r) => ["AA", "Aa", "aa"].map((rotulo, i) => ({
      rotulo, n: r.individuos.filter((g) => g === i).length, cor: ["navy", "teal", "amarelo"][i],
    })),
  },

  resumo: [
    { rotulo: "AA na amostra", valor: (r) => fmt(amostra(r)[0]) },
    { rotulo: "Aa na amostra", valor: (r) => fmt(amostra(r)[1]) },
    { rotulo: "aa na amostra", valor: (r) => fmt(amostra(r)[2]) },
    { rotulo: "p estimado", valor: (r) => fmt(amostra(r)[0] + amostra(r)[1] / 2) },
  ],
};
