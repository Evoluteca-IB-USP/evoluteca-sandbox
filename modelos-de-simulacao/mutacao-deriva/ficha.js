/* Ficha da página do simulador de mutação e deriva
   (simulador.html?modelo=mutacao-deriva).
   Modelo de alelos infinitos (Kimura–Crow): deriva remove variação a 1/(2N)
   por geração enquanto mutações a taxa μ criam alelos inéditos. */

import { simularDetalhado } from "./modelo.js";

const theta = ({ N, mu }) => 4 * N * mu;
const hEquilibrio = (par) => {
  const th = theta(par);
  return th / (1 + th);
};

/* recorrência exata para E[1 − Σ p_i²] com amostragem com reposição:
   F_(t+1) = 1/(2N) + (1 − 1/(2N))·(1 − μ)²·F_t, partindo de H_0 = 0 (F_0 = 1) */
function hEsperadoSerie({ N, mu, geracoes }) {
  const a = (1 - 1 / (2 * N)) * (1 - mu) ** 2;
  const b = 1 / (2 * N);
  const h = [0];
  let F = 1;
  for (let t = 1; t <= geracoes; t++) {
    F = b + a * F;
    h[t] = 1 - F;
  }
  return h;
}

const hEsperadoEm = (par, t) => hEsperadoSerie(par)[Math.min(t, par.geracoes)];
const fmt = (x, casas = 3) => x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default {
  titulo: "Mutação e deriva",
  arquivo: "mutacao-e-deriva",
  parametros: [
    { nome: "N", rotulo: "Tamanho da população", simbolo: "N", min: 10, max: 500, valor: 100, escala: "log" },
    { nome: "mu", rotulo: "Taxa de mutação", simbolo: "μ", min: 0, max: 0.01, passo: 0.0002, valor: 0.002, casas: 4 },
    { nome: "replicas", rotulo: "Réplicas", min: 1, max: 40, valor: 20 },
    { nome: "geracoes", rotulo: "Gerações", min: 50, max: 800, passo: 10, valor: 400, tempo: true },
  ],

  simular(par, rng) {
    return simularDetalhado(par, rng);
  },

  graficos: [
    {
      id: "heterozigosidade", tipo: "replicas", titulo: "heterozigosidade (H)", ylim: [0, 1],
      series: (r) => r.series,
      referencia: (par) => ({ y: hEquilibrio(par), rotulo: "Ĥ" }),
      previsao: (par) => hEsperadoSerie(par),
      distribuicao: true,
    },
    { id: "alelos_medios", tipo: "curva", titulo: "número médio de alelos", ylim: [0, 20], serie: (r) => r.alelos },
  ],

  derivados: {
    theta: { simbolo: "θ", calcular: (par) => theta(par), casas: 3 },
    Ht: { simbolo: "H_t", calcular: (par, t) => hEsperadoEm(par, t), casas: 3 },
  },

  derivacoes: [
    {
      titulo: "De onde vem o equilíbrio mutação–deriva",
      passos: [
        {
          texto: "A disputa entre deriva (força 1/2N) e mutação (força 2μ) se resume em um único parâmetro adimensional:",
          formula: "θ = 4{N}{mu}", valor: (par) => theta(par), casas: 3,
        },
        {
          texto: "A cada geração, dois alelos sorteados ao acaso só continuam diferentes se vierem de cópias distintas e (caso fossem iguais) ao menos um sofrer mutação:",
          formula: "H_(t+1) = (1 − [1|2{N}])(1 − (1 − {mu})^2(1 − {Ht}))",
          valor: (par, t) => hEsperadoEm(par, t + 1),
          medido: (r, t) => r.hMedio[Math.min(t + 1, r.hMedio.length - 1)],
        },
        {
          texto: "Quando a perda por deriva empata com a entrada de alelos novos, a heterozigosidade estabiliza em:",
          formula: "Ĥ ≈ [{theta}|1 + {theta}]",
          valor: (par) => hEquilibrio(par),
          medido: (r, t) => r.hMedio[t],
        },
      ],
    },
    {
      titulo: "Quantos alelos isso representa",
      passos: [
        {
          texto: "O número efetivo de alelos — quantos alelos igualmente frequentes dariam a mesma heterozigosidade 1/(1 − Ĥ) — cresce linearmente com θ:",
          formula: "n_e = 1 + {theta}",
          valor: (par) => 1 + theta(par),
          casas: 2,
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro de uma população",
    legenda: ({ N }, t) => `As ${(2 * N).toLocaleString("pt-BR")} cópias gênicas da população azul-marinho, na geração ${t}.`,
    contar: (r, par, t) => {
      const [n1, n2, resto] = r.topo[t];
      return [
        { rotulo: "alelo mais comum", n: n1, cor: "navy" },
        { rotulo: "2º alelo mais comum", n: n2, cor: "teal" },
        { rotulo: "demais alelos", n: resto, cor: "amarelo" },
      ];
    },
  },

  resumo: [
    { rotulo: "θ = 4Nμ", valor: (r, par) => fmt(theta(par), 2) },
    { rotulo: "Ĥ previsto", valor: (r, par) => fmt(hEquilibrio(par), 3) },
    { rotulo: "H médio final", valor: (r, par) => fmt(r.hMedio[par.geracoes], 3) },
    { rotulo: "alelos no fim (média)", valor: (r, par) => fmt(r.alelos[par.geracoes], 1) },
  ],
};
