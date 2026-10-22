/* A nuvem é sempre do mesmo tamanho — a mesma poeira que forma a frase forma
   a figura, ponto por ponto. Quem produz uma nuvem menor a completa aqui;
   quem produz uma maior, corta. */

export const PONTOS = 4000;

/* completa (ou corta) uma nuvem até ter exatamente n pontos */
export const ajustar = (pts, n, rng) => {
  if (!pts.length) return [];
  const saida = pts.slice(0, n);
  while (saida.length < n) {                       // faltou: repete com um tremor, para não empilhar
    const [x, y, c] = pts[Math.floor(rng() * pts.length)];
    saida.push([x + (rng() - 0.5) * 2.5, y + (rng() - 0.5) * 2.5, c]);
  }
  return saida;
};
export function embaralhar(v, rng) {
  for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
  return v;
}
