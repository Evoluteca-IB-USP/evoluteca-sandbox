/* As quatro apostas: situações da biologia e um modelo de paisagem. A dinâmica é sempre
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
    pergunta: "Bactérias crescem numa placa de gel. Para chegar ao outro lado, precisam passar por faixas com doses cada vez maiores de antibiótico, uma substância que pode matá-las. Quanto tempo você acha que elas levam para atravessar?",
    aposta: ({ aoApostar }) => reguaDeTempo(aoApostar),
    comparar: (a, dias) => ({ modelo: dias, perto: dobro(a, dias) }),
    leitura: (dias) => `Nesta simulação, as bactérias atravessaram em <b>${numero(dias)} dias</b>. Ao se reproduzir, elas podem gerar descendentes com diferenças. Alguns resistem melhor ao antibiótico e continuam se multiplicando onde os outros morrem.`,
    motivo: "A evolução pode acontecer enquanto a gente observa.",
    depois: "rodar outra placa",
  },
  {
    titulo: "Um cão campeão",
    forcas: ["selecao"],
    figura: (p, pe) => focinhos(p, pe, { inicio: 1880, anosPorGeracao: 4, geracoes: 35 }),
    pergunta: "Por muitos anos, criadores cruzaram pugs de focinho curto para ter filhotes parecidos com eles. Veja o cão de 1880. Como você imagina o focinho em 2020? E quantos de cada 20 pugs terão dificuldade para respirar?",
    aposta: ({ figura, aoApostar }) => focinhoEFolego({ figura, inicio: 6, aoApostar }),
    comparar: (a, { focinho, doentes }) => ({ modelo: { focinho, doentes }, perto: Math.abs(a.focinho - focinho) <= 0.04 && Math.abs(a.doentes - doentes) <= 3 }),
    leitura: ({ focinho, focinho0, doentes }) => `Na simulação, o focinho passou de ${numero(100 * focinho0)}% para <b>${numero(100 * focinho, focinho < 0.1 ? 1 : 0)}% do comprimento do crânio</b>, e <b>${doentes} de cada 20 pugs</b> ficaram com dificuldade para respirar. O focinho mais curto deixa menos espaço para a passagem do ar. Escolher a aparência dos filhotes também pode afetar a saúde deles.`,
    motivo: "Uma mudança na aparência pode vir acompanhada de outras mudanças.",
    depois: null,
  },
  {
    titulo: "107 vidros",
    forcas: ["deriva"],
    figura: (p, pe) => confete(p, pe, { N: 9, p0: 0.5, geracoes: 19, semente: 1956, n: 107 }),
    pergunta: "Em 107 vidros com poucas moscas, duas versões de uma informação herdada dos pais, ligada à cor dos olhos, começam igualmente comuns. Nenhuma dá vantagem. Após 19 gerações, quantos vidros terão só uma versão? Uma geração é a passagem dos pais para os filhos.",
    aposta: ({ aoApostar }) => barraDeVidros({ n: 107, aoApostar }),
    comparar: (a, real) => ({ modelo: real, perto: Math.abs(a.sem + a.marca - real.sem - real.marca) <= 15 }),
    leitura: ({ marca, sem, meio }) => `<b>${marca + sem} vidros</b> terminaram com uma única versão e <b>${meio}</b> continuaram com as duas. Isso aconteceu sem que uma versão desse vantagem. Por acaso, algumas moscas deixam mais descendentes que outras. Em grupos pequenos, esse efeito pode fazer uma versão desaparecer.`,
    motivo: "Uma característica pode se espalhar por acaso.",
    depois: "sortear de novo",
  },
  {
    titulo: "Dois morros",
    forcas: ["selecao", "deriva"],
    figura: (p, pe) => paisagem(p, pe, { N: 2000, Npequeno: 25, geracoes: 36, geracoesPequeno: 300, inicio: [0.08, 0.9] }),
    pergunta: "Imagine um grupo de animais, representado pela bolinha. Os morros são um desenho das possibilidades: quanto mais alto, maior a chance de sobreviver e deixar filhotes. A cada geração, mudanças que ajudam nisso tendem a se espalhar. Onde você acha que a bolinha vai parar?",
    aposta: ({ figura, aoApostar }) => {
      const a = apostaNaFigura({ instrucao: "<em>Clique na paisagem</em> onde você acha que a população vai parar.", formatar: figura.lugar, aoApostar });
      figura.aposta(a.mudou);
      return a;
    },
    comparar: (a, { ponto }) => ({ modelo: ponto, perto: Math.hypot(a[0] - ponto[0], a[1] - ponto[1]) <= 0.12 }),
    leitura: ({ alto }) => `${alto ? "A bolinha chegou ao morro mais alto. O acaso ajudou a atravessar o vale." : "A bolinha chegou ao <b>topo do morro mais baixo</b>."} Neste modelo, a seleção natural favorece mudanças que aumentam a chance de sobreviver e deixar filhotes. Ela não antecipa o futuro: para alcançar o outro topo, seria preciso passar antes por condições piores. Experimente diminuir o grupo para ver o efeito do acaso.`,
    motivo: "Uma mudança vantajosa agora não garante o melhor resultado possível.",
    depois: null,
  },
];
