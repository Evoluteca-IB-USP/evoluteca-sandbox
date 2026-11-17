/* A página da sala (sala.html): sem link, mostra a porta (entrada-da-sala.js);
   com link, entra como professor (se a conexão
   guardada é do mesmo Worker) ou como aluno (pede o nome) e entrega a tela a
   uma das duas vistas. Blocos, estado e mensagens: servidor/AULA.md. */

import { criar } from "escrever-html";
import { lerLink } from "./link-da-sala.js";
import { lerConexao, hostDaConexao } from "./conexao.js";
import { entrarNaSala, abrirSocket } from "./cliente-da-sala.js";
import { iniciarVistaDoProfessor } from "./vista-do-professor.js";
import { iniciarVistaDoAluno } from "./vista-do-aluno.js";
import { montarEntrada } from "./entrada-da-sala.js";

const CHAVE_DO_NOME = "evoluteca:salas:nome";
const aviso = (texto) => criar("p", { class: "aviso", texto });
/* o cartão no meio da tela: entrar, esperar, dar errado */
const cartao = (titulo, ...filhos) => criar("div", { class: "sala-entrada" },
  criar("div", { class: "prof-cartao sala-entrada-cartao" }, criar("p", { class: "aula-rotulo", texto: "Evoluteca · sala de aula" }), criar("h1", { class: "aula-titulo", html: `${titulo}<span>.</span>` }), ...filhos));

export function montarSala(raiz) {
  if (!location.hash.replace(/^#/, "")) {
    montarEntrada(raiz, (link) => { location.hash = `${link.host}/${link.sala}/${link.convite}`; montarSala(raiz); });
    return;
  }
  const caixa = criar("div", { class: "container sala" });
  raiz.replaceChildren(caixa);
  const link = lerLink(location.hash);
  if (!link) {
    caixa.append(cartao("Link de sala inválido",
      criar("p", {}, "O link parece incompleto. Peça a quem abriu a sala que mande de novo, ou ", criar("a", { href: "sala.html", texto: "volte para a entrada" }), ".")));
    return;
  }
  /* localhost é o Worker rodando no `npx wrangler dev` (servidor/sala-do-professor/wrangler.toml), sem https */
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(link.host);
  const endereco = `${local ? "http" : "https"}://${link.host}`;
  const conexao = lerConexao();
  if (conexao && hostDaConexao(conexao) === link.host) {
    entrar(caixa, { endereco, link, segredo: conexao.segredo, nome: "Professor", conexao });
  } else {
    pedirNome(caixa, (nome) => entrar(caixa, { endereco, link, nome }));
  }
}

function pedirNome(caixa, aoEscolher) {
  const nome = criar("input", { type: "text", class: "sala-campo", maxlength: "60", autocomplete: "given-name", placeholder: "Como o professor vai te ver", value: localStorage.getItem(CHAVE_DO_NOME) ?? "" });
  const entrarBotao = criar("button", { type: "submit", class: "botao botao-primario", texto: "Entrar na sala" });
  const formulario = criar("form", {}, criar("label", { class: "prof-campo" }, criar("span", { texto: "Seu nome" }), nome), entrarBotao);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!nome.value.trim()) return;
    localStorage.setItem(CHAVE_DO_NOME, nome.value.trim());
    aoEscolher(nome.value.trim());
  });
  caixa.replaceChildren(cartao("Entrar na sala", criar("p", { class: "nota", texto: "Você vai acompanhar a aula por aqui: o professor abre os blocos e você responde." }), formulario));
  requestAnimationFrame(() => nome.focus());
}

async function entrar(caixa, { endereco, link, nome, segredo, conexao }) {
  caixa.replaceChildren(cartao("Entrando na sala", criar("p", { class: "nota", texto: "Só um instante…" })));
  /* o aluno que recarrega a página continua o mesmo participante (mesmos envios e mesmo grupo) */
  const chaveDoParticipante = `evoluteca:salas:participante:${link.sala}`;
  let entrada;
  try {
    entrada = await entrarNaSala({ endereco, sala: link.sala, convite: link.convite, nome, segredo, participante: segredo ? undefined : localStorage.getItem(chaveDoParticipante) ?? undefined });
  } catch (e) {
    caixa.replaceChildren(cartao("Não deu para entrar", aviso(`${e.message}. Confira o link e a internet, ou peça a quem abriu a sala que confirme que ela está no ar.`)));
    return;
  }
  if (entrada.papel === "aluno") localStorage.setItem(chaveDoParticipante, entrada.participante);
  entrada.nome = nome;
  const sessao = { sala: null, desvio: 0, participantes: [], envios: [], resultados: {}, conectado: false };
  const socket = abrirSocket({ endereco, sala: link.sala, bilhete: entrada.bilhete });
  const vista = (entrada.papel === "professor" ? iniciarVistaDoProfessor : iniciarVistaDoAluno)(caixa, { sessao, socket, entrada, link, conexao });

  socket.aoMudar((conectado) => { sessao.conectado = conectado; vista.aoConexao(); });
  socket.aoReceber((m) => {
    if (m.tipo === "estado") { sessao.sala = m.sala; if (Number.isFinite(m.agora)) sessao.desvio = m.agora - Date.now(); }
    else if (m.tipo === "presenca") sessao.participantes = m.participantes;
    else if (m.tipo === "envios") sessao.envios = m.lista;
    else if (m.tipo === "envio") sessao.envios = [...sessao.envios.filter((e) => e.id !== m.envio.id), m.envio];
    else if (m.tipo === "resultados") sessao.resultados[m.bloco] = m.lista;
    vista.aoMensagem(m);
  });
}
