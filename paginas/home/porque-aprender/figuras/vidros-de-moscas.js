import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";
import { canvasNo, laco, rotulo, NAVY, AMARELO, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* cem ilhas, nenhuma vantagem */
export function ilhas(palco, pe, opts) {
  const ILHAS = opts.n, COL = opts.col, VEL = opts.vel, LIN = Math.ceil(ILHAS / COL);
  let { ctx, W, H } = canvasNo(palco);
  let traj = [], parar = null, semente = opts.semente;
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda([[AMARELO, opts.a], [NAVY, opts.b], [`linear-gradient(90deg, ${NAVY} 50%, ${AMARELO} 50%)`, "ainda misturado"]])));
  function sortear() {
    const rng = criarRng(semente);
    traj = Array.from({ length: ILHAS }, () => { const p = [opts.p0]; for (let g = 1; g <= opts.geracoes; g++) { const q = p[g - 1]; p.push(q <= 0 || q >= 1 ? q : rbinom(2 * opts.N, q, rng) / (2 * opts.N)); } return p; });
  }
  const cel = Math.min((W - 24) / COL, (H - 40) / LIN), r = cel * 0.4;
  const ox = (W - cel * COL) / 2, oy = 30 + (H - 30 - cel * LIN) / 2;
  function desenhar(g) {
    ctx.clearRect(0, 0, W, H);
    const c = [0, 0, 0];
    traj.forEach((p, k) => {
      const v = p[Math.min(g, opts.geracoes)], cx = ox + (k % COL + 0.5) * cel, cy = oy + (Math.floor(k / COL) + 0.5) * cel;
      c[v >= 1 ? 0 : v <= 0 ? 1 : 2]++;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = NAVY; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.fillStyle = AMARELO; ctx.fillRect(cx - r, cy + r - 2 * r * v, 2 * r, 2 * r * v);
      ctx.restore();
      if (v > 0 && v < 1) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - r, cy + r - 2 * r * v); ctx.lineTo(cx + r, cy + r - 2 * r * v); ctx.stroke(); }
    });
    rotulo(ctx, `geração ${Math.min(g, opts.geracoes)} de ${opts.geracoes}`, 12, 8, { cor: SUAVE, peso: "600" });
    conta.innerHTML = `<b>${c[0]}</b> ${opts.nome} ${opts.a} · <b>${c[1]}</b> ${opts.b} · <b>${c[2]}</b> ainda misturados`;
    return { marca: c[0], sem: c[1], meio: c[2] };
  }
  return {
    preparar() { sortear(); desenhar(0); },
    revelar(fim) {
      sortear();
      if (reduzido()) return fim(desenhar(opts.geracoes));
      parar = laco((t) => { const g = Math.floor(t * VEL); const r = desenhar(g); if (g >= opts.geracoes) { fim(r); return false; } });
    },
    deNovo() { if (parar) parar(); semente++; sortear(); parar = laco((t) => { const g = Math.floor(t * VEL); desenhar(g); return g < opts.geracoes; }); },
    parar() { if (parar) parar(); },
    captura(t) { sortear(); desenhar(Math.floor(t * VEL)); },
  };
}
