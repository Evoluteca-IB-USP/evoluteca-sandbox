/* A folha de contato: uma vinheta do gráfico de cada simulador do acervo,
   lado a lado, numa esteira que rola de lado. Com 20 ou com 60 simuladores a
   altura do banner é a mesma — o que cresce é o comprimento da esteira. Ela
   anda sozinha, bem devagar, pausa quando o cursor entra e para de vez no
   primeiro gesto. */

import { criar } from "escrever-html";
import { plural } from "portugues";
import { miniatura } from "../vitrines/__pacote__.js";
import { elo } from "./ficha-ou-previsto.js";

const PASSO = 14;           // px/s — a folha anda quase parada

export function criarFolhaDeContato({ grupos, entradas, link, aoFocar, reduz }) {
  const trilho = criar("div", { class: "folha-trilho" });
  const janela = criar("div", { class: "folha", tabindex: "0", role: "group", "aria-label": "O acervo, vinheta a vinheta" }, trilho);
  const vinhetas = [];

  for (const g of grupos) {
    const grade = criar("div", { class: "folha-grade" });
    for (const i of g.membros) {
      const e = entradas[i];
      const tela = criar("canvas", { "data-tom": "escuro" });
      const v = elo("vinheta", e, link(e.slug), tela);
      v.title = e.meta.titulo;
      v.append(
        criar("span", { class: "vinheta-num", texto: e.numero }),
        criar("span", { class: "vinheta-nome", texto: e.meta.titulo }));
      if (e.meta.previsto) v.tabIndex = 0;
      v.addEventListener("mouseenter", () => aoFocar(i));
      v.addEventListener("focus", () => aoFocar(i));
      grade.append(v);
      vinhetas[i] = { no: v, tela };
    }
    const conta = criar("span", { class: "folha-conta" });
    g.contaFolha = conta;
    trilho.append(criar("div", { class: "folha-tema" },
      criar("p", { class: "folha-rotulo" }, criar("span", { texto: g.nome }), conta), grade));
  }

  const pintar = () => vinhetas.forEach((v, i) => miniatura(v.tela, entradas[i].tipo, 7 + i));
  requestAnimationFrame(pintar);
  window.addEventListener("resize", pintar);

  /* a esteira anda sozinha; o cursor pausa, o gesto encerra */
  if (!reduz) {
    let pausada = false, viva = true, resto = 0, ultimo = null;
    janela.addEventListener("mouseenter", () => { pausada = true; });
    janela.addEventListener("mouseleave", () => { pausada = false; });
    for (const ev of ["pointerdown", "wheel", "keydown"]) janela.addEventListener(ev, () => { viva = false; }, { passive: true });
    const andar = (agora) => {
      if (!viva) return;
      if (ultimo !== null && !pausada) {
        resto += PASSO * (agora - ultimo) / 1000;
        const px = Math.floor(resto);
        if (px) {
          resto -= px;
          const fim = janela.scrollWidth - janela.clientWidth;
          janela.scrollLeft = fim > 0 && janela.scrollLeft >= fim - 1 ? 0 : janela.scrollLeft + px;
        }
      }
      ultimo = agora;
      requestAnimationFrame(andar);
    };
    requestAnimationFrame(andar);
  }

  return {
    no: janela,
    vinhetas,
    /* esmaece as vinhetas que ficaram fora do filtro */
    marcarFora(i, fora) { vinhetas[i].no.classList.toggle("fora", fora); },
    acender(i) { vinhetas.forEach((v, k) => v.no.classList.toggle("aceso", k === i)); },
    contarTema(g) { g.contaFolha.textContent = plural(g.dentro, "simulador", "simuladores"); },
    /* a esteira acompanha o foco, mas só quando a vinheta saiu da janela */
    rolarAte(i) {
      const alvo = vinhetas[i]?.no;
      if (!alvo) return;
      const r = alvo.getBoundingClientRect(), j = janela.getBoundingClientRect();
      if (r.width && (r.left < j.left + 8 || r.right > j.right - 8)) {
        janela.scrollBy({ left: r.left - j.left - j.width / 2 + r.width / 2, behavior: "smooth" });
      }
    },
  };
}
