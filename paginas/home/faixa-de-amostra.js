/* O ornamento da seção "Sobre": uma amostra de Hardy–Weinberg (p = 0,6)
   preenchida indivíduo a indivíduo, nas mesmas bolinhas da lupa dos
   simuladores. A grade é sempre de 3 linhas e ocupa a largura inteira da
   faixa — o número de colunas vem da largura disponível, então as bolinhas
   ficam do mesmo tamanho no celular e no desktop, sem sobra nas laterais.
   A amostra não enche a última linha de propósito: é uma amostra, não uma
   grade cheia. Cada rodada continua de onde a anterior parou no sorteio,
   então a faixa não repete a mesma amostra em laço — sorteia outra da
   mesma população. */

import { criarRng } from "r";
import { pontos } from "../../motor-de-simuladores/graficos/__pacote__.js";

const P = 0.6;
const FOLGA = 4;          // a mesma margem interna de pontos()
const CELULA = 29;        // passo da grade, em px
const CHEIO = 0.72;       // quanto da última linha a amostra chega a ocupar
const ENCHER = 10;        // segundos para encher (~10 indivíduos/s)
const ESPERA = 4.5;       // segundos mostrando a amostra pronta
const SORTEADOS = 600;

export function animarFaixaDeAmostra(amostra) {
  const estilo = getComputedStyle(document.documentElement);
  const corA = estilo.getPropertyValue("--alelo-1").trim();
  const cora = estilo.getPropertyValue("--alelo-2").trim();
  const classes = [{ cor: corA }, { cor: [corA, cora] }, { cor: cora }];   // AA · Aa · aa

  const rng = criarRng(2026);
  const sorteados = Array.from({ length: SORTEADOS }, () => {   // sorteio de uma vez, semente fixa
    const u = rng();
    return u < P * P ? 0 : u < P * P + 2 * P * (1 - P) ? 1 : 2;
  });

  let colunas = 0, total = 0, larguraAnterior = -1, ultimoN = -1, t0 = null, inicio = 0;

  function medir(r) {                              // grade de bolinhas quadradas, encaixada na caixa
    larguraAnterior = r.width;
    const L = r.width - 2 * FOLGA, A = r.height - 2 * FOLGA;
    const linhas = Math.max(1, Math.round(A / CELULA));
    colunas = Math.max(4, Math.ceil(L / (A / linhas)));
    total = Math.min(sorteados.length, Math.round(colunas * (linhas - 1 + CHEIO)));
    ultimoN = -1;
  }

  const desenhar = (n) => pontos(amostra, classes, {
    total, colunas,
    sequencia: Array.from({ length: n }, (_, i) => sorteados[(inicio + i) % sorteados.length]),
  });

  function quadro(agora) {
    const r = amostra.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) {   // só anima quando está na tela
      if (t0 === null) t0 = agora;
      if (r.width !== larguraAnterior) medir(r);        // largura mudou: refaz a grade e redesenha
      const decorrido = (agora - t0) / 1000;
      const n = Math.min(total, Math.round(((decorrido % (ENCHER + ESPERA)) / ENCHER) * total));
      if (n < ultimoN) inicio = (inicio + total) % sorteados.length;   // recomeçou: nova amostra
      if (n !== ultimoN) { ultimoN = n; desenhar(n); }
    }
    requestAnimationFrame(quadro);
  }

  medir(amostra.getBoundingClientRect());
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    desenhar(total);
    window.addEventListener("resize", () => { medir(amostra.getBoundingClientRect()); desenhar(total); });
  } else {
    requestAnimationFrame(quadro);
  }
}
