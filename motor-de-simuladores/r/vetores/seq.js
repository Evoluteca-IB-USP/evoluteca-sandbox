/** seq(1, 10) → [1..10]; seq(0, 1, 0.25) → [0, 0.25, 0.5, 0.75, 1] */
export function seq(de, ate, passo = 1) {
  const v = [];
  const n = Math.floor((ate - de) / passo + 1e-9);
  for (let i = 0; i <= n; i++) v.push(de + i * passo);
  return v;
}
