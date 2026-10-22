/* A página de catálogo: um banner claro (título, busca em frase, urna de
   sorteio, linha de fecho) e a estante (filtros na lateral, um bloco de
   cartões por tema). Tudo sai do bloco `meta` dos modelos: quem adiciona
   um simulador não mexe aqui.

     montarCatalogo(main, entradas)   entradas = [{ slug, meta }, …] */

import { prepararAcervo } from "./preparar-acervo.js";
import { criarBanner } from "./banner-com-busca.js";
import { criarEstante } from "./estante.js";

export function montarCatalogo(main, entradas) {
  const acervo = prepararAcervo(entradas);
  const estante = criarEstante(acervo);
  main.append(criarBanner(acervo, (texto) => estante.buscar(texto)), estante.no);
}
