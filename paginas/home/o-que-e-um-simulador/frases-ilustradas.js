/* O texto da seção, em três parágrafos curtos. A regra é escrita com
   desenhos do tamanho de uma letra (a bactéria, a filha, o espaço vazio, a
   mancha), e cada trecho com desenho diz em `data-lupa` o que a placa
   mostra quando o mouse passa por ele. As escolhas que mudam a regra são
   menus no meio da frase, e o desenho da filha muda com a escolha. */

import { criar, criarTexto as T } from "escrever-html";
import { criarEscolha } from "../../__pacote__.js";

export const FRASE = "Uma versão simplificada de um pedaço da natureza, <b>feita para você mexer</b>.";

const OPCOES = {
  mutacao: [[0, "igual à mãe"], [1 / 150, "às vezes com mutação"], [1, "de qualquer cor"]],
  vantagem: [[1, "no mesmo ritmo"], [1.6, "mais rápido"]],
};

const LEGENDAS = {
  regra: "Uma divisão de verdade, em câmera lenta: a mãe, o espaço vazio ao lado, a filha.",
  nascimento: "Uma colônia desde o começo, em câmera lenta. Cada mancha é a família de uma das " +
              "bactérias do círculo.",
  mutante: "Uma filha que nasceu de outra cor, em câmera lenta, e a mancha nova que sai dela.",
};

/* a legenda do quadro de perto para o trecho `lupa`; a da filha depende da escolha */
export function legenda(lupa, regra) {
  if (lupa === "mutante" && !(regra.mutacao > 0)) {
    return "Com a filha igual à mãe, cada família guarda uma cor, e por isso as manchas se formam.";
  }
  if (lupa === "mutante" && regra.mutacao >= 1) {
    return "Com qualquer cor, a filha não herda nada da mãe: nenhuma família guarda uma cor, e " +
           "as manchas não se formam.";
  }
  return LEGENDAS[lupa];
}

/* 0: igual à mãe, 1: às vezes com mutação, 2: de qualquer cor */
const heranca = (regra) => (regra.mutacao >= 1 ? 2 : regra.mutacao > 0 ? 1 : 0);

const desenho = (tipo) => criar("i", { class: `explica-desenho ${tipo}`, "aria-hidden": true });
const trecho = (lupa, ...partes) =>
  criar("span", { class: "explica-trecho", "data-lupa": lupa }, ...partes.map((x) => (typeof x === "string" ? T(x) : x)));

/* os parágrafos; `mudar(campo, valor)` aplica uma escolha à regra da placa */
export function criarParagrafos(regra, mudar) {
  const filha = desenho("filha");
  const mostrarFilha = () => { filha.dataset.heranca = heranca(regra); };
  const escolha = (campo) => criarEscolha(OPCOES[campo], regra[campo], (v) => { mudar(campo, v); mostrarFilha(); });
  mostrarFilha();
  return [
    criar("p", {}, "Atrás deste texto, bactérias crescem numa placa, como num laboratório. Lá, isso leva " +
      "dias; aqui, segundos. Passe o mouse nos desenhos pequenos do texto para ver a placa de perto."),
    criar("p", {}, "O computador segue uma regra só: ",
      trecho("regra", "uma bactéria ", desenho("celula"), " da borda se divide, e a filha ", desenho("celula"),
        " ocupa o espaço vazio ", desenho("vazio"), " ao lado"),
      ". Repetida milhares de vezes, ela desenha ",
      trecho("nascimento", "as manchas ", desenho("mancha"), " da placa: cada mancha é a família de uma bactéria"), "."),
    criar("p", {}, "Mude a regra e veja no que dá: ",
      trecho("mutante", "a filha ", filha, " nasce ", escolha("mutacao")),
      ", e ", trecho("amarelas", "as amarelas ", desenho("amarela"), " se dividem ", escolha("vantagem"), " que as outras"), "."),
  ];
}
