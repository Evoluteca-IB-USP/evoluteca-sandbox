import { criar, criarTexto as T } from "escrever-html";
import { criarRng, rnorm } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, NAVY, TEAL_ESC, TEAL_CLARO, AMARELO } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* só uma fração se reproduz (grãos de milho, % de óleo) */
export function cordilheira(palco, pe, opts) {
  const N = 600, CRISTAS = 24, PASSO = 17, CAIXAS = 140, LARGURA = 15, VEL = opts.vel, H2 = opts.h2, RUIDO = 0.9, EM = 36, ALTURA = 88;
  const M0 = opts.m0, DP = opts.dp, DEC = opts.decimais;
  let { ctx, W, H } = canvasNo(palco);
  palco.style.cursor = "col-resize";
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, criar("p", { class: "vivo-nota jogo-dica", hidden: true }, criar("em", { texto: "Mova o cursor" }), T(` sobre a figura para mudar quantas ${opts.plural} viram semente.`))));
  const dica = pe.querySelector(".jogo-dica");
  const rng = criarRng(1896);
  let pop, fracao = opts.fracao, limiar = 0, centro = 0, cristas = [], feitas = 0, parar = null, livre = false, max0 = 0, m0 = 0, mexeu = false;
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const quantil = (v, f) => [...v].sort((a, b) => a - b)[Math.max(0, Math.min(v.length - 1, Math.floor((1 - f) * v.length)))];
  const val = (z) => M0 + DP * z, un = (z) => `${numero(val(z), DEC)}${opts.unidade}`;
  function densidade(v) {
    const m0 = media(v), x0 = m0 - LARGURA / 2, larg = LARGURA / CAIXAS, h = 0.3, d = new Float32Array(CAIXAS);
    for (const z of v) { const c = (z - x0) / larg;
      for (let k = Math.max(0, Math.floor(c - 3 * h / larg)); k < Math.min(CAIXAS, c + 3 * h / larg); k++) { const x = x0 + (k + .5) * larg; d[k] += Math.exp(-0.5 * ((x - z) / h) ** 2); } }
    let m = 0; for (const x of d) m = Math.max(m, x);
    return { d, m, media: m0, x0, larg };
  }
  function geracao() {
    limiar = quantil(pop, fracao); const pais = pop.filter((z) => z >= limiar), m = media(pop);
    pop = Array.from({ length: N }, () => { const a = pais[Math.floor(rng() * pais.length)], b = pais[Math.floor(rng() * pais.length)]; return m + H2 * ((a + b) / 2 - m) + rnorm(0, RUIDO, rng); });
    cristas.push(densidade(pop)); if (cristas.length > CRISTAS) cristas.shift();
  }
  const xDe = (z) => EM + ((z - (centro - LARGURA / 2)) / LARGURA) * (W - 2 * EM);
  function desenhar(deslize) {
    ctx.clearRect(0, 0, W, H);
    const base0 = H - 44; centro += (cristas[cristas.length - 1].media - centro) * 0.08;
    const escala = Math.max(...cristas.map((c) => c.m)) || 1, xl = xDe(limiar), xm = xDe(max0);
    ctx.setLineDash([3, 6]); ctx.strokeStyle = AMARELO; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xl, 18); ctx.lineTo(xl, H - 30); ctx.stroke();
    ctx.strokeStyle = TEAL_CLARO; ctx.beginPath(); ctx.moveTo(xm, 18); ctx.lineTo(xm, H - 30); ctx.stroke(); ctx.setLineDash([]);
    cristas.forEach((c, k) => {
      const idade = cristas.length - 1 - k, base = base0 - (idade + deslize) * PASSO; if (base < -ALTURA) return;
      ctx.beginPath(); ctx.moveTo(xDe(centro - LARGURA), base); ctx.lineTo(xDe(c.x0), base);
      for (let i = 0; i < CAIXAS; i++) ctx.lineTo(xDe(c.x0 + (i + .5) * c.larg), base - (c.d[i] / escala) * ALTURA);
      ctx.lineTo(xDe(c.x0 + LARGURA), base); ctx.lineTo(xDe(centro + LARGURA), base); ctx.closePath();
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = idade === 0 ? "rgba(16,148,171,.22)" : "rgba(16,148,171,.09)"; ctx.fillRect(xl, base - ALTURA - 2, W, ALTURA + 2); ctx.restore();
      ctx.strokeStyle = NAVY; ctx.lineWidth = idade === 0 ? 1.8 : 1.1; ctx.globalAlpha = Math.max(.25, 1 - idade / CRISTAS); ctx.stroke(); ctx.globalAlpha = 1;
    });
    ctx.strokeStyle = "#e5e5e5"; ctx.beginPath(); ctx.moveTo(EM, H - 30); ctx.lineTo(W - EM, H - 30); ctx.stroke();
    const z0 = centro - LARGURA / 2, z1 = centro + LARGURA / 2, P = opts.passoEixo;
    for (let c = Math.ceil(val(z0) / P) * P; c <= val(z1); c += P) { const x = xDe((c - M0) / DP); ctx.beginPath(); ctx.moveTo(x, H - 30); ctx.lineTo(x, H - 26); ctx.stroke(); rotulo(ctx, `${numero(c, DEC)}${opts.unidade}`, x, H - 22, { alinhar: "center" }); }
    rotulo(ctx, `só ${opts.artigo} ${Math.round(fracao * 100)}% mais ${opts.adjetivo} viram semente`, Math.min(xl, W - EM - 4), 4, { alinhar: xl > W * 0.6 ? "right" : "left", cor: NAVY, peso: "600" });
    rotulo(ctx, opts.rotuloMax, xm - 5, H - 44, { alinhar: "right", cor: TEAL_ESC });
    const m = cristas[cristas.length - 1].media;
    conta.innerHTML = `Geração <b>${feitas}</b> · média: <b>${un(m)}</b>` + (feitas ? ` (começou em ${un(m0)})` : "");
  }
  palco.addEventListener("pointermove", (e) => {
    if (!livre) return; mexeu = true;
    const r = palco.getBoundingClientRect(), z = centro - LARGURA / 2 + ((e.clientX - r.left - EM) / (W - 2 * EM)) * LARGURA;
    fracao = Math.max(0.03, Math.min(0.97, pop.filter((v) => v >= z).length / N)); limiar = quantil(pop, fracao);
  });
  function zerar() { pop = Array.from({ length: N }, () => rnorm(0, 1, rng)); max0 = Math.max(...pop); m0 = media(pop); cristas = [densidade(pop)]; centro = media(pop); limiar = quantil(pop, fracao); feitas = 0; livre = false; fracao = opts.fracao; dica.hidden = true; }
  const resultado = () => ({ v: val(cristas[cristas.length - 1].media), max0: val(max0) });
  return {
    preparar() { zerar(); desenhar(0); },
    revelar(fim) {
      zerar();
      if (reduzido()) { while (feitas < opts.geracoes) { geracao(); feitas++; } centro = cristas[cristas.length - 1].media; livre = true; dica.hidden = false; desenhar(0); return fim(resultado()); }
      parar = laco((t) => {
        const s = t * VEL;
        while (feitas < Math.min(opts.geracoes, Math.floor(s))) { geracao(); feitas++; }
        desenhar(s - Math.floor(s));
        if (feitas >= opts.geracoes) { livre = true; dica.hidden = false; fim(resultado()); parar = laco((t2) => { if (!mexeu) return; const s2 = t2 * VEL; while (feitas < opts.geracoes + Math.floor(s2)) { geracao(); feitas++; } desenhar(s2 - Math.floor(s2)); }); return false; }
      });
    },
    parar() { if (parar) parar(); },
    captura() { zerar(); while (feitas < opts.geracoes) { geracao(); feitas++; } centro = cristas[cristas.length - 1].media; livre = true; dica.hidden = false; desenhar(0); },
  };
}
