import { PONTOS, ajustar } from "./ajustar-nuvem.js";

/** onde cada história possível terminou: uma conta de oito pontos por história, em cinza,
    empilhadas por faixa de frequência final */
export function poeiraDeHistorias(series, m, rng) {
  const FAIXAS = 25, G = series[0].length - 1;
  const contagem = Array(FAIXAS).fill(0);
  const faixa = series.map((s) => Math.min(FAIXAS - 1, Math.floor(s[G] * FAIXAS)));
  faixa.forEach((f) => contagem[f]++);
  const larg = (m.d - m.e) / FAIXAS, alto = m.b - m.t, maior = Math.max(...contagem);
  const porLinha = (c) => Math.max(1, Math.floor((larg - 2) / c));
  let c = 16;
  while (c > 2 && Math.ceil(maior / porLinha(c)) * c > alto) c -= 0.25;
  const cols = porLinha(c), q = c * 0.2;
  const usados = Array(FAIXAS).fill(0), pts = [];
  faixa.forEach((f, h) => {
    const j = usados[f]++;
    const x = m.e + f * larg + (larg - cols * c) / 2 + (j % cols) * c + c / 2;
    const y = m.b - Math.floor(j / cols) * c - c / 2;
    const cor = h % 2 ? "#a9b1c4" : "#c3c9d6";
    for (let a = 0; a < 8; a++) pts.push([x + q * Math.cos(a * Math.PI / 4), y + q * Math.sin(a * Math.PI / 4), cor]);
  });
  const fMeio = contagem.indexOf(maior);
  return { pts: ajustar(pts, PONTOS, rng),
           eixos: { contagem: true, x: `frequência do alelo depois de ${G} gerações`,
                    marcasX: [0, 0.5, 1].map((v) => ({ x: m.e + v * (m.d - m.e), rotulo: String(v).replace(".", ",") })),
                    alvo: [m.e + (fMeio + 0.5) * larg, m.b - Math.ceil(maior / cols) * c - 4] } };
}
