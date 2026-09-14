/* As cores que o simulador desenha fora do gráfico (as bolinhas da lupa, as
   barras de aptidão), lidas das variáveis de aparencia/. */

const cor = (nome, padrao) =>
  (getComputedStyle(document.documentElement).getPropertyValue(nome) || padrao).trim();

export function lerCores() {
  return {
    alelo1: cor("--alelo-1", "#142560"),
    alelo2: cor("--alelo-2", "#fcb421"),
    feixe: cor("--grafico-1", "#1094ab"),
    fantasma: cor("--fantasma", "#b9bdc9"),
  };
}
