import { NAVY, TEAL, AMARELO } from "../../../desenho-em-canvas/__pacote__.js";
import { PONTOS, ajustar } from "./ajustar-nuvem.js";

/** genótipos (saida.tipo = "barras") — cada ponto é um indivíduo da amostra */
export function poeiraDeBarras(saida, m, rng) {
  const obs = saida.grupos[1].valores, esp = saida.grupos[0].valores;
  const cores = [NAVY, TEAL, AMARELO];
  const larguraCol = (m.d - m.e) / 3, larguraBarra = larguraCol * 0.56;
  /* a célula sai do total de pontos e da altura máxima: como o nº de pontos de
     cada coluna é proporcional à frequência, as três ficam com a mesma largura
     e a mesma densidade — o que muda é só a altura */
  const cel = Math.sqrt((larguraBarra * (m.b - m.t)) / PONTOS);
  const cols = Math.max(1, Math.round(larguraBarra / cel));
  const pts = [];
  obs.forEach((fr, k) => {
    const n = Math.round(fr * PONTOS);
    const x0 = m.e + k * larguraCol + (larguraCol - cols * cel) / 2;
    for (let j = 0; j < n; j++)
      pts.push([x0 + (j % cols) * cel + cel / 2, m.b - Math.floor(j / cols) * cel - cel / 2, cores[k]]);
  });
  return { pts: ajustar(pts, PONTOS, rng),
           eixos: { colunas: saida.rotulos.map((r, k) => ({ r, obs: obs[k], esp: esp[k] })),
                    y: "frequência do genótipo" } };
}
