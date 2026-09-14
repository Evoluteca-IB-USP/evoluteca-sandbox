/* O palco de cada seção: o simulador em foco rodando ao vivo, direto no chão
   da seção e sem caixa, com a ficha ao lado. São dois canvas — a cena nova
   entra por cima da antiga num fundido. */

import { criar } from "escrever-html";
import { vitrine, LEGENDAS_DAS_VITRINES } from "../vitrines/__pacote__.js";
import { elo } from "./ficha-ou-previsto.js";
import { nivelTexto, controla } from "./descrever-entrada.js";

/* o retângulo do gráfico dentro do canvas; a vitrine de barras escreve
   rótulos acima da área, por isso a margem de topo maior */
const area = (tela, tipo) => ({
  e: tipo === "barras" ? 16 : 40,
  d: tela.clientWidth - 10,
  t: tipo === "barras" ? 34 : 18,
  b: tela.clientHeight - 32,
});

export const opcoesDaVitrine = (g, tela, e) =>
  ({ area: area(tela, e.tipo), ...(g.escuro ? {} : { tom: "claro" }) });

export function criarPalco() {
  const telas = [criar("canvas"), criar("canvas")];
  const cena = criar("div", { class: "palco-cena", "aria-hidden": "true" }, ...telas);
  const ficha = criar("div", { class: "palco-ficha" });
  return { no: criar("aside", { class: "palco" }, cena, ficha), telas, ficha };
}

export function escreverFicha(ficha, e, href) {
  ficha.dataset.trocando = "";
  void ficha.offsetWidth;
  delete ficha.dataset.trocando;
  ficha.replaceChildren(
    criar("p", { class: "palco-legenda", texto: LEGENDAS_DAS_VITRINES[e.tipo] || "" }),
    criar("p", { class: "palco-kicker", texto: [e.numero, nivelTexto(e)].filter(Boolean).join(" · ") }),
    criar("h3", { class: "palco-titulo" }, elo("", e, href, criar("span", { texto: e.meta.titulo }))),
    criar("p", { class: "palco-desc", texto: e.meta.descricao || "" }),
    criar("p", { class: "palco-controla", texto: controla(e) }),
    criar("p", { class: "palco-acao" },
      e.meta.previsto ? null : criar("a", { class: "botao botao-primario botao-mini", href },
        criar("span", { texto: "Abrir simulador" }), criar("span", { class: "seta", "aria-hidden": "true", texto: "→" })),
      criar("span", { class: "palco-tempo", texto: e.meta.tempo ? `cerca de ${e.meta.tempo}` : "" })));
}

export function desenharQuadro(g, e, t) {
  const tela = g.telas[g.frente];
  vitrine(tela, e.tipo, 7 + g.atual, t, opcoesDaVitrine(g, tela, e));
}

export function desenharEstatico(g, entradas) {
  if (g.atual < 0) return;
  const tela = g.telas[g.frente], e = entradas[g.atual];
  vitrine(tela, e.tipo, 7 + g.atual, null, opcoesDaVitrine(g, tela, e));
}
