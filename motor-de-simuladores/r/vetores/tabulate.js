import { rep } from "./rep.js";

/** tabulate([1,2,2,3], 3) → [1, 2, 1] (conta ocorrências de 1..n) */
export function tabulate(v, n) {
  const contagem = rep(0, n);
  for (const x of v) if (x >= 1 && x <= n) contagem[x - 1]++;
  return contagem;
}
