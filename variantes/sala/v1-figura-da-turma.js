/* v1 · a figura da turma. À esquerda, o convite ao aluno e a frase do link;
   à direita, "Figura 1.": uma turma de 30 rodando a deriva, cada aluno com a
   sua semente, e as respostas caindo num gráfico de pontos. O professor
   entra pela nota de rodapé ¹, chamada no texto. */

import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";
import { lerLinkColado, irParaSala, entrarComoProfessor, campoNaFrase, enderecoLembrado, LINK_DO_CLOUDFLARE } from "./comum/porta-comum.js";

const ALUNOS = 30, N = 20, GERACOES = 30;
const L = 540, A = 330, X0 = 30, X1 = 510, BASE = 280;
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

function respostas(semente) {
  const rng = criarRng(semente);
  return Array.from({ length: ALUNOS }, () => {
    let k = N / 2;
    for (let g = 0; g < GERACOES; g++) k = rbinom(N, k / N, rng);
    return k;
  });
}

function figuraDaTurma() {
  const desenho = svg("svg", { viewBox: `0 0 ${L} ${A}`, class: "v1-desenho", role: "img", "aria-label": "Uma turma de 30 alunos respondendo; as respostas formam um gráfico de pontos." });
  const xDe = (k) => X0 + (k / N) * (X1 - X0);
  desenho.append(svg("line", { x1: X0 - 8, x2: X1 + 8, y1: BASE + 10, y2: BASE + 10, class: "v1-eixo" }));
  for (const k of [0, 5, 10, 15, 20]) {
    const t = svg("text", { x: xDe(k), y: BASE + 30, class: "v1-marca" }); t.textContent = k; desenho.append(t);
  }
  const cadeiras = Array.from({ length: ALUNOS }, (_, i) => {
    const c = svg("circle", { cx: 168 + (i % 10) * 26, cy: 26 + Math.floor(i / 10) * 26, r: 8, class: "v1-aluno" });
    desenho.append(c);
    return c;
  });
  const rotuloTurma = svg("text", { x: 138, y: 30, class: "v1-rotulo", "text-anchor": "end" }); rotuloTurma.textContent = "a turma";
  const contagem = svg("text", { x: 138, y: 48, class: "v1-contagem", "text-anchor": "end" });
  desenho.append(rotuloTurma, contagem);
  const pontos = svg("g");
  desenho.append(pontos);

  let rodada = 1, tempos = [];
  const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cair(ponto, de, para, aoChegar) {
    const passos = 18; let i = 0;
    const id = setInterval(() => {
      const t = ++i / passos, e = t * t;
      ponto.setAttribute("cx", de[0] + (para[0] - de[0]) * t);
      ponto.setAttribute("cy", de[1] + (para[1] - de[1]) * e);
      if (i >= passos) { clearInterval(id); aoChegar(); }
    }, 22);
    tempos.push(id);
  }

  function comecar() {
    tempos.forEach(clearTimeout); tempos = [];
    pontos.replaceChildren();
    cadeiras.forEach((c) => c.classList.remove("v1-respondeu"));
    const valores = respostas(rodada++), pilhas = Array(N + 1).fill(0);
    const ordem = valores.map((_, i) => i).sort(() => Math.random() - 0.5);
    let feitos = 0;
    contagem.textContent = `0 de ${ALUNOS} responderam`;
    ordem.forEach((i, n) => {
      const responder = () => {
        const k = valores[i], alvo = [xDe(k), BASE - pilhas[k]++ * 13];
        const cadeira = cadeiras[i], de = [+cadeira.getAttribute("cx"), +cadeira.getAttribute("cy")];
        cadeira.classList.add("v1-respondeu");
        const ponto = svg("circle", { cx: alvo[0], cy: alvo[1], r: 5.5, class: "v1-ponto" });
        pontos.append(ponto);
        contagem.textContent = `${++feitos} de ${ALUNOS} responderam`;
        if (parado) return;
        ponto.classList.add("v1-caindo");
        cair(ponto, de, alvo, () => ponto.classList.remove("v1-caindo"));
      };
      if (parado) responder(); else tempos.push(setTimeout(responder, 500 + n * 320));
    });
    if (!parado) tempos.push(setTimeout(comecar, 500 + ALUNOS * 320 + 3500));
  }
  comecar();

  return criar("figure", { class: "v1-figura" }, desenho,
    criar("figcaption", {}, criar("b", { texto: "Figura 1. " }),
      `Uma turma de ${ALUNOS} rodando a deriva genética, cada aluno com o seu próprio sorteio. Cada ponto é a resposta de um aluno: quantos dos ${N} indivíduos têm a variante depois de ${GERACOES} gerações. O professor vê o gráfico se formar enquanto as respostas chegam.`));
}

function fraseDoAluno() {
  const campo = campoNaFrase({ placeholder: "cole aqui", "aria-label": "Link da sala" });
  const dica = criar("p", { class: "frase-dica", texto: "Cole o link inteiro que o professor mandou." });
  const form = criar("form", { class: "v1-entrar" },
    criar("label", { class: "frase" }, criar("span", { texto: "O professor mandou o link" }),
      criar("span", { class: "frase-caixa" }, campo, criar("button", { type: "submit", class: "frase-seta", "aria-label": "Entrar na sala", texto: "→" }))),
    dica);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const link = lerLinkColado(campo.value);
    if (link) return irParaSala(link);
    dica.textContent = campo.value.trim() ? "Esse link não parece de uma sala. Confira se copiou ele inteiro." : "Cole o link inteiro que o professor mandou.";
    dica.classList.toggle("erro", !!campo.value.trim());
  });
  return form;
}

function notaDoProfessor() {
  const endereco = campoNaFrase({ placeholder: "seu-subdominio", "aria-label": "Endereço das suas salas", autocomplete: "username", value: enderecoLembrado() });
  const senha = campoNaFrase({ type: "password", placeholder: "senha", "aria-label": "Senha", autocomplete: "current-password" });
  const entrar = criar("button", { type: "submit", class: "acao-texto", texto: "entrar →" });
  const erro = criar("span", { class: "v1-erro", "aria-live": "polite" });
  const form = criar("form", { class: "v1-nota", id: "nota-professor" },
    criar("sup", { texto: "1" }),
    criar("b", { texto: "Para o professor. " }),
    "Minhas salas ficam em ", criar("span", { class: "frase-caixa" }, endereco),
    " e a senha é ", criar("span", { class: "frase-caixa" }, senha), " ", entrar, erro,
    criar("br"),
    "Primeira vez? ", criar("a", { class: "acao-texto", href: LINK_DO_CLOUDFLARE, texto: "Conectar com o Cloudflare →" }),
    criar("span", { class: "v1-nota-fina", texto: " As aulas e as respostas ficam na sua conta Cloudflare, que é gratuita." }));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    entrar.disabled = true;
    erro.textContent = (await entrarComoProfessor(endereco.value, senha.value)) ?? "";
    entrar.disabled = false;
  });
  return form;
}

export function montar(raiz) {
  raiz.replaceChildren(criar("section", { class: "v1" },
    criar("div", { class: "container v1-grade" },
      criar("div", { class: "v1-texto" },
        criar("p", { class: "kicker", texto: "Sala de aula" }),
        criar("h1", { html: "Entre na aula da sua turma<span>.</span>" }),
        criar("p", { class: "v1-lede" }, "Aqui você acompanha a aula que o professor",
          criar("a", { class: "v1-marca-nota", href: "#nota-professor", "aria-label": "nota 1, para o professor", texto: "¹" }),
          " abriu. Você roda o simulador, responde, e a resposta da turma inteira aparece junto."),
        fraseDoAluno()),
      figuraDaTurma()),
    criar("div", { class: "container" }, notaDoProfessor())));
}
