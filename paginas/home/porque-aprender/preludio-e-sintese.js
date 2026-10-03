/* As duas pontas da trilha. O prelúdio pede que o aluno registre o que
   pensa hoje sobre quatro frases que muita gente acha verdade; cada uma é
   posta à prova por alguns dos sete casos. A síntese devolve as frases com
   o que os casos mostraram e abre a porta dos simuladores, cada um com um
   desafio. As respostas ficam em `crencas` (índice da frase → "concordo" |
   "discordo"), que a moldura guarda. */

import { criar } from "escrever-html";

const FRASES = [
  { frase: "Evolução leva milhões de anos; não dá para ver acontecendo.", casos: [1, 2, 0],
    resposta: "As bactérias atravessaram a placa em 11 dias, a variante Delta virou maioria em uns dois meses e o milho de Illinois quadruplicou o óleo em cem anos de lavoura." },
  { frase: "Uma característica nova aparece porque o organismo precisa dela.", casos: [4, 3],
    resposta: "As mudanças no gene surgem ao acaso, e quase todas atrapalham: na enzima, só umas poucas cópias em mil ajudavam. E as elefantas sem presa já nasciam antes da guerra; a caça não as criou, só tirou as outras do caminho." },
  { frase: "Se nenhuma versão de um gene tem vantagem, nada muda.", casos: [5],
    resposta: "Nos vidros de Buri, sem vantagem nenhuma, mais da metade perdeu uma das versões em 19 gerações. Numa população pequena, o sorteio de quem deixa filhos muda tudo sozinho." },
  { frase: "A seleção sempre leva ao melhor resultado possível.", casos: [6],
    resposta: "A seleção só sobe, um passo por vez: a população parou no morro baixo e nunca viu o morro alto. Evolução não é “o melhor vence”, é “o que melhora a partir daqui”." },
];

const DESAFIOS = [
  { modelo: "selecao-1-locus", nome: "Seleção em um locus", desafio: "Qual é a menor vantagem que ainda vence? E em quanto tempo?" },
  { modelo: "deriva", nome: "Deriva genética", desafio: "Uma população de 10 perde a variação em quantas gerações? E uma de 1.000?" },
  { modelo: "hardy-weinberg", nome: "Equilíbrio de Hardy–Weinberg", desafio: "O que acontece com uma população quando nenhuma força age?" },
];

const nomesDosCasos = (perguntas, casos) => casos.map((k) => perguntas[k].titulo).join(" · ");

/** crencas: Map; perguntas: PERGUNTAS; aoComecar() */
export function preludio(coluna, palco, { crencas, perguntas, aoComecar }) {
  const comecar = criar("button", { type: "button", class: "vivo-elo", texto: "começar pela pergunta 1 →" });
  comecar.addEventListener("click", aoComecar);
  coluna.replaceChildren(
    criar("p", { class: "pergunta-texto", texto: "Antes dos casos: o que você pensa hoje?" }),
    criar("p", { class: "vivo-texto", texto: "Quatro frases que muita gente acha verdade, inclusive quem estuda biologia. Marque se concorda ou discorda: não vale nota, é só para registrar a sua intuição." }),
    criar("p", { class: "vivo-texto", texto: "Depois vêm sete casos reais. Em cada um você aposta, um modelo roda na hora e mostra o que acontece. No fim, a gente volta a estas frases." }),
    criar("div", { class: "vivo-acoes" }, comecar));
  palco.replaceChildren(criar("ol", { class: "frases" }, ...FRASES.map((f, i) => {
    const botoes = ["concordo", "discordo"].map((v) => {
      const b = criar("button", { type: "button", class: "frase-voto", texto: v, "aria-pressed": String(crencas.get(i) === v) });
      b.addEventListener("click", () => { crencas.set(i, v); botoes.forEach((o) => o.setAttribute("aria-pressed", String(o === b))); });
      return b;
    });
    return criar("li", { class: "frase frase-com-votos" },
      criar("p", { class: "frase-texto", texto: f.frase }),
      criar("div", { class: "frase-votos" }, ...botoes),
      criar("p", { class: "frase-casos", texto: `posta à prova em: ${nomesDosCasos(perguntas, f.casos)}` }));
  })));
}

/** perguntas: PERGUNTAS; feitas, acertos: Sets de índices; crencas: Map; abrir(k) */
export function sintese(coluna, palco, { perguntas, feitas, acertos, crencas, abrir }) {
  const n = feitas.size, faltam = perguntas.length - n;
  const placar = n === 0 ? "Você ainda não apostou em nenhum caso."
    : `Você chegou perto em <b>${acertos.size} de ${n}</b> ${n === 1 ? "aposta" : "apostas"}` + (faltam ? `; faltam ${faltam} ${faltam === 1 ? "caso" : "casos"}.` : ".");
  coluna.replaceChildren(
    criar("p", { class: "pergunta-texto", html: placar }),
    criar("p", { class: "vivo-texto", html:
      "Os sete casos se explicam com três ingredientes: a <b>mutação</b>, que cria variação ao acaso; a <b>seleção</b>, que favorece quem deixa mais filhos; " +
      "e a <b>deriva</b>, o sorteio de quem deixa filhos. Nos simuladores, quem controla cada um é você:" }),
    criar("ul", { class: "desafios" }, ...DESAFIOS.map((d) => criar("li", {},
      criar("a", { href: `simulador.html?modelo=${d.modelo}` }, criar("span", { class: "desafio-nome", texto: `${d.nome} →` }), criar("span", { class: "desafio-texto", texto: d.desafio }))))),
    criar("div", { class: "vivo-acoes" }, criar("a", { class: "vivo-elo", href: "catalogo.html", texto: "ver todos os simuladores →" })));
  palco.replaceChildren(
    criar("p", { class: "porque-kicker", texto: "As frases do começo" }),
    criar("ol", { class: "frases" }, ...FRASES.map((f, i) => {
      const voto = crencas.get(i);
      const casos = f.casos.map((k) => { const b = criar("button", { type: "button", class: "grade-caso", texto: perguntas[k].titulo }); b.addEventListener("click", () => abrir(k)); return b; });
      return criar("li", { class: "frase" },
        criar("p", { class: "frase-texto", texto: f.frase }),
        criar("p", { class: "frase-resposta" }, criar("b", { texto: "Não é bem assim." }), criar("span", { texto: ` ${f.resposta}` })),
        criar("p", { class: "frase-casos" },
          criar("span", { class: "frase-voto-dado", "data-voto": voto || "nada", texto: voto === "discordo" ? "você já desconfiava" : voto === "concordo" ? "você concordava" : "você não marcou" }),
          criar("span", { texto: " · rever: " }), ...casos.flatMap((b, j) => (j ? [criar("span", { texto: " · " }), b] : [b]))));
    })));
}
