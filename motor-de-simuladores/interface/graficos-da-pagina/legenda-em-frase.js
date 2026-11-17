/* A legenda de um gráfico da página, escrita como frase de figura: cada
   item traz o seu desenho do tamanho de uma letra. Itens com `avancado`
   só aparecem no modo avançado. */

import { criar } from "escrever-html";

const DESENHOS = {
  linha: `<svg viewBox="0 0 22 10"><path d="M1 7 L6 4 L10 6 L15 2 L21 5" fill="none" stroke="var(--teal)" stroke-width="1.6"/></svg>`,
  ponto: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.4" fill="var(--teal)" stroke="#fff" stroke-width="1.2"/></svg>`,
  tracejado: `<svg viewBox="0 0 22 10"><path d="M1 5 H21" stroke="var(--tinta-suave)" stroke-dasharray="3 3" stroke-width="1.2"/><circle cx="4" cy="5" r="3" fill="#fff" stroke="var(--amarelo)" stroke-width="1.8"/></svg>`,
  "linha-escura": `<svg viewBox="0 0 22 10"><path d="M1 8 L6 5 L10 6 L15 3 L21 3" fill="none" stroke="var(--navy)" stroke-width="2"/></svg>`,
  previsao: `<svg viewBox="0 0 22 10"><path d="M1 3 Q11 5 21 8" fill="none" stroke="var(--teal-escuro)" stroke-dasharray="4 3" stroke-width="1.5"/></svg>`,
  marca: `<svg viewBox="0 0 10 10"><path d="M5 1 V8" stroke="var(--teal-escuro)" stroke-width="1.8"/></svg>`,
  faixa: `<svg viewBox="0 0 22 10"><path d="M1 3 Q11 0 21 1 V9 Q11 10 1 7 Z" fill="var(--teal-claro)" fill-opacity=".3" stroke="var(--teal-claro)" stroke-dasharray="2 2"/></svg>`,
};

export function legendaEmFrase(spec, numero) {
  const itens = spec.legenda ?? [];
  return criar("p", { class: "painel-legenda" },
    criar("b", { texto: `Figura ${numero}. ` }),
    ...itens.map((item, i) => criar("span", { class: item.avancado ? "so-avancado" : "", html:
      `${i ? "; " : ""}<span class="painel-legenda-desenho" aria-hidden="true">${DESENHOS[item.desenho] ?? ""}</span> ${item.texto}` })),
    ".");
}
