import { criar } from "escrever-html";
import { NIVEIS, TEMAS } from "../../../modelos-de-simulacao/niveis-e-temas.js";

/* O título do simulador e as etiquetas do bloco `meta`: nível, tema e
   duração estimada. */
export function cabecalhoDoSimulador(meta) {
  const chips = criar("div", { class: "card-chips" });
  for (const nv of meta.nivel || []) {
    chips.append(criar("span", { class: `chip chip-${nv}`, texto: NIVEIS[nv] || nv }));
  }
  if (meta.tema) chips.append(criar("span", { class: "chip", texto: TEMAS[meta.tema] || meta.tema }));
  if (meta.tempo) chips.append(criar("span", { class: "chip", texto: `~${meta.tempo}` }));

  return criar("div", { class: "app-cabeca" }, criar("h1", { texto: meta.titulo }), chips);
}
