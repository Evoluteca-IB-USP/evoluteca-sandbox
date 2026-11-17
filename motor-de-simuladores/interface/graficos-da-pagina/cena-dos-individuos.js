/* A cena dos indivíduos: as cópias do vidro juntadas de duas em duas, ao
   acaso, como nos indivíduos. Três colunas (A₁A₁, A₁A₂, A₂A₂) e, embaixo, a
   conta que volta dos indivíduos para as cópias: a frequência conta cópias,
   e quem tem uma de cada entra com metade. */

import { criarRng } from "r";
import { NAVY, AMARELO, TINTA_SUAVE } from "../cores.js";
import { texto, numero } from "./pecas.js";

function emPares({ cheio, total }, semente) {
  const rng = criarRng(semente), copias = Array.from({ length: total }, (_, i) => i < cheio);
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copias[i], copias[j]] = [copias[j], copias[i]]; }
  const n = [0, 0, 0];
  for (let i = 0; i < total; i += 2) n[2 - (copias[i] + copias[i + 1])]++;
  return n;
}

/** `contagem`: { cheio, total } do vidro na geração t; `nomes`: { cheio, vazio } */
export function cenaDosIndividuos({ indice, t, contagem, nomes }) {
  const [n11, n12, n22] = emPares(contagem, indice * 104729 + t), N = contagem.total / 2;
  const maior = Math.max(n11, n12, n22, 1);

  function desenhar(ctx, W, H) {
    const topo = 34, base = 64, largura = (W - 40) / 3, altura = H - topo - base;
    let lado = 4, vale = 1;
    const cabe = (s) => Math.floor(largura / (2 * s + 3)) * Math.floor(altura / (s + 3));
    for (let s = 14; s >= 3; s -= 0.5) { if (cabe(s) >= maior) { lado = s; break; } lado = s; }
    if (cabe(lado) < maior) vale = Math.ceil(maior / cabe(lado));
    const colunas = Math.floor(largura / (2 * lado + 3));
    const grupos = [[n11, [1, 1], `${nomes.cheio}${nomes.cheio}`], [n12, [1, 0], `${nomes.cheio}${nomes.vazio}`], [n22, [0, 0], `${nomes.vazio}${nomes.vazio}`]];
    grupos.forEach(([n, [c1, c2], rotulo], k) => {
      const x0 = 20 + k * largura;
      texto(ctx, rotulo, x0, 12, "left", NAVY, "700 13px");
      texto(ctx, `${n.toLocaleString("pt-BR")} indivíduos`, x0 + largura - 12, 12, "right", TINTA_SUAVE, "12px");
      const quantos = Math.ceil(n / vale);
      for (let i = 0; i < quantos; i++) {
        const x = x0 + (i % colunas) * (2 * lado + 3), y = topo + Math.floor(i / colunas) * (lado + 3);
        [c1, c2].forEach((c, j) => {
          ctx.fillStyle = c ? NAVY : AMARELO;
          ctx.beginPath(); ctx.arc(x + lado / 2 + j * lado, y + lado / 2, lado / 2 - 0.4, 0, 2 * Math.PI); ctx.fill();
        });
      }
    });
    const p = contagem.cheio / contagem.total;
    texto(ctx, `frequência de ${nomes.cheio} = (2 × ${n11} + ${n12}) ÷ (2 × ${N.toLocaleString("pt-BR")}) = ${numero(p, 2)}`, W / 2, H - 40, "center", NAVY, "600 13px");
    texto(ctx, `Cada ${nomes.cheio}${nomes.cheio} leva duas cópias de ${nomes.cheio}; cada ${nomes.cheio}${nomes.vazio}, uma.` + (vale > 1 ? ` Cada par desenhado vale ${vale} indivíduos.` : ""), W / 2, H - 20, "center", TINTA_SUAVE, "12px");
    return false;
  }

  return { desenhar };
}
