/* O que as três variantes têm em comum: o header sobre a abertura e a seção 01
   da home logo abaixo, para ver a abertura terminando na página de verdade. */

import { kicker, pontuar } from "../../../paginas/__pacote__.js";
import { ativarTopoSobreposto } from "../../../paginas/home/cabecalho-sobreposto.js";
import * as porqueAprender from "../../../paginas/home/porque-aprender/__pacote__.js";

export function montarPagina() {
  ativarTopoSobreposto();
  const secao = document.getElementById("secao-porque");
  porqueAprender.montar(secao);
  const titulo = secao.querySelector(".titulo-secao");
  kicker(titulo, "Seção 01");
  pontuar(titulo);
}
