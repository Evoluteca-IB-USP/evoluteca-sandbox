import { criar, criarTexto as T } from "escrever-html";
import { criarRng, rbinom } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, NAVY, AMARELO, CINZA } from "../../../desenho-em-canvas/__pacote__.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* dois morros e um vale
   A "paisagem adaptativa" de Wright: a altura é a sobrevivência
   média da população para cada mistura de dois traços. A superfície
   é um esquema (dois morros de curva de sino, só isso) para a ideia
   aparecer — o caso real, Lewontin & White 1960, entra pelo texto.
   Desenhada como as outras figuras do site: cristas de perfil, uma
   atrás da outra, do fundo para a frente, cada uma tapando o que
   está atrás — linhas navy finas sobre branco, sem malha nem
   degradê. A bolinha amarela é a população: a cada geração sobe a
   encosta pela fórmula de Wright (Δp ∝ p(1−p) ∂w̄/∂p) e sorteia
   (Wright–Fisher); a trilha guarda um ponto a cada poucas gerações.
   Seleção só sobe; só o acaso atravessa o vale — e "encolher"
   recomeça de onde a população está, com mais gerações, porque
   o passeio do acaso é o que interessa (N=25 chega ao morro alto
   em ~1/4 das vezes em 300 gerações). */
export function paisagem(palco, pe, opts) {
  const LINHAS = 34, PONTOS = 90, EPS = 1e-3, ANG = 0.7, INCL = 0.46, RELEVO = 0.46;   // de lado e um pouco de cima: partida, morro baixo, vale e morro alto, da esquerda para a direita
  let { ctx, W, H } = canvasNo(palco);
  palco.style.cursor = "crosshair";
  const morro = (p, q, cp, cq, r) => Math.exp(-((p - cp) ** 2 + (q - cq) ** 2) / r);
  const BAIXO = [0.3, 0.72], ALTO = [0.72, 0.3];                  // na diagonal do quadrado, que a vista deixa na horizontal
  const relevo = (p, q) => 0.38 * morro(p, q, BAIXO[0], BAIXO[1], 0.045) + morro(p, q, ALTO[0], ALTO[1], 0.05) + 0.04 * morro(p, q, 0.5, 0.5, 0.5);
  const wBar = (p, q) => 0.6 + 0.4 * relevo(p, q);
  let zMin = 9, zMax = 0;
  for (let i = 0; i <= 80; i++) for (let j = 0; j <= 80; j++) { const v = wBar(i / 80, j / 80); zMin = Math.min(zMin, v); zMax = Math.max(zMax, v); }
  const alt = (w) => (w - zMin) / (zMax - zMin);
  // projeção: gira o quadrado, inclina, sobe pela altura; depois encaixa tudo no palco
  const bruto = (p, q, w) => { const x = (p - 0.5) * Math.cos(ANG) - (q - 0.5) * Math.sin(ANG), y = (p - 0.5) * Math.sin(ANG) + (q - 0.5) * Math.cos(ANG); return [x, y * INCL - alt(w) * RELEVO]; };
  let bx0 = 9, bx1 = -9, by0 = 9, by1 = -9;
  for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) for (const w of [wBar(i / 40, j / 40), zMin]) { const [x, y] = bruto(i / 40, j / 40, w); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const ESC = Math.min((W - 40) / (bx1 - bx0), (H - 48) / (by1 - by0));      // o topo do morro alto fica a 40 px, com o rótulo em cima
  const OX = W / 2 - ((bx0 + bx1) / 2) * ESC, OY = 40 - by0 * ESC;
  const proj = (p, q, w) => { const [x, y] = bruto(p, q, w); return [OX + x * ESC, OY + y * ESC]; };
  let fundo = null;
  function pintarFundo() {
    fundo = document.createElement("canvas"); const dpr = window.devicePixelRatio || 1;
    fundo.width = W * dpr; fundo.height = H * dpr; const f = fundo.getContext("2d"); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.lineJoin = "round"; f.lineCap = "round";
    // o chão: só o contorno do quadrado, bem leve, para a paisagem ter onde pousar
    f.strokeStyle = CINZA; f.lineWidth = 1; f.beginPath();
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([a, b], k) => { const [x, y] = proj(a, b, zMin); k ? f.lineTo(x, y) : f.moveTo(x, y); }); f.closePath(); f.stroke();
    // as cristas são cortes do quadrado à mesma profundidade na tela, do fundo para a frente:
    // cada uma preenchida de branco até o chão, tapando as de trás
    const c = Math.cos(ANG), s = Math.sin(ANG), cantos = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const fundoDe = ([a, b]) => (a - 0.5) * s + (b - 0.5) * c, d0 = Math.min(...cantos.map(fundoDe)), d1 = Math.max(...cantos.map(fundoDe));
    const ponto = (x, y) => [0.5 + x * c + y * s, 0.5 - x * s + y * c];
    function corte(y) {                                            // o trecho de x em que (x, y) cai dentro do quadrado
      let a = -2, b = 2;
      for (const [k, m] of [[c, y * s], [-s, y * c]]) { if (Math.abs(k) < 1e-9) continue; const r0 = (-0.5 - m) / k, r1 = (0.5 - m) / k; a = Math.max(a, Math.min(r0, r1)); b = Math.min(b, Math.max(r0, r1)); }
      return [a, b];
    }
    for (let j = 1; j < LINHAS; j++) {
      const t = j / LINHAS, y = d0 + (d1 - d0) * t, [a, b] = corte(y);
      const pts = []; for (let i = 0; i <= PONTOS; i++) { const [p, q] = ponto(a + (b - a) * i / PONTOS, y); pts.push(proj(p, q, wBar(p, q))); }
      const [x0, y0] = proj(...ponto(a, y), zMin), [x1, y1] = proj(...ponto(b, y), zMin);
      f.beginPath(); f.moveTo(x0, y0); pts.forEach(([x, y]) => f.lineTo(x, y)); f.lineTo(x1, y1); f.closePath();
      f.fillStyle = "#fff"; f.fill();
      f.beginPath(); pts.forEach(([x, y], k) => k ? f.lineTo(x, y) : f.moveTo(x, y));
      f.strokeStyle = NAVY; f.globalAlpha = 0.25 + 0.5 * t; f.lineWidth = 0.8 + 0.3 * t; f.stroke(); f.globalAlpha = 1;
    }
    // as duas bordas da frente, para fechar a silhueta
    const k = cantos.reduce((m, v, i) => (fundoDe(v) > fundoDe(cantos[m]) ? i : m), 0);
    for (const outro of [cantos[(k + 1) % 4], cantos[(k + 3) % 4]]) {
      f.beginPath();
      for (let i = 0; i <= PONTOS; i++) { const u = i / PONTOS, p = cantos[k][0] + (outro[0] - cantos[k][0]) * u, q = cantos[k][1] + (outro[1] - cantos[k][1]) * u, [x, y] = proj(p, q, wBar(p, q)); i ? f.lineTo(x, y) : f.moveTo(x, y); }
      f.strokeStyle = NAVY; f.globalAlpha = 0.5; f.lineWidth = 0.8; f.stroke(); f.globalAlpha = 1;
    }
  }
  const rng = criarRng(1960);
  let p, q, trilha = [], antigas = [], g = 0, N = opts.N, parar = null, livre = false, pino = null, avisar = null;
  // população grande: poucas gerações, devagar (a subida é curta e certa); pequena: muitas, rápido (o passeio do acaso é o show)
  const GER = () => N === opts.N ? opts.geracoes : opts.geracoesPequeno, VEL = () => N === opts.N ? 6 : 45, PASSO = () => N === opts.N ? 1 : 6;
  function geracao() {                                             // sobe a encosta (Wright) e sorteia (Wright–Fisher)
    const wb = wBar(p, q);
    const dp = (wBar(Math.min(1, p + EPS), q) - wBar(Math.max(0, p - EPS), q)) / (2 * EPS), dq = (wBar(p, Math.min(1, q + EPS)) - wBar(p, Math.max(0, q - EPS))) / (2 * EPS);
    const pp = Math.max(0, Math.min(1, p + p * (1 - p) * dp / (2 * wb))), qq = Math.max(0, Math.min(1, q + q * (1 - q) * dq / (2 * wb)));
    p = rbinom(2 * N, pp, rng) / (2 * N); q = rbinom(2 * N, qq, rng) / (2 * N);
    g++; trilha.push([p, q]);
  }
  const conta = criar("p", { class: "vivo-nota" });
  const eloN = criar("button", { type: "button", class: "vivo-elo", texto: `encolha a população para ${opts.Npequeno}`, hidden: true });
  eloN.addEventListener("click", () => { N = N === opts.N ? opts.Npequeno : opts.N; eloN.textContent = N === opts.N ? `encolha a população para ${opts.Npequeno}` : `volte a ${numero(opts.N)} indivíduos`; recomecar([p, q]); });   // encolhe (ou cresce) de onde está
  pe.replaceChildren(criar("div", {}, conta, criar("p", { class: "vivo-nota jogo-dica", hidden: true }, criar("em", { texto: "Clique na paisagem" }), T(" para soltar a população em outro lugar. "), eloN)));
  const dica = pe.querySelector(".jogo-dica");
  const sobre = (a, b) => proj(a, b, wBar(a, b) + 0.003 * (zMax - zMin) / RELEVO);
  function tracarTrilha(t, cor, viva) {                            // linha fina + um ponto a cada PASSO gerações
    ctx.strokeStyle = cor; ctx.lineWidth = viva ? 1.4 : 1.2; ctx.beginPath();
    t.forEach(([a, b], k) => { const [x, y] = sobre(a, b); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    let ux = -99, uy = -99;
    for (let k = 0; k < t.length; k += PASSO()) {
      const [x, y] = sobre(t[k][0], t[k][1]);
      if ((x - ux) ** 2 + (y - uy) ** 2 < 64) continue; ux = x; uy = y;   // parada: um ponto só, não um borrão
      if (viva) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, viva ? 2 : 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  const noAlto = () => (p - ALTO[0]) ** 2 + (q - ALTO[1]) ** 2 < 0.03;
  function desenhar() {
    ctx.clearRect(0, 0, W, H); ctx.drawImage(fundo, 0, 0, W, H);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (const t of antigas) tracarTrilha(t, "#b9bdc9", false);
    tracarTrilha(trilha, AMARELO, true);
    const marco = (pt, texto, dx, dy) => { const [x, y] = sobre(...pt); ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y - 18); ctx.stroke(); ctx.globalAlpha = 1; rotulo(ctx, texto, x + dx, y + dy, { alinhar: "center", cor: NAVY, peso: "600" }); };
    marco(ALTO, "morro alto", 0, -32); marco(BAIXO, "morro baixo", 0, -32);
    const [x, y] = sobre(p, q);
    ctx.fillStyle = "rgba(252,180,33,.22)"; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = AMARELO; ctx.beginPath(); ctx.arc(x, y, 4.6, 0, Math.PI * 2); ctx.fill();
    if (pino) {                                                    // o alfinete da aposta, espetado na superfície
      const [px, py] = sobre(...pino);
      ctx.strokeStyle = NAVY; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 20); ctx.stroke();
      ctx.fillStyle = NAVY; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py - 22, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    rotulo(ctx, "altura = sobrevivência média da população", 12, 10, {});
    conta.innerHTML = `Geração <b>${g}</b> · ${numero(N)} indivíduos · sobrevivência média: <b>${numero(wBar(p, q), 2)}</b>` + (g >= GER() ? (noAlto() ? " · <b>chegou ao morro alto</b>" : " · parou no morro baixo") : "");
  }
  function zerar(inicio) { [p, q] = inicio; trilha = [[p, q]]; g = 0; }
  const resultado = () => ({ w: wBar(p, q), alto: noAlto(), ponto: [p, q] });
  function lugar([a, b]) {                                         // o nome do lugar, para ler a aposta e o resultado
    const perto = (pt, r) => Math.hypot(a - pt[0], b - pt[1]) < r;
    if (perto(ALTO, 0.12)) return "no morro alto";
    if (perto(BAIXO, 0.12)) return "no morro baixo";
    if (perto(opts.inicio, 0.08)) return "onde ela começou";
    if (perto([(ALTO[0] + BAIXO[0]) / 2, (ALTO[1] + BAIXO[1]) / 2], 0.12)) return "no vale";
    return alt(wBar(a, b)) < 0.12 ? "na planície" : "na encosta";
  }
  function correr(fim) {
    if (parar) parar();
    parar = laco((t) => { const alvo = Math.min(GER(), Math.floor(t * VEL())); while (g < alvo) geracao(); desenhar(); if (g >= GER()) { if (fim) fim(resultado()); return false; } });
  }
  function recomecar(inicio) { if (trilha.length > 1) { antigas.push(trilha); if (antigas.length > 6) antigas.shift(); } zerar(inicio); correr(null); }
  palco.addEventListener("pointerdown", (e) => {                 // o ponto da superfície mais perto do clique, na tela
    if (!livre && !avisar) return;
    const r = palco.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let mel = null, d = 22 * 22;
    for (let i = 0; i <= 50; i++) for (let j = 0; j <= 50; j++) { const [px, py] = sobre(i / 50, j / 50); const dd = (px - x) ** 2 + (py - y) ** 2; if (dd < d) { d = dd; mel = [i / 50, j / 50]; } }
    if (!mel) return;
    if (avisar) { pino = mel; avisar(mel); desenhar(); } else recomecar(mel);
  });
  return {
    preparar() { pintarFundo(); antigas = []; N = opts.N; livre = false; pino = null; avisar = null; eloN.hidden = true; dica.hidden = true; zerar(opts.inicio); desenhar(); },
    aposta(aoMudar) { avisar = aoMudar; },
    lugar,
    revelar(fim) {
      avisar = null; zerar(opts.inicio);
      const pronto = (r) => { livre = true; eloN.hidden = false; dica.hidden = false; desenhar(); fim(r); };
      if (reduzido()) { while (g < GER()) geracao(); return pronto(resultado()); }
      correr(pronto);
    },
    parar() { if (parar) parar(); },
    captura(t) { if (!pino) pino = [0.72, 0.3]; avisar = null; zerar(opts.inicio); while (g < Math.min(GER(), Math.floor(t * VEL()))) geracao(); livre = true; eloN.hidden = false; dica.hidden = false; desenhar(); },
  };
}
