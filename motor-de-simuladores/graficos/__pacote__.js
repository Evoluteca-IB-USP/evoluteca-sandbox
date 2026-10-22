/* O motor de gráficos da Evoluteca. Canvas puro, sem dependências: uma
   linguagem visual para todos os simuladores — mesma grade, mesmos eixos,
   mesma paleta (lida de aparencia/).
     linhas(canvas, series, opts)     series = [[y0, y1, …], …]
     barras(canvas, dados, opts)      dados  = { rotulos, grupos: [{nome, valores}] }
     pontos(canvas, classes, opts)    grade de bolinhas (alelos, genótipos, indivíduos) */

export { linhas, barras, pontos, bolinha } from "./tipos-de-grafico/__pacote__.js";
export { preparar, ticks, formatar, desenharMoldura } from "./bases/__pacote__.js";
export { lerAparencia } from "./ler-aparencia.js";
