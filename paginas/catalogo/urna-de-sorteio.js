/* A urna: uma bola por simulador (cheias = prontos). Clicar na urna ou em
   "Sortear" sorteia uma, sem reposição: depois de SEM_REPOSICAO sorteios,
   o clique seguinte devolve todas as bolas e sorteia de novo. */

import { criar } from "escrever-html";

const SEM_REPOSICAO = 4;
const GIROS = 14;            // quantas bolas acendem antes de parar na sorteada

export function criarUrna(entradas) {
  const bolas = entradas.map((e) => criar("span", { class: `urna-bola${e.previsto ? "" : " urna-pronta"}` }));
  const urna = criar("button", { type: "button", class: "urna-bolas", "aria-label": "Sortear um simulador" }, ...bolas);
  const resultado = criar("span", { class: "urna-resultado", "aria-live": "polite" });
  const acao = criar("button", { type: "button", class: "urna-acao" });

  const fora = [];
  let girando = false;

  function sortear() {
    if (girando) return;
    girando = true;
    if (fora.length === SEM_REPOSICAO) {
      fora.forEach((i) => bolas[i].classList.remove("urna-fora", "urna-vez"));
      fora.length = 0;
    }
    bolas.forEach((b) => b.classList.replace("urna-vez", "urna-fora"));
    const restantes = bolas.map((_, i) => i).filter((i) => !fora.includes(i));
    const final = restantes[Math.floor(Math.random() * restantes.length)];
    let passo = 0, atual = null;
    const girar = () => {
      if (atual !== null) bolas[atual].classList.remove("urna-vez");
      atual = passo < GIROS ? restantes[Math.floor(Math.random() * restantes.length)] : final;
      bolas[atual].classList.add("urna-vez");
      if (passo++ < GIROS) return setTimeout(girar, 40 + passo * 9);
      fora.push(final);
      mostrar(entradas[final]);
      rotular();
      girando = false;
    };
    girar();
  }

  function mostrar(e) {
    resultado.replaceChildren(e.previsto
      ? criar("span", { class: "urna-titulo urna-titulo-previsto", texto: `${e.titulo} · em preparação` })
      : criar("a", { class: "urna-titulo", href: e.href, texto: `${e.titulo} →` }));
  }

  function rotular() {
    const texto = !fora.length ? "Sortear um simulador" : fora.length === SEM_REPOSICAO ? "Devolver as bolas e sortear" : "Sortear outro";
    acao.innerHTML = `<span class="urna-dado" aria-hidden="true">⚄</span> ${texto}`;
  }

  rotular();
  urna.addEventListener("click", sortear);
  acao.addEventListener("click", sortear);
  return criar("div", { class: "urna" }, urna, criar("p", { class: "urna-linha" }, resultado, acao));
}
