/* As seis apostas, todas sobre casos reais da biologia. A dinâmica é sempre
   a mesma: leia a pergunta, aposte, veja o modelo rodar de verdade e receba
   um motivo. Nenhuma figura é pictograma nem gráfico de linha.

     1  milho      Illinois, 1896–hoje: 4,7% → ~20% de óleo (cordilheira)
     2  placa      bactérias atravessam faixas de antibiótico (Baym 2016)
     3  variante   um vírus 50% mais transmissível toma conta (Delta, 2021)
     4  enzima     evolução dirigida: 256× em 3 rodadas (Chen & Arnold 1993)
     5  vidros     107 vidros de 16 moscas, 19 gerações (Buri 1956)
     6  paisagem   Moraba scurra: dois picos e uma sela (Lewontin & White 1960)

   Escolhidas na rodada de variantes de 2026-08. Texto escrito para ensino
   médio: sem "desvio", sem "alelo", sem "herdabilidade" — as grandezas
   aparecem em %, mm, dias e gerações. */

import { numero } from "portugues";
import { cordilheira, placa, enzima, ilhas, variante, paisagem } from "./figuras/__pacote__.js";

export const PERGUNTAS = [
  {
    figura: (p, pe) => cordilheira(p, pe, { m0: 4.7, dp: 0.7, h2: 0.15, fracao: 0.2, geracoes: 100, vel: 10, decimais: 1, unidade: "%", passoEixo: 2, plural: "espigas", artigo: "as", adjetivo: "oleosas", rotuloMax: "a espiga mais oleosa de 1896" }),
    pergunta: "Em 1896, em Illinois, o grão de milho tinha 4,7% de óleo — umas espigas mais, outras menos. A cada ano, só as 20% mais oleosas viram semente. Depois de 100 gerações, quanto óleo tem o grão?",
    opcoes: ["Uns 6%: a variação logo se esgota", "Uns 8%: o máximo que já havia em 1896", "Uns 20%: mais que qualquer espiga de 1896"], certa: 2,
    leitura: ({ v, max0 }) => `Chegou a <b>${numero(v, 1)}% de óleo</b>; a espiga mais oleosa da primeira geração tinha ${numero(max0, 1)}%. A variação não se esgota: cada geração cria grãos um pouco mais e menos oleosos que os pais, e a seleção empurra de novo. O experimento de Illinois começou em 1896 e continua até hoje: de 4,7% para uns 20% em cem gerações — e a linha selecionada ao contrário chegou perto de zero.`,
    motivo: "Porque a gente usa evolução há dez mil anos — só não chamava por esse nome.",
    depois: null,
  },
  {
    figura: (p, pe) => placa(p, pe),
    pergunta: "Uma placa de gel com bactérias comuns numa ponta e faixas de antibiótico cada vez mais forte até a outra — a última faixa mata qualquer bactéria comum. Quanto tempo até elas atravessarem a placa inteira?",
    opcoes: ["Nunca: a faixa mais forte mata todas", "Umas duas semanas", "Muitos anos"], certa: 1,
    leitura: (dias) => `Atravessaram em <b>${numero(dias)} dias</b>. Cada vez que a frente parava numa faixa, bastava nascer uma bactéria um pouco mais resistente — e ela nascia, porque são bilhões de divisões. A placa real, de 2016, levou 11 dias. É o mesmo que acontece com um tratamento de antibiótico parado no meio.`,
    motivo: "Porque acontece agora — no hospital, na lavoura, no vírus.",
    depois: "rodar outra placa",
  },
  {
    figura: (p, pe) => variante(p, pe, { inicio: 0.01, rComum: 1.0, rNova: 1.5 }),
    pergunta: "Surge uma variante de um vírus que se espalha 50% mais rápido que a de antes. Hoje ela é 1% dos casos. Em quanto tempo passa a ser a maioria?",
    opcoes: ["Umas 8 semanas", "Uns 2 anos", "Nunca: 1% é pouco demais para competir"], certa: 0,
    leitura: (sem) => `Passou da metade na <b>semana ${sem}</b>. Uma vantagem de 50% por rodada de contágio se multiplica: 1,5 × 1,5 × 1,5… e o 1% vira maioria em dois meses. Foi o que a variante Delta fez em 2021, país por país — e a Ômicron, depois, ainda mais rápido.`,
    motivo: "Porque o noticiário é evolução em tempo real.",
    depois: null,
  },
  {
    figura: (p, pe) => enzima(p, pe, { alvo: 256 }),
    pergunta: "Uma enzima que quase não funciona num solvente industrial. Faça mil cópias do gene com erros ao acaso, teste todas, guarde a melhor e repita. Em quantas rodadas ela fica 250 vezes melhor?",
    opcoes: ["Umas 3", "Umas 300", "Nunca: erro ao acaso só estraga"], certa: 0,
    leitura: ({ r, x }) => `Ficou <b>${numero(x)}× melhor em ${r} rodadas</b>. Quase todo erro estraga — mas entre mil cópias sempre há um que ajuda um pouco, e ele fica guardado para a rodada seguinte. Foi assim que, em 1993, Frances Arnold fez uma enzima 256× melhor em 3 rodadas, com 10 mutações: a "evolução dirigida" que lhe deu o Nobel de 2018. Tire a seleção e veja o que sobra.`,
    motivo: "Porque o acaso sozinho não faz nada — e com seleção faz tudo o que vive.",
    depois: null,
  },
  {
    figura: (p, pe) => ilhas(p, pe, { N: 9, p0: 0.5, geracoes: 19, semente: 1956, n: 107, col: 11, vel: 3, nome: "vidros", a: "só com a versão A", b: "só com a versão B" }),
    pergunta: "Em 1956, Peter Buri pôs 16 moscas em cada um de 107 vidros: metade com uma versão de um gene da cor do olho, metade com a outra — nenhuma delas dá vantagem. Depois de 19 gerações, como estão os vidros?",
    opcoes: ["A maioria ainda meio a meio", "Mais da metade só com uma versão — e metade dos vidros para cada lado", "Todos com a mesma versão"], certa: 1,
    leitura: ({ marca, sem, meio }) => `<b>${marca}</b> vidros ficaram só com a versão A, <b>${sem}</b> só com a B${meio ? ` e ${meio} ainda misturados` : " — nenhum misturado"}. Sem vantagem nenhuma, o sorteio de quem deixa filhotes decide sozinho — e num vidro de 16 moscas, das quais só umas 9 chegam a se reproduzir, decide rápido. No experimento real: 30 vidros de um lado, 28 do outro, 49 ainda misturados.`,
    motivo: "Porque o acaso também decide — e ninguém o enxerga.",
    depois: "sortear de novo",
  },
  {
    figura: (p, pe) => paisagem(p, pe, { N: 2000, Npequeno: 25, geracoes: 36, geracoesPequeno: 300, inicio: [0.08, 0.9] }),
    pergunta: "Numa paisagem assim, quanto mais alto, mais a população sobrevive. A bolinha é a população, na encosta do morro baixo. Para onde a seleção a leva?",
    opcoes: ["Para o morro alto, o melhor lugar", "Para o topo do morro baixo", "Ela fica onde está"], certa: 1,
    leitura: ({ alto }) => `${alto ? "Chegou ao morro alto — deu sorte no caminho." : "Subiu até o <b>topo do morro baixo</b> e parou."} Seleção só sobe, um passo por vez, e não enxerga a paisagem: para chegar ao morro alto seria preciso descer antes. Uma paisagem dessas foi medida de verdade em 1960, num gafanhoto da Austrália, a partir de duas versões de dois cromossomos — e as populações estavam na passagem entre os morros, o que se discute até hoje. Encolha a população: só o acaso atravessa o vale.`,
    motivo: "Porque evolução não é \"o melhor vence\" — é \"o que sobe daqui\".",
    depois: null,
  },
];
