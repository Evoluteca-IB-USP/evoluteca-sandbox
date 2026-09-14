/* O acervo dividido por tema, na ordem canônica de TEMAS. De passagem,
   anota em cada entrada o que a página vai precisar: o número no acervo, o
   tipo de vitrine e o texto sobre o qual a busca corre. */

import { semAcento, doisDigitos } from "portugues";
import { NIVEIS, TEMAS } from "../../modelos-de-simulacao/niveis-e-temas.js";
import { nomeTema } from "./descrever-entrada.js";

export function agruparPorTema(entradas) {
  const conhecidos = Object.keys(TEMAS).filter((t) => entradas.some((e) => (e.meta.tema || "") === t));
  const outros = [...new Set(entradas.map((e) => e.meta.tema || "").filter((t) => !TEMAS[t]))];
  const grupos = [];
  let numero = 0;
  for (const [k, tema] of [...conhecidos, ...outros].entries()) {
    const membros = [];
    entradas.forEach((e, i) => {
      if ((e.meta.tema || "") !== tema) return;
      e.numero = doisDigitos(++numero);
      e.tipo = e.meta.miniatura || e.meta.saida?.tipo || "linhas";
      e.busca = semAcento([e.meta.titulo, e.meta.descricao, nomeTema(tema),
                           ...(e.meta.nivel || []).map((n) => NIVEIS[n] || n)].filter(Boolean).join(" "));
      membros.push(i);
    });
    grupos.push({ tema, nome: nomeTema(tema), indice: k, membros, dentro: membros.length });
  }
  return grupos;
}
