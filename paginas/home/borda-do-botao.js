/* A borda de cima do botão da abertura: uma trajetória curta de deriva — a
   receita da aresta (passeio lento + tremor, comprimido por tanh), com poucos
   passos e bastante altura, para ler como série plotada e não como papel
   rasgado. A cada passada do mouse sai outra trajetória, como outra população.

   API: recortarBotao(botao)
        botao: o <a> com um <svg> e um <path> dentro (a massa âmbar) */

import { criarRng, rnorm } from "r";

const PASSOS = 12, TOPO = 2, FUNDO = 22;           // a borda varia entre y = 2 e y = 22, em px

function trajetoria(semente) {
  const rng = criarRng(semente);
  let lento = 0, rapido = 0;
  return Array.from({ length: PASSOS + 1 }, () => {
    lento += -0.1 * lento + rnorm(0, 0.8, rng);
    rapido += -0.6 * rapido + rnorm(0, 0.7, rng);
    return TOPO + (FUNDO - TOPO) * (0.5 + 0.5 * Math.tanh((lento + rapido) / 1.6));
  });
}

export function recortarBotao(botao) {
  const svg = botao.querySelector("svg"), massa = svg.querySelector("path");
  const altura = botao.offsetHeight;
  svg.setAttribute("viewBox", `0 0 100 ${altura}`);
  const desenhar = (ys) => {
    const pontos = ys.map((y, i) => `${((i / PASSOS) * 100).toFixed(2)} ${y.toFixed(2)}`);
    massa.setAttribute("d", `M${pontos.join(" L")} L100 ${altura} L0 ${altura} Z`);
  };

  let atual = trajetoria(9), quadro = 0;            // a semente 9 sobe e desce bem
  desenhar(atual);
  function irPara(alvo) {                           // de uma trajetória à outra, ponto a ponto
    const de = atual.slice(), t0 = performance.now();
    cancelAnimationFrame(quadro);
    (function passo(agora) {
      const p = Math.min(1, (agora - t0) / 480), e = 1 - (1 - p) ** 3;
      atual = de.map((y, i) => y + (alvo[i] - y) * e);
      desenhar(atual);
      if (p < 1) quadro = requestAnimationFrame(passo);
    })(t0);
  }
  const outraPopulacao = () => irPara(trajetoria(Math.floor(Math.random() * 1e9)));
  botao.addEventListener("mouseenter", outraPopulacao);
  botao.addEventListener("focus", outraPopulacao);
}
