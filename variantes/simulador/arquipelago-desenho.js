/* O desenho do arquipélago: o mar com as ilhas e as fichas embaixo.
   Só lê o estado; quem sorteia é arquipelago.js. */

import { NAVY, AMARELO, SUAVE, FONTE } from "../../paginas/desenho-em-canvas/__pacote__.js";

const AREIA = "#f4f1ea", SO_A = "#d3d9ea", SO_a = "#fde5b0", RASO = "rgba(100, 196, 210, .16)";
const FAIXAS = 11, POR_LINHA = 4, PASSO = 20, RAIO_FICHA = 8;
const TOPO = 56, LADO = 24;

function geometria(W, H, ilha, colunas, linhas) {
  const cw = (W - 2 * LADO) / colunas, ch = (H - TOPO - 12) / linhas;
  const R = Math.min(cw, ch) * 0.36;
  const [, f1, , f2] = ilha.forma;
  const cx = LADO + (ilha.col + 0.5) * cw + Math.cos(f1) * cw * 0.08;
  const cy = TOPO + (ilha.lin + 0.5) * ch + Math.sin(f2) * ch * 0.08;
  const [a1, , a2] = ilha.forma;
  return { cx, cy, R, raio: (t) => R * (1 + a1 * Math.sin(3 * t + f1) + a2 * Math.sin(5 * t + f2)) };
}

function contorno(ctx, g, escala) {
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * 2 * Math.PI, r = g.raio(t) * escala;
    ctx[i ? "lineTo" : "moveTo"](g.cx + Math.cos(t) * r, g.cy + Math.sin(t) * r);
  }
  ctx.closePath();
}

export function desenharMar(tela, { ilhas, total, relogio, foco }, colunas) {
  const { ctx } = tela, W = tela.W(), H = tela.H(), linhas = Math.ceil(ilhas.length / colunas);
  ctx.clearRect(0, 0, W, H);
  const r = Math.max(1.8, Math.min(3.6, 4.2 - total / 30));
  for (const ilha of ilhas) {
    const g = geometria(W, H, ilha, colunas, linhas);
    ctx.fillStyle = RASO;
    contorno(ctx, g, 1.24);
    ctx.fill();
    ctx.fillStyle = ilha.nA === total ? SO_A : ilha.nA === 0 ? SO_a : AREIA;
    contorno(ctx, g, 1);
    ctx.fill();
    if (ilha.k === foco) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      contorno(ctx, g, 1.34);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const p of ilha.pontos) {
      const rr = g.raio(p.ang) * p.raio;
      const x = g.cx + Math.cos(p.ang) * rr + Math.sin(relogio * p.vel + p.fase) * 1.6;
      const y = g.cy + Math.sin(p.ang) * rr + Math.cos(relogio * p.vel * 0.8 + p.fase) * 1.6;
      const piscar = Math.max(0, 1 - (relogio - p.mudou) / 0.4);
      if (piscar > 0) {
        ctx.fillStyle = p.A ? "rgba(20, 37, 96, .25)" : "rgba(252, 180, 33, .35)";
        ctx.beginPath();
        ctx.arc(x, y, r * (1 + piscar * 2.2), 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = p.A ? NAVY : AMARELO;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function ilhaSob(tela, ilhas, colunas, mx, my) {
  const W = tela.W(), H = tela.H(), linhas = Math.ceil(ilhas.length / colunas);
  const achada = ilhas.find((ilha) => {
    const g = geometria(W, H, ilha, colunas, linhas);
    return Math.hypot(mx - g.cx, my - g.cy) < g.R * 1.25;
  });
  return achada ? achada.k : -1;
}

/* a faixa 0 é "só a", a 10 é "só A"; as nove do meio dividem as ilhas ainda misturadas */
function faixa(nA, total) {
  if (nA === 0) return 0;
  if (nA === total) return FAIXAS - 1;
  return 1 + Math.min(8, Math.floor((nA / total) * 9));
}

export function desenharFichas(tela, { ilhas, total, foco }, dt) {
  const { ctx } = tela, W = tela.W(), H = tela.H();
  const largura = W / FAIXAS, base = H - 30, xFaixa = (b) => (b + 0.5) * largura;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "rgba(252, 180, 33, .1)";
  ctx.fillRect(xFaixa(0) - largura * 0.42, 6, largura * 0.84, base - 6);
  ctx.fillStyle = "rgba(20, 37, 96, .06)";
  ctx.fillRect(xFaixa(FAIXAS - 1) - largura * 0.42, 6, largura * 0.84, base - 6);
  ctx.strokeStyle = "#cfcfcf";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, base + 0.5);
  ctx.lineTo(W, base + 0.5);
  ctx.stroke();
  ctx.font = `12px ${FONTE}`;
  ctx.fillStyle = SUAVE;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  [[0, "0%"], [5, "50%"], [FAIXAS - 1, "100%"]].forEach(([b, t]) => ctx.fillText(t, xFaixa(b), base + 9));

  const porFaixa = Array.from({ length: FAIXAS }, () => []);
  ilhas.forEach((ilha) => porFaixa[faixa(ilha.nA, total)].push(ilha));
  porFaixa.forEach((grupo, b) => grupo.forEach((ilha, j) => {
    const alvoX = xFaixa(b) + ((j % POR_LINHA) - (POR_LINHA - 1) / 2) * PASSO;
    const alvoY = base - 14 - Math.floor(j / POR_LINHA) * PASSO;
    if (ilha.x === null) { ilha.x = alvoX; ilha.y = alvoY; }
    const k = Math.min(1, dt * 7);
    ilha.x += (alvoX - ilha.x) * k;
    ilha.y += (alvoY - ilha.y) * k;
    desenharFicha(ctx, ilha, total, ilha.k === foco);
  }));
}

/* a ficha é a ilha em miniatura: a fatia azul é a fração de A */
function desenharFicha(ctx, ilha, total, emFoco) {
  const p = ilha.nA / total, { x, y } = ilha;
  ctx.fillStyle = AMARELO;
  ctx.beginPath();
  ctx.arc(x, y, RAIO_FICHA, 0, 2 * Math.PI);
  ctx.fill();
  if (p > 0) {
    ctx.fillStyle = NAVY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, RAIO_FICHA, -Math.PI / 2, -Math.PI / 2 + p * 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, RAIO_FICHA, 0, 2 * Math.PI);
  ctx.stroke();
  if (emFoco) {
    ctx.strokeStyle = "#1094ab";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, RAIO_FICHA + 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
