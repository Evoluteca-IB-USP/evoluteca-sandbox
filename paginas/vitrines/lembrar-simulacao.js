/* As vitrines redesenham a cada quadro, mas só sorteiam uma vez por ciclo:
   o resultado fica guardado por chave, com o cache limitado. */

const cacheVitrine = new Map();
export function lembrar(chave, calcular) {
  if (!cacheVitrine.has(chave)) {
    if (cacheVitrine.size > 40) cacheVitrine.delete(cacheVitrine.keys().next().value);
    cacheVitrine.set(chave, calcular());
  }
  return cacheVitrine.get(chave);
}
