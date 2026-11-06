import { sample, seq } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Coalescente",
  descricao:
    "A genealogia de uma amostra, das pontas para o ancestral comum. Siga as linhagens para trás no tempo, veja quanto demora até todas se encontrarem e onde caem as mutações que a amostra carrega.",
  nivel: ["graduacao"],
  tema: "molecular",
  tempo: "20 min",
  parametros: [
    { nome: "n",        rotulo: "Tamanho da amostra",   valor: 4 },
    { nome: "N",        rotulo: "Tamanho da população", valor: 5 },
    { nome: "mu",       rotulo: "Taxa de mutação",      valor: 0.02 },
    { nome: "geracoes", rotulo: "Gerações para trás",   valor: 30, avancado: true },
  ],
  saida: { tipo: "linhas", y: "linhagens da amostra" },
};

/* Wright–Fisher olhado de trás para frente. A população tem 2N cópias do
   gene em cada geração; cada cópia sorteia a sua cópia-mãe na geração
   anterior. A geração 0 é hoje, e dela saem as n cópias da amostra.
   Seguindo as mães para trás, as linhagens da amostra vão se encontrando
   (coalescendo) até sobrar uma: o ancestral comum mais recente.

   Devolve:
     pais[g][i]    a mãe, na geração g + 1, da cópia i da geração g
     linhagens[g]  as cópias da geração g que deixaram descendentes na amostra
     vivas[g][i]   se a cópia i da geração g deixou descendentes na população de hoje
     alelos[g][i]  o alelo da cópia i da geração g: 1 é A, 0 é a
     mutacoes      [{ t, copia }]: a cópia da geração t tem alelo diferente da mãe
     nos           a árvore: { t, copia, filhos, pai }; as n primeiras são a amostra
     raiz, tmrca   o nó do ancestral comum e a geração dele (null se não chegou)

   A amostra sai antes das mães, sempre com o mesmo número de sorteios: com a
   mesma semente, mudar n ou as gerações mantém a mesma população. Os alelos
   saem depois da genealogia: mudar μ mantém a mesma árvore. */
export function simular({ N, n, geracoes, mu }, rng) {
  const copias = 2 * N;
  const amostra = sample(seq(0, copias - 1), n, rng);
  const pais = seq(1, geracoes).map(() => seq(1, copias).map(() => Math.floor(rng() * copias)));

  const nos = amostra.map((copia) => ({ t: 0, copia, filhos: [], pai: null }));
  let linhagem = new Map(amostra.map((copia, i) => [copia, i]));   // cópia → nó da árvore
  const linhagens = [[...linhagem.keys()]];
  let raiz = null;

  for (const g of seq(1, geracoes)) {
    const maes = new Map();
    for (const [copia, no] of linhagem) {
      const mae = pais[g - 1][copia];
      maes.set(mae, [...(maes.get(mae) ?? []), no]);
    }
    linhagem = new Map();
    for (const [mae, filhos] of maes) {
      if (filhos.length === 1) {
        linhagem.set(mae, filhos[0]);
        continue;
      }
      nos.push({ t: g, copia: mae, filhos, pai: null });     // um encontro: coalescência
      for (const f of filhos) nos[f].pai = nos.length - 1;
      linhagem.set(mae, nos.length - 1);
    }
    linhagens.push([...linhagem.keys()]);
    if (raiz === null && linhagem.size === 1) raiz = [...linhagem.values()][0];
  }

  /* quem deixou descendentes hoje: na geração 0, todas; mais para trás, as mães de quem deixou */
  const vivas = [Array(copias).fill(true)];
  for (const g of seq(1, geracoes)) {
    vivas[g] = Array(copias).fill(false);
    pais[g - 1].forEach((mae, c) => { if (vivas[g - 1][c]) vivas[g][mae] = true; });
  }

  /* os alelos: na geração mais antiga, A ou a ao acaso; daí até hoje, cada
     cópia herda o alelo da mãe e, com chance μ, ele muda (A ↔ a) */
  const alelos = [], mutacoes = [];
  alelos[geracoes] = seq(1, copias).map(() => (rng() < 0.5 ? 1 : 0));
  for (let g = geracoes - 1; g >= 0; g--) {
    alelos[g] = pais[g].map((mae, c) => {
      if (rng() >= mu) return alelos[g + 1][mae];
      mutacoes.push({ t: g, copia: c });
      return 1 - alelos[g + 1][mae];
    });
  }

  return {
    copias, amostra, pais, linhagens, vivas, alelos, mutacoes, nos, raiz,
    tmrca: raiz === null ? null : nos[raiz].t,
    k: linhagens.map((l) => l.length),
  };
}
