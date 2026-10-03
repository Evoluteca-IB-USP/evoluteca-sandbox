import { criar, criarTexto as T } from "escrever-html";
import { criarRng, rnorm } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, FONTE, NAVY, TEAL_ESC, TEAL_CLARO, AMARELO } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* só uma fração se reproduz (grãos de milho, % de óleo). Na aposta o eixo
   abre de opts.escalaAposta[0] a [1] e a curva clara se arrasta até onde o
   aluno acha que a população vai parar; quando o modelo roda, o eixo
   fecha sobre a população e a curva clara fica onde foi deixada. */
export function cordilheira(palco, pe, opts) {
  const N = 600, CRISTAS = 16, CAIXAS = 140, LARGURA = 15, VEL = opts.vel, H2 = opts.h2, RUIDO = 0.9, EM = 36;
  const M0 = opts.m0, DP = opts.dp, DEC = opts.decimais;
  let { ctx, W, H } = canvasNo(palco);
  const TOPO = 40, BASE = H - 44, ALTURA = Math.min(88, H * 0.24), PASSO = (BASE - TOPO - ALTURA) / CRISTAS;
  palco.style.cursor = "col-resize";
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, criar("p", { class: "vivo-nota jogo-dica", hidden: true }, criar("em", { texto: "Mova o cursor" }), T(` sobre a figura para mudar quantas ${opts.plural} viram semente.`))));
  const dica = pe.querySelector(".jogo-dica");
  const rng = criarRng(1896);
  let pop, fracao = opts.fracao, limiar = 0, centro = 0, cristas = [], feitas = 0, parar = null, livre = false, max0 = 0, m0 = 0, mexeu = false;
  let vista = LARGURA, apostando = false, aposta = null, fantasma = null, avisar = null, arrastando = false;
  const [A0, A1] = opts.escalaAposta, zDe = (v) => (v - M0) / DP;
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
  const xDe = (z) => EM + ((z - (centro - vista / 2)) / vista) * (W - 2 * EM);
  const zNoX = (x) => centro - vista / 2 + ((x - EM) / (W - 2 * EM)) * vista;
  function desenhar(deslize) {
    ctx.clearRect(0, 0, W, H);
    if (!apostando) { centro += (cristas[cristas.length - 1].media - centro) * 0.08; vista += (LARGURA - vista) * 0.08; }
    const escala = Math.max(...cristas.map((c) => c.m)) || 1, xl = xDe(limiar), xm = xDe(max0);
    const semente = `só ${opts.artigo} ${Math.round(fracao * 100)}% mais ${opts.adjetivo} viram semente`;
    const [ySem, yMax] = marcos(semente, xl, opts.rotuloMax, xm);
    ctx.setLineDash([3, 6]); ctx.strokeStyle = AMARELO; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xl, ySem + 14); ctx.lineTo(xl, H - 30); ctx.stroke();
    ctx.strokeStyle = TEAL_CLARO; ctx.beginPath(); ctx.moveTo(xm, yMax + 14); ctx.lineTo(xm, H - 30); ctx.stroke(); ctx.setLineDash([]);
    cristas.forEach((c, k) => {
      const idade = cristas.length - 1 - k, base = BASE - (idade + deslize) * PASSO;
      ctx.globalAlpha = Math.max(0, Math.min(1, CRISTAS - idade - deslize));
      ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(xDe(c.x0), base);
      for (let i = 0; i < CAIXAS; i++) ctx.lineTo(xDe(c.x0 + (i + .5) * c.larg), base - (c.d[i] / escala) * ALTURA);
      ctx.lineTo(xDe(c.x0 + LARGURA), base); ctx.lineTo(W, base); ctx.closePath();
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = idade === 0 ? "rgba(16,148,171,.22)" : "rgba(16,148,171,.09)"; ctx.fillRect(xl, base - ALTURA - 2, W, ALTURA + 2); ctx.restore();
      ctx.strokeStyle = NAVY; ctx.lineWidth = idade === 0 ? 1.8 : 1.1; ctx.globalAlpha *= Math.max(.25, 1 - idade / CRISTAS); ctx.stroke(); ctx.globalAlpha = 1;
    });
    if (aposta !== null) desenharAposta(escala);
    ctx.strokeStyle = "#e5e5e5"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(EM, H - 30); ctx.lineTo(W - EM, H - 30); ctx.stroke();
    const z0 = centro - vista / 2, z1 = centro + vista / 2, P = vista > 2 * LARGURA ? 5 : opts.passoEixo;
    for (let c = Math.ceil(val(z0) / P) * P; c <= val(z1); c += P) { const x = xDe((c - M0) / DP); ctx.beginPath(); ctx.moveTo(x, H - 30); ctx.lineTo(x, H - 26); ctx.stroke(); rotulo(ctx, `${numero(Math.abs(c) < 1e-9 ? 0 : c, DEC)}${opts.unidade}`, x, H - 22, { alinhar: "center" }); }
    const m = cristas[cristas.length - 1].media;
    conta.innerHTML = `Geração <b>${feitas}</b> · média: <b>${un(m)}</b>` + (feitas ? ` (começou em ${un(m0)})` : "");
  }
  /* a curva clara da aposta: a forma da população de partida, levada até o
     valor apostado; fora da janela, vira uma seta na borda */
  function desenharAposta(escala) {
    const x = xDe(aposta), desloca = aposta - fantasma.media, texto = apostando ? `sua aposta: ${un(aposta)}` : "sua aposta";
    const escrever = (t, x, y, alinhar) => { ctx.font = `600 11px ${FONTE}`; ctx.textAlign = alinhar; ctx.textBaseline = "bottom"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeText(t, x, y); rotulo(ctx, t, x, y, { alinhar, base: "bottom", cor: NAVY, peso: "600" }); };
    if (x < EM - 4 || x > W - EM + 4) { const esq = x < EM; escrever(esq ? `← sua aposta: ${un(aposta)}` : `sua aposta: ${un(aposta)} →`, esq ? EM : W - EM, BASE - 8, esq ? "left" : "right"); return; }
    ctx.beginPath(); ctx.moveTo(xDe(fantasma.x0 + desloca), BASE);
    for (let i = 0; i < CAIXAS; i++) ctx.lineTo(xDe(fantasma.x0 + desloca + (i + .5) * fantasma.larg), BASE - (fantasma.d[i] / escala) * ALTURA);
    ctx.lineTo(xDe(fantasma.x0 + desloca + LARGURA), BASE);
    ctx.fillStyle = "rgba(20,37,96,.07)"; ctx.fill();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    escrever(texto, Math.max(EM + 50, Math.min(W - EM - 50, x)), BASE - (fantasma.m / escala) * ALTURA - 8, "center");
  }
  function apontar(e) {
    const r = palco.getBoundingClientRect(), v = Math.max(A0, Math.min(A1, val(zNoX(e.clientX - r.left))));
    aposta = zDe(Math.round(v * 10) / 10); avisar(val(aposta)); desenhar(0);
  }
  palco.addEventListener("pointerdown", (e) => { if (!apostando) return; arrastando = true; palco.setPointerCapture(e.pointerId); apontar(e); });
  palco.addEventListener("pointermove", (e) => { if (apostando && arrastando) apontar(e); });
  palco.addEventListener("pointerup", () => { arrastando = false; });
  /* os rótulos das duas linhas ficam no topo, cada um ancorado na sua; se
     colidirem, desce o que a linha do outro não atravessa */
  function marcos(txtSem, xl, txtMax, xm) {
    const caixa = (txt, x, y, cor, peso) => {
      ctx.font = `${peso} 11px ${FONTE}`; const w = ctx.measureText(txt).width;
      const dir = x + w + 4 > W - 4, x0 = dir ? x - w - 4 : x + 4;
      return { txt, x: dir ? x - 4 : x + 4, alinhar: dir ? "right" : "left", a: x0, b: x0 + w, y, cor, peso, visivel: x > EM - 2 && x < W - EM + 2 };
    };
    const s = caixa(txtSem, xl, 4, NAVY, "600"), m = caixa(txtMax, xm, 4, TEAL_ESC, "");
    if (m.visivel && s.a < m.b + 8 && m.a < s.b + 8) (m.a - 4 > xl || m.b + 4 < xl ? m : s).y = 20;
    for (const r of [s, m]) if (r.visivel) rotulo(ctx, r.txt, r.x, r.y, { alinhar: r.alinhar, cor: r.cor, peso: r.peso });
    return [s.y, m.visivel ? m.y : H];
  }
  palco.addEventListener("pointermove", (e) => {
    if (!livre) return; mexeu = true;
    const r = palco.getBoundingClientRect(), z = zNoX(e.clientX - r.left);
    fracao = Math.max(0.03, Math.min(0.97, pop.filter((v) => v >= z).length / N)); limiar = quantil(pop, fracao);
  });
  function zerar() { pop = Array.from({ length: N }, () => rnorm(0, 1, rng)); max0 = Math.max(...pop); m0 = media(pop); cristas = [densidade(pop)]; centro = media(pop); limiar = quantil(pop, fracao); feitas = 0; livre = false; fracao = opts.fracao; dica.hidden = true; }
  const resultado = () => ({ v: val(cristas[cristas.length - 1].media), max0: val(max0) });
  return {
    preparar() { zerar(); aposta = null; apostando = false; vista = LARGURA; desenhar(0); },
    aposta(aoMudar) {
      avisar = aoMudar; apostando = true; palco.style.cursor = "grab";
      fantasma = cristas[0]; aposta = fantasma.media; centro = zDe((A0 + A1) / 2); vista = (A1 - A0) / DP;
      desenhar(0);
    },
    revelar(fim) {
      apostando = false; palco.style.cursor = "col-resize";
      const [c0, v0] = [centro, vista];                            // o eixo sai de onde a aposta o deixou e fecha devagar
      zerar(); centro = c0; vista = v0;
      if (reduzido()) { while (feitas < opts.geracoes) { geracao(); feitas++; } centro = cristas[cristas.length - 1].media; vista = LARGURA; livre = true; dica.hidden = false; desenhar(0); return fim(resultado()); }
      parar = laco((t) => {
        const s = t * VEL;
        while (feitas < Math.min(opts.geracoes, Math.floor(s))) { geracao(); feitas++; }
        desenhar(s - Math.floor(s));
        if (feitas >= opts.geracoes) { livre = true; dica.hidden = false; fim(resultado()); parar = laco((t2) => { if (!mexeu) return; const s2 = t2 * VEL; while (feitas < opts.geracoes + Math.floor(s2)) { geracao(); feitas++; } desenhar(s2 - Math.floor(s2)); }); return false; }
      });
    },
    parar() { if (parar) parar(); },
    captura() { if (!fantasma) { zerar(); fantasma = cristas[0]; aposta = zDe(9); } apostando = false; zerar(); while (feitas < opts.geracoes) { geracao(); feitas++; } centro = cristas[cristas.length - 1].media; vista = LARGURA; livre = true; dica.hidden = false; desenhar(0); },
  };
}
