/* A legenda da figura da genealogia, como a da Figura 3.4 de Rice (2004):
   vai sob a figura, diz como ler os dois painéis e traz cada sinal do
   tamanho de uma letra (desenhados em aparencia/simulador/genealogia.css). */

import { criar } from "escrever-html";

const sinal = (qual) => `<span class="sinal sinal-${qual}" aria-hidden="true"></span>`;

/** o parágrafo da legenda; `atualizar(gen)` o reescreve quando o tamanho da população muda */
export function legendaDaGenealogia() {
  const no = criar("p", { class: "legenda-da-figura" });
  let escrita = "";
  no.atualizar = (gen) => {
    const N = gen.copias / 2, versao = `${N} ${gen.mutacoes.length > 0}`;
    if (versao === escrita) return;
    escrita = versao;
    no.innerHTML = `<b>Figura 1.</b> A história de um gene numa população de ${N} pessoas (${gen.copias} cópias do gene).
      Hoje fica em cima e o passado, embaixo. Cada cópia veio de uma cópia da geração anterior, sorteada ao acaso.
      <b>(A)</b> Cada oval ${sinal("oval")} é uma pessoa, com as suas duas cópias.
      <b>(B)</b> As mesmas cópias, trocadas de lugar dentro de cada geração para as linhas não se cruzarem.
      As cópias escuras ${sinal("viva")} têm descendentes hoje; as cinzas ${sinal("perdida")} não têm.
      O círculo ${sinal("ancestral")} é o ancestral comum: a cópia de onde vieram todas as cópias de hoje.${gen.mutacoes.length ? ` O ${sinal("mutacao")} é uma mutação.` : ""}
      <span class="legenda-dica">Passe o mouse numa cópia para ver, nos dois painéis, de onde ela veio e quem veio dela.</span>`;
  };
  return no;
}
