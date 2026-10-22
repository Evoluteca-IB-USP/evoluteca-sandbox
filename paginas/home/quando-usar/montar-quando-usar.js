/* A seção "Quando usar um simulador", como a Figura 3 de um artigo sobre
   papel pontilhado.

   O que esta seção É: para que perguntas um simulador serve, e onde ele
   para. Não é uma aula de evolução (a seção 01), nem a explicação do que é
   um simulador (a 02), nem a vitrine do acervo (o catálogo): o modelo de
   cada painel empresta o `simular()`, mas não é apresentado.

   A forma: à direita, o painel, com a letra no canto e os eixos sobre os
   pontos do papel; a poeira sai do papel, forma a pergunta dentro dos
   eixos e vira a figura que a responde. À esquerda, a legenda, um
   parágrafo só, com um trecho por painel, de (A) a (E): o trecho da vez é
   tingido de azul enquanto o passo corre, e os já lidos ficam com a letra
   laranja. O (E) é o do leitor e leva ao acervo; ali a seção para.

     montar(secao, entradas)
       entradas = [{ slug, modulo }, …]   modulo = { meta, simular } */

import { criar } from "escrever-html";
import { criarRng } from "r";
import { clamp } from "../../desenho-em-canvas/__pacote__.js";
import { lista, previstos } from "../../../modelos-de-simulacao/__pacote__.js";
import { poeiraDeTexto, figuraDaSituacao } from "./poeira/__pacote__.js";
import { criarPoeiraEmPassos, TEMPOS } from "./poeira-em-passos.js";
import { papel, areaDaFigura, eixos, moldura, anotar } from "./moldura-e-letreiros.js";
import { passosDaSecao } from "./situacoes.js";

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function montar(secao, entradas) {
  const container = secao.querySelector(".container");
  const passos = passosDaSecao(entradas);
  const ultimo = passos.length - 1;

  /* ---------- a legenda ---------- */
  const trechos = passos.map((p, i) => {
    const t = criar("span", { class: "quando-trecho", role: "button", tabindex: "0" },
      criar("b", { class: "quando-letra", texto: `(${p.letra})` }), " ",
      criar("b", { texto: `${maiuscula(p.curto)}${p.curto.endsWith("?") ? "" : "."}` }), ` ${p.explica}`,
      p.convite ? criar("a", { class: "quando-acervo-na-legenda", href: "catalogo.html", texto: " Explorar o acervo →" }) : "");
    t.addEventListener("click", (ev) => { if (!ev.target.closest("a")) controle.ir(i); });
    t.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); controle.ir(i); } });
    return t;
  });
  const legenda = criar("p", { class: "quando-legenda" },
    criar("b", { class: "quando-figura", texto: "Figura 3." }), " Quatro perguntas, e até onde um simulador vai em cada uma. ",
    ...trechos.flatMap((t) => [t, " "]));

  /* ---------- o painel ---------- */
  const tela = criar("canvas", { class: "quando-tela", "aria-hidden": "true" });
  const letra = criar("span", { class: "quando-letra-do-painel", "aria-hidden": "true" });
  const deNovo = criar("button", { type: "button", class: "vivo-elo quando-denovo", texto: "ver de novo" });
  const convite = criar("div", { class: "quando-convite" },
    criar("a", { class: "quando-acervo", href: "catalogo.html" },
      criar("b", { texto: "Explorar o acervo" }),
      criar("small", { texto: `${lista.length + previstos.length} simuladores, cada um com a sua pergunta →` })),
    deNovo);
  const painel = criar("figure", { class: "quando-painel" }, letra, tela, convite);
  container.append(criar("div", { class: "quando-folha" }, legenda, painel));

  /* ---------- a poeira de cada passo ---------- */
  const guardadas = new Map();
  function formas(i, W, H) {
    const chave = `${i}:${W}x${H}`;
    if (guardadas.has(chave)) return guardadas.get(chave);
    const pp = papel(tela, secao), p = passos[i];
    const m = { e: pp.x(56), d: pp.x(W - 14), t: pp.y(52), b: pp.y(H - 52) };
    const caixa = { x: m.e + 24, y: m.t, w: m.d - m.e - 48, h: (m.b - m.t) * (p.convite ? 0.5 : 0.8) };
    const f = { m, texto: poeiraDeTexto(W, H, p.pergunta, caixa, criarRng(40 + i)),
                fig: p.convite ? null : figuraDaSituacao(p, p.modulo, areaDaFigura(m)) };
    guardadas.set(chave, f);
    return f;
  }
  /* a primeira vez, a poeira sai dos pontos do papel */
  function origem(W, H, n) {
    const pp = papel(tela, secao), rng = criarRng(9);
    return Array.from({ length: n }, () => [pp.x(rng() * W), pp.y(rng() * H), "#cfd5df"]);
  }

  let fase = "";
  const controle = criarPoeiraEmPassos({
    tela, secao, passos, formas, origem, pausadores: [legenda, painel],
    aoMarcar(k) {
      trechos.forEach((t, i) => {
        t.dataset.estado = i < k ? "lido" : i === k ? "ativo" : "futuro";
        t.style.setProperty("--p", i < k ? "100%" : "0%");
      });
      letra.textContent = passos[k].letra;
      painel.toggleAttribute("data-convite", k === ultimo);
    },
    fundo(e) { eixos(e.ctx, e.forma.m); },
    frente(e) {
      if (e.rumo !== fase) { fase = e.rumo; painel.dataset.fase = fase; }
      trechos[e.k].style.setProperty("--p", `${(e.fracao * 100).toFixed(1)}%`);
      if (!e.aFig) return;
      moldura(e.ctx, e.forma.m, e.forma.fig.eixos, e.aFig);
      if (e.rumo !== "figura") return;
      const s = e.f * TEMPOS.figura;      // a anotação entra depois da figura e sai antes dela
      anotar(e.ctx, e.forma.fig.eixos.alvo, passos[e.k].nota, clamp((s - 0.6) / 1.2) * clamp((TEMPOS.figura - s) / 0.4), e.W);
    },
  });
  deNovo.addEventListener("click", () => controle.recomecar());
}
