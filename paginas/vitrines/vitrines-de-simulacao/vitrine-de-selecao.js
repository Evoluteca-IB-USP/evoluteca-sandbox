import { formatar } from "../../../motor-de-simuladores/graficos/__pacote__.js";
import { fracaoCiclo } from "../../desenho-em-canvas/__pacote__.js";
import { ESCURA } from "../paletas.js";
import { lembrar } from "../lembrar-simulacao.js";
import { escalaDe, grelhaEscura, cabeca, tracarAte } from "../desenho-das-vitrines.js";

/* seleção: a curva em S para quatro valores de s, rotulados onde cruzam 0,5 */
export function vitrineSelecao(ctx, familia, area, semente, t, PAL = ESCURA) {
  const G = 300, P0 = 0.02, H = 0.5, SUBIDA = 6, ESPERA = 3;
  const f = t == null ? 1 : fracaoCiclo(t, SUBIDA, ESPERA);
  // `cor` é o NOME da cor na paleta: o cache é um só para as duas paletas
  const curvas = lembrar("selecao", () =>
    [{ s: 0.3, cor: "amarelo" }, { s: 0.1, cor: "forte" }, { s: 0.05, cor: "claro" }, { s: 0.02, cor: "teal" }]
      .map(({ s, cor }) => {
        const p = [P0];
        for (let g = 1; g <= G; g++) {
          const x = p[g - 1], q = 1 - x, wAA = 1 + s, wAa = 1 + H * s;
          p[g] = (x * x * wAA + x * q * wAa) / (x * x * wAA + 2 * x * q * wAa + q * q);
        }
        return { s, cor, p, meio: p.findIndex((v) => v >= 0.5) };
      }));

  const esc = escalaDe(area);
  grelhaEscura(ctx, familia, area, { y: [0.25, 0.5, 0.75], x: [0, 100, 200, 300], xlim: [0, G] }, PAL);
  const px = (g) => area.e + (g / G) * (area.d - area.e);
  const py = (p) => area.b - p * (area.b - area.t);
  const ate = Math.round(f * G);
  const pulso = t == null ? null : 0.5 + 0.5 * Math.sin(t * 7);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.font = `600 ${esc > 1.25 ? 13 : 12}px ${familia}`;
  for (const c of curvas) {
    const destaque = c.cor === "amarelo";
    const cor = PAL[c.cor];
    if (destaque) tracarAte(ctx, px, py, c.p, ate, { cor, largura: 7 * esc, alpha: 0.16 });
    tracarAte(ctx, px, py, c.p, ate, { cor, largura: 2.2 * esc, alpha: destaque ? 0.95 : 0.85 });
    const rotulo = `s = ${formatar(c.s)}`;
    ctx.fillStyle = cor;
    if (c.meio >= 0 && ate >= c.meio) {             // cruzou 0,5: rótulo logo abaixo do cruzamento
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(rotulo, px(c.meio) + 9, py(0.5) + 8);
    } else if (c.meio < 0 && ate >= G) {            // não cruza na janela: rótulo no fim do traço
      ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText(rotulo, px(G) - 4, py(c.p[G]) - 8);
    }
    if (f < 1) cabeca(ctx, px(ate), py(c.p[ate]), cor, destaque ? pulso : null, esc, PAL);
  }
}
