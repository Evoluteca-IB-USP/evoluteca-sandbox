/* O título do banner: "Simuladores" preenchido por dois alelos, como num
   gráfico de Muller. Um clone teal sobe de baixo e invade o navy ao longo
   da palavra, e um fio âmbar marca a fronteira. Com o mouse em cima, a
   fronteira desliza até uma nova réplica. */

import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";

const PONTOS = 24, DURACAO = 700;

function replica(semente) {
  const rng = criarRng(semente);
  const meio = 0.3 + 0.4 * rng(), rapidez = 6 + 7 * rng(), alcance = 0.6 + 0.3 * rng();
  return Array.from({ length: PONTOS }, (_, i) => {
    const logistica = 1 / (1 + Math.exp(-rapidez * (i / (PONTOS - 1) - meio)));
    return Math.min(0.95, Math.max(0.02, 0.04 + logistica * alcance + rnorm(0, 0.04, rng)));
  });
}

/* curva suave (Catmull-Rom) pelas frequências, numa caixa 0..100 que só usa o corpo das letras */
function fronteira(fs) {
  const xy = fs.map((f, i) => [(i / (PONTOS - 1)) * 100, 78 - f * 52]);
  let d = `M0 ${xy[0][1].toFixed(2)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [a, b, c, e] = [xy[i - 1] ?? xy[i], xy[i], xy[i + 1], xy[i + 2] ?? xy[i + 1]];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(2)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(2)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(2)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(2)} ${c[0].toFixed(2)} ${c[1].toFixed(2)}`;
  }
  return d;
}

function pintar(palavra, fs) {
  const borda = fronteira(fs);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">` +
    `<rect width="100" height="100" fill="#142560"/>` +
    `<path d="${borda} L100 100 L0 100Z" fill="#0d7a8d"/>` +
    `<path d="${borda}" fill="none" stroke="#fcb421" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
  palavra.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function tituloEmVarredura() {
  const palavra = criar("span", { class: "titulo-varredura", texto: "Simuladores" });
  const h1 = criar("h1", {}, palavra);

  let semente = 4, atual = replica(semente), quadro = null;
  pintar(palavra, atual);
  h1.addEventListener("mouseenter", () => {
    const de = atual, para = replica(++semente), t0 = performance.now();
    cancelAnimationFrame(quadro);
    const passo = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / DURACAO)), e = 1 - (1 - k) ** 3;
      atual = de.map((v, i) => v + (para[i] - v) * e);
      pintar(palavra, atual);
      if (k < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
  });
  return h1;
}
