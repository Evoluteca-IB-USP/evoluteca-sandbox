/* A pergunta à turma, no lugar da urna da porta da sala: quem visita dá um
   palpite clicando no eixo, e uma turma de 30 responde. Cada aluno roda a
   deriva genética com o próprio sorteio e o ponto dele cai no gráfico, como
   as respostas chegam ao professor numa sala de verdade. */

import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";

const ALUNOS = 30, N = 20, GERACOES = 30, PERTO = 2;
const L = 400, X0 = 20, X1 = 380, BASE = 200, EIXO = 210, PASSO = 9.5;
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const xDe = (k) => X0 + (k / N) * (X1 - X0);
const parado = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function respostas(semente) {
  const rng = criarRng(semente);
  return Array.from({ length: ALUNOS }, () => {
    let k = N / 2;
    for (let g = 0; g < GERACOES; g++) k = rbinom(N, k / N, rng);
    return k;
  });
}

function desenhar() {
  const raiz = svg("svg", { viewBox: `0 0 ${L} 232`, class: "pergunta-desenho", "aria-hidden": "true" });
  raiz.append(svg("line", { x1: X0 - 8, x2: X1 + 8, y1: EIXO, y2: EIXO, class: "pergunta-eixo" }));
  for (let k = 0; k <= N; k++) raiz.append(svg("line", { x1: xDe(k), x2: xDe(k), y1: EIXO, y2: EIXO + (k % 5 ? 3 : 6), class: "pergunta-eixo" }));
  for (const k of [0, 5, 10, 15, 20]) { const t = svg("text", { x: xDe(k), y: EIXO + 19, class: "pergunta-numero" }); t.textContent = k; raiz.append(t); }
  const cadeiras = Array.from({ length: ALUNOS }, (_, i) => {
    const c = svg("circle", { cx: L / 2 + ((i % 15) - 7) * 18, cy: 12 + Math.floor(i / 15) * 17, r: 5.5, class: "pergunta-aluno" });
    raiz.append(c);
    return c;
  });
  const marca = (classe) => {
    const g = svg("g", { class: classe });
    g.append(svg("line", { x1: 0, x2: 0, y1: 58, y2: EIXO, class: "pergunta-fio" }), svg("circle", { cx: 0, cy: EIXO, r: 5 }));
    const t = svg("text", { x: 0, y: 52 }); t.textContent = "você"; g.append(t);
    raiz.append(g);
    return g;
  };
  const fantasma = marca("pergunta-fantasma"), palpite = marca("pergunta-palpite");
  const pontos = svg("g");
  raiz.insertBefore(pontos, fantasma);
  const convite = svg("text", { x: L / 2, y: 140, class: "pergunta-convite" });
  convite.textContent = "clique no eixo para dar o seu palpite";
  raiz.append(convite);
  return { raiz, cadeiras, fantasma, palpite, pontos, convite };
}

export function perguntaDaTurma() {
  const d = desenhar();
  const area = criar("div", { class: "pergunta-area", tabindex: "0", role: "slider", "aria-label": "Seu palpite", "aria-valuemin": "0", "aria-valuemax": String(N), "aria-valuenow": String(N / 2) }, d.raiz);
  const estado = criar("p", { class: "pergunta-estado", "aria-live": "polite" });
  const outra = criar("button", { type: "button", class: "pergunta-outra", hidden: true }, criar("span", { "aria-hidden": "true", texto: "⚄ " }), "outra turma");
  let semente = 1, escolhido = null, foco = N / 2, tempos = [];

  const mover = (g, k) => { g.setAttribute("transform", `translate(${xDe(k)} 0)`); g.classList.add("visivel"); };
  const kDoPonteiro = (e) => {
    const caixa = d.raiz.getBoundingClientRect();
    const x = ((e.clientX - caixa.left) / caixa.width) * L;
    return Math.max(0, Math.min(N, Math.round(((x - X0) / (X1 - X0)) * N)));
  };

  function rodar() {
    tempos.forEach(clearTimeout); tempos = [];
    d.pontos.replaceChildren();
    d.cadeiras.forEach((c) => c.classList.remove("respondeu"));
    outra.hidden = true;
    const valores = respostas(semente++), pilhas = Array(N + 1).fill(0);
    const ordem = valores.map((_, i) => i).sort(() => Math.random() - 0.5);
    let feitos = 0;
    estado.textContent = `0 de ${ALUNOS} responderam`;
    const terminar = () => {
      const perto = valores.filter((v) => Math.abs(v - escolhido) <= PERTO).length;
      estado.replaceChildren(criar("b", { texto: `${perto} de ${ALUNOS}` }), ` chegaram perto do seu palpite (${escolhido}, com folga de ${PERTO}).`);
      outra.hidden = false;
    };
    ordem.forEach((i, n) => {
      const responder = () => {
        const k = valores[i], alvo = [xDe(k), BASE - pilhas[k]++ * PASSO];
        const cadeira = d.cadeiras[i], de = [+cadeira.getAttribute("cx"), +cadeira.getAttribute("cy")];
        cadeira.classList.add("respondeu");
        const ponto = svg("circle", { cx: alvo[0], cy: alvo[1], r: 4.3, class: Math.abs(k - escolhido) <= PERTO ? "pergunta-ponto perto" : "pergunta-ponto" });
        d.pontos.append(ponto);
        if (++feitos === ALUNOS) terminar(); else estado.textContent = `${feitos} de ${ALUNOS} responderam`;
        if (parado()) return;
        let passo = 0;
        const id = setInterval(() => {
          const t = ++passo / 14;
          ponto.setAttribute("cx", de[0] + (alvo[0] - de[0]) * t);
          ponto.setAttribute("cy", de[1] + (alvo[1] - de[1]) * t * t);
          if (passo >= 14) clearInterval(id);
        }, 20);
        tempos.push(id);
      };
      if (parado()) responder(); else tempos.push(setTimeout(responder, 300 + n * 110));
    });
  }

  function escolher(k) {
    escolhido = foco = k;
    area.setAttribute("aria-valuenow", String(k));
    mover(d.palpite, k);
    d.convite.remove();
    d.fantasma.classList.remove("visivel");
    rodar();
  }

  area.addEventListener("pointermove", (e) => { const k = kDoPonteiro(e); if (k !== escolhido) mover(d.fantasma, k); else d.fantasma.classList.remove("visivel"); });
  area.addEventListener("pointerleave", () => d.fantasma.classList.remove("visivel"));
  area.addEventListener("click", (e) => escolher(kDoPonteiro(e)));
  area.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); foco = Math.max(0, Math.min(N, foco + (e.key === "ArrowLeft" ? -1 : 1))); mover(d.fantasma, foco); area.setAttribute("aria-valuenow", String(foco)); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(foco); }
  });
  outra.addEventListener("click", rodar);

  return criar("figure", { class: "pergunta" },
    criar("p", { class: "kicker-secao", texto: "Pergunta para a turma" }),
    criar("p", { class: "pergunta-enunciado", texto: `Numa população de ${N} indivíduos, ${N / 2} têm uma variante. Depois de ${GERACOES} gerações, só com o acaso, quantos terão a variante?` }),
    area,
    criar("div", { class: "pergunta-linha" }, estado, outra),
    criar("figcaption", {}, criar("b", { texto: "Figura 1. " }), "Cada ponto é um aluno que rodou a deriva genética com o próprio sorteio."));
}
