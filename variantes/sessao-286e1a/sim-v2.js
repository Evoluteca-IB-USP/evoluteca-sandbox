/* ============================================================
   v2 — A TEORIA AO LADO DO SORTEIO

   Conteúdo: um traço de todo simulador daqui, que o catálogo
   não conta: a previsão da teoria fica sempre ao lado do que o
   sorteio deu — a linha de p₀ no gráfico, as barras do esperado
   atrás das barras da amostra, a probabilidade de fixação no
   resumo. É assim que se confere que o modelo está certo, e é
   assim que a teoria ganha sentido para quem aprende: uma
   população só faz o que quer; centenas obedecem ao número.

   A figura: à esquerda, populações rodam uma atrás da outra
   (N = 50, p₀ = 0,2), cada traço novo por cima dos antigos, que
   vão ficando como um feixe pálido; cada rodada que termina
   solta uma bolinha para o placar à direita — fixou A (âmbar)
   ou perdeu A (navy) — e a fração fixada vai se acomodando na
   linha tracejada que a teoria previu: p₀ = 20%. Um gesto:
   mudar p₀ (três frases-controle) recomeça o placar.
   ============================================================ */

import { criarRng, rbinom } from "../../motor-de-simuladores/r/__pacote__.js";

function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "texto") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  n.append(...filhos.filter((f) => f != null));
  return n;
}
const T = (s) => document.createTextNode(s);

const NAVY = "#142560", TEAL = "#1094ab", TEAL_CLARO = "#64c4d2", AMARELO = "#fcb421", SUAVE = "#6b6b6b";
const GRADE = "rgba(20,37,96,.16)", EIXO = "rgba(20,37,96,.35)", FONTE = "'Open Sans', sans-serif";
const N = 50, G = 300, RODADA = 0.9, MAX = 240;      // s por rodada; rodadas até recomeçar
const OPCOES = [{ p0: 0.2, rotulo: "p₀ = 0,2" }, { p0: 0.5, rotulo: "p₀ = 0,5" }, { p0: 0.8, rotulo: "p₀ = 0,8" }];
const fmtPct = (x) => `${Math.round(x * 100)}%`;

const LEITURAS = [
  { n: "1", titulo: "Uma população faz o que quer",
    texto: "Cada traço é um sorteio: sobe, desce, fixa quando dá. Olhando uma só, não há como saber o que vai acontecer — e é isso que a lupa e o gráfico de cada simulador mostram." },
  { n: "2", titulo: "Muitas obedecem ao número",
    texto: "A teoria diz que um alelo neutro fixa com probabilidade igual à sua frequência inicial. O placar começa longe disso e vai se acomodando na linha, rodada após rodada." },
  { n: "3", titulo: "A previsão fica sempre à vista",
    texto: "Em todo simulador daqui a teoria está ao lado do sorteio: a linha de p₀ no gráfico, as barras do esperado atrás da amostra, a fixação prevista no resumo. Serve para conferir o modelo — e para entender o que a fórmula quer dizer." },
];

export function montar(secao, opts = {}) {
  const base = opts.base || "../../";
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let p0 = 0.2, rng = criarRng(20);

  /* ================= DOM ================= */
  const elos = OPCOES.map((o) => {
    const b = el("button", { type: "button", class: "vivo-elo", texto: o.rotulo, "aria-pressed": String(o.p0 === p0) });
    b.addEventListener("click", () => { p0 = o.p0; recomecar(); });
    return b;
  });
  const cabeca = el("div", { class: "teo-cabeca" },
    el("p", { class: "vivo-frase", html: "O acaso, de um lado. <b>A teoria, do outro.</b>" }),
    el("p", { class: "vivo-texto" },
      T("Nenhuma população sozinha obedece à fórmula; centenas, sim. Aqui elas rodam uma atrás da outra, e o placar vai encontrando o número que a teoria previu. "),
      el("em", { texto: "Mude o começo" }), T(": "), elos[0], T(" · "), elos[1], T(" · "), elos[2], T(".")));

  const tela = el("canvas", { class: "teo-tela", "aria-hidden": "true" });
  const placarN = el("b", { texto: "0" }), placarFix = el("b", { texto: "—" }), placarTeo = el("b", { texto: fmtPct(p0) });
  const placar = el("div", { class: "teo-placar" },
    el("div", {}, placarN, el("small", { texto: "populações rodadas" })),
    el("div", {}, placarFix, el("small", { texto: "fixaram A" })),
    el("div", { class: "teo-placar-teoria" }, placarTeo, el("small", { texto: "a teoria previu (= p₀)" })));
  const figura = el("div", { class: "teo-figura" }, tela, placar);

  const legenda = el("div", { class: "teo-legenda" },
    ...LEITURAS.map((e) => el("div", { class: "teo-item" },
      el("span", { class: "teo-n", texto: e.n }), el("h3", { texto: e.titulo }), el("p", { texto: e.texto }))));
  const pe = el("div", { class: "teo-pe" },
    el("p", { class: "vivo-nota", texto: "Os modelos são curtos e conferidos contra estes resultados clássicos; cada página traz a previsão ao lado do que saiu." }),
    el("a", { class: "link-seta", href: `${base}catalogo.html`, texto: "Ver os simuladores" }));

  const container = secao.querySelector(".container") || secao.appendChild(el("div", { class: "container" }));
  container.append(cabeca, figura, legenda, pe);

  /* ================= geometria ================= */
  const ctx = tela.getContext("2d");
  let W = 0, H = 0, A = null, B = null;
  function medir() {
    const dpr = window.devicePixelRatio || 1;
    W = tela.clientWidth; H = tela.clientHeight;
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const estreito = W < 700;
    A = { x: 40, y: 34, w: Math.round(W * (estreito ? 0.56 : 0.6)) - 40, h: H - 78 };        // o feixe
    B = { x: A.x + A.w + (estreito ? 40 : 80), y: 34, w: W - (A.x + A.w + (estreito ? 40 : 80)) - 16, h: H - 78 };   // o placar
    fundo = null;
  }

  /* ================= estado ================= */
  let feitas = [], atual = null, inicio = null, fundo = null, contagem = { fix: 0, perd: 0 }, bolinhas = [];
  function novaRodada() {
    const p = [p0];
    for (let g = 1; g <= G; g++) { p[g] = rbinom(2 * N, p[g - 1], rng) / (2 * N); if (p[g] <= 0 || p[g] >= 1) break; }
    return { p, fim: p.length - 1, fixou: p[p.length - 1] >= 1, perdeu: p[p.length - 1] <= 0 };
  }
  function recomecar() {
    feitas = []; atual = null; inicio = null; fundo = null; contagem = { fix: 0, perd: 0 }; bolinhas = [];
    rng = criarRng(20 + Math.round(p0 * 100));
    elos.forEach((b, i) => b.setAttribute("aria-pressed", String(OPCOES[i].p0 === p0)));
    placarTeo.textContent = fmtPct(p0);
    if (reduzido) { for (let i = 0; i < 120; i++) terminar(novaRodada()); desenhar(null, 1); }
  }
  function terminar(r) {
    feitas.push(r);
    if (r.fixou) contagem.fix++; else if (r.perdeu) contagem.perd++;
    fundo = null;
  }

  /* ================= desenho ================= */
  function texto(s, x, y, { alinhar = "left", cor = SUAVE, peso = "", tam = 11, base = "top" } = {}) {
    ctx.font = `${peso} ${tam}px ${FONTE}`; ctx.fillStyle = cor; ctx.textAlign = alinhar; ctx.textBaseline = base; ctx.fillText(s, x, y);
  }
  const px = (g) => A.x + (g / G) * A.w, py = (p) => A.y + A.h - p * A.h;
  function tracar(serie, ate, { cor, largura = 1.5, alpha = 1 }) {
    ctx.strokeStyle = cor; ctx.lineWidth = largura; ctx.globalAlpha = alpha; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    for (let g = 0; g <= ate; g++) g ? ctx.lineTo(px(g), py(serie[g])) : ctx.moveTo(px(g), py(serie[g]));
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  // o feixe das rodadas já feitas é caro de redesenhar: fica guardado numa camada
  let camada = null;
  function feixeGuardado() {
    if (fundo) return fundo;
    const dpr = window.devicePixelRatio || 1;
    if (!camada) camada = document.createElement("canvas");
    camada.width = tela.width; camada.height = tela.height;
    const c2 = camada.getContext("2d"); c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.lineJoin = "round"; c2.lineCap = "round"; c2.lineWidth = 1;
    for (const r of feitas) {
      c2.strokeStyle = r.fixou ? AMARELO : r.perdeu ? TEAL : TEAL_CLARO; c2.globalAlpha = 0.22;
      c2.beginPath();
      for (let g = 0; g <= r.fim; g++) g ? c2.lineTo(px(g), py(r.p[g])) : c2.moveTo(px(g), py(r.p[g]));
      c2.stroke();
    }
    fundo = camada;
    return fundo;
  }

  function desenhar(rodada, f) {
    ctx.clearRect(0, 0, W, H);
    /* ---- o feixe ---- */
    texto(`populações de N = ${N}, uma atrás da outra`, A.x, A.y - 20, { cor: NAVY, peso: "600" });
    ctx.setLineDash([2, 5]); ctx.strokeStyle = GRADE; ctx.lineWidth = 1;
    for (const v of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.moveTo(A.x, py(v)); ctx.lineTo(A.x + A.w, py(v)); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = EIXO; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x, A.y + A.h); ctx.lineTo(A.x + A.w, A.y + A.h); ctx.stroke();
    for (const [v, r] of [[1, "1"], [0.5, "0,5"], [0, "0"]]) texto(r, A.x - 6, py(v), { alinhar: "right", base: "middle" });
    for (const g of [0, 100, 200, 300]) texto(String(g), px(g), A.y + A.h + 6, { alinhar: "center" });
    texto("gerações", A.x + A.w, A.y + A.h + 20, { alinhar: "right" });
    if (feitas.length) ctx.drawImage(feixeGuardado(), 0, 0, W, H);
    // a linha de p₀: a previsão, sempre à vista
    ctx.setLineDash([5, 5]); ctx.strokeStyle = SUAVE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(A.x, py(p0)); ctx.lineTo(A.x + A.w, py(p0)); ctx.stroke(); ctx.setLineDash([]);
    texto(`p₀ = ${p0.toString().replace(".", ",")}`, A.x + A.w - 4, py(p0) - 4, { alinhar: "right", base: "bottom", cor: NAVY, peso: "600" });
    if (rodada) {
      const ate = Math.round(f * rodada.fim);
      tracar(rodada.p, ate, { cor: NAVY, largura: 6, alpha: 0.12 });
      tracar(rodada.p, ate, { cor: NAVY, largura: 2 });
      const x = px(ate), y = py(rodada.p[ate]);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, 2 * Math.PI); ctx.fill();
    }

    /* ---- o placar: fixou A × perdeu A, com a linha da teoria ---- */
    texto("de cada cem, quantas fixaram A", B.x, B.y - 20, { cor: NAVY, peso: "600" });
    const total = feitas.length, fr = total ? contagem.fix / total : 0;
    const barra = { x: B.x, y: B.y + 24, w: B.w, h: 14 };
    // trilho e as duas frações
    ctx.fillStyle = "rgba(20,37,96,.07)"; ctx.beginPath(); ctx.roundRect(barra.x, barra.y, barra.w, barra.h, 7); ctx.fill();
    if (total) {
      ctx.fillStyle = AMARELO; ctx.beginPath(); ctx.roundRect(barra.x, barra.y, Math.max(6, barra.w * fr), barra.h, 7); ctx.fill();
    }
    const xt = barra.x + barra.w * p0;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xt, barra.y - 10); ctx.lineTo(xt, barra.y + barra.h + 10); ctx.stroke(); ctx.setLineDash([]);
    texto(`teoria: ${fmtPct(p0)}`, xt, barra.y + barra.h + 14, { alinhar: p0 > 0.6 ? "right" : "left", cor: NAVY, peso: "600" });
    if (total) texto(`agora: ${fmtPct(fr)}`, barra.x + barra.w * fr, barra.y - 14, { alinhar: fr > 0.6 ? "right" : "left", cor: "#b07a00", peso: "600", base: "bottom" });
    // a linha do placar no tempo: a fração fixada, rodada após rodada, encostando na teoria
    const S = { x: B.x, y: barra.y + 58, w: B.w, h: B.h - 106 };
    ctx.setLineDash([2, 5]); ctx.strokeStyle = GRADE; ctx.lineWidth = 1;
    for (const v of [0.25, 0.5, 0.75]) { const y = S.y + S.h - v * S.h; ctx.beginPath(); ctx.moveTo(S.x, y); ctx.lineTo(S.x + S.w, y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = EIXO; ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(S.x, S.y + S.h); ctx.lineTo(S.x + S.w, S.y + S.h); ctx.stroke();
    texto("100%", S.x - 6, S.y, { alinhar: "right", base: "middle" }); texto("0", S.x - 6, S.y + S.h, { alinhar: "right", base: "middle" });
    texto("rodadas →", S.x + S.w, S.y + S.h + 6, { alinhar: "right" });
    const yTeo = S.y + S.h - p0 * S.h;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(S.x, yTeo); ctx.lineTo(S.x + S.w, yTeo); ctx.stroke(); ctx.setLineDash([]);
    if (total > 1) {
      ctx.strokeStyle = AMARELO; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.beginPath();
      let fix = 0;
      feitas.forEach((r, i) => {
        if (r.fixou) fix++;
        const x = S.x + ((i + 1) / MAX) * S.w, y = S.y + S.h - (fix / (i + 1)) * S.h;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
      const x = S.x + (total / MAX) * S.w, y = S.y + S.h - fr * S.h;
      ctx.fillStyle = "rgba(252,180,33,.25)"; ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = AMARELO; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
    // as bolinhas voando do fim da rodada para o placar
    for (const b of bolinhas) {
      const u = Math.min(1, (performance.now() - b.t0) / 600), e = u * u * (3 - 2 * u);
      const x = b.x0 + (b.x1 - b.x0) * e, y = b.y0 + (b.y1 - b.y0) * e - Math.sin(u * Math.PI) * 40;
      ctx.fillStyle = b.cor; ctx.globalAlpha = 1 - e * 0.6; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    }
    placarN.textContent = String(total);
    placarFix.textContent = total ? `${contagem.fix} · ${fmtPct(fr)}` : "—";
  }

  /* ================= laço ================= */
  const naTela = () => { const r = figura.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  function quadro(agora) {
    if (naTela()) {
      if (!atual) { atual = novaRodada(); inicio = agora; }
      const dur = RODADA * Math.max(0.35, Math.min(1, atual.fim / 120));   // rodadas curtas passam mais rápido
      const f = Math.min(1, (agora - inicio) / 1000 / dur);
      desenhar(atual, f);
      if (f >= 1) {
        const fimX = px(atual.fim), fimY = py(atual.p[atual.fim]);
        terminar(atual);
        const fr = contagem.fix / feitas.length;
        bolinhas.push({ t0: agora, x0: fimX, y0: fimY, x1: B.x + B.w * fr, y1: B.y + 15, cor: atual.fixou ? AMARELO : NAVY });
        atual = null;
        if (feitas.length >= MAX) { setTimeout(recomecar, 1800); atual = { p: [p0], fim: 0, fixou: false, perdeu: false, pausa: true }; inicio = agora + 1e9; }
      }
      bolinhas = bolinhas.filter((b) => agora - b.t0 < 650);
    }
    requestAnimationFrame(quadro);
  }

  medir();
  window.addEventListener("resize", () => { medir(); desenhar(atual, 1); });
  /* só para captura de tela: #rodadas=80 mostra o placar depois de 80 populações */
  const captura = /rodadas=(\d+)/.exec(location.hash);
  if (captura) { for (let i = 0; i < +captura[1]; i++) terminar(novaRodada()); desenhar(novaRodada(), 0.6); return; }
  if (reduzido) { recomecar(); return; }
  desenhar(null, 0);
  requestAnimationFrame(quadro);
}
