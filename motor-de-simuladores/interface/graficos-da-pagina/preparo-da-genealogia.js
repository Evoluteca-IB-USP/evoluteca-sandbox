/* O que o desenho da genealogia precisa saber de cada cópia, calculado uma
   vez por rodada a partir do simular() do coalescente:
     hoje[g][c]   quantas cópias de hoje descendem da cópia c da geração g
     papel[g][c]  VIVA (deixou descendentes hoje) ou PERDIDA (não deixou)
     lugar[g][c]  a coluna da cópia no painel (B), de 0 a 2N − 1
     ancestral    { g, c }: a primeira cópia, voltando no tempo, de quem
                  todas as cópias de hoje descendem (null se não chegou)

   Em (B), como na Figura 3.4 de Rice (2004), as colunas são as mesmas em
   todas as gerações e só a ordem muda: a geração mais antiga fica como
   está e, de lá para hoje, as filhas de cada mãe ficam juntas, na ordem das
   mães. Assim nenhuma linha cruza outra. Dentro de cada família, as que
   deixaram descendentes ficam no meio. */

export const PERDIDA = 0, VIVA = 1;

const prontos = new WeakMap();

export function preparar(gen) {
  if (!prontos.has(gen)) {
    const hoje = descendencia(gen), g = hoje.findIndex((fileira) => fileira.includes(gen.copias));
    prontos.set(gen, {
      hoje, papel: hoje.map((fileira) => fileira.map((n) => (n ? VIVA : PERDIDA))), lugar: desembaracar(gen, hoje),
      ancestral: g < 0 ? null : { g, c: hoje[g].indexOf(gen.copias) },
    });
  }
  return prontos.get(gen);
}

function descendencia({ pais, copias }) {
  const hoje = [Array(copias).fill(1)];
  pais.forEach((maes, g) => {
    hoje[g + 1] = Array(copias).fill(0);
    maes.forEach((mae, c) => { hoje[g + 1][mae] += hoje[g][c]; });
  });
  return hoje;
}

function desembaracar({ pais, copias }, hoje) {
  const G = pais.length, lugar = [];
  let ordem = Array.from({ length: copias }, (_, c) => c);
  const marcar = (g) => { lugar[g] = []; ordem.forEach((c, i) => { lugar[g][c] = i; }); };
  marcar(G);
  for (let g = G - 1; g >= 0; g--) {
    const filhas = Array.from({ length: copias }, () => []);
    pais[g].forEach((mae, c) => filhas[mae].push(c));
    ordem = ordem.flatMap((mae) => {
      const vivas = filhas[mae].filter((c) => hoje[g][c]), perdidas = filhas[mae].filter((c) => !hoje[g][c]);
      const metade = Math.ceil(perdidas.length / 2);
      return [...perdidas.slice(0, metade), ...vivas, ...perdidas.slice(metade)];
    });
    marcar(g);
  }
  return lugar;
}

/** a linhagem que passa pela cópia c da geração ger: ela, as ancestrais (para trás) e as descendentes (até hoje), num Set de cópias por geração */
export function linhagemDe({ pais }, ger, c) {
  const marca = Array.from({ length: pais.length + 1 }, () => new Set());
  for (let g = ger, a = c; g <= pais.length; a = pais[g]?.[a], g++) marca[g].add(a);
  for (let g = ger - 1; g >= 0; g--) pais[g].forEach((mae, filha) => { if (marca[g + 1].has(mae)) marca[g].add(filha); });
  return marca;
}
