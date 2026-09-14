const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** a cor a `t` do caminho entre duas cores hexadecimais */
export function mistura(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
}
