/* Ficha da página do simulador do coalescente
   (simulador.html?modelo=coalescente). O modelo é o `simular` de modelo.js:
   Wright–Fisher seguido de trás para frente, a partir de uma amostra de hoje.
   O tempo da página anda para o passado: a geração t é t gerações atrás. */

import { simular } from "./modelo.js";

const esperado = ({ N, n }) => 4 * N * (1 - 1 / n);
const kEm = (r, t) => r.k[Math.min(t, r.k.length - 1)];
const chegou = (r, t) => r.tmrca !== null && t >= r.tmrca;

/* quanto durou, nesta genealogia, o trecho com k linhagens que passa pela geração t */
function espera(r, t) {
  const k = kEm(r, t);
  if (k === 1) return "não há mais encontros";
  let de = t, ate = t;
  while (de > 0 && r.k[de - 1] === k) de--;
  while (ate < r.k.length && r.k[ate] === k) ate++;
  return ate < r.k.length ? `${ate - de} gerações` : "ainda não acabou";
}

/* o comprimento da genealogia (a soma dos ramos, em gerações) e as mutações que caíram nela */
const harmonica = (n) => Array.from({ length: n - 1 }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0);
const comprimento = (r) => r.k.slice(0, r.tmrca).reduce((a, b) => a + b, 0);
const naGenealogia = (r) => r.mutacoes.filter((m) => m.t < r.tmrca && r.linhagens[m.t].includes(m.copia)).length;
const naAmostra = (r) => r.amostra.filter((c) => r.alelos[0][c] === 1).length;

/* a fração do tempo até o ancestral comum passada com duas linhagens */
const comDuas = (r) => r.k.slice(0, r.tmrca).filter((k) => k === 2).length / r.tmrca;

export default {
  titulo: "Coalescente",
  arquivo: "coalescente",
  /* gerações por segundo: devagar enquanto há muitas linhagens e os encontros
     se sucedem, mais depressa na longa espera das duas últimas */
  velocidade: (t, r) => {
    const k = r ? kEm(r, Math.floor(t) + 1) : 3;
    return k >= 3 ? 2.5 : k === 2 ? 7 : 12;
  },
  parametros: [
    { nome: "n", rotulo: "Tamanho da amostra", simbolo: "n", min: 2, max: 8, valor: 4 },
    { nome: "N", rotulo: "Tamanho da população", simbolo: "N", min: 4, max: 30, valor: 5 },
    { nome: "mu", rotulo: "Taxa de mutação", simbolo: "μ", min: 0, max: 0.1, passo: 0.005, valor: 0.02, casas: 3 },
    { nome: "geracoes", rotulo: "Gerações para trás", min: 10, max: 300, passo: 5, valor: 30, tempo: true },
  ],

  simular,

  graficos: [
    {
      id: "genealogia", tipo: "genealogia", titulo: "gerações atrás",
      genealogia: (r) => r,
      referencia: (par) => ({ y: esperado(par), rotulo: "esperado" }),
    },
    { id: "linhagens", tipo: "curva", titulo: "linhagens da amostra", ylim: [0, 8], serie: (r) => r.k },
  ],

  derivados: {
    k: { simbolo: "k", calcular: (par, t, r) => kEm(r, t), casas: 0 },
  },

  derivacoes: [
    {
      titulo: "Quando duas linhagens se encontram",
      passos: [
        {
          texto: "Volte uma geração. Duas cópias da amostra sorteiam, cada uma, a sua mãe entre as 2N cópias de antes. A chance de sortearem a mesma — de as duas linhagens se encontrarem — é",
          formula: "[1|2{N}]", valor: ({ N }) => 1 / (2 * N), casas: 4,
        },
        {
          texto: "Se não se encontraram, o sorteio recomeça uma geração mais para trás. A espera é geométrica, e a média é o inverso da chance:",
          formula: "E(T_2) = 2{N}", valor: ({ N }) => 2 * N, casas: 0,
        },
      ],
    },
    {
      titulo: "Com mais linhagens, encontros mais rápidos",
      passos: [
        {
          texto: "Com k linhagens há k(k − 1)/2 pares, e qualquer um deles pode se encontrar. Enquanto k é bem menor que 2N, a chance de algum encontro numa geração é quase",
          formula: "P_k ≈ [{k}({k} − 1)|4{N}]", valor: ({ N }, t, r) => (kEm(r, t) * (kEm(r, t) - 1)) / (4 * N), casas: 3,
        },
        {
          texto: "e a espera média até o próximo encontro é o inverso:",
          formula: "E(T_k) = [4{N}|{k}({k} − 1)]", valor: ({ N }, t, r) => (4 * N) / (kEm(r, t) * (kEm(r, t) - 1)), casas: 1,
          medido: (r, t) => espera(r, t), rotuloMedido: "nesta genealogia, essa espera durou",
        },
      ],
    },
    {
      titulo: "O ancestral comum de toda a amostra",
      passos: [
        {
          texto: "Somando as esperas de n linhagens até sobrar uma, os termos se cancelam aos pares, porque 4N/(k(k − 1)) = 4N(1/(k − 1) − 1/k):",
          formula: "E(T_(ACMR)) = 4{N}(1 − [1|{n}])", valor: esperado, casas: 1,
          medido: (r, t) => (chegou(r, t) ? r.tmrca : "ainda não chegou"), rotuloMedido: "nesta genealogia,",
        },
        {
          texto: "Por maior que seja a amostra, a espera não passa de 4N gerações. E metade dela, ou mais, é a das duas últimas linhagens:",
          formula: "[E(T_2)|E(T_(ACMR))] = [{n}|2({n} − 1)]", valor: ({ n }) => n / (2 * (n - 1)), casas: 2,
          medido: (r, t) => (chegou(r, t) ? comDuas(r) : "ainda não chegou"), rotuloMedido: "nesta genealogia,",
        },
      ],
    },
    {
      titulo: "As mutações que a amostra carrega",
      passos: [
        {
          texto: "Some os ramos da genealogia: enquanto há k linhagens, cada uma anda E(T_k) gerações, e k · 4N/(k(k − 1)) = 4N/(k − 1). O comprimento total é",
          formula: "E(L) = 4{N}(1 + [1|2] + … + [1|{n} − 1])", valor: ({ N, n }) => 4 * N * harmonica(n), casas: 1,
          medido: (r, t) => (chegou(r, t) ? `${comprimento(r)} gerações` : "ainda não chegou"), rotuloMedido: "nesta genealogia,",
        },
        {
          texto: "Em cada geração de cada ramo, a cópia pode mudar de alelo, com chance μ. As mutações que separam as cópias da amostra são as que caíram nos ramos:",
          formula: "E(M) = 4{N}{mu}(1 + [1|2] + … + [1|{n} − 1])", valor: ({ N, n, mu }) => 4 * N * mu * harmonica(n), casas: 2,
          medido: (r, t) => (chegou(r, t) ? naGenealogia(r) : "ainda não chegou"), rotuloMedido: "nesta genealogia,",
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro de uma geração",
    legenda: ({ N }, t) => `As ${2 * N} cópias do gene ${t ? `de ${t} ${t === 1 ? "geração" : "gerações"} atrás` : "de hoje"}, por alelo.`,
    contar: (r, { N }, t) => {
      const nA = r.alelos[Math.min(t, r.k.length - 1)].filter((a) => a === 1).length;
      return [{ rotulo: "alelos A", n: nA, cor: "navy" }, { rotulo: "alelos a", n: 2 * N - nA, cor: "amarelo" }];
    },
  },

  resumo: [
    { rotulo: "ancestral comum", valor: (r, par) => (r.tmrca !== null ? `geração ${r.tmrca}` : `além da ${par.geracoes}`) },
    { rotulo: "esperado", valor: (r, par) => `geração ${Math.round(esperado(par))}` },
    { rotulo: "com só duas linhagens", valor: (r) => (r.tmrca !== null ? `${Math.round(comDuas(r) * 100)}% do tempo` : "—") },
    { rotulo: "alelos na amostra", valor: (r) => `${naAmostra(r)} A · ${r.amostra.length - naAmostra(r)} a` },
    { rotulo: "mutações na genealogia", valor: (r) => (r.tmrca !== null ? String(naGenealogia(r)) : "—") },
  ],
};
