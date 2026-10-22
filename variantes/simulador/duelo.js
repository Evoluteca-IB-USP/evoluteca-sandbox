/* Variante 3 — o duelo. Duas raias, uma população pequena e uma grande,
   no mesmo relógio. Em cada raia correm trinta réplicas; a que bate numa
   parede fica cravada ali como um pino, na geração em que fixou ou perdeu A.
   Embaixo de cada raia, quanto ainda resta da variação genética do começo. */

import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";
import { campo, tocador, palco } from "./comum/comum.js";
import { NAVY, AMARELO, TEAL, TEAL_CLARO, SUAVE, FONTE } from "../../paginas/desenho-em-canvas/__pacote__.js";

const GERACOES = 120, REPLICAS = 30, VELOCIDADE = 14;
const M = { esq: 44, dir: 56, topo: 14, base: 26 };

export function montarDuelo() {
  let p0 = 50, semente = 1, relogio = 0, tocando = false;
  const raias = [novaRaia("Uma tem", 10, ""), novaRaia("a outra,", 200, ".")];

  const botoes = tocador({
    aoReiniciar: () => sortear(),
    aoAlternar: () => { if (relogio >= GERACOES) sortear(); tocar(!tocando); },
    aoPassar: () => { tocar(false); relogio = Math.min(GERACOES, Math.floor(relogio) + 1); },
  });
  document.getElementById("tocador").append(botoes);
  document.getElementById("frase").append(
    "Duas populações começam com ", campo({ valor: p0, min: 5, max: 95, sufixo: "%", rotulo: "Frequência inicial de A", aoMudar: (v) => { p0 = v; sortear(); } }),
    " de alelos ", criar("strong", { class: "duelo-A", texto: "A" }), ".");
  document.getElementById("raias").append(...raias.map((r) => r.no));

  function novaRaia(inicio, N, fim) {
    const canvas = criar("canvas", { class: "raia-canvas" });
    const medidor = criar("span", { class: "raia-medidor-cheio" });
    const valor = criar("span", { class: "raia-medidor-valor" });
    const raia = { N, series: [], canvas, medidor, valor };
    raia.no = criar("section", { class: "raia" },
      criar("div", { class: "raia-topo" },
        criar("p", { class: "frase raia-frase" }, `${inicio} `,
          campo({ valor: N, min: 2, max: 1000, rotulo: "Tamanho da população", aoMudar: (v) => { raia.N = v; sortear(); } }),
          ` indivíduos${fim}`),
        criar("div", { class: "raia-medidor" },
          criar("span", { class: "raia-medidor-rotulo", texto: "variação genética" }),
          criar("span", { class: "raia-medidor-trilho" }, medidor), valor)),
      canvas);
    raia.tela = palco(canvas, () => {});
    return raia;
  }

  /* as duas raias usam a mesma semente: a diferença entre elas é só o N */
  function sortear() {
    const s = semente++;
    for (const raia of raias) {
      const rng = criarRng(s), n = 2 * raia.N;
      raia.series = Array.from({ length: REPLICAS }, () => {
        const p = [p0 / 100];
        for (let g = 1; g <= GERACOES; g++) p[g] = rbinom(n, p[g - 1], rng) / n;
        return { p, fixou: p.findIndex((x) => x === 0 || x === 1) };
      });
    }
    relogio = 0;
    tocar(false);
  }

  function tocar(sim) { tocando = sim; botoes.marcar(sim); }

  let antes = null;
  requestAnimationFrame(function quadro(agora) {
    const dt = antes === null ? 0 : Math.min(0.1, (agora - antes) / 1000);
    antes = agora;
    if (tocando) {
      relogio = Math.min(GERACOES, relogio + dt * VELOCIDADE);
      if (relogio >= GERACOES) tocar(false);
    }
    raias.forEach((r) => desenharRaia(r, relogio, p0 / 100));
    requestAnimationFrame(quadro);
  });

  sortear();
  tocar(true);
}

/* a heterozigosidade média relativa à do começo: 1 no início, 0 quando todas fixaram */
function variacaoRestante(series, g, p0) {
  const h = (p) => 2 * p * (1 - p);
  return series.reduce((s, r) => s + h(r.p[g]), 0) / series.length / h(p0);
}

function desenharRaia(raia, relogio, p0) {
  const { ctx } = raia.tela, W = raia.tela.W(), H = raia.tela.H();
  const x = (g) => M.esq + (g / GERACOES) * (W - M.esq - M.dir);
  const y = (p) => M.topo + (1 - p) * (H - M.topo - M.base);
  const g0 = Math.floor(relogio), f = relogio - g0;
  ctx.clearRect(0, 0, W, H);

  ctx.lineWidth = 2;
  ctx.strokeStyle = NAVY;
  linha(ctx, x(0), y(1), x(GERACOES), y(1));
  ctx.strokeStyle = AMARELO;
  linha(ctx, x(0), y(0), x(GERACOES), y(0));
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#cfcfcf";
  ctx.setLineDash([3, 5]);
  linha(ctx, x(0), y(p0), x(GERACOES), y(p0));
  ctx.setLineDash([]);
  texto(ctx, "100%", M.esq - 10, y(1), "right");
  texto(ctx, "0%", M.esq - 10, y(0), "right");
  for (let g = 0; g <= GERACOES; g += 20) texto(ctx, String(g), x(g), H - 8, "center");

  let soA = 0, soa = 0;
  for (const r of raia.series) {
    const fim = r.fixou >= 0 && r.fixou <= relogio ? r.fixou : null;
    const ate = fim ?? Math.min(GERACOES, g0 + 1);
    const pontoAtual = fim === null && g0 < GERACOES ? r.p[g0] + (r.p[g0 + 1] - r.p[g0]) * f : r.p[ate];
    ctx.strokeStyle = TEAL_CLARO;
    ctx.globalAlpha = fim === null ? 0.55 : 0.25;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let g = 0; g <= ate; g++) {
      const gx = fim === null && g === ate ? g0 + f : g, py = fim === null && g === ate ? pontoAtual : r.p[g];
      ctx[g ? "lineTo" : "moveTo"](x(gx), y(py));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (fim !== null) {
      if (r.p[fim] === 1) soA++; else soa++;
      bolinha(ctx, x(fim), y(r.p[fim]), 4.5, r.p[fim] === 1 ? NAVY : AMARELO);
    } else {
      bolinha(ctx, x(Math.min(relogio, GERACOES)), y(pontoAtual), 3.2, TEAL);
    }
  }
  texto(ctx, String(soA), x(GERACOES) + 14, y(1), "left", NAVY, "700 15px");
  texto(ctx, String(soa), x(GERACOES) + 14, y(0), "left", "#9a7318", "700 15px");

  const resta = variacaoRestante(raia.series, Math.min(GERACOES, g0), p0);
  raia.medidor.style.width = `${(resta * 100).toFixed(1)}%`;
  raia.valor.textContent = `${Math.round(resta * 100)}%`;
}

function linha(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

function bolinha(ctx, x, y, r, cor) {
  ctx.fillStyle = cor;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function texto(ctx, t, x, y, alinhar, cor = SUAVE, fonte = "11px") {
  ctx.font = `${fonte} ${FONTE}`;
  ctx.fillStyle = cor;
  ctx.textAlign = alinhar;
  ctx.textBaseline = "middle";
  ctx.fillText(t, x, y);
}
