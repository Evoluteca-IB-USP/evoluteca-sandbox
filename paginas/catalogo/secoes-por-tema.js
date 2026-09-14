/* O acervo: uma SEÇÃO por tema, alternando branco e navy (duas cores só —
   com seis ou com dez temas o ritmo é sempre o mesmo). Cada seção corta a de
   cima pela emenda serrilhada da home, abre com o kicker numerado e um
   título grande terminado em ponto âmbar, e traz o índice do tema em linhas
   de uma linha só, com o palco ao lado. */

import { criar } from "escrever-html";
import { kicker, pontuar, recortar } from "../__pacote__.js";
import { elo, aoPousar } from "./ficha-ou-previsto.js";
import { nivelTexto } from "./descrever-entrada.js";
import { criarPalco } from "./palco-do-tema.js";

const TONS = ["claro", "escuro"];   // o ritmo das seções, de cima para baixo
const SEMENTE_EMENDA = 61;          // semente da 1ª emenda; cada seção soma 10

export function criarSecoesPorTema({ grupos, entradas, main, link, aoFocar, reduz }) {
  const linhas = [];

  grupos.forEach((g, k) => {
    const secao = criar("section", { class: "secao tema", id: `tema-${g.tema || "outros"}`, "data-tom": TONS[k % TONS.length] });
    const h2 = criar("h2", { class: "titulo-secao", texto: g.nome });

    const ol = criar("ol", { class: "acervo-lista" });
    for (const i of g.membros) {
      const e = entradas[i];
      const a = elo("acervo-item", e, link(e.slug),
        criar("span", { class: "acervo-num", texto: e.numero }),
        criar("span", { class: "acervo-nome", texto: e.meta.titulo }),
        criar("span", { class: "acervo-meta", texto: [nivelTexto(e), e.meta.tempo].filter(Boolean).join(" · ") }));
      if (e.meta.previsto) a.tabIndex = 0;
      aoPousar(a, () => aoFocar(i));
      linhas[i] = a;
      ol.append(criar("li", {}, a));
    }

    const palco = criarPalco();
    secao.append(criar("div", { class: "container" }, h2, criar("div", { class: "tema-corpo" }, ol, palco.no)));
    main.append(secao);

    kicker(h2, "");                              // o texto entra ao filtrar, com a contagem
    pontuar(h2);
    recortar(secao, SEMENTE_EMENDA + 10 * k);    // a 1ª emenda corta o próprio banner

    Object.assign(g, {
      secao, ficha: palco.ficha, telas: palco.telas, palco: palco.no,
      etiqueta: h2.previousElementSibling,
      escuro: secao.dataset.tom === "escuro",
      atual: -1, frente: 0, inicio: 0, saindo: null,
      automatico: !reduz, progresso: 0,
    });
  });

  return { linhas };
}
