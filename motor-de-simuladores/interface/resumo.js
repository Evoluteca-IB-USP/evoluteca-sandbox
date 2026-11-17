/* O resumo da ficha numa rodada: os itens de `ficha.resumo` avaliados sobre o
   resultado e os valores dela (na última geração, que é onde as fichas olham).
   O caderno mostra os textos; a ponte com a sala manda também os números. */

/** o primeiro número de um texto escrito em português: "0,25" → 0.25, "1.234" → 1234, "45%" → 45, "3 de 20" → 3 */
export function primeiroNumero(texto) {
  const m = /[-−]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?/.exec(String(texto));
  if (!m) return undefined;
  const n = Number(m[0].replace("−", "-").replaceAll(".", "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** [{ rotulo, texto, numero? }] — o `numero` só aparece quando o texto tem um */
export function resumoDaRodada(ficha, res, valores) {
  return (ficha.resumo ?? []).map((m) => {
    const texto = m.valor(res, valores), numero = primeiroNumero(texto);
    return numero === undefined ? { rotulo: m.rotulo, texto } : { rotulo: m.rotulo, texto, numero };
  });
}
