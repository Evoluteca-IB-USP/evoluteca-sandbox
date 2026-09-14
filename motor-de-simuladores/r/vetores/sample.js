/** sample(v, k, rng, reposicao) — amostra k elementos de v. */
export function sample(v, k, rng, reposicao = false) {
  if (reposicao) {
    return Array.from({ length: k }, () => v[Math.floor(rng() * v.length)]);
  }
  const copia = v.slice();
  for (let i = copia.length - 1; i > 0; i--) {           // Fisher–Yates
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, k);
}
