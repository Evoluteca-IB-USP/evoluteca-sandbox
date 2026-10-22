export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** aceleração e freada (ease-in-out cúbico) */
export const suaveIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** smoothstep: a mesma curva, mais suave nas pontas */
export const suavizar = (x) => x * x * (3 - 2 * x);

/** fração de um ciclo "desenha em `subida` s, segura `espera` s, recomeça" */
export const fracaoCiclo = (t, subida = 4, espera = 1.6) => Math.min(1, (t % (subida + espera)) / subida);
