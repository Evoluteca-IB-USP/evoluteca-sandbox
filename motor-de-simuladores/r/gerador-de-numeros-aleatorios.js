/* O `set.seed` do pacote: um gerador com semente (mulberry32).
   Devolve uma função equivalente a runif(1).
   NUNCA use Math.random() num modelo — quebra a reprodutibilidade. */
export function criarRng(semente) {
  let a = semente >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
