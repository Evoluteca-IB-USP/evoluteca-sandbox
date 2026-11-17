/* Ferramenta "Como o modelo funciona": as premissas da ficha, cada uma com um
   desenho pequeno, o que ela diz e o que muda se ela não valer. */

import { criar } from "escrever-html";
import { linkDeTeste } from "./testar-no-painel.js";

const T = "var(--teal)", N = "var(--navy)", A = "var(--amarelo)";
const bola = (x, y, cor, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" stroke="${cor}"/>`;

const DESENHOS = {
  geracoes: [6, 13, 20, 27].map((x) => bola(x, 7, T)).join("") + `<path d="M16 12v7m-3-3 3 3 3-3" stroke="${N}"/>`
    + [6, 13, 20, 27].map((x) => bola(x, 25, N)).join(""),
  acaso: `<rect x="5" y="5" width="22" height="22" rx="4" stroke="${N}"/>`
    + `<circle cx="11" cy="11" r="1.6" fill="${T}"/><circle cx="16" cy="16" r="1.6" fill="${T}"/><circle cx="21" cy="21" r="1.6" fill="${A}" stroke="${A}"/>`,
  tamanho: `<path d="M5 8v17h9V8M18 8v17h9V8" stroke="${N}"/><path d="M5 13h9M18 13h9" stroke="${T}" stroke-dasharray="2 2"/>`
    + bola(9.5, 20, T, 2.2) + bola(22.5, 20, T, 2.2),
  semSelecao: `<path d="M16 6v20M10 26h12M6 11h20" stroke="${N}"/><path d="M6 11l-3 7h6zM26 11l-3 7h6z" stroke="${T}"/>`,
  isolados: `<path d="M3 8v17h10V8M19 8v17h10V8" stroke="${N}"/><path d="M16 4v24" stroke="${A}" stroke-width="2"/>`
    + bola(8, 19, T, 2.2) + bola(24, 19, T, 2.2),
  semMutacao: bola(8, 16, N, 4.5) + `<path d="M14 16h6m-3-3 3 3-3 3" stroke="${T}"/>` + bola(25, 16, N, 4.5),
  casais: `<circle cx="11" cy="18" r="5" stroke="${T}"/><path d="M14.5 14.5 20 9m-4 0h4v4" stroke="${T}"/>`
    + `<circle cx="22" cy="14" r="5" stroke="${A}"/><path d="M22 19v8m-3-3h6" stroke="${A}"/>`,
};

export const desenhoDaPremissa = (nome) => criar("span", {
  class: "ensino-desenho", "aria-hidden": "true",
  html: `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${DESENHOS[nome] ?? ""}</svg>`,
});

export function montarPremissas(painel, no) {
  const { ficha } = painel;
  no.append(
    criar("p", { class: "abas-nota", texto: "Todo modelo simplifica. Estas são as regras que o simulador segue. Cada uma vale sozinha: leia as que quiser." }),
    criar("div", { class: "premissas" }, ...ficha.premissas.map((item) => criar("div", { class: "premissa" },
      desenhoDaPremissa(item.desenho),
      criar("div", {},
        criar("h3", { class: "premissa-titulo", texto: item.titulo }),
        criar("p", { class: "premissa-texto", texto: item.texto }),
        item.seNaoValer && criar("p", { class: "premissa-senao" },
          criar("b", { texto: "Se não valer: " }), item.seNaoValer.texto, " ",
          item.seNaoValer.valores ? linkDeTeste(painel, item.seNaoValer.rotulo ?? "veja", item.seNaoValer) : null))))));
  return { atualizar() {} };
}
