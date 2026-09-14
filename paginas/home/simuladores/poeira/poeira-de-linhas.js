import { TEAL, TEAL_CLARO, AMARELO } from "../../../desenho-em-canvas/__pacote__.js";
import { PONTOS, ajustar } from "./ajustar-nuvem.js";

/** n pontos igualmente espaçados AO LONGO da curva (e não no eixo x): sem isso
    a poeira rareia exatamente onde a trajetória sobe ou desce depressa */
function porComprimento(xy, n) {
  const acc = [0];
  for (let i = 1; i < xy.length; i++)
    acc.push(acc[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  const total = acc[acc.length - 1];
  const saida = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const alvo = (k / (n - 1)) * total;
    while (j < acc.length - 1 && acc[j] < alvo) j++;
    const t = acc[j] === acc[j - 1] ? 0 : (alvo - acc[j - 1]) / (acc[j] - acc[j - 1]);
    saida.push([xy[j - 1][0] + (xy[j][0] - xy[j - 1][0]) * t,
                xy[j - 1][1] + (xy[j][1] - xy[j - 1][1]) * t]);
  }
  return saida;
}

/** séries (saida.tipo = "linhas") — o feixe do simulador */
export function poeiraDeLinhas(series, m, rng, destaque) {
  const px = (f) => m.e + f * (m.d - m.e);
  const py = (v) => m.b - v * (m.b - m.t);
  const porTrilha = Math.floor(PONTOS / series.length);
  const pts = [];
  series.forEach((p, k) => {
    const G = p.length - 1;
    const cor = destaque === k ? AMARELO : k % 3 === 2 ? TEAL : TEAL_CLARO;
    const xy = p.map((v, g) => [px(g / G), py(v)]);
    for (const [x, y] of porComprimento(xy, porTrilha)) pts.push([x, y, cor]);
  });
  return ajustar(pts, PONTOS, rng);
}
