/** rpois(lambda, rng) — um sorteio de Poisson (método de Knuth). */
export function rpois(lambda, rng) {
  const limite = Math.exp(-lambda);
  let k = 0, p = 1;
  do {
    k++;
    p *= rng();
  } while (p > limite);
  return k - 1;
}
