/* v6 · gíria na sala. A sala vista de cima: clicar numa carteira inventa
   uma gíria, e a cada instante um aluno copia um vizinho ao acaso, até a
   gíria pegar na sala inteira ou sumir. É a deriva genética, com carteiras
   no lugar de genes. Quando o link colado serve, a porta abre e o lugar do
   aluno ganha o anel âmbar. O professor entra pela cabecinha da linha que
   fecha o banner. */

import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";
import { tituloEmVarredura } from "../../paginas/catalogo/titulo-em-varredura.js";
import { ladoDoAluno, entradaDoProfessor, svg, parado } from "./comum/pecas-da-porta.js";

const FILAS = 5, COLUNAS = 6, TOTAL = FILAS * COLUNAS, SEU_LUGAR = 15, RITMO = 75;
const CARTEIRA = 34, X0 = 59, Y0 = 64, PASSO_Y = 48;
const xDe = (c) => X0 + c * CARTEIRA + Math.floor((c + 1) / 2) * 6 + Math.floor(c / 2) * 30; // duplas com corredor entre elas

const vizinhos = Array.from({ length: TOTAL }, (_, i) => {
  const f = Math.floor(i / COLUNAS), c = i % COLUNAS;
  return [[f - 1, c], [f + 1, c], [f, c - 1], [f, c + 1]].filter(([a, b]) => a >= 0 && a < FILAS && b >= 0 && b < COLUNAS).map(([a, b]) => a * COLUNAS + b);
});

function desenharSala() {
  const raiz = svg("svg", { viewBox: "0 0 400 322", class: "v6-sala" });
  const porta = svg("g", { class: "v6-porta" });
  porta.append(svg("path", { d: "M20 18A36 36 0 0 1 56 54", class: "v6-arco" }), svg("line", { x1: 20, y1: 54, x2: 20, y2: 18, class: "v6-folha" }));
  raiz.append(svg("path", { d: "M20 54V308H380V14H20V18", class: "v6-parede" }), porta, svg("line", { x1: 130, y1: 28, x2: 270, y2: 28, class: "v6-lousa" }));
  const carteiras = Array.from({ length: TOTAL }, (_, i) => {
    const no = svg("rect", { x: xDe(i % COLUNAS), y: Y0 + Math.floor(i / COLUNAS) * PASSO_Y, width: CARTEIRA, height: CARTEIRA, rx: 6, class: "v6-carteira", tabindex: "0", role: "button", "aria-label": `Carteira ${i + 1}` });
    raiz.append(no);
    return no;
  });
  return { raiz, carteiras };
}

function figura() {
  const sala = desenharSala();
  const estado = criar("p", { class: "figura-linha", "aria-live": "polite", texto: "Clique numa carteira para inventar uma gíria." });
  let fala = Array(TOTAL).fill(false), copias = 0, relogio = null;

  const quantos = () => fala.filter(Boolean).length;
  const pintar = () => sala.carteiras.forEach((no, i) => no.classList.toggle("v6-fala", fala[i]));

  function terminar(pegou) {
    relogio = null;
    const vezes = copias === 1 ? "1 cópia" : `${copias} cópias`;
    estado.replaceChildren(...(pegou
      ? [criar("b", { texto: "A gíria pegou" }), ` na sala inteira, em ${vezes}.`]
      : [criar("b", { texto: "A gíria sumiu" }), ` depois de ${vezes}.`]));
  }

  /* um aluno copia um vizinho que fala diferente dele; subir e descer têm a mesma chance */
  function copiar() {
    const pares = [];
    for (let i = 0; i < TOTAL; i++) for (const v of vizinhos[i]) if (fala[i] !== fala[v]) pares.push([i, v]);
    if (!pares.length) return terminar(fala[0]);
    const [quem, de] = pares[Math.floor(Math.random() * pares.length)];
    fala[quem] = fala[de];
    copias++;
    pintar();
    const no = sala.carteiras[quem];
    no.classList.add("v6-copiou");
    setTimeout(() => no.classList.remove("v6-copiou"), 160);
    estado.replaceChildren(criar("b", { texto: `${quantos()} de ${TOTAL}` }), " falam a gíria. Ela pega ou some?");
    relogio = setTimeout(copiar, RITMO);
  }

  function inventar(i) {
    if (quantos() === TOTAL) fala.fill(false);
    if (!relogio) copias = 0;
    fala[i] = true;
    pintar();
    estado.replaceChildren(criar("b", { texto: `${quantos()} de ${TOTAL}` }), " falam a gíria. Ela pega ou some?");
    if (parado()) { clearTimeout(relogio); relogio = null; while (quantos() % TOTAL) { const pares = []; for (let k = 0; k < TOTAL; k++) for (const v of vizinhos[k]) if (fala[k] !== fala[v]) pares.push([k, v]); const [quem, de] = pares[Math.floor(Math.random() * pares.length)]; fala[quem] = fala[de]; copias++; } pintar(); return terminar(fala[0]); }
    if (!relogio) relogio = setTimeout(copiar, 500);
  }

  sala.carteiras.forEach((no, i) => {
    no.addEventListener("click", () => inventar(i));
    no.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inventar(i); } });
  });

  return {
    no: criar("figure", { class: "v6-figura" }, sala.raiz, estado,
      criar("figcaption", { class: "figura-legenda" }, criar("b", { texto: "Figura 1. " }), "A cada instante, um aluno copia o jeito de falar de um vizinho, ao acaso. Com os genes, esse jogo se chama deriva genética.")),
    abrirPorta: (sim) => { sala.raiz.classList.toggle("v6-aberta", sim); sala.carteiras[SEU_LUGAR].classList.toggle("v6-seu-lugar", sim); },
  };
}

/* a linha de fecho do catálogo, que aqui para na cabecinha âmbar: dali em
   diante quem continua é o professor. A cabecinha se alinha com a figura. */
function fechoDoProfessor(ancora) {
  const ALTURA = 70, PONTOS = 72, rng = criarRng(17);
  let lento = 0, rapido = 0;
  const pts = Array.from({ length: PONTOS + 1 }, () => {
    lento += -0.08 * lento + rnorm(0, 1.4, rng);
    rapido += -0.35 * rapido + rnorm(0, 1.1, rng);
    return ALTURA / 2 + Math.tanh((lento + rapido) / 5) * ALTURA * 0.4;
  });
  const professor = entradaDoProfessor();
  professor.balao?.classList.add("para-cima");
  const no = criar("div", { class: "fecho v6-fecho" },
    criar("div", { class: "v6-fecho-linha", "aria-hidden": "true", html: `<svg viewBox="0 0 1000 ${ALTURA}" preserveAspectRatio="none"><path d="${pts.map((y, i) => `${i ? "L" : "M"}${((i / PONTOS) * 1000).toFixed(1)} ${y.toFixed(1)}`).join(" ")}"/></svg>` }),
    criar("span", { class: "fecho-cabeca", "aria-hidden": "true" }),
    criar("div", { class: "v6-professor" }, professor.linha), professor.balao);
  const ajustar = () => {
    const x = ancora.getBoundingClientRect().left - no.getBoundingClientRect().left - 22;
    const k = Math.min(PONTOS - 1, Math.max(0, (x / no.clientWidth) * PONTOS)), i = Math.floor(k);
    no.style.setProperty("--x", `${x}px`);
    no.style.setProperty("--y", `${pts[i] + (pts[i + 1] - pts[i]) * (k - i)}px`);
  };
  new ResizeObserver(ajustar).observe(no);
  return no;
}

export function montar(raiz) {
  const sala = figura();
  raiz.replaceChildren(
    criar("section", { class: "banner-catalogo porta v6" },
      criar("div", { class: "container banner-grade" },
        criar("div", {}, tituloEmVarredura("Sala de aula"), ladoDoAluno(sala.abrirPorta)),
        sala.no),
      fechoDoProfessor(sala.no)));
}
