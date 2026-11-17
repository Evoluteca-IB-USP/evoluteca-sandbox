/* Ficha da página do simulador de deriva (simulador.html?modelo=deriva).
   A rodada vem de forcas.js (o Wright–Fisher de modelo.js com as outras
   forças do modo avançado); a conta, de conta-da-deriva.js. A ficha diz o
   que a página mostra: as réguas, as abas do painel, as fórmulas coladas às
   linhas que elas desenham, os vidros e as ferramentas de baixo.
   Os alelos se chamam A₁ e A₂: "A" e "a" dão a ideia de dominância. */

import { mean } from "r";
import { simularComForcas, tamanhoNa, INICIO_DO_GARGALO } from "./forcas.js";
import * as conta from "./conta-da-deriva.js";
import { premissas } from "./ferramentas-de-ensino.js";

const porGeracao = (series, f) => series[0].map((_, t) => f(series.map((s) => s[t])));
const variancia = (v) => { const m = mean(v); return mean(v.map((x) => (x - m) ** 2)); };
const num = (x, casas = 2) => x.toLocaleString("pt-BR", { maximumFractionDigits: casas });
const AVISO = "a conta não inclui migração nem mutação";

const soCom = (r, t, alvo) => r.series.filter((s) => s[t] === alvo).length;

export default {
  titulo: "Deriva genética",
  arquivo: "deriva-genetica",
  parametros: [
    { nome: "N", rotulo: "Indivíduos por população", simbolo: "N", min: 10, max: 5000, valor: 100, escala: "log", marcas: [10, 30, 100, 1000, 5000] },
    { nome: "p0", rotulo: "Frequência inicial", simbolo: "p_0", min: 0.02, max: 0.98, passo: 0.01, valor: 0.5, casas: 2, marcas: [0.02, 0.25, 0.5, 0.75, 0.98] },
    { nome: "replicas", rotulo: "Populações", min: 1, max: 100, valor: 20, marcas: [1, 20, 50, 100] },
    { nome: "geracoes", rotulo: "Gerações", min: 10, max: 1000, passo: 10, valor: 200, tempo: true, marcas: [10, 200, 500, 1000] },
    { nome: "gargaloGeracoes", rotulo: "Gargalo (gerações)", min: 0, max: 50, valor: 0, avancado: true, marcas: [0, 10, 25, 50] },
    { nome: "gargaloN", rotulo: "Gargalo (indivíduos)", min: 2, max: 1000, valor: 10, escala: "log", avancado: true, marcas: [2, 10, 100, 1000] },
    { nome: "migracao", rotulo: "Migração entre populações", simbolo: "m", min: 0, max: 0.1, passo: 0.001, valor: 0, casas: 3, avancado: true, marcas: [0, 0.05, 0.1] },
    { nome: "mutacao", rotulo: "Mutação por cópia", simbolo: "μ", min: 0, max: 0.01, passo: 0.0001, valor: 0, casas: 4, avancado: true, marcas: [0, 0.005, 0.01] },
    { nome: "machos", rotulo: "Fração de machos", min: 0.05, max: 0.5, passo: 0.01, valor: 0.5, casas: 2, avancado: true, marcas: [0.05, 0.25, 0.5] },
  ],

  simular(par, rng) {
    const series = simularComForcas(par, rng);
    const media = porGeracao(series, mean), v = porGeracao(series, variancia);
    return {
      series,
      h: porGeracao(series, (x) => mean(x.map((p) => 2 * p * (1 - p)))),
      fst: v.map((vi, t) => (media[t] > 0 && media[t] < 1 ? vi / (media[t] * (1 - media[t])) : 1)),
      fixacao: series.map((s) => s.findIndex((p) => p === 0 || p === 1)),
    };
  },

  faixasDeTempo: (par) => (par.gargaloGeracoes > 0
    ? [{ de: INICIO_DO_GARGALO, ate: INICIO_DO_GARGALO + par.gargaloGeracoes, rotulo: `gargalo de ${num(Math.min(par.N, par.gargaloN))}` }]
    : []),
  marcos: conta.marcosDaDeriva,

  graficos: [
    {
      id: "freq", aba: "Trajetórias", tipo: "replicas", titulo: "frequência do alelo A₁", ylim: [0, 1],
      series: (r) => r.series,
      arrastar: "p0",
      referencia: ({ p0 }) => ({ y: p0, rotulo: "p₀" }),
      faixa: (par) => (conta.contaValida(par) ? conta.faixaPrevista(par) : null),
      fixacoes: (r) => r.fixacao.map((t, i) => (t > 0 ? { t, y: r.series[i][t] } : null)),
      formulas: (par, t, r) => {
        if (!conta.contaValida(par)) return [{ letras: AVISO, x: par.geracoes, y: 0.97, alinhar: "right" }];
        const fx = conta.faixaPrevista(par), x = Math.round(par.geracoes * 0.86), tt = Math.min(t, par.geracoes);
        const medido = r.fixacao.filter((g) => g > 0), media = medido.length ? Math.round(mean(medido)) : null;
        return [
          { letras: "p₀ ± 2σₜ", numeros: `${num(par.p0)} ± ${num(fx.dp[Math.floor(tt)])} na geração ${Math.floor(tt)}`, liga: ["p0", "N"], x, y: fx.sup[x], alinhar: "center", acima: true },
          { letras: "tempo até um só alelo ≈ −4N(p₀ ln p₀ + q₀ ln q₀)", numeros: `≈ ${num(conta.tempoAteFixar(par), 0)} gerações${media ? ` · nesta rodada, ${media}` : ""}`, liga: ["N", "p0"], x: par.geracoes, y: 0.035, alinhar: "right" },
        ];
      },
      legenda: [
        { desenho: "linha", texto: "cada linha é uma população" },
        { desenho: "ponto", texto: "onde ela está na geração mostrada" },
        { desenho: "tracejado", texto: "p₀, a frequência do começo (arraste o ponto do começo para mudar)" },
        { desenho: "faixa", texto: "onde a conta prevê 95% das populações", avancado: true },
        { desenho: "marca", texto: "onde cada uma ficou com um só alelo", avancado: true },
      ],
    },
    { id: "vidros", aba: "Populações", tipo: "vidros" },
    { id: "distribuicao", aba: "Distribuição", tipo: "relevo", lado: "corte" },
    {
      id: "variacao", aba: "Dentro × entre", tipo: "curva",
      curvas: [
        {
          id: "heterozigose", rotulo: "Dentro das populações", titulo: "variação dentro das populações (heterozigose média)", ylim: [0, 0.5], serie: (r) => r.h, relativa: true,
          nota: "Cada população perde variação por dentro.",
          previsao: (par) => (conta.contaValida(par) ? conta.heterozigosePrevista(par) : null),
          formulas: (par, t) => {
            if (!conta.contaValida(par)) return [{ letras: AVISO, x: par.geracoes, y: 0.48, alinhar: "right" }];
            const h = conta.heterozigosePrevista(par), x = par.geracoes, tt = Math.floor(Math.min(t, x));
            return [{ letras: "H₀ (1 − 1/2N)ᵗ", numeros: `${num(conta.H0(par), 3)} · (1 − 1/${num(2 * par.N)})^${tt} = ${num(h[tt], 3)}`, liga: ["N", "p0"], x, y: h[x], alinhar: "right", acima: true }];
          },
          legenda: [
            { desenho: "linha-escura", texto: "a média de 2pq nas populações desta rodada: a variação que ainda existe dentro de cada uma" },
            { desenho: "previsao", texto: "a conta", avancado: true },
          ],
        },
        {
          id: "F", rotulo: "Entre as populações (F)", titulo: "diferença entre as populações (F)", ylim: [0, 1], serie: (r) => r.fst,
          nota: "Enquanto isso, as populações se separam umas das outras.",
          previsao: (par) => (conta.contaValida(par) ? conta.diferencaPrevista(par) : null),
          formulas: (par, t) => {
            if (!conta.contaValida(par)) return [{ letras: AVISO, x: par.geracoes, y: 0.97, alinhar: "right" }];
            const f = conta.diferencaPrevista(par), x = par.geracoes, tt = Math.floor(Math.min(t, x));
            return [{ letras: "F = 1 − (1 − 1/2N)ᵗ", numeros: `1 − (1 − 1/${num(2 * par.N)})^${tt} = ${num(f[tt], 3)}`, liga: ["N"], x, y: f[x], alinhar: "right", acima: true }];
          },
          legenda: [
            { desenho: "linha", texto: "o quanto as populações já se separaram: 0 é todas iguais, 1 é cada uma com um só alelo" },
            { desenho: "previsao", texto: "a conta: o que cada população perde por dentro vira diferença entre elas", avancado: true },
          ],
        },
      ],
    },
  ],

  derivados: {
    H0: { simbolo: "H_0", calcular: conta.H0, casas: 3 },
  },

  relevo: {
    calcular: conta.relevoDaDeriva,
    corte: conta.corteNa,
    eixoX: "frequência do alelo A₁",
    eixoZ: "geração",
    paredes: { esquerda: "perdeu A₁", direita: "fixou A₁" },
    legenda: (par, t, r) =>
      `A conta, sem sorteio: a aba Populações mostra uma rodada sorteada; aqui está o que se espera de infinitas populações. ` +
      `Se muitas populações de ${par.N.toLocaleString("pt-BR")} indivíduos começassem com p₀ = ${num(par.p0)}, ` +
      `cada barra é a fração delas com aquela frequência na geração ${t}. As colunas das pontas acumulam as que perderam ou fixaram A₁.` +
      (conta.semOutrasForcas(par) ? "" : " A conta é a da deriva sozinha, sem as outras forças.") +
      (r.aproximado ? ` Com N acima de ${conta.N_DA_CONTA}, a conta usa uma população de ${conta.N_DA_CONTA} com o tempo reescalado.` : ""),
  },

  vidros: {
    acrescentar: "replicas",
    nomes: { cheio: "A₁", vazio: "A₂" },
    destinos: ["só com A₂", "com os dois", "só com A₁"],
    contar: (r, par, i, t) => { const dois = 2 * tamanhoNa(par, t); return { cheio: Math.round(r.series[i][t] * dois), total: dois }; },
    titulo: ({ replicas }, t) => `${replicas === 1 ? "a população" : `as ${replicas} populações`} na geração ${t}`,
    quem: (i, t) => `População ${i + 1}, geração ${t}`,
    dica: "Passe o mouse numa população para ver as cópias dela; clique para segui-la também nas Trajetórias.",
    nota: "A frequência conta cópias, não indivíduos: quem é A₁A₂ leva uma cópia de cada.",
    conta: (par, { cheio, total }, avancado) => {
      const p = cheio / total, n = (x) => x.toLocaleString("pt-BR");
      return `<p><b>${n(cheio)}</b> cópias de A₁</p><p><b>${n(total - cheio)}</b> cópias de A₂</p>` +
        `<p class="painel-vidros-miudo">${n(total)} cópias = ${n(total / 2)} indivíduos × 2</p>` +
        `<p>frequência de A₁ = ${n(cheio)} ÷ ${n(total)} = <b>${num(p)}</b></p>` +
        (avancado ? `<p class="painel-vidros-miudo"><i>2pq</i> = ${num(2 * p * (1 - p), 3)}, a variação dentro da população</p>` : "");
    },
    esperado: (par, t) => (conta.semOutrasForcas(par) ? conta.destinosPrevistos(par, t) : null),
  },

  resumo: [
    { rotulo: "só com A₁", valor: (r, par) => `${soCom(r, par.geracoes, 1)} de ${par.replicas}` },
    { rotulo: "só com A₂", valor: (r, par) => `${soCom(r, par.geracoes, 0)} de ${par.replicas}` },
    { rotulo: "variação que resta", valor: (r, par) => `${Math.round((r.h[par.geracoes] / r.h[0]) * 100)}%` },
  ],

  premissas,
};
