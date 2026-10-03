import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";
import { numero } from "portugues";
import { canvasNo, rotulo, NAVY, AMARELO, CINZA, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";
import { animar } from "./animacao-com-fim.js";

/* as elefantas de Gorongosa nos 15 anos de guerra. A cada
   ano, a com presa escapa da caça com 83% de chance; a sem presa, com
   92% — no fim, 6% contra 28%. */
function sortearCaca({ n = 600, semPresa = 0.18, anos = 15, escapaCom = 0.829, escapaSem = 0.919, semente = 1978 }) {
  const rng = criarRng(semente);
  return Array.from({ length: n }, () => {
    const sem = rng() < semPresa, escapa = sem ? escapaSem : escapaCom;
    let morre = null;
    for (let a = 1; a <= anos && morre === null; a++) if (rng() > escapa) morre = a - rng();
    return { sem, morre };
  });
}
function contarManada(manada, ano) {
  const c = { sem: 0, com: 0 };
  for (const e of manada) if (e.morre === null || e.morre > ano) e.sem ? c.sem++ : c.com++;
  return c;
}

/* a manada no campo: 600 elefantas em grupos, vistas de cima. A cada ano
   da guerra umas somem, e no lugar fica um aro cinza. Em cima, a barra
   das vivas: quanto delas é sem presa, com a marca dos 18% de antes. */
export function manada(palco, pe) {
  const ANOS = 15, VEL = 1.05, INICIO = 1977;
  const { ctx, W, H } = canvasNo(palco);
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda([[NAVY, "elefanta com presas"], [AMARELO, "elefanta sem presas"], [CINZA, "morta na guerra", "aro"]])));
  const elefantas = sortearCaca({}), rng = criarRng(5);
  const grupos = Array.from({ length: 16 }, () => [40 + rng() * (W - 80), 92 + rng() * (H - 128)]);
  const lugar = elefantas.map(() => { const [gx, gy] = grupos[Math.floor(rng() * grupos.length)]; return [gx + rnorm(0, 24, rng), Math.max(66, Math.min(H - 8, gy + rnorm(0, 16, rng)))]; });
  const ordem = [...elefantas.keys()].sort((a, b) => (elefantas[b].morre ?? 99) - (elefantas[a].morre ?? 99));
  function barra(c) {
    const x0 = W / 2, larg = W / 2 - 12, y = 22, f = c.sem / Math.max(1, c.sem + c.com);
    ctx.fillStyle = NAVY; ctx.fillRect(x0, y, larg, 8);
    ctx.fillStyle = AMARELO; ctx.fillRect(x0, y, larg * f, 8);
    const xa = x0 + larg * 0.18;
    ctx.strokeStyle = SUAVE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa, y - 2); ctx.lineTo(xa, y + 12); ctx.stroke();
    rotulo(ctx, "antes: 18%", xa, y + 14, { alinhar: "center", tam: 10 });
    rotulo(ctx, `das vivas, ${numero(100 * f)}% sem presas`, x0, 4, { cor: NAVY, peso: "600" });
  }
  function desenhar(t) {
    const ano = Math.min(ANOS, t * VEL);
    ctx.clearRect(0, 0, W, H);
    for (const i of ordem) {
      const e = elefantas[i], [x, y] = lugar[i], viva = e.morre === null || e.morre > ano;
      if (viva) { ctx.fillStyle = e.sem ? AMARELO : NAVY; ctx.beginPath(); ctx.arc(x, y, ano >= ANOS ? 4 : 3.3, 0, Math.PI * 2); ctx.fill(); continue; }
      const desde = ano - e.morre;
      if (desde < 0.5) { ctx.globalAlpha = 1 - desde / 0.5; ctx.fillStyle = e.sem ? AMARELO : NAVY; ctx.beginPath(); ctx.arc(x, y, 3.3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = CINZA; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3 + Math.max(0, 0.5 - desde) * 6, 0, Math.PI * 2); ctx.stroke();
    }
    const c = contarManada(elefantas, ano), a = Math.floor(ano);
    rotulo(ctx, ano >= ANOS ? "1992: fim da guerra" : `${INICIO + a}: ano ${a + 1} da guerra`, 12, 4, { cor: NAVY, peso: "600" });
    rotulo(ctx, `${numero(c.sem + c.com)} vivas de ${numero(elefantas.length)}`, 12, 20, { cor: SUAVE });
    barra(c);
    conta.innerHTML = `Vivas: <b>${c.sem + c.com}</b> · sem presas: <b>${c.sem}</b> · com presas: <b>${c.com}</b>`;
    return c;
  }
  const DUR = ANOS / VEL + 0.3;
  let parar = null;
  return {
    preparar() { desenhar(0); },
    revelar(fim) { parar = animar(desenhar, DUR, () => fim(desenhar(DUR))); },
    parar() { if (parar) parar(); },
    captura(t) { desenhar(Math.min(t, DUR)); },
  };
}
