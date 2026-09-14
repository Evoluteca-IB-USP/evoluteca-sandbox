import { criar, criarTexto as T } from "escrever-html";
import { criarRng, rpois } from "r";
import { numero } from "portugues";
import { laco } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* evolução dirigida (Chen & Arnold 1993)
   Um trecho da enzima em letras, uma por aminoácido. A cada rodada:
   mil cópias do gene com erros ao acaso, testa todas, guarda a melhor.
   O efeito de cada erro na atividade é sorteado: quase sempre piora,
   raramente melhora um pouco. A atividade é multiplicativa. */
export function enzima(palco, pe, opts) {
  const SEQ = [..."AQSVPYGISQIKAPALHSQGYTGSNVKVAVIDSGIDSSHPDLNVRGGA"], AA = "ACDEFGHIKLMNPQRSTVWY";
  const COPIAS = 1000, ALVO = Math.log2(opts.alvo), MAX = 14, DUR = 1.4;
  const rng = criarRng(1993);
  const p = criar("p", { class: "frase-alvo jogo-frase enzima-seq", "aria-label": "trecho da enzima" });
  const spans = SEQ.map((c) => criar("span", { texto: c })); p.append(...spans);
  const rodada = criar("b", { texto: "0" }), ativ = criar("b", { texto: "×1" }), copias = criar("span", { texto: "" });
  const escada = criar("div", { class: "enzima-escada" });
  const degraus = []; for (let k = 0; k <= 8; k++) { const d = criar("span", { texto: `×${2 ** k}` }); degraus.push(d); escada.append(d); }
  palco.replaceChildren(criar("div", { class: "jogo-frase-caixa" }, p,
    criar("p", { class: "frase-marcador" }, criar("span", {}, T("rodada "), rodada), criar("span", {}, T("atividade "), ativ), copias), escada));
  const elo = criar("button", { type: "button", class: "vivo-elo", texto: "tire a seleção", hidden: true });
  pe.replaceChildren(criar("p", { class: "vivo-nota" }, T("A cada rodada: mil cópias do gene, uns dois erros em cada, fica a mais ativa. "), elo));
  let seq, log2 = 0, g = 0, comSelecao = true, recem = new Set(), velhas = new Set(), parar = null, pronta = false;
  const efeito = () => { const u = rng(); return u < 0.03 ? -Math.log(1 - rng()) * 0.75 : u < 0.5 ? 0 : Math.log(1 - rng()) * 1.5; };
  function zerar() { seq = [...SEQ]; log2 = 0; g = 0; pronta = false; recem.clear(); velhas.clear(); }
  function passo() {
    let melhor = null;
    for (let k = 0; k < COPIAS; k++) {
      const n = rpois(1.6, rng), muts = [];
      let d = 0;
      for (let j = 0; j < n; j++) { muts.push([Math.floor(rng() * seq.length), AA[Math.floor(rng() * AA.length)]]); d += efeito(); }
      if (!comSelecao) { if (k === 0) melhor = { muts, d }; continue; }
      if (!melhor || d > melhor.d) melhor = { muts, d };
    }
    velhas = new Set([...velhas, ...recem]); recem = new Set();
    for (const [i, a] of melhor.muts) { if (seq[i] !== a) { seq[i] = a; recem.add(i); } }
    log2 += melhor.d; g++;
    if (comSelecao && log2 >= ALVO) pronta = true;
  }
  function mostrar(n) {
    seq.forEach((c, i) => { const s = spans[i]; s.textContent = c; s.className = recem.has(i) ? "nova" : velhas.has(i) ? "certa" : ""; });
    rodada.textContent = String(g); ativ.textContent = `×${numero(2 ** log2, 2 ** log2 < 10 ? 1 : 0)}`;
    copias.textContent = n === undefined ? "" : `${numero(n)} cópias testadas`;
    degraus.forEach((d, k) => d.toggleAttribute("data-passou", log2 >= k));
  }
  function correr(fim) {
    if (parar) parar();
    let ultimo = -1;
    parar = laco((t) => {
      const k = Math.floor(t / DUR), f = t / DUR - k;
      if (k !== ultimo) { ultimo = k; if (k > 0 && !pronta && g < MAX) passo(); }
      mostrar(f < 0.5 && !pronta && g < MAX ? Math.floor(COPIAS * f * 2) : undefined);
      if ((pronta || g >= MAX) && f > 0.3) { if (fim) fim({ r: g, x: 2 ** log2 }); return false; }
    });
  }
  elo.addEventListener("click", () => { comSelecao = !comSelecao; elo.textContent = comSelecao ? "tire a seleção" : "devolva a seleção"; zerar(); mostrar(); correr(null); });
  return {
    preparar() { zerar(); mostrar(); elo.hidden = true; },
    revelar(fim) { zerar(); mostrar(); if (reduzido()) { while (!pronta && g < MAX) passo(); mostrar(); elo.hidden = false; return fim({ r: g, x: 2 ** log2 }); } correr((r) => { elo.hidden = false; fim(r); }); },
    parar() { if (parar) parar(); },
    captura(t) { zerar(); for (let i = 0; i < Math.min(MAX, Math.floor(t)) && !pronta; i++) passo(); mostrar(); },
  };
}
