/* O laço da seção: a pergunta se forma em poeira, vira a figura e dá lugar
   à seguinte. Passa sozinho, pausa com o mouse nos `pausadores`, espera
   fora da tela e para no convite. Com movimento reduzido, as trocas são
   cortes secos.

     criarPoeiraEmPassos({ tela, secao, passos, formas, origem, pausadores, fundo, frente, aoMarcar })
       formas(k, W, H)      { texto, fig }: os pontos da pergunta e da figura do passo k
       origem(W, H, n)      de onde a poeira sai na primeira vez
       fundo(e), frente(e)  o que vai antes e depois dos pontos, a cada quadro
         e = { ctx, W, H, k, rumo, f, aFig, fracao, forma }
         rumo   "chega", "pergunta", "ida", "figura" ou "volta"; f é quanto do rumo já passou
         aFig   o quanto a poeira já é figura, para a moldura entrar e sair com ela
         fracao o quanto do passo já passou
       aoMarcar(k)          o passo mudou */

import { preparar, laco, naTela, clamp } from "../../desenho-em-canvas/__pacote__.js";
import { pintarPontos, atrasoPorX } from "./poeira/__pacote__.js";

const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const TEMPOS = reduz
  ? { chega: 0.01, pergunta: 3.5, ida: 0.01, figura: 8, volta: 0.01 }
  : { chega: 1.8, pergunta: 2.8, ida: 2, figura: 7, volta: 1.4 };

export function criarPoeiraEmPassos({ tela, secao, passos, formas, origem, pausadores = [], fundo, frente, aoMarcar }) {
  let k = 0, t = 0, primeira = true, pausa = false, cache = new Map(), medida = "";
  for (const el of pausadores) {
    el.addEventListener("mouseenter", () => (pausa = true));
    el.addEventListener("mouseleave", () => (pausa = false));
  }

  function forma(i, W, H) {
    if (!cache.has(i)) {
      const f = formas(i, W, H);
      f.atrasoTexto = atrasoPorX(f.texto);
      if (f.fig) f.atrasoFig = atrasoPorX(f.fig.pts);
      cache.set(i, f);
    }
    return cache.get(i);
  }

  function trechos(W, H) {
    const p = passos[k], f = forma(k, W, H);
    const lista = [];
    if (primeira && k === 0)
      lista.push({ rumo: "chega", de: origem(W, H, f.texto.length), para: f.texto, dur: TEMPOS.chega, atraso: f.atrasoTexto });
    lista.push({ rumo: "pergunta", de: f.texto, para: f.texto, dur: p.convite ? Infinity : TEMPOS.pergunta, atraso: f.atrasoTexto });
    if (p.convite) return lista;
    const prox = forma(k + 1, W, H);
    lista.push({ rumo: "ida", de: f.texto, para: f.fig.pts, dur: TEMPOS.ida, atraso: f.atrasoFig });
    lista.push({ rumo: "figura", de: f.fig.pts, para: f.fig.pts, dur: TEMPOS.figura, atraso: f.atrasoFig });
    lista.push({ rumo: "volta", de: prox.texto, para: f.fig.pts, dur: TEMPOS.volta, atraso: f.atrasoFig });
    return lista;
  }

  function desenhar() {
    const { ctx, W, H } = preparar(tela);
    if (`${W}x${H}` !== medida) { medida = `${W}x${H}`; cache = new Map(); }
    const lista = trechos(W, H);
    let resto = t, i = 0;
    while (i < lista.length - 1 && resto >= lista[i].dur) { resto -= lista[i].dur; i++; }
    const tr = lista[i], f = Math.min(1, resto / tr.dur);
    const total = lista.reduce((a, x) => a + (x.dur === Infinity ? 0 : x.dur), 0);
    let aFig = 0;
    if (tr.rumo === "ida") aFig = clamp((f - 0.45) / 0.55);
    if (tr.rumo === "figura") aFig = 1;
    if (tr.rumo === "volta") aFig = clamp(1 - f * 2);
    const e = { ctx, W, H, k, rumo: tr.rumo, f, aFig, fracao: passos[k].convite ? 1 : clamp(t / total), forma: forma(k, W, H) };

    fundo(e);
    pintarPontos(ctx, tr.de, tr.para, tr.rumo === "volta" ? 1 - f : tr.de === tr.para ? 1 : f, tr.atraso);
    frente(e);

    if (resto >= tr.dur && i === lista.length - 1 && !passos[k].convite) { primeira = false; k += 1; t = 0; aoMarcar(k); }
  }

  aoMarcar(0);
  let antes = 0;
  laco((seg) => {
    const dt = Math.min(0.1, seg - antes); antes = seg;
    if (!naTela(secao, 0)) return;
    if (!pausa || passos[k].convite) t += dt;
    desenhar();
  });

  return {
    ir(i) { k = i; t = 0; aoMarcar(k); },
    recomecar() { primeira = true; k = 0; t = 0; aoMarcar(0); },
  };
}
