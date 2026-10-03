import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";
import { canvasNo, rotulo, FONTE, NAVY, AMARELO, OCRE, CINZA, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";
import { animar } from "./animacao-com-fim.js";

/* quantas cópias da versão A há em cada vidro, geração a geração */
function sortearVidros({ n, N, p0, geracoes, semente }) {
  const rng = criarRng(semente), dois = 2 * N;
  return Array.from({ length: n }, () => {
    const c = [Math.round(p0 * dois)];
    for (let g = 1; g <= geracoes; g++) { const q = c[g - 1] / dois; c.push(q <= 0 || q >= 1 ? c[g - 1] : rbinom(dois, q, rng)); }
    return c;
  });
}
function contarVidros(vidros, g, dois) {
  const c = { marca: 0, sem: 0, meio: 0 };
  for (const v of vidros) { const k = v[g]; if (k >= dois) c.marca++; else if (k <= 0) c.sem++; else c.meio++; }
  return c;
}

/* confete dentro dos vidros: cada vidro mostra as 18 cópias do gene que
   passam para a geração seguinte (9 moscas que se reproduzem, 2 cópias
   cada). A cada geração as cópias são sorteadas de novo e as bolinhas
   trocam de cor, umas antes, outras depois. O vidro que perde uma versão
   fica de uma cor só, ganha um aro e para de piscar. Embaixo, a régua
   conta os três grupos. */
export function confete(palco, pe, opts) {
  const VEL = 1.3, DOIS = 2 * opts.N;
  const { ctx, W, H } = canvasNo(palco);
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda([[AMARELO, "uma cópia da versão A"], [NAVY, "uma cópia da versão B"]])));
  const TOPO = 30, BAIXO = 46;
  const lado = (col) => Math.min((W - 16) / col, (H - TOPO - BAIXO) / Math.ceil(opts.n / col));   // as colunas que deixam o vidro maior
  let COL = 6; for (let c = 7; c <= 24; c++) if (lado(c) > lado(COL)) COL = c;
  const LIN = Math.ceil(opts.n / COL), cel = lado(COL), R = cel * 0.44;
  const ox = (W - cel * COL) / 2, oy = TOPO + (H - TOPO - BAIXO - cel * LIN) / 2;
  const aneis = [[6, 0.36, 0], [12, 0.74, 0.26]], lugar = [];
  for (const [n, r, f] of aneis) for (let i = 0; i < n; i++) { const a = (i + f) / n * Math.PI * 2 - Math.PI / 2; lugar.push([r * Math.cos(a), r * Math.sin(a)]); }
  let semente = opts.semente, vidros, cores, vez;
  function sortear() {
    vidros = sortearVidros({ ...opts, semente });
    const rng = criarRng(semente + 7);
    cores = vidros.map((v) => v.map((k) => {                // quais das 18 bolinhas são A, sorteado de novo a cada geração
      const ordem = [...lugar.keys()].sort(() => rng() - 0.5), c = new Uint8Array(DOIS);
      for (let j = 0; j < k; j++) c[ordem[j]] = 1;
      return c;
    }));
    vez = vidros.map(() => Float32Array.from({ length: DOIS }, () => rng() * 0.8));
  }
  function relogio(g, u) {                                  // uma bolinha por geração
    const passo = 14, x0 = W - ox - opts.geracoes * passo;
    rotulo(ctx, `geração ${g} de ${opts.geracoes}`, ox, 8, { cor: NAVY, peso: "600" });
    for (let k = 1; k <= opts.geracoes; k++) {
      const x = x0 + (k - 0.5) * passo, cheia = k <= g, vindo = k === g + 1 ? u : 0;
      ctx.beginPath(); ctx.arc(x, 14, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cheia ? NAVY : vindo > 0 ? `rgba(20,37,96,${0.2 + 0.5 * vindo})` : "#fff"; ctx.fill();
      ctx.strokeStyle = cheia ? NAVY : CINZA; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function regua(c) {                                       // só B | misturados | só A, um tracinho por vidro
    const y = H - 32, larg = (W - 2 * ox) / opts.n, fim = W - ox;
    const grupos = [[c.sem, NAVY, NAVY, `${c.sem} só com B`], [c.meio, CINZA, SUAVE, `${c.meio} misturados`], [c.marca, AMARELO, OCRE, `${c.marca} só com A`]];
    let x = ox;
    for (const [n, cor] of grupos) { for (let i = 0; i < n; i++) { ctx.fillStyle = cor; ctx.fillRect(x + i * larg, y, larg - 1, 12); } x += n * larg; }
    ctx.font = `600 11px ${FONTE}`;                          // B encosta à esquerda, A à direita, os misturados no meio do seu trecho, sem invadir os vizinhos
    const wB = c.sem ? ctx.measureText(grupos[0][3]).width : 0, wA = c.marca ? ctx.measureText(grupos[2][3]).width : 0, wM = ctx.measureText(grupos[1][3]).width;
    const opcoes = { cor: NAVY, peso: "600" };
    if (c.sem) rotulo(ctx, grupos[0][3], ox, y + 17, { ...opcoes, cor: grupos[0][2] });
    if (c.marca) rotulo(ctx, grupos[2][3], fim, y + 17, { ...opcoes, alinhar: "right", cor: grupos[2][2] });
    if (c.meio) {
      const meio = ox + (c.sem + c.meio / 2) * larg, a = ox + wB + (wB ? 12 : 0) + wM / 2, b = fim - wA - (wA ? 12 : 0) - wM / 2;
      rotulo(ctx, grupos[1][3], Math.max(a, Math.min(b, meio)), y + 17, { ...opcoes, alinhar: "center", cor: grupos[1][2] });
    }
  }
  function desenhar(t) {
    const s = t * VEL, g = Math.min(opts.geracoes, Math.floor(s)), u = s - g, g2 = Math.min(opts.geracoes, g + 1);
    ctx.clearRect(0, 0, W, H);
    vidros.forEach((v, i) => {
      const cx = ox + (i % COL + 0.5) * cel, cy = oy + (Math.floor(i / COL) + 0.5) * cel, k = u > 0.9 ? v[g2] : v[g];
      const preso = k <= 0 || k >= DOIS;
      if (preso) { ctx.fillStyle = k ? "rgba(252,180,33,.2)" : "rgba(20,37,96,.1)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = preso ? (k ? AMARELO : NAVY) : CINZA; ctx.lineWidth = preso ? 2 : 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      lugar.forEach(([dx, dy], j) => {
        const a = vez[i][j] < u ? cores[i][g2][j] : cores[i][g][j];
        ctx.fillStyle = a ? AMARELO : NAVY; ctx.beginPath(); ctx.arc(cx + dx * R * 0.86, cy + dy * R * 0.86, R * 0.15, 0, Math.PI * 2); ctx.fill();
      });
    });
    relogio(g, g < opts.geracoes ? u : 0);
    const c = contarVidros(vidros, g, DOIS);
    regua(c);
    conta.textContent = `Cada círculo é um vidro: as ${DOIS} cópias do gene que passam adiante (${opts.N} moscas × 2).`;
    return c;
  }
  const DUR = opts.geracoes / VEL + 0.3;
  let parar = null;
  return {
    preparar() { sortear(); desenhar(0); },
    revelar(fim) { sortear(); parar = animar(desenhar, DUR, () => fim(desenhar(DUR))); },
    deNovo() { if (parar) parar(); semente++; sortear(); parar = animar(desenhar, DUR); },
    parar() { if (parar) parar(); },
    captura(t) { sortear(); desenhar(Math.min(t, DUR)); },
  };
}
