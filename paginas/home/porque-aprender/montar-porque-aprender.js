/* A moldura das sete apostas: a trilha vai do prelúdio (nó 0) à síntese
   (nó final), passando pelas perguntas; cada pergunta tem a sua maneira
   de apostar (apostas/), a leitura do resultado e o motivo. A figura de cada pergunta
   mora em figuras/; o texto, em perguntas.js. Esta camada não sabe desenhar
   nada — ela abre, pergunta e manda revelar. */

import { criar } from "escrever-html";
import { trilhaDePassos } from "../../../motor-de-simuladores/interface/abas/trilha-de-passos.js";
import { PERGUNTAS } from "./perguntas.js";
import { preludio, sintese } from "./preludio-e-sintese.js";

export function montar(secao) {
  secao.className = "secao";
  let k = 0, figura = null, respondido = false;
  let passo = 0;
  const feitas = new Set(), acertos = new Set(), vistos = new Set(), crencas = new Map();   // acertos: as apostas que chegaram perto
  const FIM = PERGUNTAS.length + 1;
  const entradas = [{ titulo: "Antes de apostar", marca: "0" }, ...PERGUNTAS.map((q, i) => ({ titulo: q.titulo, marca: i + 1 })), { titulo: "De volta às frases", marca: "fim" }];
  const trilha = trilhaDePassos({ entradas, semente: 7, aoEscolher: ir });
  trilha.classList.add("perguntas-trilha");
  const pergunta = criar("p", { class: "pergunta-texto" });
  const opcoes = criar("div", { class: "aposta-opcoes" });
  let aposta = null;
  const leitura = criar("p", { class: "vivo-texto aposta-leitura", hidden: true });
  const motivoN = criar("p", { class: "porque-kicker" });
  const motivoP = criar("p", { class: "motivo-frase" });
  const motivo = criar("div", { class: "motivo", hidden: true }, motivoN, motivoP);
  const acoes = criar("div", { class: "vivo-acoes", hidden: true });
  const coluna = criar("div", { class: "perguntas-coluna" });
  const palco = criar("div", { class: "perguntas-palco" });
  const pe = criar("div", { class: "perguntas-pe" });

  secao.replaceChildren(
    criar("div", { class: "container" },
      criar("h2", { class: "titulo-secao", texto: "Por que aprender evolução" }),
      trilha,
      criar("div", { class: "perguntas" },
        coluna,
        criar("div", {}, palco, pe))));

  function marcar() {
    vistos.add(passo);
    trilha.querySelectorAll(".trilha-passo").forEach((b, j) => {
      b.setAttribute("aria-pressed", String(j === passo));
      b.toggleAttribute("data-feita", j === 0 || j === FIM ? vistos.has(j) : feitas.has(j - 1));
    });
  }
  function ir(t) {
    if (t === 0) abrirPonta(() => preludio(coluna, palco, { crencas, perguntas: PERGUNTAS, aoComecar: () => abrir(0) }), "preludio");
    else if (t === FIM) abrirPonta(() => sintese(coluna, palco, { perguntas: PERGUNTAS, feitas, acertos, crencas, abrir }), "sintese");
    else abrir(t - 1);
  }
  function abrirPonta(desenhar, tipo) {
    if (figura) figura.parar();
    figura = null; passo = tipo === "preludio" ? 0 : FIM; marcar();
    palco.className = `perguntas-palco perguntas-palco-${tipo}`; pe.replaceChildren();
    desenhar();
  }
  function abrir(i) {
    if (figura) figura.parar();
    k = i; respondido = false; passo = k + 1;
    const q = PERGUNTAS[k];
    marcar();
    palco.className = "perguntas-palco";
    coluna.replaceChildren(pergunta, opcoes, leitura, motivo, acoes);
    pergunta.textContent = q.pergunta;
    leitura.hidden = true; motivo.hidden = true; acoes.hidden = true; acoes.replaceChildren();
    palco.style.cursor = ""; palco.replaceChildren(); pe.replaceChildren();
    figura = q.figura(palco, pe); figura.preparar();
    aposta = q.aposta({ figura, aoApostar: responder });
    opcoes.replaceChildren(aposta.no);
  }
  function responder(valor) {
    if (respondido) return; respondido = true; feitas.add(k);
    const q = PERGUNTAS[k];
    aposta.travar();
    figura.revelar((resultado) => {
      const { modelo, perto } = q.comparar(valor, resultado);
      if (perto) acertos.add(k);
      aposta.revelar(modelo, perto);
      marcar();
      leitura.innerHTML = q.leitura(resultado); leitura.hidden = false;
      motivoN.textContent = `Motivo ${k + 1}`; motivoP.textContent = q.motivo;
      motivo.classList.remove("motivo-entra"); void motivo.offsetWidth; motivo.hidden = false; motivo.classList.add("motivo-entra");
      acoes.replaceChildren();
      const prox = criar("button", { type: "button", class: "vivo-elo", texto: k + 1 < PERGUNTAS.length ? "próxima pergunta →" : "de volta às frases →" });
      prox.addEventListener("click", () => ir(k + 2)); acoes.append(prox);
      if (q.depois && figura.deNovo) { const d = criar("button", { type: "button", class: "vivo-elo", texto: q.depois }); d.addEventListener("click", () => figura.deNovo()); acoes.append(d); }
      acoes.hidden = false;
    });
  }
  ir(0);
  /* só para captura de tela: #q=2&t=1.4 abre a pergunta 2 já respondida, no instante t */
  const m = /q=(\d+)(?:&t=([\d.]+))?/.exec(location.hash);
  if (m) { abrir(+m[1] - 1); responder(aposta.valor() ?? [0.5, 0.5]); figura.parar(); if (figura.captura) figura.captura(m[2] ? +m[2] : 1e9); }
}
