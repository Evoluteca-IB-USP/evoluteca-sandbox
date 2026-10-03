/* Como um parâmetro da ficha vira posição na régua e volta a ser valor. */

import { numero } from "./graficos-da-pagina/pecas.js";

/** valor → fração 0..1 do caminho entre min e max (em log, se a escala pedir) */
export function paraFracao(p, v) {
  return p.escala === "log" ? Math.log(v / p.min) / Math.log(p.max / p.min) : (v - p.min) / (p.max - p.min);
}

/** fração → valor, já arredondado ao passo do parâmetro */
export function deFracao(p, f) {
  f = Math.max(0, Math.min(1, f));
  if (p.escala === "log") return arredondarLog(p.min * (p.max / p.min) ** f);
  const passo = p.passo ?? 1;
  return +(Math.round((p.min + f * (p.max - p.min)) / passo) * passo).toFixed(6);
}

/* em escala log, dois algarismos significativos bastam: 137 → 140, 2468 → 2500 */
function arredondarLog(v) {
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / mag) * mag;
}

export const formatar = (p, v) => (p.casas ? numero(v, p.casas) : v.toLocaleString("pt-BR"));
