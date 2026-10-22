/* De [{ slug, meta }] para o que a página lê: cada entrada já com título,
   nível, tipo de miniatura e link, e os temas na ordem de TEMAS. */

import { TEMAS } from "../../modelos-de-simulacao/niveis-e-temas.js";

/* os modelos prontos não declaram o tipo de miniatura; os previstos, sim */
const TIPO_DA_MINIATURA = { deriva: "linhas", "hardy-weinberg": "barras", "selecao-1-locus": "curva" };

export function prepararAcervo(lista) {
  const entradas = lista.map(({ slug, meta }, indice) => ({
    slug,
    indice,
    titulo: meta.titulo,
    descricao: meta.descricao,
    tema: meta.tema,
    nivel: meta.nivel || [],
    tipo: TIPO_DA_MINIATURA[slug] || meta.saida?.tipo || "linhas",
    previsto: !!meta.previsto,
    href: meta.previsto ? null : `simulador.html?modelo=${slug}`,
  }));
  const temas = Object.entries(TEMAS).map(([chave, nome], i) => ({
    chave, nome, numero: String(i + 1).padStart(2, "0"),
    entradas: entradas.filter((e) => e.tema === chave),
  }));
  return { entradas, temas };
}
