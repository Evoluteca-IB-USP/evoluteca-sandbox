import { lerAparencia } from "../../motor-de-simuladores/graficos/__pacote__.js";
import { preparar } from "../desenho-em-canvas/__pacote__.js";
import { ESCURA, CLARA } from "./paletas.js";
import { vitrineDeriva, vitrineAmostra, vitrineSelecao } from "./vitrines-de-simulacao/__pacote__.js";

/** A simulação do tipo `tipo` — sobre fundo escuro (o palco do catálogo)
    ou, com opts.tom = "claro", direto sobre o fundo claro da página.
    t = segundos decorridos → quadro da animação; sem t, desenha o quadro final.
    opts.area = retângulo do gráfico no canvas; padrão: o canvas todo, com margens. */
export function vitrine(canvas, tipo, semente = 1, t = null, opts = {}) {
  const C = lerAparencia();
  const familia = C.fonte.split("px ")[1];
  const { ctx, W: largura, H: altura } = preparar(canvas);
  const area = opts.area || (tipo === "barras"
    ? { e: 28, d: largura - 28, t: 30, b: altura - 80 }
    : { e: 44, d: largura - 24, t: 26, b: altura - 80 });
  const desenhar = tipo === "barras" ? vitrineAmostra : tipo === "curva" ? vitrineSelecao : vitrineDeriva;
  desenhar(ctx, familia, area, semente, t, opts.tom === "claro" ? CLARA : ESCURA);
}
