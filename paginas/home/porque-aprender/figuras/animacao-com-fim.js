import { criar } from "escrever-html";
import { laco } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** desenha `desenhar(t)` de 0 a `duracao` segundos e chama `fim`; devolve o que para */
export function animar(desenhar, duracao, fim) {
  if (reduzido()) { desenhar(duracao); if (fim) fim(); return () => {}; }
  return laco((t) => { desenhar(Math.min(t, duracao)); if (t >= duracao) { if (fim) fim(); return false; } });
}

/** o elo "tire a seleção" da enzima, que some até a primeira resposta */
export function eloSelecao(aoTrocar) {
  let com = true;
  const elo = criar("button", { type: "button", class: "vivo-elo", texto: "tire a seleção", hidden: true });
  elo.addEventListener("click", () => { com = !com; elo.textContent = com ? "tire a seleção" : "devolva a seleção"; aoTrocar(com); });
  return elo;
}

export const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const entre = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
