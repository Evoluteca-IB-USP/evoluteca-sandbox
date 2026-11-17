/* A cena de seguir uma cópia: o vidro grande, um ponto por cópia. Clicar
   numa cópia a marca; conforme o tempo anda, as cópias que descendem dela
   ganham um anel. A genealogia é sorteada de acordo com a rodada: cada cópia
   nova tem como mãe uma cópia do mesmo alelo na geração anterior, ao acaso.
   Quando todas descendem dela, ela é a ancestral comum (o coalescente). */

import { criarRng } from "r";
import { NAVY, AMARELO, TEAL_ESCURO, TINTA_SUAVE } from "../cores.js";
import { texto } from "./pecas.js";
import { lugaresDoVidro, CINZA } from "./desenho-dos-vidros.js";

export const LIMITE_DE_COPIAS = 700;

/** `contarNa(g)` → { cheio, total } do vidro na geração g; `tempo()` → a geração mostrada */
export function cenaDeUmaCopia({ indice, contarNa, tempo, nomes }) {
  let marca = null, linhagem = [];
  const maes = new Map();

  function maesNa(g) {
    if (maes.has(g)) return maes.get(g);
    const antes = contarNa(g - 1), agora = contarNa(g), rng = criarRng(indice * 7919 + g * 31 + 5);
    const m = Array.from({ length: agora.total }, (_, r) => {
      const ehA = r < agora.cheio, de = ehA ? 0 : antes.cheio, quantas = ehA ? antes.cheio : antes.total - antes.cheio;
      return quantas > 0 ? de + Math.floor(rng() * quantas) : -1;
    });
    maes.set(g, m);
    return m;
  }

  function descendentesNa(t) {
    if (!marca || t < marca.t) return null;
    while (linhagem.length <= t - marca.t) {
      const g = marca.t + linhagem.length, antes = linhagem[linhagem.length - 1];
      linhagem.push(new Set(maesNa(g).flatMap((mae, r) => (antes.has(mae) ? [r] : []))));
    }
    return linhagem[t - marca.t];
  }

  let geometria = null;
  function desenhar(ctx, W, H) {
    const t = tempo(), c = contarNa(t), R = Math.min(H / 2 - 18, W * 0.25), cx = R + 24, cy = H / 2;
    const L = lugaresDoVidro(indice, c.total), raio = Math.max(1.3, Math.min(R * 0.08, 0.86 * R * Math.sqrt(Math.PI / c.total) * 0.36));
    geometria = { L, R, cx, cy, raio, total: c.total, t };
    ctx.strokeStyle = CINZA; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    const desc = descendentesNa(t);
    for (let r = 0; r < c.total; r++) {
      const x = cx + L[r][0] * R * 0.84, y = cy + L[r][1] * R * 0.84;
      ctx.fillStyle = r < c.cheio ? NAVY : AMARELO;
      ctx.globalAlpha = desc && !desc.has(r) ? 0.35 : 1;
      ctx.beginPath(); ctx.arc(x, y, raio, 0, 2 * Math.PI); ctx.fill();
      if (desc?.has(r)) { ctx.globalAlpha = 1; ctx.strokeStyle = TEAL_ESCURO; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, raio + 2.2, 0, 2 * Math.PI); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    const tx = cx + R + 30, linhas = frases(t, desc, c);
    linhas.forEach(([frase, forte], k) => texto(ctx, frase, tx, cy - linhas.length * 10 + k * 20, "left", forte ? NAVY : TINTA_SUAVE, forte ? "600 13px" : "12.5px"));
    return false;
  }

  function frases(t, desc, c) {
    if (!marca) return [["Clique numa cópia", true], ["para marcá-la.", true], ["Depois toque o tempo:", false], ["as que descendem dela", false], ["ganham um anel.", false]];
    const alelo = marca.ehA ? nomes.cheio : nomes.vazio;
    if (!desc) return [[`Cópia de ${alelo} marcada`, true], [`na geração ${marca.t}.`, true], ["Avance o tempo até lá.", false]];
    const n = desc.size;
    if (t === marca.t) return [[`Cópia de ${alelo} marcada`, true], [`na geração ${t}.`, true], ["Toque o tempo para ver", false], ["os descendentes dela.", false]];
    if (n === 0) {
      const fim = marca.t + linhagem.findIndex((s) => s.size === 0);
      return [["A linhagem dela acabou", true], [`na geração ${fim}.`, true], ["Nenhuma cópia de hoje", false], ["descende dela: é assim", false], ["que a maioria some.", false]];
    }
    if (n === c.total) return [[`Todas as ${n} cópias`, true], ["descendem dela.", true], ["Ela virou a ancestral", false], ["comum da população:", false], ["olhando para trás,", false], ["todas se juntam nela.", false]];
    return [[`${n} de ${c.total} cópias`, true], [`da geração ${t}`, false], ["descendem da cópia", false], [`marcada na geração ${marca.t}.`, false]];
  }

  function clicar(x, y) {
    if (!geometria) return false;
    const { L, R, cx, cy, raio, total, t } = geometria;
    let melhor = -1, menor = raio * 1.6 + 6;
    for (let r = 0; r < total; r++) {
      const d = Math.hypot(cx + L[r][0] * R * 0.84 - x, cy + L[r][1] * R * 0.84 - y);
      if (d < menor) { menor = d; melhor = r; }
    }
    if (melhor < 0) return false;
    marca = { t, r: melhor, ehA: melhor < contarNa(t).cheio };
    linhagem = [new Set([melhor])];
    return true;
  }

  return { desenhar, clicar };
}
