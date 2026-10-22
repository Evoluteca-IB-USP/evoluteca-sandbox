/** rep(x, 3) → [x, x, x] */
export function rep(x, vezes) {
  return Array.from({ length: vezes }, () => x);
}
