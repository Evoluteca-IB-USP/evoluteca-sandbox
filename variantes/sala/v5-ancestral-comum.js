/* v5 · ancestral comum. A turma como uma genealogia: os alunos são as
   pontas da árvore e o professor é a raiz, com a entrada dele escrita ali.
   Clicar em dois alunos sobe pelas duas linhagens até o ancestral comum.
   Quando o link colado serve, a linhagem do aluno "você" se acende até o
   professor. */

import { criar } from "escrever-html";
import { criarRng } from "r";
import { tituloEmVarredura } from "../../paginas/catalogo/titulo-em-varredura.js";
import { ladoDoAluno, entradaDoProfessor, linhaDaFigura, svg } from "./comum/pecas-da-porta.js";

const ALUNOS = 20, POPULACAO = 20, VOCE = 12;
const L = 440, A = 280, X0 = 14, X1 = 426, CHAO = 244, TOPO = 16;
const MEIO = [150, 290]; // a raiz precisa cair aqui para a entrada do professor caber em cima dela

/* coalescente de Kingman: duas linhagens ao acaso se juntam, até sobrar a raiz */
function genealogia(semente) {
  const rng = criarRng(semente);
  const nos = Array.from({ length: ALUNOS }, () => ({ t: 0, filhos: [] }));
  let vivos = [...nos], t = 0;
  while (vivos.length > 1) {
    const k = vivos.length;
    t += -Math.log(1 - rng()) / ((k * (k - 1)) / 2);
    const a = vivos.splice(Math.floor(rng() * vivos.length), 1)[0], b = vivos.splice(Math.floor(rng() * vivos.length), 1)[0];
    const pai = { t, filhos: [a, b] };
    a.pai = b.pai = pai;
    nos.push(pai);
    vivos.push(pai);
  }
  const raiz = vivos[0], folhas = [];
  const pousar = (no) => {
    if (no.filhos.length) { no.filhos.forEach(pousar); no.x = (no.filhos[0].x + no.filhos[1].x) / 2; }
    else { no.x = X0 + (folhas.length / (ALUNOS - 1)) * (X1 - X0); folhas.push(no); }
    no.y = CHAO - (no.t / raiz.t) ** 0.6 * (CHAO - TOPO);
    no.geracoes = Math.max(1, Math.round(no.t * POPULACAO));
  };
  pousar(raiz);
  return { nos, raiz, folhas };
}

function sortear(semente) {
  for (;; semente++) {
    const arvore = genealogia(semente);
    if (arvore.raiz.x > MEIO[0] && arvore.raiz.x < MEIO[1]) return { arvore, semente };
  }
}

const ancestrais = (no) => { const lista = []; for (let n = no; n; n = n.pai) lista.push(n); return lista; };
const emComum = (a, b) => { const de = new Set(ancestrais(a)); return ancestrais(b).find((n) => de.has(n)); };

function figura() {
  const professor = entradaDoProfessor();
  const rotulo = criar("div", { class: "v5-professor" }, professor.linha);
  const desenho = svg("svg", { viewBox: `0 0 ${L} ${A}`, class: "v5-desenho" });
  const palco = criar("div", { class: "v5-palco" }, rotulo, desenho, professor.balao);
  const { linha, estado, rotular } = linhaDaFigura("Sortear outra turma", () => nova(semente + 1));
  let arvore, semente, escolhidos = [], sobre = null, serve = false;

  function subir(de, ate, classe, camada) {
    for (let n = de; n && n !== ate && n.ramo; n = n.pai) { n.ramo.setAttribute("class", `v5-ramo ${classe}`); camada.append(n.ramo); }
  }

  function pintar() {
    const { nos, raiz, folhas, camada, marca } = arvore;
    nos.forEach((n) => n.ramo?.setAttribute("class", "v5-ramo"));
    folhas.forEach((f, i) => f.ponta.setAttribute("class", `v5-aluno${escolhidos.includes(f) || f === sobre ? " v5-escolhido" : ""}${serve && i === VOCE ? " v5-voce" : ""}`));
    if (serve) subir(folhas[VOCE], null, "v5-sua", camada);
    const par = escolhidos.length === 2 ? escolhidos : escolhidos.length === 1 && sobre && sobre !== escolhidos[0] ? [escolhidos[0], sobre] : null;
    marca.setAttribute("class", par ? "v5-marca visivel" : "v5-marca");
    if (!par) {
      const um = escolhidos[0] ?? sobre;
      if (um) subir(um, null, "v5-quente", camada);
      estado.textContent = escolhidos.length ? "Agora clique em outro aluno." : "Clique em dois alunos para achar o ancestral comum deles.";
      return;
    }
    const comum = emComum(...par);
    subir(comum, null, "v5-morno", camada);
    par.forEach((p) => subir(p, comum, "v5-quente", camada));
    marca.setAttribute("transform", `translate(${comum.x} ${comum.y})`);
    estado.replaceChildren("O ancestral comum deles viveu há ", criar("b", { texto: comum.geracoes === 1 ? "1 geração" : `${comum.geracoes} gerações` }), comum === raiz ? ". É o mesmo da turma inteira." : ".");
  }

  function nova(a_partir_de) {
    ({ arvore, semente } = sortear(a_partir_de));
    escolhidos = []; sobre = null;
    const camada = svg("g"), pontas = svg("g");
    for (const no of arvore.nos) if (no.pai) { no.ramo = svg("path", { d: `M${no.x.toFixed(1)} ${no.y.toFixed(1)}V${no.pai.y.toFixed(1)}H${no.pai.x.toFixed(1)}` }); camada.append(no.ramo); }
    const marca = svg("g", { class: "v5-marca" });
    marca.append(svg("circle", { r: 11, class: "v5-marca-halo" }), svg("circle", { r: 6, class: "v5-marca-miolo" }));
    const raiz = svg("g", { class: "v5-raiz", transform: `translate(${arvore.raiz.x} ${arvore.raiz.y})` });
    raiz.append(svg("circle", { r: 13, class: "v5-raiz-anel" }), svg("circle", { r: 8, class: "v5-raiz-miolo" }));
    arvore.folhas.forEach((f, i) => {
      f.ponta = svg("g", { transform: `translate(${f.x.toFixed(1)} ${f.y})`, tabindex: "0", role: "button", "aria-label": `Aluno ${i + 1}` });
      f.ponta.append(svg("circle", { r: 11, class: "v5-toque" }), svg("circle", { r: 6.5, class: "v5-bola" }));
      if (i === VOCE) { const t = svg("text", { y: 27, class: "v5-rotulo-voce" }); t.textContent = "você"; f.ponta.append(t); }
      const escolher = () => { escolhidos = escolhidos.includes(f) ? escolhidos.filter((e) => e !== f) : escolhidos.length === 2 ? [f] : [...escolhidos, f]; pintar(); };
      f.ponta.addEventListener("pointerenter", () => { sobre = f; pintar(); });
      f.ponta.addEventListener("pointerleave", () => { sobre = null; pintar(); });
      f.ponta.addEventListener("click", escolher);
      f.ponta.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(); } });
      pontas.append(f.ponta);
    });
    Object.assign(arvore, { camada, marca });
    desenho.replaceChildren(camada, raiz, marca, pontas);
    rotulo.style.left = `${(arvore.raiz.x / L) * 100}%`;
    pintar();
  }

  nova(3);
  return {
    no: criar("figure", { class: "v5-figura" }, palco, linha),
    marcarVoce: (sim) => { serve = sim; pintar(); },
  };
}

export function montar(raiz) {
  const turma = figura();
  raiz.replaceChildren(
    criar("section", { class: "banner-catalogo porta v5" },
      criar("div", { class: "container banner-grade" },
        criar("div", {}, tituloEmVarredura("Sala de aula"), ladoDoAluno(turma.marcarVoce)),
        turma.no)));
}
