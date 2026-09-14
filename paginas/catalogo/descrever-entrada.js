/* As frases que o catálogo escreve a partir do bloco `meta` de um modelo. */

import { minuscula } from "portugues";
import { NIVEIS, TEMAS } from "../../modelos-de-simulacao/niveis-e-temas.js";

export const nomeTema = (t) => TEMAS[t] || t || "Outros";

export const nivelTexto = (e) => (e.meta.nivel || []).map((n) => NIVEIS[n] || n).join(" e ");

export function controla(e) {
  const b = (e.meta.parametros || []).filter((p) => !p.avancado).map((p) => minuscula(p.rotulo));
  return b.length ? `Você controla ${b.join(", ")}` : "";
}
