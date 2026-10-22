import { ticks, formatar } from "./ticks-do-eixo.js";

/* a grade, as marcas e os rótulos dos dois eixos — a base sobre a qual
   qualquer tipo de gráfico cartesiano é desenhado */
export function desenharMoldura(ctx, area, xlim, ylim, rotuloX, rotuloY, C, mostrarX = true) {
  const { e, d, t, b } = area; // esquerda, direita, topo, base (px)
  ctx.font = C.fonte;
  ctx.lineWidth = 1;

  // grade + marcas do eixo y
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const m of ticks(ylim[0], ylim[1])) {
    const y = b - ((m - ylim[0]) / (ylim[1] - ylim[0])) * (b - t);
    ctx.strokeStyle = C.grade;
    ctx.beginPath();
    ctx.moveTo(e, y);
    ctx.lineTo(d, y);
    ctx.stroke();
    ctx.fillStyle = C.eixo;
    ctx.fillText(formatar(m), e - 8, y);
  }

  // marcas do eixo x
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (mostrarX) {
    for (const m of ticks(xlim[0], xlim[1], 6)) {
      const x = e + ((m - xlim[0]) / (xlim[1] - xlim[0])) * (d - e);
      ctx.fillStyle = C.eixo;
      ctx.fillText(formatar(m), x, b + 8);
    }
  }

  // rótulos dos eixos
  ctx.fillStyle = C.eixo;
  if (rotuloX) ctx.fillText(rotuloX, e + (d - e) / 2, b + 27);
  if (rotuloY) {
    ctx.save();
    ctx.translate(13, t + (b - t) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(rotuloY, 0, 0);
    ctx.restore();
  }
}
