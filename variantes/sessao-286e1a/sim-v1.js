/* ============================================================
   v1 — TRÊS ESCALAS

   Conteúdo: como se LÊ um simulador daqui. O catálogo diz quais
   existem; a página do app tem os controles. O que ninguém
   explica é a leitura: toda página mostra a mesma população em
   três escalas ao mesmo tempo — os 2N alelos de perto (a lupa),
   uma população no tempo (o traço) e as vinte em conjunto (o
   feixe, e onde cada uma está agora). Aqui as três escalas são
   UMA figura só, ligada por chaves de zoom, e um cursor de
   geração move as três: arrastar a geração recolore os alelos,
   encurta o traço, fecha o feixe. Um gesto; os dados são os
   mesmos que o simulador de deriva calcula (Wright–Fisher).
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
const N = 100, G = 200, K = 20, P0 = 0.5;
const CORRE = 13, ESPERA = 3.2;                 // s: as 200 gerações passam em 13 s; 3,2 s paradas no fim

const ESCALAS = [
  { n: "1", titulo: "De perto: os alelos",
    texto: "Os 2N = 200 alelos da população 1, na geração em que o cursor está — A em azul, a em âmbar. Cada geração é um sorteio novo destes duzentos." },
  { n: "2", titulo: "No tempo: uma população",
    texto: "A frequência de A, geração a geração. O traço é o rastro dos sorteios da lupa: sem seleção nenhuma, ele anda só por acaso." },
  { n: "3", titulo: "Em conjunto: vinte populações",
    texto: "As outras dezenove começaram iguais. À direita, onde cada uma está agora: com o tempo o feixe se abre e as pontas se acumulam em 0 e em 1." },
];

function simular(semente) {
  const rng = criarRng(semente);
  const series = Array.from({ length: K }, () => {
    const p = [P0];
    for (let g = 1; g <= G; g++) p[g] = rbinom(2 * N, p[g - 1], rng) / (2 * N);
    return p;
  });
  // a população 1 é a que mais anda sem fixar: a lupa fica viva até o fim
  const amplitude = (p) => Math.max(...p) - Math.min(...p);
  const vivas = series.filter((p) => p[G] > 0 && p[G] < 1);
  const foco = (vivas.length ? vivas : series).reduce((a, b) => (amplitude(b) > amplitude(a) ? b : a));
  series.splice(series.indexOf(foco), 1); series.unshift(foco);
  // a posição de cada alelo na lupa é fixa; o que muda é quantos estão em A
  const ordem = Array.from({ length: 2 * N }, (_, i) => i);
  for (let i = ordem.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [ordem[i], ordem[k]] = [ordem[k], ordem[i]]; }
  return { series, ordem };
}

export function montar(secao, opts = {}) {
  const base = opts.base || "../../";
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= DOM ================= */
  const eloCorrer = el("button", { type: "button", class: "vivo-elo", texto: "deixe o tempo correr" });
  const eloNovo = el("button", { type: "button", class: "vivo-elo", texto: "sorteie outra vez" });
  const cabeca = el("div", { class: "esc-cabeca" },
    el("p", { class: "vivo-frase", html: "Uma população de perto, uma no tempo, <b>vinte em conjunto</b>." }),
    el("p", { class: "vivo-texto" },
      T("Todo simulador daqui mostra a mesma coisa em três escalas, ao mesmo tempo — e é assim que se lê a página. "),
      el("em", { texto: "Arraste a geração" }), T(" na linha de baixo, "), eloCorrer, T(" ou "), eloNovo, T(".")));

  const tela = el("canvas", { class: "esc-tela", "aria-label": "Uma simulação de deriva genética em três escalas" });
  const figura = el("div", { class: "esc-figura" }, tela);
  const legenda = el("div", { class: "esc-legenda" },
    ...ESCALAS.map((e) => el("div", { class: "esc-item" },
      el("span", { class: "esc-n", texto: e.n }),
      el("h3", { texto: e.titulo }),
      el("p", { texto: e.texto }))));
  const pe = el("div", { class: "esc-pe" },
    el("p", { class: "vivo-nota", texto: "Na página de cada simulador as três escalas ficam lado a lado — a lupa, o gráfico com a linha do tempo e a faixa das réplicas — e o modelo no meio muda de um para outro." }),
    el("a", { class: "link-seta", href: `${base}catalogo.html`, texto: "Ver os simuladores" }));

  const container = secao.querySelector(".container") || secao.appendChild(el("div", { class: "container" }));
  container.append(cabeca, figura, legenda, pe);

  /* ================= geometria ================= */
  const ctx = tela.getContext("2d");
  let W = 0, H = 0, Z = null;
  function medir() {
    const dpr = window.devicePixelRatio || 1;
    W = tela.clientWidth; H = tela.clientHeight;
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const estreito = W < 760;
    const topo = 34, base = H - 84;                       // a faixa da geração fica embaixo
    if (W < 560) {                                        // celular: a lupa e o traço em cima, o feixe embaixo
      const R = 62, distW = 30, meio = topo + 2 * R + 20 + 52;
      Z = {
        lupa: { cx: 24 + R, cy: topo + R + 10, R },
        linha: { x: 24 + 2 * R + 44, y: topo, w: W - (24 + 2 * R + 44) - 16, h: 2 * R + 20 },
        feixe: { x: 40, y: meio, w: W - 40 - 16 - distW - 10, h: base - meio },
        dist: { x: W - 16 - distW, y: meio, w: distW, h: base - meio },
        cursor: { x: 24, y: H - 34, w: W - 48 },
      };
      return;
    }
    const R = Math.min((base - topo) / 2 - 6, estreito ? 90 : 118);
    Z = {
      lupa: { cx: 24 + R, cy: (topo + base) / 2, R },
      linha: { x: 24 + 2 * R + (estreito ? 44 : 88), y: topo, w: 0, h: base - topo },
      feixe: { x: 0, y: topo, w: 0, h: base - topo },
      dist:  { x: 0, y: topo, w: estreito ? 34 : 52, h: base - topo },
      cursor: { x: 24, y: H - 34, w: W - 48 },
    };
    const livre = W - Z.linha.x - Z.dist.w - 24;          // o que sobra, dividido entre o traço e o feixe
    const vao = estreito ? 36 : 64;
    Z.linha.w = Math.round((livre - vao) * 0.42);
    Z.feixe.x = Z.linha.x + Z.linha.w + vao;
    Z.feixe.w = livre - vao - Z.linha.w;
    Z.dist.x = Z.feixe.x + Z.feixe.w + 10;
  }

  /* ================= desenho ================= */
  function texto(s, x, y, { alinhar = "left", cor = SUAVE, peso = "", tam = 11, base = "top" } = {}) {
    ctx.font = `${peso} ${tam}px ${FONTE}`; ctx.fillStyle = cor; ctx.textAlign = alinhar; ctx.textBaseline = base; ctx.fillText(s, x, y);
  }
  const px = (a, g) => a.x + (g / G) * a.w;
  const py = (a, p) => a.y + a.h - p * a.h;
  function tracar(a, serie, ate, { cor, largura = 1.5, alpha = 1, tracejado = null }) {
    ctx.strokeStyle = cor; ctx.lineWidth = largura; ctx.globalAlpha = alpha; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.setLineDash(tracejado || []);
    ctx.beginPath();
    for (let g = 0; g <= ate; g++) g ? ctx.lineTo(px(a, g), py(a, serie[g])) : ctx.moveTo(px(a, g), py(a, serie[g]));
    ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
  }
  function eixos(a, comX) {
    ctx.setLineDash([2, 5]); ctx.strokeStyle = GRADE; ctx.lineWidth = 1;
    for (const v of [0.25, 0.5, 0.75]) { const y = py(a, v); ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = EIXO; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y + a.h); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.stroke();
    texto("1", a.x - 6, py(a, 1), { alinhar: "right", base: "middle" });
    texto("0,5", a.x - 6, py(a, 0.5), { alinhar: "right", base: "middle" });
    texto("0", a.x - 6, py(a, 0), { alinhar: "right", base: "middle" });
    if (comX) for (const g of [0, 100, 200]) texto(String(g), px(a, g), a.y + a.h + 6, { alinhar: "center" });
  }
  function chave(x1a, y1a, x1b, y1b, x2, y2) {           // as duas linhas que "abrem" uma escala na outra
    ctx.strokeStyle = TEAL_CLARO; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x1a, y1a); ctx.lineTo(x2, y2); ctx.moveTo(x1b, y1b); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  }

  let dados = simular(7), g = 0, semente = 7;
  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    const { series, ordem } = dados;
    const p = series[0][g], nA = Math.round(p * 2 * N);
    const emA = new Uint8Array(2 * N);
    for (let i = 0; i < nA; i++) emA[ordem[i]] = 1;

    /* ---- 1 · a lupa: 200 alelos num girassol ---- */
    const L = Z.lupa;
    ctx.strokeStyle = EIXO; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, 0, 2 * Math.PI); ctx.stroke();
    const dourado = Math.PI * (3 - Math.sqrt(5)), r = Math.max(2.6, L.R / 22);
    for (let i = 0; i < 2 * N; i++) {
      const rr = (L.R - r - 3) * Math.sqrt((i + 0.5) / (2 * N)), a = i * dourado;
      ctx.fillStyle = emA[i] ? NAVY : AMARELO;
      ctx.beginPath(); ctx.arc(L.cx + rr * Math.cos(a), L.cy + rr * Math.sin(a), r, 0, 2 * Math.PI); ctx.fill();
    }
    texto("população 1 · de perto", L.cx - L.R, L.cy - L.R - 18, { cor: NAVY, peso: "600" });
    texto(`A: ${nA} de ${2 * N}`, L.cx - L.R, L.cy + L.R + 8, { cor: NAVY, peso: "600", tam: 12 });
    texto(`a: ${2 * N - nA}`, L.cx + L.R, L.cy + L.R + 8, { alinhar: "right" });

    /* ---- 2 · o traço da população 1 ---- */
    const A = Z.linha;
    texto("população 1 · no tempo", A.x, A.y - 18, { cor: NAVY, peso: "600" });
    eixos(A, true);
    tracar(A, Array(G + 1).fill(P0), G, { cor: SUAVE, largura: 1, alpha: 0.6, tracejado: [5, 5] });
    texto("p₀", A.x + A.w - 3, py(A, P0) - 4, { alinhar: "right", base: "bottom" });
    tracar(A, series[0], g, { cor: AMARELO, largura: 6, alpha: 0.16 });
    tracar(A, series[0], g, { cor: NAVY, largura: 2.2 });
    const mx = px(A, g), my = py(A, p);
    // a chave: a lupa é este ponto
    chave(L.cx + L.R * Math.cos(-0.35), L.cy + L.R * Math.sin(-0.35), L.cx + L.R * Math.cos(0.35), L.cy + L.R * Math.sin(0.35), mx, my);
    ctx.strokeStyle = GRADE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, A.y); ctx.lineTo(mx, A.y + A.h); ctx.stroke();

    /* ---- 3 · as vinte, e onde estão agora ---- */
    const F = Z.feixe, D = Z.dist;
    texto("as vinte populações · em conjunto", F.x, F.y - 18, { cor: NAVY, peso: "600" });
    eixos(F, true);
    for (let k = 1; k < K; k++) tracar(F, series[k], g, { cor: k % 3 === 2 ? TEAL : TEAL_CLARO, largura: 1.2, alpha: 0.55 });
    tracar(F, series[0], g, { cor: NAVY, largura: 2 });
    // a chave: o traço é um destes vinte
    chave(A.x + A.w, A.y, A.x + A.w, A.y + A.h, F.x - 4, py(F, p));
    // a distribuição agora: histograma deitado, como na página do app
    const nb = 10, cont = new Array(nb).fill(0);
    for (const s of series) cont[Math.max(0, Math.min(nb - 1, Math.floor(s[g] * nb)))]++;
    const maxC = Math.max(...cont, 1), hb = D.h / nb;
    ctx.strokeStyle = GRADE; ctx.beginPath(); ctx.moveTo(D.x - 4, D.y); ctx.lineTo(D.x - 4, D.y + D.h); ctx.stroke();
    ctx.fillStyle = TEAL; ctx.globalAlpha = 0.55;
    cont.forEach((c, b) => { if (c) ctx.fillRect(D.x, D.y + D.h - (b + 1) * hb + 1.5, Math.max(2, (c / maxC) * (D.w - 4)), hb - 3); });
    ctx.globalAlpha = 1;
    texto("agora", D.x - 2, D.y - 18);
    const fix = series.filter((s) => s[g] >= 1).length, perd = series.filter((s) => s[g] <= 0).length;
    texto(`fixou em ${fix} · perdeu em ${perd}`, F.x + F.w, F.y - 18, { alinhar: "right", cor: NAVY, peso: "600" });

    /* ---- o cursor da geração ---- */
    const C = Z.cursor;
    ctx.strokeStyle = EIXO; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(C.x + C.w, C.y); ctx.stroke();
    for (const t of [0, 50, 100, 150, 200]) {
      const x = C.x + (t / G) * C.w;
      ctx.beginPath(); ctx.moveTo(x, C.y - 4); ctx.lineTo(x, C.y + 4); ctx.stroke();
      texto(String(t), x, C.y + 9, { alinhar: "center" });
    }
    const cx = C.x + (g / G) * C.w;
    ctx.strokeStyle = AMARELO; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(cx, C.y); ctx.stroke();
    ctx.fillStyle = "rgba(252,180,33,.25)"; ctx.beginPath(); ctx.arc(cx, C.y, 11, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = AMARELO; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, C.y, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    texto(`geração ${g}`, cx, C.y - 12, { alinhar: "center", cor: NAVY, peso: "600", tam: 12, base: "bottom" });
  }

  /* ================= o gesto: arrastar a geração ================= */
  let correndo = true, inicio = null, arrastando = false;
  function gDe(e) {
    const r = tela.getBoundingClientRect();
    return Math.max(0, Math.min(G, Math.round(((e.clientX - r.left - Z.cursor.x) / Z.cursor.w) * G)));
  }
  tela.addEventListener("pointerdown", (e) => {
    arrastando = true; correndo = false; tela.setPointerCapture(e.pointerId);
    g = gDe(e); desenhar();
  });
  tela.addEventListener("pointermove", (e) => { if (arrastando) { g = gDe(e); desenhar(); } });
  tela.addEventListener("pointerup", () => { arrastando = false; });
  tela.addEventListener("pointercancel", () => { arrastando = false; });
  eloCorrer.addEventListener("click", () => { correndo = true; inicio = performance.now() - (g / G) * CORRE * 1000; });
  eloNovo.addEventListener("click", () => { semente += 1; dados = simular(semente); g = 0; inicio = null; if (!correndo) desenhar(); });

  const naTela = () => { const r = figura.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  function quadro(agora) {
    if (correndo && naTela()) {
      if (inicio === null) inicio = agora;
      const t = (agora - inicio) / 1000;
      if (t > CORRE + ESPERA) { semente += 1; dados = simular(semente); inicio = agora; }
      const novo = Math.min(G, Math.floor((Math.min(t, CORRE) / CORRE) * G));
      if (novo !== g) { g = novo; desenhar(); }
    }
    requestAnimationFrame(quadro);
  }

  medir();
  window.addEventListener("resize", () => { medir(); desenhar(); });
  /* só para captura de tela: #g=140 para a figura na geração 140 */
  const captura = /g=(\d+)/.exec(location.hash);
  if (captura) { g = Math.min(G, +captura[1]); correndo = false; desenhar(); return; }
  if (reduzido) { g = G; desenhar(); return; }
  desenhar();
  requestAnimationFrame(quadro);
}
