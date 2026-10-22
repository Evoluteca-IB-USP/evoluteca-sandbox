/* As cores que a página do simulador desenha em canvas, lidas das variáveis
   de aparencia/variaveis/valores/cores.css (canvas não lê CSS sozinho). */

const ler = (nome, padrao) => (getComputedStyle(document.documentElement).getPropertyValue(nome) || padrao).trim();

export const NAVY = ler("--navy", "#142560");
export const TEAL = ler("--teal", "#1094ab");
export const TEAL_ESCURO = ler("--teal-escuro", "#0d7a8d");
export const TEAL_CLARO = ler("--teal-claro", "#64c4d2");
export const AMARELO = ler("--amarelo", "#fcb421");
export const TINTA_SUAVE = ler("--tinta-suave", "#6b6b6b");
export const FANTASMA = ler("--fantasma", "#b9bdc9");
export const FONTE = ler("--fonte-dados", "'Open Sans', sans-serif");
