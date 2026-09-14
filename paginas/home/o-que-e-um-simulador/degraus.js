import { criar, criarTexto as T } from "escrever-html";

/* A escada de quatro degraus:
     1 um modelo é uma regra
     2 uma simulação é a regra no tempo (e o acaso)
     3 um simulador é poder mudar a regra e comparar
     4 é para isso que o site existe
   As frases dos degraus SÃO os controles — "rode de novo", "ligue a
   seleção", "ligue a mutação" mudam a placa na hora. Nenhum widget: o
   experimento mora na frase. */

const degrau = (n, titulo, ...corpo) =>
  criar("div", { class: "degrau" },
    criar("span", { class: "degrau-n", texto: n }),
    criar("h3", { texto: titulo }),
    criar("p", {}, ...corpo));

export function criarDegraus({ recomecar, deNovo, selecao, mutacao }, linkCatalogo) {
  return criar("div", { class: "degraus" },
    degrau("1", "Um modelo é uma regra.",
      T("Aqui, uma só: uma célula da borda, sorteada, ocupa uma casa vazia ao lado e passa a " +
        "sua cor adiante. Não há mais nada escrito — nem “setor”, nem “competição”. Duvida? "),
      recomecar, T(".")),
    degrau("2", "Uma simulação é a regra no tempo.",
      T("Milhares de divisões depois aparece um padrão que a regra não menciona: os setores. " +
        "No laboratório isso leva dias e um microscópio; aqui, segundos. E como cada divisão " +
        "é sorteada, o mesmo começo dá outro desenho — "),
      deNovo, T(" e compare.")),
    degrau("3", "Um simulador é poder mudar a regra.",
      T("E se a cor escura se dividisse 30% mais rápido? "), selecao,
      T(": os setores alargam e engolem os vizinhos. E se, de vez em quando, uma célula " +
        "nascesse de outra cor? "), mutacao,
      T(". Mudar uma coisa, rodar de novo, comparar — é o experimento que a natureza não " +
        "deixa fazer.")),
    degrau("4", "É para isso que a Evoluteca existe.",
      T("Evolução se ensina com figuras paradas e fórmulas. Cada simulador do acervo é um " +
        "modelo como este, com o que se pode mudar à mão, o conceito explicado, um roteiro de " +
        "atividade e um guia para o professor — para a aula ter algo para rodar. "),
      criar("a", { class: "link-seta", href: linkCatalogo, texto: "Ver os simuladores" })));
}
