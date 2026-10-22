/* As duas pontas da trilha. O prelúdio pede que o aluno registre o que
   pensa hoje sobre quatro frases que muita gente acha verdade, numa régua
   de discordo a concordo; cada frase é posta à prova por um ou dois dos
   casos. A síntese devolve as frases com o que os casos mostraram e abre a
   porta dos simuladores, cada um com um desafio. As respostas ficam em
   `crencas` (índice da frase → 1 a 5), que a moldura guarda. */

import { criar } from "escrever-html";

const FRASES = [
  { frase: "Evolução leva milhões de anos; não dá para ver acontecendo.", casos: [0, 1],
    resposta: "As bactérias atravessaram a placa em 11 dias, e o focinho do pug encolheu a um terço em pouco mais de um século." },
  { frase: "Quando a gente escolhe os pais a dedo, só muda o que a gente escolheu.", casos: [1],
    resposta: "Os criadores de pug escolheram o focinho curto, e a falta de ar veio junto: hoje, só 1 pug em cada 20 respira sem nenhum sinal do problema." },
  { frase: "Se nenhuma versão de um gene tem vantagem, nada muda.", casos: [2],
    resposta: "Nos vidros de Buri, sem vantagem nenhuma, mais da metade perdeu uma das versões em 19 gerações. Numa população pequena, o sorteio de quem deixa filhos muda tudo sozinho." },
  { frase: "A seleção sempre leva ao melhor resultado possível.", casos: [3],
    resposta: "A seleção só sobe, um passo por vez: a população parou no morro baixo e nunca viu o morro alto. Evolução não é “o melhor vence”, é “o que melhora a partir daqui”." },
];

const REGUA = ["discordo totalmente", "discordo um pouco", "em dúvida", "concordo um pouco", "concordo totalmente"];
const LEMBRANCA = ["você já desconfiava", "você desconfiava um pouco", "você estava em dúvida", "você concordava um pouco", "você concordava"];
const lado = (v) => (!v ? "nada" : v < 3 ? "discordo" : v > 3 ? "concordo" : "duvida");

/* a régua de uma frase: cinco nós numa linha, de discordo a concordo */
function regua(i, crencas) {
  const nos = REGUA.map((nome, k) => {
    const b = criar("button", { type: "button", class: "regua-no", role: "radio", title: nome, "aria-label": nome, "aria-checked": String(crencas.get(i) === k + 1) });
    b.addEventListener("click", () => { crencas.set(i, k + 1); nos.forEach((o) => o.setAttribute("aria-checked", String(o === b))); });
    return b;
  });
  return criar("div", { class: "frase-regua", role: "radiogroup", "aria-label": "o quanto você concorda" },
    criar("span", { class: "regua-ponta", texto: "discordo" }), criar("span", { class: "regua-trilho" }, ...nos), criar("span", { class: "regua-ponta", texto: "concordo" }));
}

const DESAFIOS = [
  { modelo: "selecao-1-locus", nome: "Seleção em um locus", desafio: "Qual é a menor vantagem que ainda vence? E em quanto tempo?" },
  { modelo: "deriva", nome: "Deriva genética", desafio: "Uma população de 10 perde a variação em quantas gerações? E uma de 1.000?" },
  { modelo: "hardy-weinberg", nome: "Equilíbrio de Hardy–Weinberg", desafio: "O que acontece com uma população quando nenhuma força age?" },
];

/** crencas: Map; perguntas: PERGUNTAS; aoComecar() */
export function preludio(coluna, palco, { crencas, perguntas, aoComecar }) {
  const comecar = criar("button", { type: "button", class: "vivo-elo", texto: "começar pela pergunta 1 →" });
  comecar.addEventListener("click", aoComecar);
  coluna.replaceChildren(
    criar("p", { class: "pergunta-texto", texto: "Antes dos casos: o que você pensa hoje?" }),
    criar("p", { class: "vivo-texto", texto: "Quatro frases que muita gente acha verdade, inclusive quem estuda biologia. Marque o quanto você concorda: não vale nota, é só para registrar a sua intuição." }),
    criar("p", { class: "vivo-texto", texto: "Depois vêm quatro casos reais. Em cada um você aposta, um modelo roda na hora e mostra o que acontece. No fim, a gente volta a estas frases." }),
    criar("div", { class: "vivo-acoes" }, comecar));
  palco.replaceChildren(criar("ol", { class: "frases" }, ...FRASES.map((f, i) =>
    criar("li", { class: "frase frase-com-votos" }, criar("p", { class: "frase-texto", texto: f.frase }), regua(i, crencas)))));
}

/** perguntas: PERGUNTAS; feitas, acertos: Sets de índices; crencas: Map; abrir(k) */
export function sintese(coluna, palco, { perguntas, feitas, acertos, crencas, abrir }) {
  const n = feitas.size, faltam = perguntas.length - n;
  const placar = n === 0 ? "Você ainda não apostou em nenhum caso."
    : `Você chegou perto em <b>${acertos.size} de ${n}</b> ${n === 1 ? "aposta" : "apostas"}` + (faltam ? `; faltam ${faltam} ${faltam === 1 ? "caso" : "casos"}.` : ".");
  coluna.replaceChildren(
    criar("p", { class: "pergunta-texto", html: placar }),
    criar("p", { class: "vivo-texto", html:
      "Os quatro casos se explicam com três ingredientes: a <b>mutação</b>, que cria variação ao acaso; a <b>seleção</b>, que favorece quem deixa mais filhos; " +
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
          criar("span", { class: "frase-voto-dado", "data-voto": lado(voto), texto: voto ? LEMBRANCA[voto - 1] : "você não marcou" }),
          criar("span", { texto: " · rever: " }), ...casos.flatMap((b, j) => (j ? [criar("span", { texto: " · " }), b] : [b]))));
    })));
}
