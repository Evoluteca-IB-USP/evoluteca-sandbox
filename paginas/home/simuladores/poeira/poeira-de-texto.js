import { NAVY, FONTE, clamp, quebrar } from "../../../desenho-em-canvas/__pacote__.js";
import { PONTOS, ajustar, embaralhar } from "./ajustar-nuvem.js";

/** os pontos que desenham uma frase, lidos do próprio canvas */
export function poeiraDeTexto(W, H, texto, rng) {
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const c = off.getContext("2d");
  let tam = clamp(W / 15, 30, 62), linhas;
  for (;;) {                                       // encolhe até caber em três linhas
    c.font = `600 ${tam}px ${FONTE}`;
    linhas = quebrar(c, texto, W * 0.84);
    if (linhas.length <= 3 || tam <= 26) break;
    tam -= 3;
  }
  c.fillStyle = "#000"; c.textAlign = "center"; c.textBaseline = "middle";
  const alturaLinha = tam * 1.2;
  const y0 = H / 2 - ((linhas.length - 1) * alturaLinha) / 2;
  linhas.forEach((l, i) => c.fillText(l, W / 2, y0 + i * alturaLinha));

  const img = c.getImageData(0, 0, W, H).data;
  const pts = [];
  const passo = Math.max(2, Math.round(tam / 26));
  for (let y = 0; y < H; y += passo)
    for (let x = 0; x < W; x += passo)
      if (img[(y * W + x) * 4 + 3] > 120) pts.push([x, y, NAVY]);
  return ajustar(embaralhar(pts, rng), PONTOS, rng);
}
