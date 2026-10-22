import { NAVY, FONTE, clamp, quebrar } from "../../../desenho-em-canvas/__pacote__.js";
import { PONTOS, ajustar, embaralhar } from "./ajustar-nuvem.js";

/** os pontos que escrevem `texto` dentro da `caixa`, alinhado à esquerda e lido de um canvas
    fora da tela; a letra encolhe até a frase caber em três linhas */
export function poeiraDeTexto(W, H, texto, caixa, rng) {
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const c = off.getContext("2d");
  let tam = clamp(caixa.w / 14, 22, 50), linhas;
  for (;;) {
    c.font = `600 ${tam}px ${FONTE}`;
    linhas = quebrar(c, texto, caixa.w);
    if ((linhas.length <= 3 && linhas.length * tam * 1.2 <= caixa.h) || tam <= 22) break;
    tam -= 2;
  }
  c.fillStyle = "#000"; c.textAlign = "left"; c.textBaseline = "middle";
  const alturaLinha = tam * 1.2;
  const y0 = caixa.y + caixa.h / 2 - ((linhas.length - 1) * alturaLinha) / 2;
  linhas.forEach((l, i) => c.fillText(l, caixa.x, y0 + i * alturaLinha));

  const img = c.getImageData(0, 0, W, H).data;
  const pts = [];
  const passo = Math.max(2, Math.round(tam / 26));
  for (let y = 0; y < H; y += passo)
    for (let x = 0; x < W; x += passo)
      if (img[(y * W + x) * 4 + 3] > 120) pts.push([x, y, NAVY]);
  return ajustar(embaralhar(pts, rng), PONTOS, rng);
}
