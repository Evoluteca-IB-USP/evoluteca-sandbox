import { seq } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Seleção em um locus",
  descricao:
    "Um alelo vantajoso invadindo a população: a curva em S clássica, e como ela muda com a intensidade da seleção e a dominância.",
  nivel: ["medio", "graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  miniatura: "curva",
  parametros: [
    { nome: "p0",       rotulo: "Frequência inicial",         valor: 0.02 },
    { nome: "s",        rotulo: "Coeficiente de seleção (s)", valor: 0.1 },
    { nome: "geracoes", rotulo: "Gerações",                   valor: 150 },
    { nome: "h",        rotulo: "Dominância (h)",             valor: 0.5, avancado: true },
  ],
  saida: { tipo: "linhas", y: "frequência do alelo A" },
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
