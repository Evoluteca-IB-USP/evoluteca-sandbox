/* A paleta e as fontes do gráfico, lidas das variáveis de aparencia/.
   É o único ponto do motor que sabe de cor: os tipos de gráfico recebem
   este objeto pronto. */
export function lerAparencia() {
  const estilo = getComputedStyle(document.documentElement);
  const v = (nome, padrao) => (estilo.getPropertyValue(nome) || padrao).trim();
  return {
    series: [
      v("--grafico-1", "#1094ab"),
      v("--grafico-2", "#64c4d2"),
      v("--grafico-3", "#fcb421"),
      v("--grafico-4", "#131d60"),
    ],
    foco: v("--navy", "#142560"),        // a série em destaque (população 1)
    feixe: v("--grafico-1", "#1094ab"),  // as outras réplicas
    fantasma: v("--fantasma", "#b9bdc9"),// rodada guardada como referência
    grade: v("--borda", "#e5e5e5"),
    eixo: v("--tinta-suave", "#6b6b6b"),
    texto: v("--tinta", "#3d3d3d"),
    fonte: `12px ${v("--fonte-dados", "sans-serif")}`,
    fonteMini: `11px ${v("--fonte-dados", "sans-serif")}`,
  };
}
