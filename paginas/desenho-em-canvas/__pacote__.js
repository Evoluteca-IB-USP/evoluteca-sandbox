/* O que as figuras animadas das páginas têm em comum: preparar um canvas,
   um laço de animação que sabe parar, escrever um rótulo, saber se está na
   tela e as curvas de suavização. O motor de gráficos não passa por aqui —
   ele desenha gráfico, isto aqui desenha figura. */

export { NAVY, TEAL, TEAL_ESC, TEAL_CLARO, AMARELO, OCRE, CINZA, SUAVE, FONTE } from "./cores-das-figuras.js";
export { preparar, canvasNo } from "./preparar-canvas.js";
export { laco } from "./laco-de-animacao.js";
export { naTela } from "./na-tela.js";
export { rotulo, quebrar } from "./escrever-no-canvas.js";
export { mistura } from "./misturar-cores.js";
export { clamp, suaveIO, suavizar, fracaoCiclo } from "./suavizar.js";
