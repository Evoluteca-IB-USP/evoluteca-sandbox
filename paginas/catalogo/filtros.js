/* O que decide se um cartão aparece. */

import { TEMAS } from "../../modelos-de-simulacao/niveis-e-temas.js";

export const passaNoNivel = (e, nivel) => nivel === "todos" || e.nivel.includes(nivel);

/* sem acento e sem caixa: "selecao" acha "Seleção" */
export function passaNaBusca(e, busca) {
  if (!busca) return true;
  const limpar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return limpar(`${e.titulo} ${e.descricao} ${TEMAS[e.tema]}`).includes(limpar(busca));
}
