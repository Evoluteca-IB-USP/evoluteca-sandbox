import { criarRng, rbinom } from "r";
import { formatar } from "../../../motor-de-simuladores/graficos/__pacote__.js";
import { fracaoCiclo } from "../../desenho-em-canvas/__pacote__.js";
import { ESCURA } from "../paletas.js";
import { lembrar } from "../lembrar-simulacao.js";
import { escalaDe, grelhaEscura, cabeca, tracarAte } from "../desenho-das-vitrines.js";

/* deriva: 20 populações de N = 100; a que mais anda sem fixar vai em amarelo */
export function vitrineDeriva(ctx, familia, area, semente, t, PAL = ESCURA) {
  const N = 100, G = 150, K = 20, SUBIDA = 7, ESPERA = 2.5;
  const ciclo = t == null ? 0 : Math.floor(t / (SUBIDA + ESPERA));
  const f = t == null ? 1 : fracaoCiclo(t, SUBIDA, ESPERA);
  const dados = lembrar(`deriva:${semente}:${ciclo}`, () => {
    const rng = criarRng(semente * 7919 + ciclo * 104729 + 1);
    const trilhas = Array.from({ length: K }, () => {
      const p = [0.5];
      for (let g = 1; g <= G; g++) p[g] = rbinom(2 * N, p[g - 1], rng) / (2 * N);
      return p;
    });
    const amplitude = (p) => Math.max(...p) - Math.min(...p);
    const vivas = trilhas.filter((p) => p[G] > 0 && p[G] < 1);
    const foco = (vivas.length ? vivas : trilhas).reduce((a, b) => (amplitude(b) > amplitude(a) ? b : a));
    return { trilhas, foco };
  });

  const esc = escalaDe(area);
  grelhaEscura(ctx, familia, area, { y: [0.25, 0.5, 0.75], x: [0, 50, 100, 150], xlim: [0, G] }, PAL);
  const px = (g) => area.e + (g / G) * (area.d - area.e);
  const py = (p) => area.b - p * (area.b - area.t);
  const ate = Math.round(f * G);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  dados.trilhas.forEach((p, k) => {
    if (p === dados.foco) return;
    tracarAte(ctx, px, py, p, ate, { cor: k % 3 === 2 ? PAL.teal : PAL.claro, largura: 1.4 * esc, alpha: 0.5 });
  });
  tracarAte(ctx, px, py, dados.foco, ate, { cor: PAL.amarelo, largura: 7 * esc, alpha: 0.16 });   // halo (sem shadowBlur)
  tracarAte(ctx, px, py, dados.foco, ate, { cor: PAL.amarelo, largura: 2.2 * esc, alpha: 0.95 });
  cabeca(ctx, px(ate), py(dados.foco[ate]), PAL.amarelo, t == null ? 0 : 0.5 + 0.5 * Math.sin(t * 7), esc, PAL);
}
