import { seq } from "r";

export const meta = {
  titulo: "Seleção em um locus",
  descricao:
    "Um alelo vantajoso invadindo a população: a curva em S clássica, e como ela muda com a intensidade da seleção e a dominância.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  miniatura: "curva",
  parametros: [
    { nome: "p0",       rotulo: "Frequência inicial",        min: 0.005, max: 0.95, valor: 0.02, passo: 0.005, simbolo: "p₀" },
    { nome: "s",        rotulo: "Coeficiente de seleção (s)", min: 0,     max: 0.5,  valor: 0.1,  passo: 0.005 },
    { nome: "geracoes", rotulo: "Gerações",                  min: 20,    max: 1000, valor: 150 },
    { nome: "h",        rotulo: "Dominância (h)",            min: 0,     max: 1,    valor: 0.5,  passo: 0.05, avancado: true },
  ],
  cenarios: [
    { rotulo: "Seleção fraca", valores: { s: 0.01, geracoes: 1000 },
      dica: "s = 0,01 parece nada, mas em mil gerações o alelo invade. Seleção fraca também transforma — dado tempo." },
    { rotulo: "Seleção forte", valores: { s: 0.3, geracoes: 100 },
      dica: "Com s = 0,3 a invasão leva poucas dezenas de gerações. A forma em S é a mesma; muda a escala de tempo." },
    { rotulo: "Já frequente", valores: { p0: 0.5 },
      dica: "Começando de 0,5 sobra só a metade de cima do S: a fase lenta é a do alelo raro." },
    { rotulo: "A dominante", valores: { h: 0, geracoes: 300 }, avancado: true,
      dica: "Com A dominante (h = 0) a subida começa rápido, mas a fixação se arrasta: os últimos a se escondem em heterozigotos." },
    { rotulo: "A recessivo", valores: { h: 1, geracoes: 1000 }, avancado: true,
      dica: "Com A recessivo (h = 1) a seleção quase não enxerga A enquanto ele é raro: a subida demora a começar." },
  ],
  saida: {
    tipo: "linhas", x: "geração", y: "frequência do alelo A", ylim: [0, 1],
    alelos: ["A", "a"],          // lupa: genótipos p², 2pq, q² (população infinita, sem N)
    referencias: [{ valor: 0.5, rotulo: "0,5" }],
  },
};

/* Modelo determinístico clássico de seleção viabilidade num locus:
   aptidões  w_AA = 1 · w_Aa = 1 − h·s · w_aa = 1 − s  (A é o alelo favorecido) */
export function aptidoes({ s, h }) {
  return { AA: 1, Aa: 1 - h * s, aa: 1 - s };
}

export function simular({ p0, s, h, geracoes }, rng) {
  const { AA: wAA, Aa: wAa, aa: waa } = aptidoes({ s, h });
  const p = [p0];
  for (const g of seq(1, geracoes)) {
    const pa = p[g - 1], qa = 1 - pa;
    const wBar = pa * pa * wAA + 2 * pa * qa * wAa + qa * qa * waa;
    p[g] = (pa * pa * wAA + pa * qa * wAa) / wBar;
  }
  return [p];
}

export function resumo(series, { p0, geracoes }) {
  const p = series[0];
  const final = p[p.length - 1];
  const meiaVida = p.findIndex((v) => v >= 0.5);
  const fmt = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return (
    `p passou de ${fmt(p0)} para ${fmt(final)} em ${geracoes} gerações` +
    (meiaVida > 0 ? ` · cruzou 0,5 na geração ${meiaVida}` : " · não chegou a 0,5")
  );
}
