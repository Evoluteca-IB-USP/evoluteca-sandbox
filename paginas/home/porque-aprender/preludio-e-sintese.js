/* A abertura registra opiniões numa régua de cinco pontos.
   O encerramento retoma as frases e apresenta os simuladores. */

import { criar } from "escrever-html";

const FRASES = [
  { frase: "A evolução é lenta demais para ser observada.", casos: [0, 1],
    titulo: "Algumas mudanças acontecem depressa.",
    resposta: "Na placa, bactérias resistentes se espalharam em poucos dias. Nos cães, a mudança no focinho aconteceu ao longo de várias gerações." },
  { frase: "Escolher as melhores características produz um organismo melhor como um todo.", casos: [1],
    titulo: "Melhorar uma característica pode prejudicar outra.",
    resposta: "Nos pugs, os criadores favoreceram o focinho curto por considerá-lo mais bonito. Essa escolha mudou a aparência, mas também dificultou a respiração. O que é desejável em uma característica pode trazer prejuízos ao conjunto." },
  { frase: "Uma característica pode se espalhar mesmo sem trazer vantagem.", casos: [2],
    titulo: "O acaso também muda uma população.",
    resposta: "Mesmo sem dar vantagem, uma das versões da cor dos olhos pode se tornar a única entre as moscas de um vidro. Isso depende de quais moscas deixam descendentes." },
  { frase: "A evolução sempre leva à melhor adaptação possível ao ambiente.", casos: [3],
    titulo: "O caminho limita aonde a população pode chegar.",
    resposta: "No modelo dos morros, a população pode parar no topo mais baixo, embora o outro permita sobreviver melhor no mesmo ambiente. Para chegar lá, teria de atravessar um vale onde sobreviveria pior. Favorecer mudanças vantajosas a cada passo não garante chegar à melhor combinação possível." },
];

const DESAFIOS = [
  { modelo: "selecao-1-locus", nome: "Seleção em um locus", desafio: "Uma pequena vantagem pode se espalhar pelo grupo? Quanto tempo isso leva?" },
  { modelo: "deriva", nome: "Deriva genética", desafio: "O acaso tem o mesmo efeito em grupos de 10 e de 1.000 indivíduos?" },
  { modelo: "hardy-weinberg", nome: "Equilíbrio de Hardy–Weinberg", desafio: "Como as características dos pais se combinam nos filhos?" },
];

const REGUA = ["discordo totalmente", "discordo um pouco", "em dúvida", "concordo um pouco", "concordo totalmente"];
const LEMBRANCA = ["você discordava", "você discordava um pouco", "você estava em dúvida", "você concordava um pouco", "você concordava"];
const lado = (v) => (!v ? "nada" : v < 3 ? "discordo" : v > 3 ? "concordo" : "duvida");

function regua(i, crencas) {
  const nos = REGUA.map((nome, k) => {
    const b = criar("button", { type: "button", class: "regua-no", role: "radio", title: nome, "aria-label": nome, "aria-checked": String(crencas.get(i) === k + 1) });
    b.addEventListener("click", () => { crencas.set(i, k + 1); nos.forEach((o) => o.setAttribute("aria-checked", String(o === b))); });
    return b;
  });
  return criar("div", { class: "frase-regua", role: "radiogroup", "aria-label": "o quanto você concorda" },
    criar("span", { class: "regua-ponta", texto: "discordo" }), criar("span", { class: "regua-trilho" }, ...nos), criar("span", { class: "regua-ponta", texto: "concordo" }));
}

/** crencas: Map; perguntas: PERGUNTAS; aoComecar() */
export function preludio(coluna, palco, { crencas, perguntas, aoComecar }) {
  const comecar = criar("button", { type: "button", class: "vivo-elo", texto: "Começar pelos casos →" });
  comecar.addEventListener("click", aoComecar);
  coluna.replaceChildren(
    criar("h3", { class: "pergunta-texto preludio-titulo", texto: "O que você acha?" }),
    criar("p", { class: "vivo-texto preludio-instrucao", texto: "Marque o quanto concorda com cada frase. Vamos retomar suas respostas depois dos casos." }));
  palco.replaceChildren(
    criar("ol", { class: "frases" }, ...FRASES.map((f, i) =>
      criar("li", { class: "frase frase-com-votos" }, criar("p", { class: "frase-texto", texto: f.frase }), regua(i, crencas)))),
    criar("div", { class: "vivo-acoes preludio-continuar" }, comecar));
}

/** perguntas: PERGUNTAS; feitas, acertos: Sets de índices; crencas: Map; abrir(k) */
export function sintese(coluna, palco, { perguntas, feitas, acertos, crencas, abrir }) {
  const n = feitas.size, faltam = perguntas.length - n;
  const placar = n === 0 ? "Você ainda não apostou em nenhum caso."
    : `Você chegou perto em <b>${acertos.size} de ${n}</b> ${n === 1 ? "aposta" : "apostas"}` + (faltam ? `; faltam ${faltam} ${faltam === 1 ? "caso" : "casos"}.` : ".");
  coluna.replaceChildren(
    criar("p", { class: "pergunta-texto", html: placar }),
    criar("p", { class: "vivo-texto", html:
      "Evolução é a mudança das características herdadas em uma população ao longo das gerações. Nos simuladores, você pode mudar as condições e observar o que acontece:" }),
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
        criar("p", { class: "frase-resposta" }, criar("b", { texto: f.titulo }), criar("span", { texto: ` ${f.resposta}` })),
        criar("p", { class: "frase-casos" },
          criar("span", { class: "frase-voto-dado", "data-voto": lado(voto), texto: voto ? LEMBRANCA[voto - 1] : "você não marcou" }),
          criar("span", { texto: " · rever: " }), ...casos.flatMap((b, j) => (j ? [criar("span", { texto: " · " }), b] : [b]))));
    })));
}
