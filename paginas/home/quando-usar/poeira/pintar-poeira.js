import { clamp, suaveIO } from "../../../desenho-em-canvas/__pacote__.js";

/** atraso de cada ponto pela posição horizontal do destino: a nuvem escorre da esquerda para a direita */
export function atrasoPorX(para) {
  let min = Infinity, max = -Infinity;
  for (const p of para) { if (p[0] < min) min = p[0]; if (p[0] > max) max = p[0]; }
  const larg = Math.max(1, max - min);
  return para.map((p) => ((p[0] - min) / larg) * 0.42);
}

/** a nuvem a caminho: `f` = 0 é `de`, 1 é `para`; um caminho por cor, quatro mil arcos por quadro */
export function pintarPontos(ctx, de, para, f, atraso) {
  const grupos = new Map();
  for (let i = 0; i < para.length; i++) {
    const u = suaveIO(clamp(f * 1.42 - atraso[i]));
    const x = de[i][0] + (para[i][0] - de[i][0]) * u;
    const y = de[i][1] + (para[i][1] - de[i][1]) * u;
    const cor = u > 0.5 ? para[i][2] : de[i][2];
    let g = grupos.get(cor);
    if (!g) grupos.set(cor, (g = []));
    g.push(x, y, u);
  }
  for (const [cor, v] of grupos) {
    ctx.fillStyle = cor;
    ctx.beginPath();
    for (let i = 0; i < v.length; i += 3) {
      const r = 1.15 + 0.55 * Math.sin(v[i + 2] * Math.PI);   // engorda no meio do voo
      ctx.moveTo(v[i] + r, v[i + 1]);
      ctx.arc(v[i], v[i + 1], r, 0, 2 * Math.PI);
    }
    ctx.fill();
  }
}
