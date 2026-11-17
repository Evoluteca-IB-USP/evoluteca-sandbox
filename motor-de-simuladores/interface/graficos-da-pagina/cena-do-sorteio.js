/* A cena do sorteio: como uma geração nasce da anterior. À esquerda o vidro
   na geração t (os pais), à direita o da geração t + 1 enchendo. Cada cópia
   nova é uma cópia sorteada dos pais, com reposição: a mesma cópia pode ser
   sorteada várias vezes, e outras nenhuma. O resultado é o da rodada: a
   cena só mostra em que ordem as cópias saíram. */

import { criarRng } from "r";
import { NAVY, AMARELO, TINTA_SUAVE } from "../cores.js";
import { texto } from "./pecas.js";
import { lugaresDoVidro, copiasPorPonto, pontos, CINZA } from "./desenho-dos-vidros.js";

/** `antes` e `depois`: { cheio, total } nas gerações t e t + 1; `fim()` quando acaba */
export function cenaDoSorteio({ indice, t, antes, depois, nomes, fim }) {
  let inicio = null, k = 1, pais, filhos, sorteios, passo, duracao;

  function preparar(R) {
    k = copiasPorPonto(Math.max(antes.total, depois.total), R, 4.6);
    pais = pontos(antes, k);
    filhos = pontos(depois, k);
    const rng = criarRng(indice * 7919 + t);
    const cores = Array.from({ length: filhos.m }, (_, r) => r < filhos.a);
    for (let i = cores.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cores[i], cores[j]] = [cores[j], cores[i]]; }
    let proximoA = 0, proximoB = filhos.a;
    sorteios = cores.map((ehA) => {
      const temCor = ehA ? pais.a > 0 : pais.m - pais.a > 0;
      const pai = !temCor ? Math.floor(rng() * pais.m) : ehA ? Math.floor(rng() * pais.a) : pais.a + Math.floor(rng() * (pais.m - pais.a));
      return { pai, filho: ehA ? proximoA++ : proximoB++, ehA };
    });
    duracao = Math.min(6, 1.2 + filhos.m * 0.05);
    passo = duracao / filhos.m;
  }

  function desenhar(ctx, W, H, agora) {
    const R = Math.min(H * 0.36, W * 0.2);
    if (!sorteios) preparar(R);
    if (inicio === null) inicio = agora;
    const tempo = (agora - inicio) / 1000, feitos = Math.min(sorteios.length, Math.floor(tempo / passo));
    const cx0 = W * 0.27, cx1 = W * 0.73, cy = H * 0.46;
    const L0 = lugaresDoVidro(indice, pais.m), L1 = lugaresDoVidro(indice + 501, filhos.m);
    const raio = Math.max(1.4, Math.min(R * 0.12, 0.86 * R * Math.sqrt(Math.PI / Math.max(pais.m, filhos.m)) * 0.34));
    const pos = (L, r, cx) => [cx + L[r][0] * R * 0.84, cy + L[r][1] * R * 0.84];

    [cx0, cx1].forEach((cx) => { ctx.strokeStyle = CINZA; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); });
    texto(ctx, `geração ${t}: os pais`, cx0, cy - R - 16, "center", NAVY, "600 12px");
    texto(ctx, `geração ${t + 1}: os filhos`, cx1, cy - R - 16, "center", NAVY, "600 12px");

    const vezes = new Array(pais.m).fill(0);
    for (let s = 0; s < feitos; s++) vezes[sorteios[s].pai]++;
    for (let r = 0; r < pais.m; r++) {
      const [x, y] = pos(L0, r, cx0);
      ctx.fillStyle = r < pais.a ? NAVY : AMARELO;
      ctx.globalAlpha = feitos === sorteios.length && !vezes[r] ? 0.25 : 1;
      ctx.beginPath(); ctx.arc(x, y, raio, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let s = 0; s < feitos; s++) {
      const { filho, ehA } = sorteios[s], [x, y] = pos(L1, filho, cx1);
      ctx.fillStyle = ehA ? NAVY : AMARELO;
      ctx.beginPath(); ctx.arc(x, y, raio, 0, 2 * Math.PI); ctx.fill();
    }
    if (feitos < sorteios.length) {
      const { pai, filho } = sorteios[feitos], [xa, ya] = pos(L0, pai, cx0), [xb, yb] = pos(L1, filho, cx1);
      ctx.strokeStyle = "rgba(252, 180, 33, .8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.bezierCurveTo(xa + 60, ya - 40, xb - 60, yb - 40, xb, yb); ctx.stroke();
      ctx.strokeStyle = AMARELO;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xa, ya, raio + 3, 0, 2 * Math.PI); ctx.stroke();
    }

    const nA = sorteios.slice(0, feitos).filter((s) => s.ehA).length;
    const unidade = k > 1 ? ` (cada ponto vale ${k} cópias)` : "";
    texto(ctx, `sorteadas ${feitos} de ${sorteios.length}: ${nA} de ${nomes.cheio}, ${feitos - nA} de ${nomes.vazio}${unidade}`, W / 2, cy + R + 22, "center", TINTA_SUAVE, "12px");
    if (feitos === sorteios.length) {
      const nunca = vezes.filter((v) => !v).length;
      texto(ctx, `${nunca} cópias dos pais não foram sorteadas nenhuma vez (as apagadas);`, W / 2, cy + R + 40, "center", NAVY, "600 12px");
      texto(ctx, "outras saíram mais de uma vez. É esse acaso que muda a frequência.", W / 2, cy + R + 56, "center", NAVY, "600 12px");
    }
    if (tempo > duracao + 2.2) fim();
    return tempo <= duracao + 2.2;
  }

  return { desenhar };
}
