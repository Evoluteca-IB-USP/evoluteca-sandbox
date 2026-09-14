/* A moldura das seis apostas: a trilha do índice, a pergunta, os botões da
   aposta, a leitura do resultado, o motivo e o fecho com o placar. A figura
   de cada pergunta mora em figuras/; o texto, em perguntas.js. Esta camada
   não sabe desenhar nada — ela abre, pergunta, manda revelar e conta. */

import { criar, criarTexto as T } from "escrever-html";
import { PERGUNTAS } from "./perguntas.js";

export function montar(secao, ajustes = {}) {
  const linkCatalogo = ajustes.linkCatalogo || "catalogo.html";
  secao.className = "secao";
  let k = 0, figura = null, respondido = false;
  const feitas = new Set(), acertos = new Set();
  const kicker = criar("p", { class: "porque-kicker" });
  const indice = criar("div", { class: "jogo-indice", role: "tablist" });
  const pergunta = criar("p", { class: "pergunta-texto" });
  const opcoes = criar("div", { class: "aposta-opcoes" });
  const leitura = criar("p", { class: "vivo-texto aposta-leitura", hidden: true });
  const motivoN = criar("p", { class: "porque-kicker" });
  const motivoP = criar("p", { class: "motivo-frase" });
  const motivo = criar("div", { class: "motivo", hidden: true }, motivoN, motivoP);
  const acoes = criar("div", { class: "vivo-acoes", hidden: true });
  const palco = criar("div", { class: "perguntas-palco" });
  const pe = criar("div", { class: "perguntas-pe" });
  const jogo = criar("div", { class: "perguntas" },
    criar("div", { class: "perguntas-coluna" }, pergunta, opcoes, leitura, motivo, acoes),
    criar("div", {}, palco, pe));
  const fecho = criar("div", { class: "perguntas-fecho", hidden: true });

  secao.replaceChildren(
    criar("div", { class: "container" },
      criar("h2", { class: "titulo-secao", texto: "Por que aprender evolução" }),
      criar("div", { class: "perguntas-cabeca" },
        criar("p", { class: "vivo-frase", html: "Seis casos reais. <b>Aposte antes de ver a resposta.</b>" }),
        criar("p", { class: "vivo-texto", html:
          "Cada pergunta é um experimento ou uma medição de verdade — e a resposta vem de um modelo " +
          "rodando na hora, com os números que saíram. Populações, acaso e muitas gerações são coisas " +
          "com que ninguém tem prática: errar aqui faz parte." })),
      criar("div", { class: "perguntas-trilha" }, kicker, indice),
      jogo, fecho));

  PERGUNTAS.forEach((_, i) => {
    const b = criar("button", { type: "button", class: "jogo-ponto", role: "tab", "aria-label": `pergunta ${i + 1}`, texto: String(i + 1) });
    b.addEventListener("click", () => abrir(i)); indice.append(b);
  });
  const pontoFecho = criar("button", { type: "button", class: "jogo-ponto jogo-ponto-fecho", role: "tab", "aria-label": "fecho", texto: "fim" });
  pontoFecho.addEventListener("click", fechar); indice.append(pontoFecho);

  function fechar() {                                  // o fecho: placar e os seis motivos
    if (figura) figura.parar();
    [...indice.children].forEach((b, j) => { b.setAttribute("aria-selected", String(j === PERGUNTAS.length)); b.toggleAttribute("data-feita", feitas.has(j)); });
    kicker.textContent = "Fecho";
    const n = feitas.size, a = acertos.size;
    const placar = n === 0 ? "Você ainda não apostou em nenhuma."
      : `Você apostou em ${n === PERGUNTAS.length ? "todas" : n} e acertou <b>${a}</b>${n < PERGUNTAS.length ? ` de ${n}` : ""}.`;
    const recomecar = criar("button", { type: "button", class: "vivo-elo", texto: n ? "apostar de novo" : "começar pela primeira" });
    recomecar.addEventListener("click", () => { feitas.clear(); acertos.clear(); abrir(0); });
    fecho.replaceChildren(
      criar("div", { class: "fecho-texto" },
        criar("p", { class: "vivo-frase", html: "Seis perguntas, <b>seis motivos</b>." }),
        criar("p", { class: "fecho-placar", html: placar }),
        criar("p", { class: "vivo-texto", html:
          "Errar aqui é normal — e é o ponto. Evolução é feita de populações, acaso e muitas gerações, " +
          "coisas com que ninguém tem prática. Cada simulador do acervo é um destes modelos com os " +
          "controles na mão: para mudar o que se quiser, rodar de novo e comparar." }),
        criar("div", { class: "vivo-acoes" },
          criar("a", { class: "botao botao-grande", href: linkCatalogo, texto: "Ver os simuladores" }), recomecar)),
      criar("ol", { class: "fecho-motivos" }, ...PERGUNTAS.map((q, i) => {
        const li = criar("li", {}, T(q.motivo));
        if (acertos.has(i)) li.setAttribute("data-acertou", ""); else if (feitas.has(i)) li.setAttribute("data-errou", "");
        li.addEventListener("click", () => abrir(i));
        return li;
      })));
    jogo.hidden = true; fecho.hidden = false;
    fecho.classList.remove("motivo-entra"); void fecho.offsetWidth; fecho.classList.add("motivo-entra");
  }

  function abrir(i) {
    if (figura) figura.parar();
    jogo.hidden = false; fecho.hidden = true;
    k = i; respondido = false;
    const q = PERGUNTAS[k];
    [...indice.children].forEach((b, j) => { b.setAttribute("aria-selected", String(j === k)); b.toggleAttribute("data-feita", feitas.has(j)); });
    kicker.textContent = `Pergunta ${k + 1} de ${PERGUNTAS.length}`;
    pergunta.textContent = q.pergunta;
    opcoes.replaceChildren(...q.opcoes.map((texto, j) => { const b = criar("button", { type: "button", class: "aposta-opcao", texto }); b.addEventListener("click", () => responder(j)); return b; }));
    leitura.hidden = true; motivo.hidden = true; acoes.hidden = true; acoes.replaceChildren();
    palco.style.cursor = ""; palco.replaceChildren(); pe.replaceChildren();
    figura = q.figura(palco, pe); figura.preparar();
  }
  function responder(j) {
    if (respondido) return; respondido = true; feitas.add(k); if (j === PERGUNTAS[k].certa) acertos.add(k);
    const q = PERGUNTAS[k];
    [...opcoes.children].forEach((b, i) => { b.disabled = true; if (i === j) b.setAttribute("aria-pressed", "true"); });
    figura.revelar((resultado) => {
      opcoes.children[q.certa].setAttribute("data-certa", "");
      indice.children[k].toggleAttribute("data-feita", true);
      leitura.innerHTML = q.leitura(resultado); leitura.hidden = false;
      motivoN.textContent = `Motivo ${k + 1}`; motivoP.textContent = q.motivo;
      motivo.classList.remove("motivo-entra"); void motivo.offsetWidth; motivo.hidden = false; motivo.classList.add("motivo-entra");
      const prox = criar("button", { type: "button", class: "vivo-elo", texto: k + 1 < PERGUNTAS.length ? "próxima pergunta →" : "ver o fecho →" });
      prox.addEventListener("click", () => (k + 1 < PERGUNTAS.length ? abrir(k + 1) : fechar()));
      acoes.replaceChildren(prox); acoes.hidden = false;
      if (q.depois && figura.deNovo) { const d = criar("button", { type: "button", class: "vivo-elo", texto: q.depois }); d.addEventListener("click", () => figura.deNovo()); acoes.append(d); }
    });
  }
  abrir(0);
  /* só para captura de tela: #q=2&t=1.4 abre a pergunta 2 já respondida, no instante t */
  const m = /q=(\d+)(?:&t=([\d.]+))?/.exec(location.hash);
  if (m) { abrir(+m[1] - 1); responder(0); figura.parar(); if (figura.captura) figura.captura(m[2] ? +m[2] : 1e9); }
  if (/fecho/.test(location.hash)) { PERGUNTAS.forEach((_, i) => { feitas.add(i); if (i % 3) acertos.add(i); }); fechar(); }
}
