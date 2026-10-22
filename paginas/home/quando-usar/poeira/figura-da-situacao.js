import { criarRng } from "r";
import { poeiraDeLinhas } from "./poeira-de-linhas.js";
import { poeiraDeBarras } from "./poeira-de-barras.js";
import { poeiraDeHistorias } from "./poeira-de-historias.js";

/** a figura que responde a situação, rodando o `simular()` do modelo dela: os pontos e o que
    a moldura precisa saber (`eixos`: títulos, notas e o `alvo` da anotação) */
export function figuraDaSituacao(situacao, modulo, m) {
  const { meta, simular } = modulo;
  const rng = criarRng(500 + situacao.semente);
  const valores = { ...Object.fromEntries(meta.parametros.map((p) => [p.nome, p.valor])), ...situacao.ajuste };
  const px = (f) => m.e + f * (m.d - m.e), py = (v) => m.b - v * (m.b - m.t);

  if (meta.saida.tipo === "barras") return poeiraDeBarras(simular(valores, criarRng(situacao.semente)), m, rng);

  if (situacao.rodadas) {
    const series = situacao.rodadas.map((r) => simular({ ...valores, ...r }, criarRng(situacao.semente))[0]);
    const notas = series.map((serie, j) => {
      const G = serie.length - 1, meio = serie.findIndex((v) => v >= 0.5);
      const g = meio >= 0 ? meio : Math.round(G * 0.92);
      return { x: px(g / G) + (meio >= 0 ? 8 : 0), y: py(serie[g]) + (meio >= 0 ? 2 : -14),
               alinhar: meio >= 0 ? "left" : "right", rotulo: `${Math.round(situacao.rodadas[j].s * 100)}%` };
    });
    const ultima = series[series.length - 1], G = ultima.length - 1, gAlvo = Math.round(G * 0.8);
    return { pts: poeiraDeLinhas(series, m, rng, series.length - 1),
             eixos: { x: "gerações", y: meta.saida.y, notas, alvo: [px(gAlvo / G), py(ultima[gAlvo])] } };
  }

  const series = simular(valores, criarRng(situacao.semente));
  if (situacao.limite) return poeiraDeHistorias(series, m, rng);
  const destaque = Math.max(0, series.findIndex((s) => s.includes(0)));   // a que perdeu o alelo
  const serie = series[destaque], G = serie.length - 1, g = serie.indexOf(0) >= 0 ? serie.indexOf(0) : G;
  return { pts: poeiraDeLinhas(series, m, rng, destaque),
           eixos: { x: "gerações", y: meta.saida.y, alvo: [px(g / G), py(serie[g])] } };
}
