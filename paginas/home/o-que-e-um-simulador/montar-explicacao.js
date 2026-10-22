/* "O que é um simulador": a placa de colônias cobre a seção de borda a
   borda e, por cima, à esquerda, fica só o texto, com a regra escrita em
   desenhos do tamanho de uma letra. Com o mouse num trecho com desenho, a
   placa responde onde a coisa acontece: um anel marca o ponto e um quadro
   de perto abre ao lado dele. Só o que o olho não alcança ganha zoom (uma
   divisão, uma família nascendo, uma filha de outra cor); as amarelas se
   veem na própria placa, e um anel em volta da colônia diz quanto da borda
   elas ocupam. */

import { criar } from "escrever-html";
import { criarPlacaDeColonias } from "./placa-de-colonias.js";
import { criarLentes } from "./lentes-que-explicam.js";
import { desenharAnel, cercarColonia } from "./aneis-na-placa.js";
import { criarSorteio } from "./lugares-das-colonias.js";
import { FRASE, legenda, criarParagrafos } from "./frases-ilustradas.js";

const QUADRO = 200;                       // lado, em px, do quadro de perto

export function montar(secao) {
  secao.className = "secao";
  const tela = criar("canvas", { class: "fundo-tela", "aria-hidden": true });
  const camada = criar("canvas", { class: "explica-camada", "aria-hidden": true });
  const vista = criar("canvas", { class: "explica-vista", "aria-hidden": true });
  const nota = criar("figcaption", {});
  const quadro = criar("figure", { class: "explica-quadro", "aria-hidden": true }, vista, nota);
  const texto = criar("div", { class: "explica-texto" });
  const p = criarPlacaDeColonias(secao, tela, criarSorteio(secao, ocupada, naJanela));

  const mudar = (campo, v) => { p.regra[campo] = v; p.recomecar(); };
  texto.append(
    criar("h2", { class: "titulo-secao", texto: "O que é um simulador" }),
    criar("p", { class: "intro-secao", html: FRASE }),
    criar("div", { class: "explica-corpo" }, ...criarParagrafos(p.regra, mudar)));
  secao.replaceChildren(tela, camada, criar("div", { class: "container" }, texto), quadro);

  const medida = (no) => {
    const r = no.getBoundingClientRect(), o = secao.getBoundingClientRect();
    return { esq: r.left - o.left, dir: r.right - o.left, topo: r.top - o.top, base: r.bottom - o.top };
  };

  /* onde nenhuma colônia nasce: sob o texto */
  function ocupada(x, y) {
    const t = medida(texto);
    return x > t.esq - 40 && x < t.dir + 40 && y > t.topo - 40 && y < t.base + 40;
  }

  /* os pontos que a placa mostra ficam longe do texto, para o quadro caber de um lado ou do outro deles */
  function naJanela(x, y) {
    return !ocupada(x, y) && x > medida(texto).dir + 300 && x < secao.clientWidth - 40 && y > 170 && y < secao.clientHeight - 170;
  }

  const trechos = [...texto.querySelectorAll(".explica-trecho")];
  let sobre = null;
  for (const t of trechos) {
    t.addEventListener("pointerenter", () => { sobre = t; });
    t.addEventListener("pointerleave", () => { if (sobre === t) sobre = null; });
  }

  /* o quadro abre ao lado do anel, do lado em que couber */
  function posicionar([x, y]) {
    const esq = x + 44 + QUADRO < secao.clientWidth - 20 ? x + 44 : x - 44 - QUADRO;
    quadro.style.left = `${esq}px`;
    quadro.style.top = `${Math.max(90, Math.min(secao.clientHeight - QUADRO - 150, y - QUADRO / 2))}px`;
  }

  p.comecar();
  const L = criarLentes(p, { naJanela });
  let escrita = null, posto = null;

  function quadroDaVez(t) {
    L.passo(t);
    const qual = sobre ? sobre.dataset.lupa : null;
    for (const tr of trechos) tr.classList.toggle("da-vez", tr === sobre);

    /* com a filha igual à mãe não há mutante: o quadro mostra as manchas que se formam */
    const lupa = !qual || qual === "amarelas" ? null : qual === "mutante" && !(p.regra.mutacao > 0) ? "nascimento" : qual;
    const foco = lupa ? L[lupa].foco : null;
    if (qual === "amarelas") cercarColonia(camada, secao, L.vantagem.foco, L.vantagem.medida, p.CEL);
    else desenharAnel(camada, secao, foco, t);

    /* o quadro fica parado enquanto o mouse não sai do trecho; sem ponto ainda
       (a placa espera um mutante), ele abre perto da colônia que nasce */
    const ponto = foco ?? L.nascimento.foco;
    if (!lupa || !ponto) posto = null;
    else if (!posto || posto.sobre !== sobre || (!posto.noFoco && foco)) { posicionar(ponto); posto = { sobre, noFoco: !!foco }; }
    quadro.classList.toggle("aberto", !!posto);
    if (posto) {
      L[lupa].desenhar(vista, t);
      const l = legenda(qual, p.regra);
      if (l !== escrita) { escrita = l; nota.textContent = l; }
    }
    requestAnimationFrame(quadroDaVez);
  }
  requestAnimationFrame(quadroDaVez);
}
