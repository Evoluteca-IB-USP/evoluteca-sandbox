import { lerAparencia } from "../ler-aparencia.js";
import { preparar, desenharMoldura } from "../bases/__pacote__.js";

/** Gráfico de linhas.
    opts: { x, y, ylim, xlim,
            ate          — desenha só até este índice (linha do tempo); padrão: tudo
            foco         — índice da série em destaque (padrão 0; -1 = nenhuma)
            fantasmas    — séries de uma rodada anterior, em cinza, ao fundo
            referencias  — [{ valor, rotulo }] linhas horizontais tracejadas
            distribuicao — faixa à direita com a distribuição das séries no instante `ate`
            marcador     — linha vertical + ponto no instante `ate` } */
export function linhas(canvas, series, opts = {}) {
  const C = lerAparencia();
  const { ctx, largura, altura } = preparar(canvas);

  const maxLen = Math.max(...series.map((s) => s.length));
  const T = Math.max(1, maxLen - 1);
  const ate = opts.ate == null ? T : Math.max(0, Math.min(T, opts.ate));
  const comDist = !!opts.distribuicao && series.length >= 5;
  const larguraDist = comDist ? 78 : 0;
  const area = { e: 54, d: largura - 16 - larguraDist, t: 18, b: altura - 50 };

  const xlim = opts.xlim || [0, T];
  let ylim = opts.ylim;
  if (!ylim) {
    const tudo = series.flat();
    const min = Math.min(...tudo);
    const max = Math.max(...tudo);
    const folga = (max - min || 1) * 0.08;
    ylim = [min - folga, max + folga];
  }

  desenharMoldura(ctx, area, xlim, ylim, opts.x, opts.y, C);

  const px = (i) => area.e + ((i - xlim[0]) / (xlim[1] - xlim[0])) * (area.d - area.e);
  const py = (v) => area.b - ((v - ylim[0]) / (ylim[1] - ylim[0])) * (area.b - area.t);
  const tracar = (s, fim) => {
    ctx.beginPath();
    const ultimo = Math.min(fim, s.length - 1);
    for (let i = 0; i <= ultimo; i++) (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, px(i), py(s[i]));
    ctx.stroke();
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.e - 1, area.t - 4, area.d - area.e + 2, area.b - area.t + 8);
  ctx.clip();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // rodada guardada como referência: cinza, completa, ao fundo
  if (opts.fantasmas) {
    ctx.strokeStyle = C.fantasma;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.4;
    for (const s of opts.fantasmas) tracar(s, s.length - 1);
  }

  // muitas séries (réplicas) → um feixe teal translúcido; poucas → cores distintas
  const foco = opts.foco == null ? 0 : opts.foco;
  const muitas = series.length > 4;
  series.forEach((s, k) => {
    if (k === foco) return;
    ctx.strokeStyle = muitas ? C.feixe : C.series[k % C.series.length];
    ctx.globalAlpha = muitas ? 0.3 : 0.9;
    ctx.lineWidth = muitas ? 1.3 : 2;
    tracar(s, ate);
  });
  if (foco >= 0 && series[foco]) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = C.foco;
    tracar(series[foco], ate);
  }
  ctx.globalAlpha = 1;

  // linhas de referência (p₀, 0,5…)
  for (const r of opts.referencias || []) {
    if (r.valor == null || Number.isNaN(r.valor)) continue;
    const y = py(r.valor);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = C.eixo;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(area.e, y);
    ctx.lineTo(area.d, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (r.rotulo) {
      ctx.font = C.fonteMini;
      ctx.fillStyle = C.eixo;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(r.rotulo, area.d - 5, y - 3);
    }
  }
  ctx.restore();

  // marcador do instante atual
  if (opts.marcador && ate < T) {
    const x = px(ate);
    ctx.strokeStyle = C.foco;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, area.t);
    ctx.lineTo(x, area.b);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (opts.marcador && foco >= 0 && series[foco] && ate < series[foco].length) {
    const x = px(ate), y = py(series[foco][ate]);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = C.foco;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  // distribuição das séries no instante `ate` (histograma deitado, à direita)
  if (comDist) {
    const nb = 10;
    const contagem = new Array(nb).fill(0);
    for (const s of series) {
      const v = s[Math.min(ate, s.length - 1)];
      let b = Math.floor(((v - ylim[0]) / (ylim[1] - ylim[0])) * nb);
      contagem[Math.max(0, Math.min(nb - 1, b))]++;
    }
    const maxC = Math.max(...contagem, 1);
    const x0 = area.d + 14;
    const wMax = larguraDist - 20;
    const hBin = (area.b - area.t) / nb;
    ctx.strokeStyle = C.grade;
    ctx.beginPath();
    ctx.moveTo(x0 - 5, area.t);
    ctx.lineTo(x0 - 5, area.b);
    ctx.stroke();
    ctx.fillStyle = C.feixe;
    ctx.globalAlpha = 0.55;
    contagem.forEach((c, b) => {
      if (!c) return;
      const w = Math.max(2, (c / maxC) * wMax);
      ctx.fillRect(x0, area.b - (b + 1) * hBin + 1.5, w, hBin - 3);
    });
    ctx.globalAlpha = 1;
    ctx.font = C.fonteMini;
    ctx.fillStyle = C.eixo;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("réplicas", x0 - 2, area.t - 4);
    ctx.textBaseline = "top";
    ctx.fillText("agora", x0 - 2, area.b + 8);
  }
}
