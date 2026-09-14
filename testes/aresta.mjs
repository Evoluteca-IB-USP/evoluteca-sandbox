/* ============================================================
   testes/aresta.mjs — o traçado da aresta da abertura

   A fronteira entre a abertura e a página (o SVG .abertura-aresta em
   index.html) não é uma linha reta: é uma trajetória. Ela usa a mesma
   receita da população em destaque do gráfico de abertura — um passeio
   lento somado a um tremor rápido, comprimido por tanh para não encostar
   nas bordas — mas sorteada uma vez só, com semente fixa, e congelada no
   HTML: nada é calculado no navegador.

   Rode para reimprimir o traçado (por exemplo, para trocar a semente ou o
   número de passos) e cole o resultado nos dois `d=` do SVG:

       node testes/aresta.mjs
       node testes/aresta.mjs 5 60      (semente 5, 60 passos)

   PASSOS é o que separa "gráfico" de "papel rasgado": poucos passos e muita
   amplitude leem como série plotada; muitos passos e pouca amplitude leem
   como borda serrilhada.

   MEIO e AMPLITUDE posicionam o traçado dentro do viewBox. Estão calibrados
   para os picos passarem ACIMA da linha de grade do 0,25 do gráfico de fundo
   e cortarem o pontilhado — é isso que faz a aresta parecer parte da figura,
   e não uma borda decorativa colada embaixo. Essa mira só funciona se a faixa
   (.abertura-aresta em aparencia/home/abertura.css) for mais alta que ~140px: a grade fica em 82,9%
   da altura da seção, então com faixa baixa o 0,25 cai acima dela, fora de
   alcance de qualquer traçado.
   ============================================================ */

import { criarRng, rnorm } from "../motor-de-simuladores/r/__pacote__.js";

const SEMENTE = Number(process.argv[2] ?? 2);
const PASSOS  = Number(process.argv[3] ?? 52);
const W = 1440, H = 160;          // o viewBox; estica só na horizontal
const MEIO = 0.46, AMPLITUDE = 0.455;   // sobe o traçado: os picos passam do 0,25

const rng = criarRng(SEMENTE);
let lento = 0, rapido = 0;
const x = [];
for (let i = 0; i <= PASSOS; i++) {
  lento  += -0.012 * lento  + rnorm(0, 0.105, rng);   // sobe-e-desce de dezenas de passos
  rapido += -0.380 * rapido + rnorm(0, 0.045, rng);   // tremor de um passo para o outro
  x.push(Math.tanh((lento + rapido) / 0.55));
}

const pts = x.map((v, i) => [Math.round((i * W) / PASSOS), +(H * MEIO - v * H * AMPLITUDE).toFixed(1)]);
const linha = pts.map(([px, py], i) => `${i ? "L" : "M"}${px} ${py}`).join(" ");
const ys = pts.map((p) => p[1]);

const quebra = (d) => d.replace(/((?:[ML][\d.]+ [\d.]+ ){7})/g, "$1\n             ").trimEnd();

console.log(`semente ${SEMENTE}, ${PASSOS} passos — alcance ${(Math.max(...ys) - Math.min(...ys)).toFixed(0)} de ${H}`);
console.log("\n--- aresta-massa ---\n" + quebra(`${linha} L${W} ${H} L0 ${H} Z`));
console.log("\n--- aresta-linha ---\n" + quebra(linha));
