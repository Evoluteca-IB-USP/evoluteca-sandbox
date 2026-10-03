/* As sete apostas, todas sobre casos reais da biologia. A dinâmica é sempre
   a mesma: leia a pergunta, aposte, veja o modelo rodar de verdade e receba
   um motivo. Nenhuma figura é pictograma nem gráfico de linha. A aposta
   nunca é uma lista de opções, que entregaria a resposta pelo formato: é
   um valor contínuo, ou um gesto na própria figura. `comparar` diz o que
   o modelo mediu, na unidade da aposta, e se a aposta chegou perto.

     1  milho      Illinois, 1896–hoje: 4,7% → ~20% de óleo (cordilheira)
     2  placa      bactérias atravessam faixas de antibiótico (Baym 2016)
     3  variante   um vírus 50% mais transmissível toma conta (Delta, 2021)
     4  elefantas  Gorongosa, 1977–1992: 18% → 51% sem presa (Campbell-Staton 2021)
     5  enzima     evolução dirigida: 256× em 3 rodadas (Chen & Arnold 1993)
     6  vidros     107 vidros de 16 moscas, 19 gerações (Buri 1956)
     7  paisagem   Moraba scurra: dois picos e uma sela (Lewontin & White 1960)

   Escolhidas na rodada de variantes de 2026-08; as figuras da variante, da
   enzima e dos vidros e a pergunta das elefantas, na de 2026-10. Texto escrito para ensino
   médio: sem "desvio", sem "alelo", sem "herdabilidade" — as grandezas
   aparecem em %, mm, dias e gerações. */

import { numero } from "portugues";
import { reguaLogaritmica, MARCAS_DE_TEMPO, tempo, elefantasParaPintar, barraDeVidros, apostaNaFigura } from "./apostas/__pacote__.js";
import { cordilheira, placa, mosaico, manada, placaDePocos, confete, paisagem } from "./figuras/__pacote__.js";

const dobro = (a, m) => a !== Infinity && Math.max(a / m, m / a) <= 2;     // tempo e rodadas: perto é até 2× para mais ou para menos
const reguaDeTempo = (aoApostar) => reguaLogaritmica({ min: 1, max: 36500, marcas: MARCAS_DE_TEMPO, formatar: tempo, aoApostar });

export const PERGUNTAS = [
  {
    titulo: "Milho de Illinois",
    forcas: ["mutacao", "selecao"],
    figura: (p, pe) => cordilheira(p, pe, { m0: 4.7, dp: 0.7, h2: 0.15, fracao: 0.2, geracoes: 100, vel: 10, decimais: 1, unidade: "%", passoEixo: 2, plural: "espigas", artigo: "as", adjetivo: "oleosas", rotuloMax: "a espiga mais oleosa de 1896", escalaAposta: [0, 30] }),
    pergunta: "Em 1896, em Illinois, o grão de milho tinha 4,7% de óleo — umas espigas mais, outras menos. A cada ano, só as 20% mais oleosas viram semente. Depois de 100 gerações, quanto óleo tem o grão?",
    aposta: ({ figura, aoApostar }) => {
      const a = apostaNaFigura({ instrucao: "<em>Arraste a curva clara</em> na figura até onde você acha que ela estará depois de 100 gerações.", formatar: (v) => `${numero(v, 1)}%`, aoApostar });
      figura.aposta(a.mudou);
      return a;
    },
    comparar: (a, { v }) => ({ modelo: v, perto: Math.abs(a - v) <= 3 }),
    leitura: ({ v, max0 }) => `Chegou a <b>${numero(v, 1)}% de óleo</b>; a espiga mais oleosa da primeira geração tinha ${numero(max0, 1)}%. A variação não se esgota: cada geração cria grãos um pouco mais e menos oleosos que os pais, e a seleção empurra de novo. O experimento de Illinois começou em 1896 e continua até hoje: de 4,7% para uns 20% em cem gerações — e a linha selecionada ao contrário chegou perto de zero.`,
    motivo: "Porque a gente usa evolução há dez mil anos — só não chamava por esse nome.",
    depois: null,
  },
  {
    titulo: "Placa de antibiótico",
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
    titulo: "Variante do vírus",
    forcas: ["selecao"],
    figura: (p, pe) => mosaico(p, pe, { inicio: 0.01, rComum: 1.0, rNova: 1.5 }),
    pergunta: "Surge uma variante de um vírus que se espalha 50% mais rápido que a de antes. Hoje ela é 1% dos casos. Em quanto tempo passa a ser a maioria?",
    aposta: ({ aoApostar }) => reguaDeTempo(aoApostar),
    comparar: (a, sem) => ({ modelo: 7 * sem, perto: dobro(a, 7 * sem) }),
    leitura: (sem) => `Passou da metade na <b>semana ${sem}</b>. Uma vantagem de 50% por rodada de contágio se multiplica: 1,5 × 1,5 × 1,5… e o 1% vira maioria em dois meses. Foi o que a variante Delta fez em 2021, país por país — e a Ômicron, depois, ainda mais rápido.`,
    motivo: "Porque o noticiário é evolução em tempo real.",
    depois: null,
  },
  {
    titulo: "Elefantas sem presa",
    forcas: ["selecao"],
    figura: (p, pe) => manada(p, pe),
    pergunta: "Em Gorongosa, Moçambique, 18% das elefantas nasciam sem presas. Na guerra civil (1977–1992), caçadores mataram 9 em cada 10 elefantes atrás do marfim — e quem não tinha presa quase sempre escapava. Das elefantas que sobraram, quantas não tinham presa?",
    aposta: ({ aoApostar }) => elefantasParaPintar({ aoApostar }),
    comparar: (a, { sem, com }) => { const pct = 100 * sem / (sem + com); return { modelo: pct, perto: Math.abs(a - pct / 10) <= 1 }; },
    leitura: ({ sem, com }) => `Das <b>${sem + com}</b> que sobraram, <b>${numero(100 * sem / (sem + com))}% não têm presa</b>. Ninguém criou elefantas sem presa: elas já existiam, e a caça só tirou as outras do caminho. Em Gorongosa, contadas depois da guerra, eram 51% — e entre as filhas nascidas depois, cerca de um terço já nasce sem presa.`,
    motivo: "Porque a gente também seleciona — mesmo sem querer.",
    depois: null,
  },
  {
    titulo: "Enzima no solvente",
    forcas: ["mutacao", "selecao"],
    figura: (p, pe) => placaDePocos(p, pe, { alvo: 256 }),
    pergunta: "Uma enzima que quase não funciona num solvente industrial. Faça mil cópias do gene com erros ao acaso, teste todas, guarde a melhor e repita. Em quantas rodadas ela fica 250 vezes melhor?",
    aposta: ({ aoApostar }) => reguaLogaritmica({ min: 1, max: 1000, marcas: [[1, "1 rodada"], [10, "10"], [100, "100"], [1000, "1.000"]], formatar: (r) => (Math.round(r) === 1 ? "1 rodada" : `${numero(Math.round(r))} rodadas`), aoApostar }),
    comparar: (a, { r }) => ({ modelo: r, perto: dobro(a, r) }),
    leitura: ({ r, x }) => `Ficou <b>${numero(x)}× melhor em ${r} rodadas</b>. Quase todo erro estraga — mas entre mil cópias sempre há um que ajuda um pouco, e ele fica guardado para a rodada seguinte. Foi assim que, em 1993, Frances Arnold fez uma enzima 256× melhor em 3 rodadas, com 10 mutações: a "evolução dirigida" que lhe deu o Nobel de 2018. Tire a seleção e veja o que sobra.`,
    motivo: "Porque o acaso sozinho não faz nada — e com seleção faz tudo o que vive.",
    depois: null,
  },
  {
    titulo: "Vidros de moscas",
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
    titulo: "Morros e vales",
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
