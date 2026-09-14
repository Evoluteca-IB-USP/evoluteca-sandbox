import { criar } from "escrever-html";
import { criarRng } from "r";
import { numero } from "portugues";
import { canvasNo, laco, rotulo, NAVY, TEAL, TEAL_ESC, TEAL_CLARO, AMARELO, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* bactérias atravessam faixas de antibiótico */
export function placa(palco, pe) {
  const CEL = 3, FAIXAS = 5, TAXA = 6500, POR_DIA = 6500, MUT = 1 / 2500, MAX_DIAS = 40;
  const CORES = [TEAL_CLARO, TEAL, TEAL_ESC, NAVY, AMARELO];
  const NOMES = ["sem antibiótico", "dose fraca", "10× mais", "100× mais", "1 000× mais"];
  const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let { ctx, W, H } = canvasNo(palco);
  const GW = Math.floor(W / CEL), GH = Math.floor((H - 26) / CEL), Y0 = 26;
  const faixaDe = (x) => Math.min(FAIXAS - 1, Math.floor((x / GW) * FAIXAS));
  let rng, res, frente, tentativas, chegou, parar = null, semente = 2016, maior = 0;
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda(CORES.map((c, i) => [c, i ? `resiste a ${NOMES[i]}` : "bactéria comum"]))));

  function fundo() {
    ctx.clearRect(0, 0, W, H);
    for (let k = 0; k < FAIXAS; k++) {
      const x0 = (k / FAIXAS) * W, x1 = ((k + 1) / FAIXAS) * W;
      ctx.fillStyle = `rgba(20,37,96,${0.03 * k})`; ctx.fillRect(x0, Y0, x1 - x0, H - Y0);
      ctx.strokeStyle = "#e5e5e5"; ctx.beginPath(); ctx.moveTo(x0, Y0); ctx.lineTo(x0, H); ctx.stroke();
      rotulo(ctx, NOMES[k], x0 + 8, 8, { cor: k ? SUAVE : TEAL_ESC, peso: k === FAIXAS - 1 ? "600" : "" });
    }
    ctx.strokeStyle = "#e5e5e5"; ctx.strokeRect(0.5, Y0 + 0.5, W - 1, H - Y0 - 1);
  }
  function pintar(i) {                               // duas tonalidades por nível: textura de colônia, não bloco chapado
    ctx.fillStyle = CORES[res[i]]; ctx.globalAlpha = rng() < 0.5 ? 1 : 0.78;
    ctx.fillRect((i % GW) * CEL, Y0 + Math.floor(i / GW) * CEL, CEL, CEL); ctx.globalAlpha = 1;
  }
  function zerar() {
    rng = criarRng(semente); res = new Int8Array(GW * GH).fill(-1); frente = []; tentativas = 0; chegou = 0; maior = 0;
    fundo();
    for (let y = 0; y < GH; y++) for (let x = 0; x < 2; x++) if (rng() < 0.5) { const i = y * GW + x; res[i] = 0; frente.push(i); pintar(i); }
  }
  function crescer(n) {
    for (let k = 0; k < n && frente.length && !chegou; k++) {
      tentativas++;
      const j = Math.floor(rng() * frente.length), i = frente[j], x = i % GW, y = Math.floor(i / GW);
      const filha = Math.min(FAIXAS - 1, res[i] + (rng() < MUT ? 1 : 0));
      let cand = -1, vazios = 0, bloqueados = 0;
      for (const [dx, dy] of VIZ) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx; if (res[ni] !== -1) continue;
        if (faixaDe(nx) > filha) { bloqueados++; continue; }
        vazios++; if (rng() * vazios < 1) cand = ni;
      }
      if (cand < 0) { if (!bloqueados) { frente[j] = frente[frente.length - 1]; frente.pop(); } continue; }
      res[cand] = filha; frente.push(cand); pintar(cand);
      maior = Math.max(maior, cand % GW);
      if (cand % GW >= GW - 2) chegou = tentativas;
    }
  }
  const dias = () => tentativas / POR_DIA;
  function situacao() {
    conta.innerHTML = chegou
      ? `Atravessaram em <b>${numero(dias(), 0)} dias</b>.`
      : `Dia <b>${numero(dias(), 0)}</b> · a frente está na faixa <b>${NOMES[faixaDe(maior)]}</b>`;
  }
  return {
    preparar() { zerar(); situacao(); },
    revelar(fim) {
      zerar();
      const pronto = () => { situacao(); fim(dias()); };
      if (reduzido()) { while (!chegou && dias() < MAX_DIAS) crescer(2000); return pronto(); }
      let ultimo = 0;
      parar = laco((t) => {
        const dt = Math.min(0.05, t - ultimo); ultimo = t;
        crescer(Math.round(TAXA * dt)); situacao();
        if (chegou || dias() >= MAX_DIAS) { pronto(); return false; }
      });
    },
    deNovo() { if (parar) parar(); semente++; zerar(); let ultimo = 0; parar = laco((t) => { const dt = Math.min(0.05, t - ultimo); ultimo = t; crescer(Math.round(TAXA * dt)); situacao(); return !chegou && dias() < MAX_DIAS; }); },
    parar() { if (parar) parar(); },
    captura(t) { zerar(); crescer(Math.round(Math.min(t, MAX_DIAS) * POR_DIA)); situacao(); },
  };
}
