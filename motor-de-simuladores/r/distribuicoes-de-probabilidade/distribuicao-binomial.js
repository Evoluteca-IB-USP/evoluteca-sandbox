import { rnorm } from "./distribuicao-normal.js";

/** rbinom(n, p, rng) — um sorteio binomial: nº de sucessos em n tentativas.
    Equivale a rbinom(1, n, p) no R.
    Para n grande usa aproximação normal (exata o bastante para ensino,
    e mantém a simulação instantânea mesmo com N = 5000). */
export function rbinom(n, p, rng) {
  if (p <= 0) return 0;
  if (p >= 1) return n;
  if (n <= 256) {
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }
  const media = n * p;
  const dp = Math.sqrt(n * p * (1 - p));
  const k = Math.round(rnorm(media, dp, rng));
  return Math.max(0, Math.min(n, k));
}
