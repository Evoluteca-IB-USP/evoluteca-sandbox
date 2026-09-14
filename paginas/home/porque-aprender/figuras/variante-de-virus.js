import { criar } from "escrever-html";
import { criarRng, rpois } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, NAVY, TEAL_CLARO } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* um vírus que se espalha 50% mais rápido
   Cada linha é uma semana; cada bolinha, um caso de uma amostra
   de 100. As semanas vão se empilhando de cima para baixo. */
export function variante(palco, pe, opts) {
  const SEMANAS = 16, AMOSTRA = 100, VEL = 1.6;
  let { ctx, W, H } = canvasNo(palco);
  let semanas = [], parar = null;
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda([[TEAL_CLARO, "vírus de antes"], [NAVY, "a variante nova"]])));
  function sortear() {
    const rng = criarRng(2021); let comum = 2000, nova = comum * opts.inicio / (1 - opts.inicio);
    semanas = [];
    for (let s = 0; s <= SEMANAS; s++) {
      const f = nova / (comum + nova);
      semanas.push({ f, casos: Array.from({ length: AMOSTRA }, () => rng() < f) });
      comum = rpois(comum * opts.rComum, rng); nova = rpois(nova * opts.rNova, rng);
    }
  }
  const EM = 92, passoY = (H - 30) / (SEMANAS + 1), passoX = (W - EM - 20) / AMOSTRA, r = Math.min(passoX, passoY) * 0.36;
  function desenhar(ate) {
    ctx.clearRect(0, 0, W, H);
    let virou = -1;
    semanas.forEach((s, k) => {
      if (k > ate) return;
      const y = 14 + (k + 0.5) * passoY;
      rotulo(ctx, k ? `semana ${k}` : "início", EM - 10, y - 6, { alinhar: "right" });
      s.casos.forEach((nova, i) => { ctx.fillStyle = nova ? NAVY : TEAL_CLARO; ctx.beginPath(); ctx.arc(EM + (i + 0.5) * passoX, y, r, 0, Math.PI * 2); ctx.fill(); });
      if (virou < 0 && s.f >= 0.5) virou = k;
    });
    const k = Math.min(ate, SEMANAS), f = semanas[k].f;
    conta.innerHTML = `Semana <b>${k}</b> · a variante é <b>${numero(f * 100)}%</b> dos casos` + (virou >= 0 ? ` · passou da metade na <b>semana ${virou}</b>` : "");
    return virou >= 0 ? virou : SEMANAS;
  }
  return {
    preparar() { sortear(); desenhar(0); },
    revelar(fim) {
      sortear();
      if (reduzido()) return fim(desenhar(SEMANAS));
      parar = laco((t) => { const k = Math.floor(t * VEL); const v = desenhar(k); if (k >= SEMANAS) { fim(v); return false; } });
    },
    parar() { if (parar) parar(); },
    captura(t) { sortear(); desenhar(Math.min(SEMANAS, Math.floor(t * VEL))); },
  };
}
