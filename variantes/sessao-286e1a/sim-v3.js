/* ============================================================
   v3 — A ÁRVORE DOS "E SE"

   Conteúdo: como se EXPLORA um simulador daqui. Toda página
   abre num ponto de partida; os cenários de um clique e os
   passos do roteiro são ramos que saem dele — muda-se uma coisa
   só, vê-se o que dá, muda-se outra por cima. A figura é essa
   árvore, desenhada com os ramos do roteiro da deriva genética:
   a raiz à esquerda (N = 100, p₀ = 0,5), quatro ramos de
   primeira ordem (população pequena, enorme, A raro, os doze do
   zoológico) e dois ramos sobre ramos. Em cada ponta o
   resultado está vivo, rodando com aqueles valores. Passar o
   cursor por uma ponta acende o caminho desde a raiz.
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
const SVG = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

const NAVY = "#142560", TEAL = "#1094ab", TEAL_CLARO = "#64c4d2", AMARELO = "#fcb421", SUAVE = "#6b6b6b";
const GRADE = "rgba(20,37,96,.16)", EIXO = "rgba(20,37,96,.35)", FONTE = "'Open Sans', sans-serif";
const G = 100, DESENHA = 5, ESPERA = 2.2;

/* a árvore: cada nó é um "e se" com os valores que mudam em relação ao pai */
const NOS = [
  { id: "raiz", pai: null, nivel: 0, N: 100, p0: 0.5, K: 20, kicker: "ponto de partida", pergunta: "N = 100, p₀ = 0,5", roteiro: 1 },
  { id: "pequena", pai: "raiz", nivel: 1, linha: 0, N: 10, p0: 0.5, K: 12, kicker: "e se…", pergunta: "a população fosse pequena?", muda: "N = 10", roteiro: 2 },
  { id: "enorme", pai: "raiz", nivel: 1, linha: 1, N: 2000, p0: 0.5, K: 12, kicker: "e se…", pergunta: "fosse enorme?", muda: "N = 2000", roteiro: 3 },
  { id: "raro", pai: "raiz", nivel: 1, linha: 2, N: 50, p0: 0.1, K: 12, kicker: "e se…", pergunta: "A começasse raro?", muda: "p₀ = 0,1 · N = 50", roteiro: 4 },
  { id: "zoo", pai: "raiz", nivel: 1, linha: 3, N: 12, p0: 0.5, K: 12, kicker: "e se…", pergunta: "fossem os 12 do zoológico?", muda: "N = 12", roteiro: 5 },
  { id: "pequena-raro", pai: "pequena", nivel: 2, linha: 0, N: 10, p0: 0.1, K: 12, kicker: "…e se, além disso,", pergunta: "A começasse raro?", muda: "N = 10 · p₀ = 0,1" },
  { id: "raro-enorme", pai: "raro", nivel: 2, linha: 2, N: 2000, p0: 0.1, K: 12, kicker: "…e se, além disso,", pergunta: "a população fosse enorme?", muda: "N = 2000 · p₀ = 0,1" },
];

const LEITURAS = [
  { n: "1", titulo: "O ponto de partida",
    texto: "Vinte populações iguais, N = 100 e p₀ = 0,5. O roteiro começa mandando rodar de novo umas cinco vezes: as curvas nunca saem iguais, e é preciso ver isso antes de mudar qualquer coisa." },
  { n: "2", titulo: "Um ramo, uma mudança",
    texto: "Cada cenário muda um número só, para a comparação ser justa: N pequeno, N enorme, A raro. Guardar a rodada anterior como referência deixa o antes em cinza, atrás do depois." },
  { n: "3", titulo: "Ramo sobre ramo",
    texto: "As perguntas boas nascem das respostas: e se a população pequena também começasse com A raro? O roteiro dá o primeiro caminho; o resto da árvore é da turma." },
];

function simular(no, semente) {
  const rng = criarRng(semente);
  return Array.from({ length: no.K }, () => {
    const p = [no.p0];
    for (let g = 1; g <= G; g++) p[g] = rbinom(2 * no.N, p[g - 1], rng) / (2 * no.N);
    return p;
  });
}

export function montar(secao, opts = {}) {
  const base = opts.base || "../../";
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= DOM ================= */
  const eloNovo = el("button", { type: "button", class: "vivo-elo", texto: "sorteie a árvore de novo" });
  const cabeca = el("div", { class: "arv-cabeca" },
    el("p", { class: "vivo-frase", html: "Um simulador é uma árvore de <b>e se</b>." }),
    el("p", { class: "vivo-texto" },
      T("Toda página abre num ponto de partida. Os cenários de um clique e os passos do roteiro são ramos que saem dele: muda-se uma coisa só, vê-se o que dá, muda-se outra por cima. "),
      el("em", { texto: "Passe o cursor" }), T(" por uma ponta para acender o caminho, ou "), eloNovo, T(".")));

  const ramos = svg("svg", { class: "arv-ramos", "aria-hidden": "true" });
  const figura = el("div", { class: "arv-figura" }, ramos);
  for (const no of NOS) {
    no.tela = el("canvas", { class: "arv-tela" });
    no.no = el("div", { class: `arv-no arv-nivel-${no.nivel}`, "data-id": no.id },
      el("p", { class: "arv-kicker" }, T(no.kicker), no.roteiro ? el("span", { class: "arv-roteiro", texto: `roteiro ${no.roteiro}` }) : null),
      el("p", { class: "arv-pergunta", texto: no.pergunta }),
      no.muda ? el("p", { class: "arv-muda", texto: no.muda }) : null,
      no.tela,
      el("p", { class: "arv-resumo" }));
    no.resumo = no.no.lastChild;
    figura.append(no.no);
  }

  const legenda = el("div", { class: "arv-legenda" },
    ...LEITURAS.map((e) => el("div", { class: "arv-item" },
      el("span", { class: "arv-n", texto: e.n }), el("h3", { texto: e.titulo }), el("p", { texto: e.texto }))));
  const pe = el("div", { class: "arv-pe" },
    el("p", { class: "vivo-nota", texto: "Cada simulador tem a sua árvore: os cenários de um clique são os primeiros ramos, o roteiro é um caminho por eles, e os controles deixam abrir os outros." }),
    el("a", { class: "link-seta", href: `${base}catalogo.html`, texto: "Ver os simuladores" }));

  const container = secao.querySelector(".container") || secao.appendChild(el("div", { class: "container" }));
  container.append(cabeca, figura, legenda, pe);

  /* ================= a árvore: posições e ramos ================= */
  const porId = Object.fromEntries(NOS.map((n) => [n.id, n]));
  function dispor() {
    const W = figura.clientWidth, H = figura.clientHeight;
    const estreita = W < 820;
    ramos.replaceChildren();
    if (estreita) return;                                 // no celular a árvore vira lista (CSS)
    ramos.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const larg = [Math.round(W * 0.235), Math.round(W * 0.245), Math.round(W * 0.235)];
    const x = [0, Math.round(W * 0.375), Math.round(W * 0.765)];
    const linhas = 4, passo = H / linhas;
    for (const no of NOS) {
      no.no.style.width = `${larg[no.nivel]}px`;
      no.no.style.left = `${x[no.nivel]}px`;
      const alt = no.no.offsetHeight;
      let y;
      if (no.nivel === 0) y = H / 2 - alt / 2;
      else y = passo * no.linha + (passo - alt) / 2 + (no.nivel === 2 ? passo * 0.42 : 0);
      y = Math.max(0, Math.min(H - alt, y));
      no.no.style.top = `${y}px`;
      no.ancoraEsq = [x[no.nivel], y + alt * 0.5];
      no.ancoraDir = [x[no.nivel] + larg[no.nivel], y + alt * 0.5];
    }
    for (const no of NOS) {
      if (!no.pai) continue;
      const p = porId[no.pai];
      const [x1, y1] = p.ancoraDir, [x2, y2] = no.ancoraEsq;
      const cx = (x1 + x2) / 2;
      no.ramo = svg("path", { class: "arv-ramo", d: `M${x1 + 6},${y1} C${cx},${y1} ${cx},${y2} ${x2 - 6},${y2}`, "data-para": no.id });
      no.ponta = svg("circle", { class: "arv-ponta", cx: x2 - 6, cy: y2, r: 3.5 });
      ramos.append(no.ramo, no.ponta);
    }
    ramos.append(svg("circle", { class: "arv-raiz", cx: porId.raiz.ancoraDir[0] + 6, cy: porId.raiz.ancoraDir[1], r: 4.5 }));
  }

  /* o caminho aceso: da raiz até o nó sob o cursor */
  function acender(id) {
    const caminho = new Set();
    for (let n = id ? porId[id] : null; n; n = n.pai ? porId[n.pai] : null) caminho.add(n.id);
    for (const no of NOS) {
      no.no.classList.toggle("arv-aceso", caminho.has(no.id));
      no.no.classList.toggle("arv-apagado", id != null && !caminho.has(no.id));
      if (no.ramo) no.ramo.classList.toggle("arv-aceso", caminho.has(no.id));
      if (no.ponta) no.ponta.classList.toggle("arv-aceso", caminho.has(no.id));
    }
  }
  for (const no of NOS) {
    no.no.addEventListener("pointerenter", () => acender(no.id));
    no.no.addEventListener("pointerleave", () => acender(null));
  }

  /* ================= as pontas vivas ================= */
  let semente = 31;
  for (const no of NOS) { no.series = simular(no, semente + NOS.indexOf(no)); no.atraso = NOS.indexOf(no) * 0.7; }
  function texto(ctx, s, x, y, { alinhar = "left", cor = SUAVE, peso = "", tam = 10, base = "top" } = {}) {
    ctx.font = `${peso} ${tam}px ${FONTE}`; ctx.fillStyle = cor; ctx.textAlign = alinhar; ctx.textBaseline = base; ctx.fillText(s, x, y);
  }
  function desenharNo(no, f) {
    const c = no.tela, ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const a = { x: 18, y: 6, w: W - 22, h: H - 18 };
    const px = (g) => a.x + (g / G) * a.w, py = (p) => a.y + a.h - p * a.h;
    ctx.setLineDash([2, 4]); ctx.strokeStyle = GRADE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x, py(0.5)); ctx.lineTo(a.x + a.w, py(0.5)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = EIXO; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y + a.h); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.stroke();
    texto(ctx, "1", a.x - 4, a.y, { alinhar: "right" }); texto(ctx, "0", a.x - 4, a.y + a.h, { alinhar: "right", base: "bottom" });
    texto(ctx, `${G} ger.`, a.x + a.w, a.y + a.h + 3, { alinhar: "right", tam: 9 });
    ctx.setLineDash([4, 4]); ctx.strokeStyle = SUAVE; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(a.x, py(no.p0)); ctx.lineTo(a.x + a.w, py(no.p0)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    const ate = Math.round(f * G);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    no.series.forEach((s, k) => {
      ctx.strokeStyle = k === 0 ? NAVY : k % 3 === 2 ? TEAL : TEAL_CLARO;
      ctx.lineWidth = k === 0 ? 1.8 : 1; ctx.globalAlpha = k === 0 ? 1 : 0.6;
      ctx.beginPath();
      for (let g = 0; g <= ate; g++) g ? ctx.lineTo(px(g), py(s[g])) : ctx.moveTo(px(g), py(s[g]));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    const fix = no.series.filter((s) => s[ate] >= 1).length, perd = no.series.filter((s) => s[ate] <= 0).length;
    no.resumo.textContent = fix + perd
      ? `${no.K} populações · A fixou em ${fix}, perdeu-se em ${perd}`
      : `${no.K} populações · nenhuma fixou ainda`;
  }
  eloNovo.addEventListener("click", () => {
    semente += 10;
    for (const no of NOS) no.series = simular(no, semente + NOS.indexOf(no));
    inicio = null;
    if (reduzido) for (const no of NOS) desenharNo(no, 1);
  });

  let inicio = null;
  const naTela = () => { const r = figura.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  function quadro(agora) {
    if (naTela()) {
      if (inicio === null) inicio = agora;
      const t = (agora - inicio) / 1000;
      for (const no of NOS) {
        const tt = Math.max(0, t - no.atraso) % (DESENHA + ESPERA);
        desenharNo(no, Math.min(1, tt / DESENHA));
      }
    }
    requestAnimationFrame(quadro);
  }

  dispor();
  window.addEventListener("resize", dispor);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dispor);
  /* só para captura de tela: #t=0.7 desenha todas as pontas até 70% das gerações; #aceso=raro acende um caminho */
  const captura = /t=([\d.]+)/.exec(location.hash), aceso = /aceso=([\w-]+)/.exec(location.hash);
  if (captura) { for (const no of NOS) desenharNo(no, Math.min(1, +captura[1])); if (aceso) acender(aceso[1]); return; }
  if (reduzido) { for (const no of NOS) desenharNo(no, 1); return; }
  requestAnimationFrame(quadro);
}
