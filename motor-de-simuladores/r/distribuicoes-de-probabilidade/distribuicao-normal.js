/** rnorm(media, dp, rng) — um sorteio normal (Box–Muller). */
export function rnorm(media = 0, dp = 1, rng) {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return media + dp * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
