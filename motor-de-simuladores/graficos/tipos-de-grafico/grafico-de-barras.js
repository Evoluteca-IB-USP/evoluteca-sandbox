import { lerAparencia } from "../ler-aparencia.js";
import { preparar, desenharMoldura, formatar } from "../bases/__pacote__.js";

/** Gráfico de barras agrupadas. dados: { rotulos, grupos: [{nome, valores}] }
    Com mais de um grupo, o primeiro (o esperado pela teoria) sai em contorno
    tracejado e os demais (o observado) em barras cheias. opts: { y, ylim, valores, legenda } */
export function barras(canvas, dados, opts = {}) {
  const C = lerAparencia();
  const { ctx, largura, altura } = preparar(canvas);
  const area = { e: 54, d: largura - 16, t: 36, b: altura - 50 };

  const maximo = opts.ylim ? opts.ylim[1] : Math.max(...dados.grupos.flatMap((g) => g.valores)) * 1.15;
  const ylim = [0, maximo || 1];
  desenharMoldura(ctx, area, [0, 1], ylim, null, opts.y, C, false); // sem marcas numéricas no x

  const nCat = dados.rotulos.length;
  const nGrp = dados.grupos.length;
  const larguraCat = (area.d - area.e) / nCat;
  const larguraBarra = (larguraCat * 0.62) / nGrp;
  const corDo = (j) => (nGrp > 1 ? (j === 0 ? C.feixe : [C.foco, C.series[2], C.series[1]][(j - 1) % 3]) : C.feixe);

  dados.grupos.forEach((g, j) => {
    const contorno = nGrp > 1 && j === 0;
    const cor = corDo(j);
    g.valores.forEach((v, i) => {
      const x = area.e + i * larguraCat + larguraCat * 0.19 + j * larguraBarra + 2;
      const w = larguraBarra - 5;
      const h = ((v - ylim[0]) / (ylim[1] - ylim[0])) * (area.b - area.t);
      if (h > 0) {
        ctx.beginPath();
        ctx.roundRect(x, area.b - h, w, h, [4, 4, 0, 0]);
        if (contorno) {
          ctx.fillStyle = cor;
          ctx.globalAlpha = 0.1;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = cor;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = cor;
          ctx.fill();
        }
      }
      if (opts.valores !== false) {
        ctx.font = C.fonteMini;
        ctx.fillStyle = contorno ? C.eixo : C.texto;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(formatar(+v.toFixed(3)), x + w / 2, area.b - h - 4);
      }
    });
  });

  // rótulos das categorias
  ctx.font = `600 13px ${C.fonte.split("px ")[1]}`;
  ctx.fillStyle = C.texto;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  dados.rotulos.forEach((r, i) => ctx.fillText(r, area.e + (i + 0.5) * larguraCat, area.b + 9));

  // legenda dos grupos, no topo (opts.legenda = false quando a página já tem uma)
  if (nGrp > 1 && opts.legenda !== false) {
    let x = area.e;
    ctx.font = C.fonte;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    dados.grupos.forEach((g, j) => {
      const contorno = j === 0;
      ctx.beginPath();
      ctx.roundRect(x, 8, 12, 12, 3);
      if (contorno) {
        ctx.strokeStyle = corDo(j);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = corDo(j);
        ctx.fill();
      }
      ctx.fillStyle = C.eixo;
      ctx.fillText(g.nome, x + 18, 14);
      x += 18 + ctx.measureText(g.nome).width + 20;
    });
  }
}
