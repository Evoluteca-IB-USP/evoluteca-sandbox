/* A porta da sala de aula (sala.html sem link), no molde do banner do
   catálogo: o título, duas frases que dizem o que é a sala, o aluno colando
   o link numa frase (o campo é uma trajetória que se completa,
   campo-com-trajetoria.js) e, embaixo, uma linha pequena para o professor
   entrar pelo Cloudflare.
   No lugar da urna, a turma brinca de telefone sem fio (telefone-sem-fio.js). */

import { criar } from "escrever-html";
import { ENDERECO_DA_API } from "./configuracao.js";
import { lerConexao, esquecerConexao, hostDaConexao } from "./conexao.js";
import { lerLink } from "./link-da-sala.js";
import { tituloEmVarredura } from "../catalogo/titulo-em-varredura.js";
import { campoComTrajetoria } from "./campo-com-trajetoria.js";
import { telefoneSemFio } from "./telefone-sem-fio.js";

export const CHAVE_DO_AVISO = "evoluteca:salas:aviso"; // um erro que sobrevive à troca de página

export const MENSAGENS_DE_ERRO = {
  estado: "A volta do Cloudflare demorou demais. Tente entrar de novo.",
  negado: "Você não autorizou a entrada no Cloudflare.",
  oauth: "O Cloudflare recusou a entrada.",
  sem_codigo: "O Cloudflare não devolveu o código de autorização.",
  troca_do_codigo: "Não foi possível trocar o código pelo acesso ao Cloudflare.",
  sem_conta: "Esse login do Cloudflare não tem nenhuma conta.",
  implantacao: "Não foi possível instalar as salas na sua conta.",
  resposta_invalida: "A resposta do Cloudflare veio ilegível.",
  sessao: "Sua sessão terminou. Entre de novo com o Cloudflare.",
};

/* aceita o link inteiro ou só o que vem depois do # */
function lerLinkColado(texto) {
  const limpo = texto.trim();
  return lerLink(limpo.includes("#") ? limpo.slice(limpo.indexOf("#")) : limpo);
}

/* o que é a sala, logo abaixo do título; os desenhos repetem o professor e o aluno da roda ao lado */
function apresentacao() {
  const desenho = (quem) => criar("i", { class: `porta-desenho porta-desenho-${quem}`, "aria-hidden": "true" });
  return criar("p", { class: "porta-apresenta" },
    criar("b", { texto: "Uma aula ao vivo com os simuladores." }),
    " O professor", desenho("professor"), " escolhe um simulador ou faz uma pergunta, cada aluno", desenho("aluno"),
    " responde no seu computador e os resultados da turma inteira aparecem juntos.");
}

function ladoDoAluno(aoEntrar) {
  const { caixa, campo } = campoComTrajetoria({ semente: 11, placeholder: "aqui", "aria-label": "Link da sala",
    medir: (v) => ({ parte: v.trim().length / 70, serve: !!lerLinkColado(v) }) });
  const erro = criar("p", { class: "porta-erro", "aria-live": "polite" });
  const formulario = criar("form", { class: "porta-aluno" },
    criar("label", { class: "busca" }, criar("span", { class: "busca-frase", texto: "Cole o link que o professor mandou" }), caixa), erro);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const link = lerLinkColado(campo.value);
    if (link) return aoEntrar(link);
    if (campo.value.trim()) erro.textContent = "Esse link não parece de uma sala. Confira se copiou ele inteiro.";
  });
  /* não há botão: o link colado entra sozinho, depois que a trajetória se completa; Enter também envia */
  campo.addEventListener("input", (evento) => {
    erro.textContent = "";
    if (/^insertFrom(Paste|Drop)$/.test(evento.inputType)) setTimeout(() => formulario.requestSubmit(), lerLinkColado(campo.value) ? 600 : 0);
  });
  return formulario;
}

/* o "?": o que é o Cloudflare, como se entra, o que dá para fazer e o custo */
function ajudaDoProfessor() {
  const balao = criar("div", { class: "porta-balao", id: "porta-ajuda", role: "note", hidden: true },
    criar("p", {}, criar("b", { texto: "O que é. " }), "O Cloudflare é um serviço que hospeda programas na internet."),
    criar("p", {}, criar("b", { texto: "Como entrar. " }), "Você entra na sua conta Cloudflare, ou cria uma, e autoriza a Evoluteca a instalar nela o programa das salas."),
    criar("p", {}, criar("b", { texto: "O que dá para fazer. " }), "Montar aulas com simuladores e perguntas, abrir salas para a turma e ver as respostas chegando. Tudo fica guardado na sua conta."),
    criar("p", {}, criar("b", { texto: "Custo. " }), "Nenhum: o plano gratuito do Cloudflare basta."));
  const botao = criar("button", { type: "button", class: "porta-ajuda", "aria-label": "O que é o Cloudflare", "aria-expanded": "false", "aria-controls": "porta-ajuda", texto: "?" });
  const alternar = (abrir) => {
    balao.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    if (abrir) balao.style.setProperty("--seta", `${botao.offsetLeft + botao.offsetWidth / 2 - 6}px`);
  };
  botao.addEventListener("click", () => alternar(balao.hidden));
  document.addEventListener("click", (e) => { if (!balao.hidden && !balao.contains(e.target) && e.target !== botao) alternar(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
  return [botao, balao];
}

function linhaDoProfessor(mensagem) {
  const conexao = lerConexao();
  const [ajuda, balao] = ajudaDoProfessor();
  const aviso = mensagem ? criar("span", { class: "porta-aviso", texto: mensagem }) : null;
  if (conexao) {
    const sair = criar("button", { type: "button", class: "porta-discreto", texto: "sair" });
    sair.addEventListener("click", () => { esquecerConexao(); location.reload(); });
    return criar("p", { class: "porta-professor" },
      "Você é o professor: ", criar("a", { class: "porta-acao", href: "professor.html", texto: "abrir minhas aulas" }),
      criar("span", { class: "porta-conta", texto: hostDaConexao(conexao) }), sair);
  }
  return criar("div", { class: "porta-professor" },
    "Você é o professor? ", criar("a", { class: "porta-acao", href: `${ENDERECO_DA_API}/entrar`, texto: "Entre com o Cloudflare" }), ajuda, aviso, balao);
}

export function montarEntrada(raiz, aoEntrar) {
  const guardado = sessionStorage.getItem(CHAVE_DO_AVISO);
  sessionStorage.removeItem(CHAVE_DO_AVISO);
  const mensagem = guardado && (MENSAGENS_DE_ERRO[guardado] ?? `Erro na entrada (${guardado}).`);

  raiz.replaceChildren(
    criar("section", { class: "banner-catalogo porta" },
      criar("div", { class: "container banner-grade" },
        criar("div", {}, tituloEmVarredura("Sala de aula"), apresentacao(), ladoDoAluno(aoEntrar), linhaDoProfessor(mensagem)),
        telefoneSemFio())));
}
