/* A página inicial. Cada seção mora no seu próprio pacote e não sabe da
   página; aqui ficam a ORDEM em que elas entram, a numeração dos kickers e
   as sementes das emendas — o que muda quando se acrescenta ou se troca uma
   seção. A ordem em que as coisas rodam importa:

     1  o cabeçalho, primeiro, porque é ele que mede --altura-topo e a
        sobreposição da abertura depende dessa medida;
     2  a abertura e a faixa do Sobre, que animam sozinhas;
     3  as seções 01 e 02, montadas e decoradas;
     4  os simuladores, POR ÚLTIMO: ali há um import dinâmico por modelo, e
        nem a abertura nem o Sobre podem ficar esperando o acervo carregar
        para começar a animar. */

import { lista, destaques } from "../../modelos-de-simulacao/__pacote__.js";
import { kicker, pontuar, recortar } from "../__pacote__.js";
import { ativarTopoSobreposto } from "./cabecalho-sobreposto.js";
import { animarAbertura } from "./abertura.js";
import { animarFaixaDeAmostra } from "./faixa-de-amostra.js";
import * as porqueAprender from "./porque-aprender/__pacote__.js";
import * as oQueEUmSimulador from "./o-que-e-um-simulador/__pacote__.js";
import { montar as montarSimuladores } from "./simuladores/__pacote__.js";

/* a semente da emenda de cada seção, de cima para baixo */
const EMENDAS = { explica: 61, simuladores: 71, sobre: 81, rodape: 91 };

/* decora o título de uma seção: kicker numerado e ponto âmbar no fim */
function decorar(secao, numeroDaSecao) {
  const titulo = secao.querySelector(".titulo-secao");
  kicker(titulo, numeroDaSecao);
  pontuar(titulo);
  return titulo;
}

export async function montarHome() {
  ativarTopoSobreposto();
  animarAbertura(document.getElementById("hero-canvas"));
  animarFaixaDeAmostra(document.getElementById("sobre-amostra"));

  /* ---- 01 · por que aprender evolução: as seis apostas ----
     O corpo vira um díptico: a cabeça e a trilha do índice entram na coluna
     do texto, ao lado do palco que fica fixo. */
  const secaoPorque = document.getElementById("secao-porque");
  porqueAprender.montar(secaoPorque);
  decorar(secaoPorque, "Seção 01");
  porqueAprender.diptico(secaoPorque);

  /* ---- 02 · o que é um simulador: a placa com os degraus ----
     A seção seguinte corta esta numa emenda. */
  const secaoExplica = document.getElementById("secao-explica");
  oQueEUmSimulador.montar(secaoExplica);
  decorar(secaoExplica, "Seção 02");
  recortar(secaoExplica, EMENDAS.explica);

  /* ---- 03 e 04 · simuladores e sobre: decorados como as outras ---- */
  const secaoSimuladores = document.getElementById("secao-simuladores");
  decorar(secaoSimuladores, "Seção 03");
  recortar(secaoSimuladores, EMENDAS.simuladores);

  const secaoSobre = document.getElementById("sobre");
  decorar(secaoSobre, "Seção 04");
  recortar(secaoSobre, EMENDAS.sobre);

  recortar(document.querySelector(".rodape"), EMENDAS.rodape);

  /* ---- a apresentação dos simuladores ----
     A seção roda o `simular()` de cada modelo, então precisa do módulo
     inteiro, não só do bloco `meta`. */
  const entradas = [];
  for (const slug of lista) {
    entradas.push({ slug, modulo: await import(`../../modelos-de-simulacao/${slug}/modelo.js`) });
  }
  montarSimuladores(secaoSimuladores, entradas, { destaques });
}
