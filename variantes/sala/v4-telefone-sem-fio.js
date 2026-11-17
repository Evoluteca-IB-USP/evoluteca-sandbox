/* v4 · telefone sem fio. A turma em roda: o professor cochicha uma frase e
   ela dá a volta, de aluno em aluno. A cada cochicho uma letra pode trocar,
   como um erro de cópia no DNA; a carteira onde a frase mudou fica âmbar.
   Passar o mouse num aluno mostra a frase como ele ouviu. O professor entra
   por uma segunda frase, do tamanho da frase do aluno. */

import { criar } from "escrever-html";
import { criarRng } from "r";
import { tituloEmVarredura } from "../../paginas/catalogo/titulo-em-varredura.js";
import { ladoDoAluno, entradaDoProfessor, linhaDaFigura, svg, parado } from "./comum/pecas-da-porta.js";

const FRASES = ["seleção natural", "deriva genética", "ancestral comum", "origem das espécies", "tempo geológico", "árvore da vida"];
const LETRAS = "abcdefghijlmnopqrstuvxz";
const FEIO = /put|merd|bost|cu\b|fod|pica|sex/; // troca que forma palavrão é sorteada de novo
const ALUNOS = 23, ERRO = 0.2, PASSO = 190;
const LADO = 400, RAIO = 170;

const lugar = (i) => {
  const a = (i / (ALUNOS + 1)) * 2 * Math.PI - Math.PI / 2;
  return [LADO / 2 + RAIO * Math.cos(a), LADO / 2 + RAIO * Math.sin(a)];
};

/* a frase como cada um ouviu: a posição 0 é a do professor */
function cochichar(frase, rng) {
  const versoes = [frase];
  for (let i = 1; i <= ALUNOS; i++) {
    let ouvida = versoes[i - 1];
    if (rng() < ERRO) {
      const letras = [...ouvida].map((c, k) => (c === " " ? -1 : k)).filter((k) => k >= 0);
      const k = letras[Math.floor(rng() * letras.length)];
      let nova;
      do nova = LETRAS[Math.floor(rng() * LETRAS.length)]; while (nova === ouvida[k] || FEIO.test(ouvida.slice(0, k) + nova + ouvida.slice(k + 1)));
      ouvida = ouvida.slice(0, k) + nova + ouvida.slice(k + 1);
    }
    versoes.push(ouvida);
  }
  return versoes;
}

function desenharRoda() {
  const c = LADO / 2;
  const raiz = svg("svg", { viewBox: `0 0 ${LADO} ${LADO}`, class: "v4-roda", "aria-hidden": "true" });
  const feito = svg("circle", { cx: c, cy: c, r: RAIO, class: "v4-feito", pathLength: 1, transform: `rotate(-90 ${c} ${c})` });
  raiz.append(svg("circle", { cx: c, cy: c, r: RAIO, class: "v4-trilho" }), feito);
  const lugares = Array.from({ length: ALUNOS + 1 }, (_, i) => {
    const [x, y] = lugar(i);
    const no = svg("g", { class: i ? "v4-aluno" : "v4-aluno v4-professor", transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
    no.append(svg("circle", { r: 15, class: "v4-toque" }), svg("circle", { r: i ? 7 : 8, class: "v4-bola" }));
    if (!i) no.append(svg("circle", { r: 13, class: "v4-anel" }));
    raiz.append(no);
    return no;
  });
  return { raiz, feito, lugares };
}

function figura() {
  const roda = desenharRoda();
  const frase = criar("p", { class: "v4-frase" });
  const legenda = criar("p", { class: "v4-legenda" });
  const palco = criar("div", { class: "v4-palco", role: "button", tabindex: "0", "aria-label": "Passar a frase adiante" },
    roda.raiz, criar("div", { class: "v4-centro" }, criar("p", { class: "v4-kicker", texto: "Telefone sem fio" }), frase, legenda));
  const { linha, estado, rotular } = linhaDaFigura("Cochichar a frase", () => rodar());
  let rodada = 0, versoes = [FRASES[0]], ate = 0, relogio = null, correndo = false;

  /* a frase como o aluno `i` ouviu; as letras que já não são as do professor vão grifadas */
  function mostrar(i) {
    const original = versoes[0], ouvida = versoes[i], antes = versoes[i - 1];
    frase.replaceChildren(...[...ouvida].map((c, k) => (c === original[k] ? c : criar("mark", { class: antes && antes[k] !== c ? "v4-nova" : null, texto: c }))));
    legenda.textContent = !ate ? "clique para o professor cochichar" : !i ? "como saiu do professor" : i === ALUNOS && !correndo ? "como chegou ao último aluno" : `como o aluno ${i} ouviu`;
  }

  function pintar() {
    roda.feito.style.strokeDashoffset = 1 - ate / (ALUNOS + 1);
    roda.lugares.forEach((no, i) => {
      no.classList.toggle("v4-ouviu", i <= ate && ate > 0);
      no.classList.toggle("v4-errou", i > 0 && i <= ate && versoes[i] !== versoes[i - 1]);
      no.classList.toggle("v4-vez", correndo && i === ate);
    });
  }

  function terminar() {
    correndo = false;
    pintar();
    mostrar(ALUNOS);
    const trocadas = [...versoes[ALUNOS]].filter((c, k) => c !== versoes[0][k]).length;
    estado.replaceChildren(...(trocadas
      ? [criar("b", { texto: trocadas === 1 ? "1 letra trocada" : `${trocadas} letras trocadas` }), ` em ${ALUNOS} cochichos. No DNA, um erro de cópia assim é uma mutação.`]
      : [criar("b", { texto: "Nenhuma letra trocada" }), ` em ${ALUNOS} cochichos. Copiar certo é o mais comum.`]));
    rotular("Cochichar outra frase");
  }

  function rodar() {
    clearTimeout(relogio);
    versoes = cochichar(FRASES[rodada % FRASES.length], criarRng(7 + rodada));
    rodada++;
    estado.textContent = "";
    if (parado()) { ate = ALUNOS; return terminar(); }
    correndo = true;
    ate = 0;
    const passo = () => {
      ate++;
      pintar();
      mostrar(ate);
      if (ate < ALUNOS) relogio = setTimeout(passo, PASSO); else relogio = setTimeout(terminar, PASSO * 2);
    };
    passo();
  }

  roda.lugares.forEach((no, i) => {
    no.addEventListener("pointerenter", () => { if (ate && i <= ate && !correndo) { mostrar(i); roda.lugares.forEach((n, k) => n.classList.toggle("v4-lido", k === i)); } });
    no.addEventListener("pointerleave", () => { no.classList.remove("v4-lido"); if (ate && !correndo) mostrar(ate); });
  });
  palco.addEventListener("click", () => { if (!correndo) rodar(); });
  palco.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !correndo) { e.preventDefault(); rodar(); } });

  mostrar(0);
  return criar("figure", { class: "v4-figura" }, palco, linha);
}

export function montar(raiz) {
  const professor = entradaDoProfessor({ pergunta: "O professor é você? ", chamada: "Entre com o Cloudflare →", saudacao: "O professor é você: " });
  raiz.replaceChildren(
    criar("section", { class: "banner-catalogo porta v4" },
      criar("div", { class: "container banner-grade" },
        criar("div", {}, tituloEmVarredura("Sala de aula"), ladoDoAluno(), criar("div", { class: "v4-professor-frase" }, professor.linha, professor.balao)),
        figura())));
}
