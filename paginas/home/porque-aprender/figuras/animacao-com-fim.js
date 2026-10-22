import { laco } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** desenha `desenhar(t)` de 0 a `duracao` segundos e chama `fim`; devolve o que para */
export function animar(desenhar, duracao, fim) {
  if (reduzido()) { desenhar(duracao); if (fim) fim(); return () => {}; }
  return laco((t) => { desenhar(Math.min(t, duracao)); if (t >= duracao) { if (fim) fim(); return false; } });
}
