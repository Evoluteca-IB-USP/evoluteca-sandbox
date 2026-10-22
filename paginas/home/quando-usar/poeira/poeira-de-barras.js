import { NAVY, TEAL, AMARELO } from "../../../desenho-em-canvas/__pacote__.js";
import { PONTOS, ajustar } from "./ajustar-nuvem.js";

/** genótipos (saida.tipo = "barras"): a amostra em barras de pontos e o esperado de cada uma */
export function poeiraDeBarras(saida, m, rng) {
  const esp = saida.grupos[0].valores, obs = saida.grupos[1].valores;
  const cores = [NAVY, TEAL, AMARELO];
  const larguraCol = (m.d - m.e) / 3, larguraBarra = larguraCol * 0.56;
  /* a célula sai do total de pontos e da altura máxima: as três barras ficam
     com a mesma largura e a mesma densidade, e só a altura muda */
  const cel = Math.sqrt((larguraBarra * (m.b - m.t)) / PONTOS);
  const cols = Math.max(1, Math.round(larguraBarra / cel));
  const pts = [];
  obs.forEach((fr, k) => {
    const q = Math.round(fr * PONTOS);
    const x0 = m.e + k * larguraCol + (larguraCol - cols * cel) / 2;
    for (let j = 0; j < q; j++)
      pts.push([x0 + (j % cols) * cel + cel / 2, m.b - Math.floor(j / cols) * cel - cel / 2, cores[k]]);
  });
  const xc = m.e + 1.5 * larguraCol;
  return { pts: ajustar(pts, PONTOS, rng),
           eixos: { colunas: saida.rotulos.map((r, k) => ({ r, obs: obs[k], esp: esp[k] })),
                    y: "frequência do genótipo",
                    alvo: [xc + larguraCol * 0.2, m.b - esp[1] * (m.b - m.t)] } };
}
