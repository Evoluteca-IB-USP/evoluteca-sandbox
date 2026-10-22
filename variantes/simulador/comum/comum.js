/* O que as três variantes do simulador de deriva compartilham: a moldura
   do site (faixas da USP, header, rodapé), o campo numérico que vive dentro
   de uma frase e o tocador (voltar ao início, tocar/pausar, um passo). */

import { criar } from "escrever-html";

const RAIZ = "../../";

export function montarMoldura() {
  document.body.prepend(
    criar("div", { class: "usp-faixa-amarela" }),
    criar("div", { class: "usp-faixa-azul" }),
    criar("div", { class: "usp-barra", html:
      `<div class="container usp-barra-inner">
        <a class="usp-logo" href="https://www.ib.usp.br" rel="external"><img src="${RAIZ}imagens/simbolo_ib_bco.png" alt="Instituto de Biociências da USP" class="usp-logo-ib"></a>
        <a class="usp-logo" href="https://www5.usp.br" rel="external"><img src="${RAIZ}imagens/logo_usp_bco.png" alt="Universidade de São Paulo" class="usp-logo-usp"></a>
      </div>` }),
    criar("header", { class: "topo", html:
      `<div class="container topo-inner">
        <a class="marca" href="${RAIZ}index.html"><span class="marca-nome">Evoluteca</span><span class="marca-sub">Instituto de Biociências · USP</span></a>
        <nav class="nav" aria-label="Principal"><a href="${RAIZ}index.html">Início</a><a href="${RAIZ}catalogo.html" aria-current="page">Simuladores</a></nav>
      </div>` }),
  );
  document.body.append(criar("footer", { class: "rodape", html:
    `<div class="container rodape-grid">
      <div><h4>Evoluteca</h4><ul><li><a href="${RAIZ}index.html">Início</a></li><li><a href="${RAIZ}catalogo.html">Simuladores</a></li></ul></div>
      <div><h4>Institucional</h4><ul><li><a href="https://www.ib.usp.br" rel="external">Instituto de Biociências</a></li><li><a href="https://www5.usp.br" rel="external">Universidade de São Paulo</a></li></ul></div>
      <div class="rodape-logos">
        <a href="https://www.ib.usp.br" rel="external"><img class="rodape-logo-ib" src="${RAIZ}imagens/logo_ib_bco.png" alt="Instituto de Biociências da USP"></a>
        <a href="https://www5.usp.br" rel="external"><img class="rodape-logo-usp" src="${RAIZ}imagens/logo_usp_bco.png" alt="Universidade de São Paulo"></a>
      </div>
    </div>
    <div class="rodape-base"><div class="container">© 2026 Evoluteca · Instituto de Biociências · Universidade de São Paulo — textos em CC BY 4.0, código MIT</div></div>` }));
}

/** um número editável escrito dentro da frase, com o tracejado da busca do catálogo */
export function campo({ valor, min, max, sufixo = "", placeholder, rotulo, aoMudar }) {
  const entrada = criar("input", {
    class: "frase-campo", type: "number", inputmode: "numeric",
    min, max, value: valor, placeholder, "aria-label": rotulo,
  });
  const ajustar = () => { entrada.style.width = `${Math.max(1, String(entrada.value).length) + 0.6}ch`; };
  entrada.addEventListener("input", ajustar);
  entrada.addEventListener("change", () => {
    const v = Math.round(Math.min(max, Math.max(min, Number(entrada.value) || min)));
    entrada.value = v;
    ajustar();
    aoMudar(v);
  });
  entrada.addEventListener("focus", () => entrada.select());
  ajustar();
  return criar("span", { class: "frase-caixa" }, entrada, sufixo && criar("span", { class: "frase-sufixo", texto: sufixo }));
}

const ICONES = {
  inicio: `<svg viewBox="0 0 24 24"><path d="M7 6v12M18 6l-8 6 8 6z"/></svg>`,
  tocar: `<svg viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z"/></svg>`,
  pausar: `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`,
  passo: `<svg viewBox="0 0 24 24"><path d="M6 6l8 6-8 6zM17 6v12"/></svg>`,
};

/** os três botões; quem chama decide o que cada um faz e avisa se está tocando */
export function tocador({ aoReiniciar, aoAlternar, aoPassar }) {
  const botao = (nome, rotulo, fn, extra = "") => {
    const b = criar("button", { type: "button", class: `tocador-botao ${extra}`, "aria-label": rotulo, html: ICONES[nome] });
    b.addEventListener("click", fn);
    return b;
  };
  const tocar = botao("tocar", "Tocar", aoAlternar, "tocador-principal");
  const no = criar("div", { class: "tocador" },
    botao("inicio", "Recomeçar", aoReiniciar), tocar, botao("passo", "Uma geração", aoPassar));
  no.marcar = (tocando) => {
    tocar.innerHTML = ICONES[tocando ? "pausar" : "tocar"];
    tocar.setAttribute("aria-label", tocando ? "Pausar" : "Tocar");
  };
  return no;
}

/** um canvas nítido em tela de alta densidade, redimensionado junto com a janela */
export function palco(canvas, desenhar) {
  const ajustar = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    desenhar();
  };
  new ResizeObserver(ajustar).observe(canvas);
  return { ctx: canvas.getContext("2d"), W: () => canvas.clientWidth, H: () => canvas.clientHeight };
}
