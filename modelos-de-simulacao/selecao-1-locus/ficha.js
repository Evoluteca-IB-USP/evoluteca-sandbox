/* Ficha da página do simulador de seleção em um locus
   (simulador.html?modelo=selecao-1-locus). O modelo é o de modelo.js:
   determinístico, aptidões AA = 1, Aa = 1 − hs, aa = 1 − s. */

import { simular, aptidoes } from "./modelo.js";

/* a trajetória sem acaso, guardada para os valores do momento */
let guardada = { chave: "", p: [] };
function trajetoria(par) {
  const chave = `${par.p0}|${par.s}|${par.h}|${par.geracoes}`;
  if (guardada.chave !== chave) guardada = { chave, p: simular(par)[0] };
  return guardada.p;
}
const pEm = (par, t) => trajetoria(par)[Math.min(t, par.geracoes)];
const aptidaoMedia = (par, p) => {
  const w = aptidoes(par), q = 1 - p;
  return p * p * w.AA + 2 * p * q * w.Aa + q * q * w.aa;
};
const fmt = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default {
  titulo: "Seleção em um locus",
  arquivo: "selecao-em-um-locus",
  deterministico: true,
  parametros: [
    { nome: "p0", rotulo: "Frequência inicial", simbolo: "p_0", min: 0.005, max: 0.95, passo: 0.005, valor: 0.02, casas: 3 },
    { nome: "s", rotulo: "Coeficiente de seleção", simbolo: "s", min: 0, max: 0.5, passo: 0.005, valor: 0.1, casas: 3 },
    { nome: "h", rotulo: "Dominância", simbolo: "h", min: 0, max: 1, passo: 0.05, valor: 0.5, casas: 2 },
    { nome: "geracoes", rotulo: "Gerações", min: 20, max: 1000, passo: 10, valor: 150, tempo: true },
  ],

  simular(par) {
    const p = simular(par)[0];
    return { p, aptidao: p.map((x) => aptidaoMedia(par, x)) };
  },

  graficos: [
    {
      id: "freq", tipo: "curva", titulo: "frequência do alelo A", ylim: [0, 1],
      serie: (r) => r.p,
      referencia: () => ({ y: 0.5, rotulo: "0,5" }),
    },
    { id: "aptidao_media", tipo: "curva", titulo: "aptidão média", ylim: [0, 1], serie: (r) => r.aptidao },
  ],

  derivados: {
    pt: { simbolo: "p_t", calcular: (par, t) => pEm(par, t), casas: 3 },
    qt: { simbolo: "q_t", calcular: (par, t) => 1 - pEm(par, t), casas: 3 },
    wt: { simbolo: "w̄_t", calcular: (par, t) => aptidaoMedia(par, pEm(par, t)), casas: 3 },
  },

  derivacoes: [
    {
      titulo: "Como a frequência muda numa geração",
      passos: [
        {
          texto: "As aptidões dos genótipos: AA vale 1, Aa vale 1 − hs e aa vale 1 − s. Com as proporções de Hardy–Weinberg, a aptidão média da população é",
          formula: "w̄_t = {pt}^2 + 2{pt}{qt}(1 − {h}{s}) + {qt}^2(1 − {s})", valor: (par, t) => aptidaoMedia(par, pEm(par, t)),
        },
        {
          texto: "Cada genótipo contribui para a geração seguinte em proporção à sua aptidão. A fração de A depois da seleção é",
          formula: "p_(t+1) = [{pt}^2 + {pt}{qt}(1 − {h}{s})|{wt}]", valor: (par, t) => pEm(par, t + 1),
        },
        {
          texto: "Enquanto A é raro, quase toda cópia de A está num heterozigoto, e o aumento por geração fica perto de",
          formula: "Δp ≈ {pt}·{s}(1 − {h})", valor: (par, t) => pEm(par, t) * par.s * (1 - par.h), casas: 4,
        },
      ],
    },
  ],

  lupa: {
    aba: "Por dentro da população",
    legenda: (par, t) => `Cem indivíduos nas proporções de Hardy–Weinberg, na geração ${t}.`,
    contar: (r, par, t) => {
      const p = r.p[t], AA = Math.round(100 * p * p), aa = Math.round(100 * (1 - p) ** 2);
      return [
        { rotulo: "AA", n: AA, cor: "navy" },
        { rotulo: "Aa", n: 100 - AA - aa, cor: "teal" },
        { rotulo: "aa", n: aa, cor: "amarelo" },
      ];
    },
  },

  resumo: [
    { rotulo: "frequência final de A", valor: (r) => fmt(r.p.at(-1)) },
    { rotulo: "passou de 0,5 na geração", valor: (r) => { const g = r.p.findIndex((v) => v >= 0.5); return g >= 0 ? String(g) : "não passou"; } },
  ],
};
