import { criar, criarTexto as T } from "escrever-html";
import { criarRng, rpois } from "r";
import { numero } from "portugues";
import { canvasNo, rotulo, mistura, FONTE, NAVY, TEAL, TEAL_CLARO, AMARELO, CINZA, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { animar, eloSelecao, entre } from "./animacao-com-fim.js";

/* rodadas de evolução dirigida, em log2 da atividade.
   Cada cópia leva uns erros; cada erro quase sempre piora, às vezes
   não muda nada, raramente ajuda um pouco. */
function sortearRodadas({ alvo = 256, copias = 1000, max = 14, comSelecao = true, semente = 1994 }) {
  const rng = criarRng(semente), ALVO = Math.log2(alvo), rodadas = [];
  const efeito = () => { const u = rng(); return u < 0.03 ? -Math.log(1 - rng()) * 0.75 : u < 0.5 ? 0 : Math.log(1 - rng()) * 1.5; };
  let base = 0;
  while (rodadas.length < max && !(comSelecao && base >= ALVO)) {
    const ds = new Float32Array(copias);
    let melhor = 0;
    for (let i = 0; i < copias; i++) {
      const n = rpois(1.6, rng);
      for (let j = 0; j < n; j++) ds[i] += efeito();
      if (comSelecao && ds[i] > ds[melhor]) melhor = i;
    }
    rodadas.push({ base, ds, melhor });
    base += ds[melhor];
  }
  return { rodadas, final: base };
}

/* a placa de mil poços, como no laboratório: cada poço tem uma cópia
   da enzima, e quanto mais ela trabalha, mais escuro fica o poço. A
   pipeta enche a placa coluna a coluna; o poço mais escuro ganha um
   aro e é dele que sai a placa seguinte. Em cima, a linhagem das
   placas; embaixo, a régua da cor, com a mãe, a melhor e o alvo. */
export function placaDePocos(palco, pe, opts) {
  const RODADA = 2.4, COL = 50, LIN = 20, L0 = -4, L1 = 9;
  const { ctx, W, H } = canvasNo(palco);
  const conta = criar("p", { class: "vivo-nota" });
  const elo = eloSelecao((com) => { if (parar) parar(); montar(com); parar = animar(desenhar, DUR); });
  pe.replaceChildren(criar("div", {}, conta, criar("p", { class: "vivo-nota" }, T("Cada poço é uma cópia do gene com uns erros ao acaso. "), elo)));
  const Y0 = 44, cel = Math.min((W - 24) / COL, (H - Y0 - 74) / LIN), R = cel * 0.4;
  const larg = cel * COL, ox = (W - larg) / 2, oy = Y0 + 6, yR = oy + cel * LIN + 38;
  const PARADAS = ["#ffffff", TEAL_CLARO, TEAL, NAVY];
  const cor = (l) => { const t = Math.max(0, Math.min(0.999, (l - L0) / (L1 - L0))) * 3, i = Math.floor(t); return mistura(PARADAS[i], PARADAS[i + 1], t - i); };
  const xR = (l) => ox + (Math.max(L0, Math.min(L1, l)) - L0) / (L1 - L0) * larg;
  const vezes = (l) => { const v = 2 ** Math.abs(l); return `${l < 0 ? "÷" : "×"}${numero(v, v < 10 ? 1 : 0)}`; };
  let sorteio, DUR, parar = null;
  function montar(comSelecao) { sorteio = sortearRodadas({ alvo: opts.alvo, comSelecao }); DUR = sorteio.rodadas.length * RODADA + 0.3; }
  function bolinha(x, y, l, aro) {
    ctx.fillStyle = cor(l); ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = aro || CINZA; ctx.lineWidth = aro ? 2 : 1; ctx.stroke();
  }
  function linhagem(k, acesa) {                          // a original → placa 1 → placa 2 …, com o espaço medido
    const { rodadas } = sorteio, itens = [{ l: 0, txt: "a original", cor: SUAVE }];
    rodadas.forEach((r, j) => {
      if (j > k || (j === k && !acesa)) return;
      const l = r.base + r.ds[r.melhor];
      itens.push({ l, aro: j === k ? AMARELO : null, txt: rodadas.length <= 4 || j === k ? `placa ${j + 1}: ${vezes(l)}` : "", cor: NAVY, peso: j === k ? "600" : "" });
    });
    for (const it of itens) { ctx.font = `${it.peso || ""} 11px ${FONTE}`; it.w = 16 + (it.txt ? ctx.measureText(it.txt).width + 5 : 0); }
    const soma = itens.reduce((a, it) => a + it.w, 0), vao = Math.min(28, (larg - soma) / Math.max(1, itens.length - 1));
    let x = ox;
    itens.forEach((it, j) => {
      if (j && vao > 10) { ctx.strokeStyle = CINZA; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - vao + 4, 14); ctx.lineTo(x - 4, 14); ctx.stroke(); }
      bolinha(x + 8, 14, it.l, it.aro);
      if (it.txt) rotulo(ctx, it.txt, x + 21, 14, { base: "middle", cor: it.cor, peso: it.peso });
      x += it.w + vao;
    });
  }
  function regua(mae, melhor) {
    for (let i = 0; i < 130; i++) { ctx.fillStyle = cor(L0 + (i + 0.5) / 130 * (L1 - L0)); ctx.fillRect(ox + i * larg / 130, yR, larg / 130 + 0.5, 8); }
    ctx.strokeStyle = CINZA; ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, yR + 0.5, larg - 1, 7);
    for (const [l, txt] of [[-4, "÷16"], [0, "×1"], [4, "×16"], [8, `×${opts.alvo}: o alvo`]]) {
      const x = xR(l); ctx.strokeStyle = l === 8 ? AMARELO : SUAVE; ctx.lineWidth = l === 8 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, yR - (l === 8 ? 4 : 0)); ctx.lineTo(x, yR + 12); ctx.stroke();
      rotulo(ctx, txt, x, yR + 15, { alinhar: l === -4 ? "left" : "center", cor: l === 8 ? NAVY : SUAVE, peso: l === 8 ? "600" : "" });
    }
    ctx.font = `600 11px ${FONTE}`;                       // cada rótulo centrado na sua marca, afastados se colidem e presos dentro da régua
    const marcas = [[mae, NAVY, "a mãe"], ...(melhor !== null ? [[melhor, AMARELO, "a melhor"]] : [])]
      .map(([l, c, txt]) => { const w = ctx.measureText(txt).width; return { x: xR(l), c, txt, w, a: xR(l) - w / 2 }; })
      .sort((m, n) => m.x - n.x);
    const fim = ox + larg, prender = (m) => { m.a = Math.max(ox, Math.min(fim - m.w, m.a)); };
    marcas.forEach(prender);
    if (marcas.length === 2) {
      const [e, d] = marcas, falta = e.a + e.w + 10 - d.a;
      if (falta > 0) { e.a -= falta / 2; d.a += falta / 2; if (e.a < ox) { d.a += ox - e.a; e.a = ox; } if (d.a + d.w > fim) { e.a -= d.a + d.w - fim; d.a = fim - d.w; } }
    }
    for (const m of marcas) {
      ctx.fillStyle = m.c; ctx.beginPath(); ctx.moveTo(m.x, yR - 2); ctx.lineTo(m.x - 5, yR - 10); ctx.lineTo(m.x + 5, yR - 10); ctx.fill();
      rotulo(ctx, m.txt, m.a, yR - 12, { base: "bottom", cor: NAVY, peso: "600" });
    }
  }
  function desenhar(t) {
    const { rodadas } = sorteio, k = Math.min(rodadas.length - 1, Math.floor(t / RODADA)), u = Math.min(1, t / RODADA - k), r = rodadas[k];
    const enche = entre(u, 0, 0.5), acende = entre(u, 0.55, 0.72);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = CINZA; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(ox - 8, oy - 8, larg + 16, cel * LIN + 16, 10); ctx.stroke();
    if (enche > 0 && enche < 1) { ctx.fillStyle = "rgba(252,180,33,.25)"; ctx.fillRect(ox + Math.floor(enche * COL) * cel, oy - 4, cel, cel * LIN + 8); }
    for (let i = 0; i < COL * LIN; i++) {
      const c = Math.floor(i / LIN), x = ox + (c + 0.5) * cel, y = oy + (i % LIN + 0.5) * cel;
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
      if (c < Math.floor(enche * COL) || enche >= 1) { ctx.fillStyle = cor(r.base + r.ds[i]); ctx.fill(); }
      ctx.strokeStyle = "#dcdcdc"; ctx.lineWidth = 0.8; ctx.stroke();
    }
    const melhor = r.base + r.ds[r.melhor];
    if (acende > 0) {
      const i = r.melhor, x = ox + (Math.floor(i / LIN) + 0.5) * cel, y = oy + (i % LIN + 0.5) * cel;
      ctx.fillStyle = AMARELO; ctx.globalAlpha = 0.3 * acende; ctx.beginPath(); ctx.arc(x, y, R + 10 * acende, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = AMARELO; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, R + 2.5, 0, Math.PI * 2); ctx.stroke();
    }
    linhagem(k, acende > 0);
    regua(r.base, acende > 0 ? melhor : null);
    const feitas = k + (acende > 0 ? 1 : 0), atual = acende > 0 ? melhor : r.base;
    conta.innerHTML = `Rodada <b>${feitas}</b> · atividade <b>${vezes(atual)}</b>` + (feitas ? ` · ${numero(1000 * feitas)} cópias testadas` : "");
  }
  const resultado = () => ({ r: sorteio.rodadas.length, x: 2 ** sorteio.final });
  return {
    preparar() { montar(true); elo.hidden = true; desenhar(0); },
    revelar(fim) { montar(true); parar = animar(desenhar, DUR, () => { elo.hidden = false; fim(resultado()); }); },
    parar() { if (parar) parar(); },
    captura(t) { montar(true); desenhar(Math.min(t, DUR)); },
  };
}
