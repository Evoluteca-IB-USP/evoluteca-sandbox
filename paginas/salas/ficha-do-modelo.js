/* O que o editor de blocos precisa saber de um simulador: os parâmetros e os
   rótulos do `resumo` da ficha dele. A ficha é um módulo do navegador (importa
   "r" pelo importmap da página), então isto só roda nas páginas. */

const cache = new Map();

/* { titulo, parametros: [{ nome, rotulo, min, max, passo, valor, casas, escala }], rotulos: [texto] } ou lança erro */
export function carregarFicha(slug) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return Promise.reject(new Error("simulador inválido"));
  if (!cache.has(slug)) {
    cache.set(slug, import(`../../modelos-de-simulacao/${slug}/ficha.js`).then(({ default: ficha }) => ({
      titulo: ficha.titulo ?? slug,
      parametros: (ficha.parametros ?? []).map(({ nome, rotulo, simbolo, min, max, passo, valor, casas, escala }) => ({ nome, rotulo, simbolo, min, max, passo, valor, casas, escala })),
      rotulos: (ficha.resumo ?? []).map((r) => r.rotulo),
    })));
    cache.get(slug).catch(() => cache.delete(slug));
  }
  return cache.get(slug);
}

/* o passo de uma régua: o da ficha ou 1/100 da faixa, arredondado para uma potência de dez */
export function passoDoParametro(p) {
  if (p.passo) return p.passo;
  const faixa = p.max - p.min;
  return faixa > 0 ? 10 ** Math.floor(Math.log10(faixa / 100)) : 1;
}
