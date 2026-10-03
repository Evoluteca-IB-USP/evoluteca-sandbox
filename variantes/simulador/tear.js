/* Variante 1 — o tear. Uma população só, alelo por alelo: cada coluna é uma
   geração, cada ponto um dos 2N alelos, e cada fio liga um alelo ao alelo
   da geração anterior de que ele é cópia. Os sorteios são ordenados, então
   os fios quase não se cruzam e a fronteira entre as cores é a frequência.
   Passar o mouse sobre um ponto acende os ancestrais e os descendentes dele. */

import { criar } from "escrever-html";
import { criarRng } from "r";
import { campo, tocador, palco } from "./comum/comum.js";
import { NAVY, AMARELO, TEAL, SUAVE, FONTE, suaveIO } from "../../paginas/desenho-em-canvas/__pacote__.js";

const DURACAO = 0.5, DX = 24, MARGEM = { esq: 18, dir: 92, topo: 18, base: 36 };

export function montarTear() {
  let N = 10, p0 = 50, semente = 1;
  let rng, geracoes, t = 1, tocando = false, foco = null, rodadas = [];

  const canvas = document.getElementById("tear");
  const tela = palco(canvas, () => desenhar());
  const estado = document.getElementById("estado");
  const placar = document.getElementById("rodadas");
  const botoes = tocador({
    aoReiniciar: () => { novaRodada(); },
    aoAlternar: () => { if (fixou()) novaRodada(); tocar(!tocando); },
    aoPassar: () => { tocar(false); if (!fixou()) avancar(); },
  });
  document.getElementById("tocador").append(botoes);
  document.getElementById("frase").append(
    "Uma população de ", campo({ valor: N, min: 3, max: 50, rotulo: "Tamanho da população", aoMudar: (v) => { N = v; recomecar(); } }),
    " indivíduos, começando com ", campo({ valor: p0, min: 5, max: 95, sufixo: "%", rotulo: "Frequência inicial de A", aoMudar: (v) => { p0 = v; recomecar(); } }),
    " de alelos ", criar("strong", { class: "tear-A", texto: "A" }), ".");

  const total = () => 2 * N;
  const atual = () => geracoes[geracoes.length - 1];
  const fixou = () => atual().nA === 0 || atual().nA === total();

  function novaRodada() {
    rng = criarRng(semente++);
    geracoes = [{ nA: Math.round((p0 / 100) * total()), pais: null }];
    t = 1;
    tocar(false);
    escreverEstado();
  }
  function recomecar() { rodadas = []; escreverPlacar(); novaRodada(); }

  /* Wright–Fisher: cada alelo novo copia um alelo sorteado da geração anterior */
  function avancar() {
    const anterior = atual().nA;
    const pais = Array.from({ length: total() }, () => Math.floor(rng() * total())).sort((a, b) => a - b);
    geracoes.push({ nA: pais.filter((p) => p < anterior).length, pais });
    t = 0;
  }

  function tocar(sim) { tocando = sim; botoes.marcar(sim); }

  let antes = null;
  requestAnimationFrame(function quadro(agora) {
    const dt = antes === null ? 0 : Math.min(0.1, (agora - antes) / 1000);
    antes = agora;
    if (t < 1) {
      t = Math.min(1, t + dt / DURACAO);
      if (t === 1) aoCompletar();
    } else if (tocando) avancar();
    desenhar();
    requestAnimationFrame(quadro);
  });

  function aoCompletar() {
    escreverEstado();
    if (!fixou()) return;
    tocar(false);
    rodadas.push({ fixouA: atual().nA > 0, geracao: geracoes.length - 1 });
    escreverPlacar();
  }

  function escreverEstado() {
    const g = geracoes.length - 1, pA = Math.round((atual().nA / total()) * 100);
    if (fixou()) {
      estado.innerHTML = atual().nA ? `<span class="legenda-A"></span>A fixou na geração <b>${g}</b>.`
        : `<span class="legenda-a"></span>A se perdeu na geração <b>${g}</b>.`;
    } else {
      estado.innerHTML = `Geração <b>${g}</b><span class="tear-sep"></span><span class="legenda-A"></span>A ${pA}%<span class="tear-sep"></span><span class="legenda-a"></span>a ${100 - pA}%`;
    }
  }

  function escreverPlacar() {
    const fixaram = rodadas.filter((r) => r.fixouA).length;
    placar.replaceChildren(
      ...rodadas.slice(-24).map((r) => criar("span", {
        class: r.fixouA ? "legenda-A" : "legenda-a",
        title: `${r.fixouA ? "A fixou" : "A se perdeu"} na geração ${r.geracao}`,
      })),
      ...(rodadas.length ? [criar("span", { class: "tear-conta", html: `A fixou em <b>${fixaram}</b> de ${rodadas.length}` })] : []));
  }

  /* --------------------------- desenho --------------------------- */

  function geometria() {
    const W = tela.W(), H = tela.H();
    const colunas = Math.floor((W - MARGEM.esq - MARGEM.dir) / DX) + 1;
    const g = geracoes.length - 1, e = suaveIO(t);
    const desloc = Math.max(0, g - (colunas - 1) - (1 - e));
    const dy = (H - MARGEM.topo - MARGEM.base) / (total() - 1);
    return {
      W, H, g, e, dy,
      r: Math.max(1.6, Math.min(5, dy * 0.32)),
      x: (k) => MARGEM.esq + (k - desloc) * DX,
      y: (i) => MARGEM.topo + i * dy,
      primeira: Math.max(0, Math.floor(desloc) - 1),
    };
  }

  /* ancestrais (para trás) e descendentes (para frente) do ponto em foco */
  function linhagem() {
    const fios = new Map(), pontos = new Map();
    if (!foco || foco.k >= geracoes.length) return null;
    let grupo = new Set([foco.i]);
    pontos.set(foco.k, grupo);
    for (let k = foco.k; k > 0 && grupo.size; k--) {
      fios.set(k, new Set(grupo));
      grupo = new Set([...grupo].map((i) => geracoes[k].pais[i]));
      pontos.set(k - 1, grupo);
    }
    grupo = new Set([foco.i]);
    for (let k = foco.k + 1; k < geracoes.length && grupo.size; k++) {
      const pais = geracoes[k].pais, filhos = new Set();
      pais.forEach((p, i) => { if (grupo.has(p)) filhos.add(i); });
      fios.set(k, new Set([...(fios.get(k) || []), ...filhos]));
      pontos.set(k, new Set([...(pontos.get(k) || []), ...filhos]));
      grupo = filhos;
    }
    return { fios, pontos };
  }

  function desenhar() {
    if (!geracoes) return;
    const { ctx } = tela, G = geometria(), luz = linhagem();
    ctx.clearRect(0, 0, G.W, G.H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, G.x(G.g - 1) + DX * G.e + 1, G.H);
    ctx.clip();
    for (let k = Math.max(1, G.primeira); k <= G.g; k++) {
      const { pais } = geracoes[k], nAant = geracoes[k - 1].nA, x0 = G.x(k - 1), x1 = G.x(k), xm = (x0 + x1) / 2;
      const acesos = luz?.fios.get(k);
      pais.forEach((p, i) => {
        const aceso = acesos?.has(i);
        ctx.strokeStyle = aceso ? TEAL : p < nAant ? NAVY : AMARELO;
        ctx.globalAlpha = aceso ? 1 : luz ? 0.07 : p < nAant ? 0.22 : 0.45;
        ctx.lineWidth = aceso ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x0, G.y(p));
        ctx.bezierCurveTo(xm, G.y(p), xm, G.y(i), x1, G.y(i));
        ctx.stroke();
      });
    }
    ctx.restore();

    for (let k = G.primeira; k <= G.g; k++) {
      const novo = k === G.g && G.g > 0, escala = novo ? Math.max(0, (G.e - 0.6) / 0.4) : 1;
      if (escala <= 0) continue;
      const acesos = luz?.pontos.get(k);
      for (let i = 0; i < total(); i++) {
        const aceso = acesos?.has(i);
        ctx.globalAlpha = luz && !aceso ? 0.25 : 1;
        ctx.fillStyle = i < geracoes[k].nA ? NAVY : AMARELO;
        ctx.beginPath();
        ctx.arc(G.x(k), G.y(i), G.r * escala * (aceso ? 1.35 : 1), 0, 2 * Math.PI);
        ctx.fill();
        if (aceso) { ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.stroke(); }
      }
      if (k % 10 === 0) rotulo(ctx, String(k), G.x(k), G.H - 14, "center");
    }
    ctx.globalAlpha = 1;
    desenharFrequencia(ctx, G);
  }

  /* a régua à direita da última geração: quanto da população é A agora */
  function desenharFrequencia(ctx, G) {
    const k = G.e < 1 ? G.g - 1 : G.g;
    if (k < 0) return;
    const ult = geracoes[Math.max(0, k)], x = G.x(k) + 22, topo = G.y(0), fim = G.y(total() - 1);
    const corte = ult.nA === 0 ? topo : ult.nA === total() ? fim : (G.y(ult.nA - 1) + G.y(ult.nA)) / 2;
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    if (ult.nA > 0) { ctx.strokeStyle = NAVY; linha(ctx, x, topo, x, corte); }
    if (ult.nA < total()) { ctx.strokeStyle = AMARELO; linha(ctx, x, corte, x, fim); }
    const pA = Math.round((ult.nA / total()) * 100);
    rotulo(ctx, `${pA}%`, x + 10, Math.min(fim - 8, Math.max(topo + 8, corte)), "left", NAVY, "600 13px");
  }

  canvas.addEventListener("mousemove", (ev) => {
    const caixa = canvas.getBoundingClientRect(), G = geometria();
    const mx = ev.clientX - caixa.left, my = ev.clientY - caixa.top;
    const k = Math.round((mx - G.x(0)) / DX), i = Math.round((my - MARGEM.topo) / G.dy);
    const perto = k >= 0 && k < geracoes.length && i >= 0 && i < total() && Math.hypot(mx - G.x(k), my - G.y(i)) < Math.max(8, G.dy / 2);
    foco = perto ? { k, i } : null;
    canvas.style.cursor = perto ? "pointer" : "default";
  });
  canvas.addEventListener("mouseleave", () => { foco = null; });

  recomecar();
  tocar(true);
}

function linha(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

function rotulo(ctx, texto, x, y, alinhar, cor = SUAVE, fonte = "11px") {
  ctx.font = `${fonte} ${FONTE}`;
  ctx.fillStyle = cor;
  ctx.textAlign = alinhar;
  ctx.textBaseline = "middle";
  ctx.fillText(texto, x, y);
}
