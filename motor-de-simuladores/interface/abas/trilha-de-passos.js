/* A trilha de passos: nós numerados sobre uma linha de deriva, o escolhido
   com o anel âmbar. Nasceu no catálogo; aqui escolhe a ferramenta. */

import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";

/** entradas: [{ titulo, marca? }] — marca é o que vai no nó (padrão: o número); atual: índice; aoEscolher(índice) */
export function trilhaDePassos({ entradas, atual = 0, semente = 30, aoEscolher = () => {} }) {
  const no = criar("div", { class: "trilha" });
  const n = entradas.length;
  const { svg, nos } = caminho(n, semente);

  function desenhar() {
    const passos = entradas.map((e, k) => {
      const b = criar("button", {
        type: "button",
        class: "trilha-passo",
        "aria-pressed": k === atual ? "true" : "false",
      },
        criar("span", { class: "trilha-no", style: `--dy: ${nos[k].toFixed(1)}px`, texto: e.marca ?? k + 1 }),
        criar("span", { class: "trilha-titulo", texto: e.titulo }));
      b.addEventListener("click", () => { atual = k; desenhar(); aoEscolher(k); });
      return b;
    });
    no.style.setProperty("--passos", n);
    no.replaceChildren(criar("div", { class: "trilha-linha", html: svg }), criar("div", { class: "trilha-passos" }, ...passos));
  }
  desenhar();
  return no;
}

/* a linha é um passeio aleatório suave; cada nó se apoia nela */
function caminho(n, semente) {
  const W = 1000, H = 60, rng = criarRng(semente);
  const pontos = [];
  let y = 0;
  for (let i = 0; i <= 80; i++) {
    y = 0.85 * y + rnorm(0, 0.35, rng);
    pontos.push([(i / 80) * W, H / 2 + Math.tanh(y) * H * 0.18]);
  }
  const nos = Array.from({ length: n }, (_, k) => {
    const x = ((k + 0.5) / n) * 80, i = Math.floor(x), f = x - i;
    return pontos[i][1] * (1 - f) + pontos[Math.min(80, i + 1)][1] * f - H / 2;
  });
  const d = pontos.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  return { svg: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`, nos };
}
