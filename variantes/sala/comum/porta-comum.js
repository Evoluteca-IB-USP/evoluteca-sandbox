/* O que as três variantes da porta da sala de aula dividem: ler o link
   colado, mandar o aluno para a sala, entrar como professor e montar o
   cabeçalho e o rodapé do site em volta do <main>. */

import { criar } from "escrever-html";
import { lerLink } from "../../../paginas/salas/link-da-sala.js";
import { normalizarEndereco, guardarConexao, enderecoLembrado } from "../../../paginas/salas/conexao.js";
import { entrarComSenha } from "../../../paginas/salas/cliente-da-sala.js";
import { ENDERECO_DA_API } from "../../../paginas/salas/configuracao.js";

export const RAIZ = "../../";
export const LINK_DO_CLOUDFLARE = `${ENDERECO_DA_API}/entrar`;
export { enderecoLembrado };

/* aceita o link inteiro ou só o que vem depois do # */
export function lerLinkColado(texto) {
  const limpo = String(texto ?? "").trim();
  return lerLink(limpo.includes("#") ? limpo.slice(limpo.indexOf("#")) : limpo);
}

export const irParaSala = (link) => { location.href = `${RAIZ}sala.html#${link.host}/${link.sala}/${link.convite}`; };

/* devolve a mensagem de erro, ou leva ao painel */
export async function entrarComoProfessor(textoDoEndereco, senha) {
  const base = normalizarEndereco(textoDoEndereco);
  if (!base) return "Escreva o endereço das suas salas.";
  try {
    const { sessao } = await entrarComSenha(base, senha);
    guardarConexao({ endereco: base, segredo: sessao });
    location.href = `${RAIZ}professor.html`;
    return null;
  } catch (e) {
    return e.status ? `Não entrou: ${e.message}.` : "Não encontrei esse endereço. Confira o que escreveu e a internet.";
  }
}

/* um campo dentro de uma frase, com o tracejado do catálogo */
export function campoNaFrase(atributos) {
  return criar("input", { type: "text", class: "frase-campo", autocomplete: "off", spellcheck: "false", ...atributos });
}

export function montarMoldura() {
  const r = RAIZ;
  document.body.prepend(
    criar("div", { class: "usp-faixa-amarela" }), criar("div", { class: "usp-faixa-azul" }),
    criar("div", { class: "usp-barra", html: `<div class="container usp-barra-inner"><a class="usp-logo" href="https://www.ib.usp.br" rel="external"><img src="${r}imagens/simbolo_ib_bco.png" alt="Instituto de Biociências da USP" class="usp-logo-ib"></a><a class="usp-logo" href="https://www5.usp.br" rel="external"><img src="${r}imagens/logo_usp_bco.png" alt="Universidade de São Paulo" class="usp-logo-usp"></a></div>` }),
    criar("header", { class: "topo", html: `<div class="container topo-inner"><a class="marca" href="${r}index.html"><span class="marca-nome">Evoluteca</span><span class="marca-sub">Instituto de Biociências · USP</span></a><nav class="nav" aria-label="Principal"><a href="${r}index.html">Início</a><a href="${r}catalogo.html">Simuladores</a><a href="${r}sala.html" aria-current="page">Sala de aula</a></nav></div>` }));
  document.body.append(criar("footer", { class: "rodape", html: `<div class="rodape-base"><div class="container">© 2026 Evoluteca · Instituto de Biociências · Universidade de São Paulo</div></div>` }));
}
