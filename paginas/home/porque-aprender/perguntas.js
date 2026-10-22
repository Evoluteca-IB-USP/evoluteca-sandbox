/* As quatro apostas, todas sobre casos reais da biologia. A dinâmica é sempre
   a mesma: leia a pergunta, aposte, veja o modelo rodar de verdade e receba
   um motivo. Nenhuma figura é pictograma nem gráfico de linha. A aposta
   nunca é uma lista de opções, que entregaria a resposta pelo formato: é
   um valor contínuo, ou um gesto na própria figura. `comparar` diz o que
   o modelo mediu, na unidade da aposta, e se a aposta chegou perto.

     1  placa      bactérias atravessam faixas de antibiótico (Baym 2016)
     2  pug        focinho de 1/4 → ~1/12 do crânio, 1880–2020 (Guintard & Denis;
                   falta de ar pelo focinho: Packer 2015; Liu 2017)
     3  vidros     107 vidros de 16 moscas, 19 gerações (Buri 1956)
     4  paisagem   Moraba scurra: dois picos e uma sela (Lewontin & White 1960)

   Escolhidas na rodada de variantes de 2026-08; a figura dos vidros, na
   de 2026-10; o pug, no lugar do milho, em 2026-10. Texto escrito para ensino
   médio: sem "desvio", sem "alelo", sem "herdabilidade" — as grandezas
   aparecem em %, mm, dias e gerações. */

import { numero } from "portugues";
import { reguaLogaritmica, MARCAS_DE_TEMPO, tempo, barraDeVidros, apostaNaFigura, focinhoEFolego } from "./apostas/__pacote__.js";
import { placa, focinhos, confete, paisagem } from "./figuras/__pacote__.js";

const dobro = (a, m) => a !== Infinity && Math.max(a / m, m / a) <= 2;     // tempo e rodadas: perto é até 2× para mais ou para menos
const reguaDeTempo = (aoApostar) => reguaLogaritmica({ min: 1, max: 36500, marcas: MARCAS_DE_TEMPO, formatar: tempo, aoApostar });

export const PERGUNTAS = [
  {
    titulo: "Uma placa de gel",
    forcas: ["mutacao", "selecao"],
    figura: (p, pe) => placa(p, pe),
    pergunta: "Uma placa de gel com bactérias comuns numa ponta e faixas de antibiótico cada vez mais forte até a outra — a última faixa mata qualquer bactéria comum. Quanto tempo até elas atravessarem a placa inteira?",
    aposta: ({ aoApostar }) => reguaDeTempo(aoApostar),
    comparar: (a, dias) => ({ modelo: dias, perto: dobro(a, dias) }),
    leitura: (dias) => `Atravessaram em <b>${numero(dias)} dias</b>. Cada vez que a frente parava numa faixa, bastava nascer uma bactéria um pouco mais resistente — e ela nascia, porque são bilhões de divisões. A placa real, de 2016, levou 11 dias. É o mesmo que acontece com um tratamento de antibiótico parado no meio.`,
    motivo: "Porque acontece agora — no hospital, na lavoura, no vírus.",
    depois: "rodar outra placa",
  },
  {
    titulo: "Um cão campeão",
    forcas: ["selecao"],
    figura: (p, pe) => focinhos(p, pe, { inicio: 1880, anosPorGeracao: 4, geracoes: 35 }),
    pergunta: "Por volta de 1880, o focinho do pug tinha um quarto do comprimento do crânio. Desde então, os criadores premiam e cruzam os de focinho mais curto. Em 2020, depois de umas 35 gerações de cães, que tamanho tem o focinho? E, de cada 20 pugs, quantos respiram com dificuldade?",
    aposta: ({ figura, aoApostar }) => focinhoEFolego({ figura, inicio: 6, aoApostar }),
    comparar: (a, { focinho, doentes }) => ({ modelo: { focinho, doentes }, perto: Math.abs(a.focinho - focinho) <= 0.04 && Math.abs(a.doentes - doentes) <= 3 }),
    leitura: ({ focinho, focinho0, doentes }) => `O focinho foi de ${numero(100 * focinho0)}% para <b>${numero(100 * focinho, focinho < 0.1 ? 1 : 0)}% do crânio</b> — e, de cada 20 pugs, <b>${doentes} respiram com dificuldade</b>. Ninguém escolheu a falta de ar: o osso encurtou, mas o céu da boca e a língua não encolheram junto, e a mesma carne, espremida num espaço menor, fecha a passagem. Fotos de campeões mostram o focinho do pug encolhendo ao longo do século 20; num estudo de 2017 com 189 pugs, só 1 em cada 20 respirava sem nenhum sinal do problema.`,
    motivo: "Porque quem escolhe uma coisa leva outras junto.",
    depois: null,
  },
  {
    titulo: "107 vidros",
    forcas: ["deriva"],
    figura: (p, pe) => confete(p, pe, { N: 9, p0: 0.5, geracoes: 19, semente: 1956, n: 107 }),
    pergunta: "Em 1956, Peter Buri pôs 16 moscas em cada um de 107 vidros: metade com uma versão de um gene da cor do olho, metade com a outra — nenhuma delas dá vantagem. Depois de 19 gerações, quantos vidros terminam só com uma das versões, e quantos ainda misturados?",
    aposta: ({ aoApostar }) => barraDeVidros({ n: 107, aoApostar }),
    comparar: (a, real) => ({ modelo: real, perto: Math.abs(a.sem + a.marca - real.sem - real.marca) <= 15 }),
    leitura: ({ marca, sem, meio }) => `<b>${marca}</b> vidros ficaram só com a versão A, <b>${sem}</b> só com a B${meio ? ` e ${meio} ainda misturados` : " — nenhum misturado"}. Sem vantagem nenhuma, o sorteio de quem deixa filhotes decide sozinho — e num vidro de 16 moscas, das quais só umas 9 chegam a se reproduzir, decide rápido. No experimento real: 30 vidros de um lado, 28 do outro, 49 ainda misturados.`,
    motivo: "Porque o acaso também decide — e ninguém o enxerga.",
    depois: "sortear de novo",
  },
  {
    titulo: "Dois morros",
    forcas: ["selecao", "deriva"],
    figura: (p, pe) => paisagem(p, pe, { N: 2000, Npequeno: 25, geracoes: 36, geracoesPequeno: 300, inicio: [0.08, 0.9] }),
    pergunta: "Numa paisagem assim, quanto mais alto, mais a população sobrevive. A bolinha é a população, na encosta do morro baixo. Onde a seleção vai deixá-la?",
    aposta: ({ figura, aoApostar }) => {
      const a = apostaNaFigura({ instrucao: "<em>Clique na paisagem</em> onde você acha que a população vai parar.", formatar: figura.lugar, aoApostar });
      figura.aposta(a.mudou);
      return a;
    },
    comparar: (a, { ponto }) => ({ modelo: ponto, perto: Math.hypot(a[0] - ponto[0], a[1] - ponto[1]) <= 0.12 }),
    leitura: ({ alto }) => `${alto ? "Chegou ao morro alto — deu sorte no caminho." : "Subiu até o <b>topo do morro baixo</b> e parou."} Seleção só sobe, um passo por vez, e não enxerga a paisagem: para chegar ao morro alto seria preciso descer antes. Uma paisagem dessas foi medida de verdade em 1960, num gafanhoto da Austrália, a partir de duas versões de dois cromossomos — e as populações estavam na passagem entre os morros, o que se discute até hoje. Encolha a população: só o acaso atravessa o vale.`,
    motivo: "Porque evolução não é \"o melhor vence\" — é \"o que sobe daqui\".",
    depois: null,
  },
];
