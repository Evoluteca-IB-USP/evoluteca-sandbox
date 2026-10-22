import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, FONTE, NAVY, TEAL_ESC, TEAL_CLARO, AMARELO, CINZA } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* a chance de respirar mal pelo tamanho do focinho, medida por Packer
   et al. 2015: some acima de metade do crânio e passa de 50% abaixo de ~20% */
const risco = (f) => 1 / (1 + Math.exp(-(3.44 - 16.8 * f)));
const METADE = 3.44 / 16.8, COMUM = 0.5;

/* a cordilheira do milho, agora com pugs: o focinho em fração do crânio
   (Guintard & Denis: ~1/4 em 1880, ~1/12 hoje), em escala log, porque
   encurta por fração e não por milímetro. Cada geração, só os 30% de
   focinho mais curto têm filhotes. A janela do eixo tem sempre a mesma
   largura, na aposta e no modelo; na aposta, arrastar a curva até a
   borda faz o eixo rolar, de 1% a 100%; no modelo, ele acompanha a
   população. No alto, de cada 20 pugs, os que respiram mal. */
export function focinhos(palco, pe, opts) {
  const N = 600, CRISTAS = 16, CAIXAS = 140, LARGURA = 15, VEL = 3, H2 = 0.35, RUIDO = 1, EM = 36, FRACAO = 0.3, BORDA = 40;
  const L0 = Math.log(0.25), UN = 0.07;                              // z = (ln focinho − ln 0,25) / 0,07
  const val = (z) => Math.exp(L0 + UN * z), zDe = (f) => (Math.log(f) - L0) / UN;
  const ZMIN = zDe(0.01), ZMAX = zDe(1);
  const { ctx, W, H } = canvasNo(palco);
  const TOPO = 84, BASE = H - 26, ALTURA = Math.min(88, H * 0.24), PASSO = (BASE - TOPO - ALTURA) / CRISTAS;
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta));
  const rng = criarRng(1880);
  let pop, limiar = 0, centro = 0, cristas = [], feitas = 0, m0 = 0, escala = 1, parar = null, revelando = null;
  let apostando = false, aposta = null, avisar = null, arrastando = false, ponteiro = null;
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const quantil = (v, f) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(f * v.length))];
  const pct = (z) => `${numero(100 * val(z), val(z) < 0.1 ? 1 : 0)}%`;
  const doentes = () => Math.round(20 * pop.reduce((a, z) => a + risco(val(z)), 0) / pop.length);
  const xDe = (z) => EM + ((z - (centro - LARGURA / 2)) / LARGURA) * (W - 2 * EM);
  const zNoX = (x) => centro - LARGURA / 2 + ((x - EM) / (W - 2 * EM)) * LARGURA;
  const prender = (c) => Math.max(ZMIN + LARGURA / 2, Math.min(ZMAX - LARGURA / 2, c));
  function densidade(v) {
    const m = media(v), x0 = m - LARGURA / 2, larg = LARGURA / CAIXAS, h = 0.3, d = new Float32Array(CAIXAS);
    for (const z of v) { const c = (z - x0) / larg;
      for (let k = Math.max(0, Math.floor(c - 3 * h / larg)); k < Math.min(CAIXAS, c + 3 * h / larg); k++) { const x = x0 + (k + .5) * larg; d[k] += Math.exp(-0.5 * ((x - z) / h) ** 2); } }
    let mx = 0; for (const x of d) mx = Math.max(mx, x);
    return { d, m: mx, media: m, x0, larg };
  }
  function geracao() {
    limiar = quantil(pop, FRACAO); const pais = pop.filter((z) => z <= limiar), m = media(pop);
    pop = Array.from({ length: N }, () => { const a = pais[Math.floor(rng() * pais.length)], b = pais[Math.floor(rng() * pais.length)]; return m + H2 * ((a + b) / 2 - m) + rnorm(0, RUIDO, rng); });
    cristas.push(densidade(pop)); if (cristas.length > CRISTAS) cristas.shift();
    limiar = quantil(pop, FRACAO); feitas++;
  }
  /* de cada 20 pugs, os que respiram mal, nas bolinhas da aposta */
  function vinte() {
    const n = doentes(), x0 = 20, passo = 22, y = 42, r = 8;
    rotulo(ctx, String(opts.inicio + feitas * opts.anosPorGeracao), 12, 2, { cor: NAVY, peso: "600", tam: 20 });
    rotulo(ctx, `de cada 20 pugs, ${n} respiram com dificuldade`, 76, 9, { cor: NAVY, peso: "600" });
    for (let i = 0; i < 10; i++) {                                    // cada bolinha são 2 pugs; a metade pintada, 1
      const x = x0 + i * passo, m = Math.max(0, Math.min(2, n - 2 * i));
      ctx.fillStyle = m === 2 ? NAVY : CINZA; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (m === 1) { ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x, y, r, Math.PI / 2, Math.PI * 3 / 2); ctx.fill(); }
    }
  }
  function crista(c, base, desloca = 0) {
    ctx.beginPath(); ctx.moveTo(EM, base); ctx.lineTo(Math.max(EM, xDe(c.x0 + desloca)), base);
    for (let i = 0; i < CAIXAS; i++) ctx.lineTo(xDe(c.x0 + desloca + (i + .5) * c.larg), base - (c.d[i] / escala) * ALTURA);
    ctx.lineTo(Math.min(W - EM, xDe(c.x0 + desloca + LARGURA)), base); ctx.lineTo(W - EM, base); ctx.closePath();
  }
  const dentro = (x) => x >= EM - 1 && x <= W - EM + 1;
  function desenhar(deslize) {
    ctx.clearRect(0, 0, W, H);
    escala = Math.max(...cristas.map((c) => c.m)) || 1;
    const xl = xDe(limiar), xm = xDe(zDe(METADE)), xc = xDe(zDe(COMUM));
    const [ySem, yMet] = marcos(`só os ${Math.round(FRACAO * 100)}% de focinho mais curto têm filhotes`, xl, "daqui para a esquerda, mais da metade respira mal", xm);
    ctx.setLineDash([3, 6]); ctx.lineWidth = 1.5;
    if (dentro(xl)) { ctx.strokeStyle = AMARELO; ctx.beginPath(); ctx.moveTo(xl, ySem + 14); ctx.lineTo(xl, BASE); ctx.stroke(); }
    ctx.strokeStyle = TEAL_CLARO;
    if (dentro(xm)) { ctx.beginPath(); ctx.moveTo(xm, yMet + 14); ctx.lineTo(xm, BASE); ctx.stroke(); }
    if (dentro(xc)) { ctx.beginPath(); ctx.moveTo(xc, BASE - ALTURA - 6); ctx.lineTo(xc, BASE); ctx.stroke(); }
    ctx.setLineDash([]);
    if (dentro(xc)) rotulo(ctx, "focinho de um cão comum", xc - 4, BASE - ALTURA - 6, { alinhar: "right", base: "bottom", cor: TEAL_ESC });
    ctx.save(); ctx.beginPath(); ctx.rect(EM, 0, W - 2 * EM, H); ctx.clip();
    cristas.forEach((c, k) => {
      const idade = cristas.length - 1 - k, base = BASE - (idade + deslize) * PASSO;
      ctx.globalAlpha = Math.max(0, Math.min(1, CRISTAS - idade - deslize));
      crista(c, base); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = idade === 0 ? "rgba(16,148,171,.22)" : "rgba(16,148,171,.09)"; ctx.fillRect(0, base - ALTURA - 2, xl, ALTURA + 2); ctx.restore();
      ctx.strokeStyle = NAVY; ctx.lineWidth = idade === 0 ? 1.8 : 1.1; ctx.globalAlpha *= Math.max(.25, 1 - idade / CRISTAS); ctx.stroke(); ctx.globalAlpha = 1;
    });
    if (aposta !== null) desenharAposta();
    ctx.restore();
    eixo(xc);
    vinte();
    const m = cristas[cristas.length - 1].media;
    conta.innerHTML = `Geração <b>${feitas}</b> · focinho médio: <b>${pct(m)}</b> do comprimento do crânio` + (feitas ? ` (era ${pct(m0)} em ${opts.inicio})` : "");
  }
  /* os tiques pendurados na base; o cão comum, quando sai da janela, vira
     uma seta no fim do eixo */
  function eixo(xc) {
    ctx.font = `11px ${FONTE}`;
    const seta = xc > W - EM + 1 ? `focinho de um cão comum: ${numero(100 * COMUM)}% →` : null, fim = seta ? W - 8 - ctx.measureText(seta).width - 18 : W;
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1;
    let ultimo = -99;
    for (const p of [1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100]) {
      const x = xDe(zDe(p / 100));
      if (!dentro(x) || x > fim || x - ultimo < 30) continue;
      ultimo = x; ctx.beginPath(); ctx.moveTo(x, BASE); ctx.lineTo(x, BASE + 4); ctx.stroke(); rotulo(ctx, `${numero(p, p % 1 ? 1 : 0)}%`, x, BASE + 7, { alinhar: "center" });
    }
    if (seta) rotulo(ctx, seta, W - 8, BASE + 7, { alinhar: "right", cor: TEAL_ESC });
  }
  /* a curva clara da aposta: a crista mais nova, levada até o valor apostado;
     fora da janela, vira uma seta na borda */
  function desenharAposta() {
    const c = cristas[cristas.length - 1], x = xDe(aposta), texto = apostando ? `sua aposta: ${pct(aposta)}` : "sua aposta";
    const escrever = (t, x, y, alinhar) => { ctx.font = `600 11px ${FONTE}`; ctx.textAlign = alinhar; ctx.textBaseline = "bottom"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeText(t, x, y); rotulo(ctx, t, x, y, { alinhar, base: "bottom", cor: NAVY, peso: "600" }); };
    if (!dentro(x)) { const esq = x < EM; escrever(esq ? `← sua aposta: ${pct(aposta)}` : `sua aposta: ${pct(aposta)} →`, esq ? EM + 4 : W - EM - 4, BASE - 8, esq ? "left" : "right"); return; }
    crista(c, BASE, aposta - c.media);
    ctx.fillStyle = "rgba(20,37,96,.07)"; ctx.fill();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    escrever(texto, Math.max(EM + 50, Math.min(W - EM - 50, x)), BASE - (c.m / escala) * ALTURA - 8, "center");
  }
  /* arrastar: a curva vai até o ponteiro; perto da borda, o eixo rola */
  function apontar() {
    aposta = Math.max(ZMIN, Math.min(ZMAX, zNoX(Math.max(EM, Math.min(W - EM, ponteiro)))));
    avisar(Math.round(val(aposta) * 1000) / 1000);
  }
  const xNoPalco = (e) => e.clientX - palco.getBoundingClientRect().left;
  palco.addEventListener("pointerdown", (e) => { if (!apostando) return; arrastando = true; palco.setPointerCapture(e.pointerId); palco.style.cursor = "grabbing"; ponteiro = xNoPalco(e); apontar(); });
  palco.addEventListener("pointermove", (e) => { if (apostando && arrastando) { ponteiro = xNoPalco(e); apontar(); } });
  palco.addEventListener("pointerup", () => { arrastando = false; if (apostando) palco.style.cursor = "grab"; });
  function rolar(dt) {
    if (!apostando || !arrastando) return;
    const esq = EM + BORDA - ponteiro, dir = ponteiro - (W - EM - BORDA);
    const passo = esq > 0 ? -Math.min(1, esq / BORDA) : dir > 0 ? Math.min(1, dir / BORDA) : 0;
    if (!passo) return;
    centro = prender(centro + passo * LARGURA * 0.5 * dt); apontar();
  }
  /* os rótulos das duas linhas ficam abaixo das bolinhas, cada um ancorado
     na sua; se colidirem, desce o que a linha do outro não atravessa */
  function marcos(txtSem, xl, txtMet, xm) {
    const caixa = (txt, x, cor, peso, esquerda) => {
      ctx.font = `${peso} 11px ${FONTE}`; const w = ctx.measureText(txt).width;
      const dir = esquerda ? x - w - 4 >= 4 : x + w + 4 > W - 4, x0 = dir ? x - w - 4 : x + 4;
      return { txt, x: dir ? x - 4 : x + 4, alinhar: dir ? "right" : "left", a: x0, b: x0 + w, y: 60, cor, peso, visivel: dentro(x) };
    };
    const s = caixa(txtSem, xl, NAVY, "600", false), m = caixa(txtMet, xm, TEAL_ESC, "", true);
    if (s.visivel && m.visivel && s.a < m.b + 8 && m.a < s.b + 8) (m.a - 4 > xl || m.b + 4 < xl ? m : s).y = 74;
    for (const r of [s, m]) if (r.visivel) rotulo(ctx, r.txt, r.x, r.y, { alinhar: r.alinhar, cor: r.cor, peso: r.peso });
    return [s.y, m.y];
  }
  function zerar() { pop = Array.from({ length: N }, () => rnorm(0, 1.07, rng)); m0 = media(pop); cristas = [densidade(pop)]; limiar = quantil(pop, FRACAO); feitas = 0; }
  const resultado = () => ({ focinho: val(cristas[cristas.length - 1].media), focinho0: val(m0), doentes: doentes() });
  function laco0() {
    if (parar) parar();
    let antes = null;
    parar = laco((t) => {
      const dt = antes === null ? 0 : Math.min(0.05, t - antes); antes = t;
      rolar(dt);
      let deslize = 0;
      if (revelando) {
        if (revelando.t0 === null) revelando.t0 = t;
        const s = reduzido() ? Infinity : (t - revelando.t0) * VEL;
        while (feitas < Math.min(opts.geracoes, Math.floor(s))) geracao();
        if (feitas < opts.geracoes) deslize = s - Math.floor(s);
        else { const fim = revelando.fim; revelando = null; fim(resultado()); }
      }
      if (!apostando) centro += (cristas[cristas.length - 1].media - centro) * (reduzido() ? 1 : 0.08);
      desenhar(deslize);
    });
  }
  return {
    preparar() { zerar(); centro = m0; aposta = null; apostando = false; desenhar(0); laco0(); },
    aposta(aoMudar) { avisar = aoMudar; apostando = true; palco.style.cursor = "grab"; aposta = cristas[0].media; },
    revelar(fim) { apostando = false; arrastando = false; palco.style.cursor = ""; zerar(); revelando = { t0: null, fim }; if (!parar) laco0(); },
    parar() { if (parar) parar(); parar = null; },
    captura(t) {
      if (aposta === null) aposta = zDe(0.15);
      apostando = false; zerar(); const g = Math.min(opts.geracoes, Math.floor(t * VEL));
      while (feitas < g) geracao(); centro = cristas[cristas.length - 1].media; desenhar(0);
    },
  };
}
