/* O que as variantes v4 a v6 da porta da sala dividem: a moldura do site,
   o lado do aluno (a frase aprovada, com o campo-trajetória) e as peças da
   entrada do professor, que cada variante encaixa num lugar diferente. */

import { criar } from "escrever-html";
import { ENDERECO_DA_API } from "../../../paginas/salas/configuracao.js";
import { lerConexao, esquecerConexao, hostDaConexao } from "../../../paginas/salas/conexao.js";
import { lerLink } from "../../../paginas/salas/link-da-sala.js";
import { campoComTrajetoria } from "../../../paginas/salas/campo-com-trajetoria.js";

const RAIZ = "../../";
const VARIANTES = [
  ["v4-telefone-sem-fio", "4 · telefone sem fio"],
  ["v5-ancestral-comum", "5 · ancestral comum"],
  ["v6-giria-na-sala", "6 · gíria na sala"],
];

const NS = "http://www.w3.org/2000/svg";
export const svg = (tag, atributos = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, v);
  return n;
};
export const parado = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* aceita o link inteiro ou só o que vem depois do # */
function lerLinkColado(texto) {
  const limpo = texto.trim();
  return lerLink(limpo.includes("#") ? limpo.slice(limpo.indexOf("#")) : limpo);
}

/* a frase do aluno; `aoServir(sim)` avisa a figura quando o link colado passa a servir */
export function ladoDoAluno(aoServir = () => {}) {
  const ir = criar("button", { type: "submit", class: "porta-seta", "aria-label": "Entrar na sala", texto: "→" });
  const { caixa, campo } = campoComTrajetoria({ semente: 11, placeholder: "cole aqui", "aria-label": "Link da sala", depois: ir,
    medir: (v) => ({ parte: v.trim().length / 70, serve: !!lerLinkColado(v) }) });
  const erro = criar("p", { class: "porta-erro", "aria-live": "polite" });
  const formulario = criar("form", { class: "porta-aluno" },
    criar("label", { class: "busca" }, criar("span", { class: "busca-frase", texto: "O professor mandou o link" }), caixa), erro);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const link = lerLinkColado(campo.value);
    if (link) { location.href = `${RAIZ}sala.html#${link.host}/${link.sala}/${link.convite}`; return; }
    if (campo.value.trim()) erro.textContent = "Esse link não parece de uma sala. Confira se copiou ele inteiro.";
  });
  campo.addEventListener("input", () => { erro.textContent = ""; aoServir(!!lerLinkColado(campo.value)); });
  return formulario;
}

/* a entrada do professor em duas peças soltas: a linha (pergunta, link e o
   "?") e o balão do "?", que a variante pendura onde couber */
export function entradaDoProfessor({ pergunta = "Professor? ", chamada = "Entrar com o Cloudflare →", saudacao = "Professor: " } = {}) {
  const conexao = lerConexao();
  if (conexao) {
    const sair = criar("button", { type: "button", class: "porta-discreto", texto: "sair" });
    sair.addEventListener("click", () => { esquecerConexao(); location.reload(); });
    return { balao: null, linha: criar("p", { class: "prof" }, saudacao,
      criar("a", { class: "porta-acao", href: `${RAIZ}professor.html`, texto: "abrir minhas aulas →" }),
      criar("span", { class: "porta-conta", texto: hostDaConexao(conexao) }), sair) };
  }
  const balao = criar("div", { class: "prof-balao", id: "prof-ajuda", role: "note", hidden: true },
    criar("p", {}, criar("b", { texto: "O que é. " }), "O Cloudflare é um serviço que hospeda programas na internet."),
    criar("p", {}, criar("b", { texto: "Como entrar. " }), "Você entra na sua conta Cloudflare, ou cria uma, e autoriza a Evoluteca a instalar nela o programa das salas."),
    criar("p", {}, criar("b", { texto: "O que dá para fazer. " }), "Montar aulas com simuladores e perguntas, abrir salas para a turma e ver as respostas chegando. Tudo fica guardado na sua conta."),
    criar("p", {}, criar("b", { texto: "Custo. " }), "Nenhum: o plano gratuito do Cloudflare basta."));
  const botao = criar("button", { type: "button", class: "porta-ajuda", "aria-label": "O que é o Cloudflare", "aria-expanded": "false", "aria-controls": "prof-ajuda", texto: "?" });
  const alternar = (abrir) => {
    balao.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    if (!abrir) return;
    const b = botao.getBoundingClientRect(), caixa = balao.getBoundingClientRect();
    balao.style.setProperty("--seta", `${b.left + b.width / 2 - caixa.left - 7}px`);
  };
  botao.addEventListener("click", () => alternar(balao.hidden));
  document.addEventListener("click", (e) => { if (!balao.hidden && !balao.contains(e.target) && e.target !== botao) alternar(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
  return { balao, linha: criar("p", { class: "prof" }, pergunta, criar("a", { class: "porta-acao", href: `${ENDERECO_DA_API}/entrar`, texto: chamada }), botao) };
}

/* a linha embaixo de uma figura: o que aconteceu à esquerda, a ação com o dado à direita */
export function linhaDaFigura(rotulo, aoClicar) {
  const estado = criar("span", { class: "figura-estado", "aria-live": "polite" });
  const texto = criar("span", { texto: rotulo });
  const acao = criar("button", { type: "button", class: "figura-acao" }, criar("span", { class: "figura-dado", "aria-hidden": "true", texto: "⚄" }), " ", texto);
  acao.addEventListener("click", aoClicar);
  return { linha: criar("p", { class: "figura-linha" }, estado, acao), estado, rotular: (t) => { texto.textContent = t; } };
}

export function montarMoldura(atual) {
  const r = RAIZ;
  document.body.prepend(
    criar("div", { class: "usp-faixa-amarela" }), criar("div", { class: "usp-faixa-azul" }),
    criar("div", { class: "usp-barra", html: `<div class="container usp-barra-inner"><a class="usp-logo" href="https://www.ib.usp.br" rel="external"><img src="${r}imagens/simbolo_ib_bco.png" alt="Instituto de Biociências da USP" class="usp-logo-ib"></a><a class="usp-logo" href="https://www5.usp.br" rel="external"><img src="${r}imagens/logo_usp_bco.png" alt="Universidade de São Paulo" class="usp-logo-usp"></a></div>` }),
    criar("header", { class: "topo", html: `<div class="container topo-inner"><a class="marca" href="${r}index.html"><span class="marca-nome">Evoluteca</span><span class="marca-sub">Instituto de Biociências · USP</span></a><nav class="nav" aria-label="Principal"><a href="${r}index.html">Início</a><a href="${r}catalogo.html">Simuladores</a><a href="${r}sala.html" aria-current="page">Sala de aula</a></nav></div>` }));
  document.body.append(
    criar("footer", { class: "rodape", html: `<div class="container rodape-grid"><div><h4>Evoluteca</h4><ul><li><a href="${r}index.html">Início</a></li><li><a href="${r}catalogo.html">Simuladores</a></li><li><a href="${r}sala.html">Sala de aula</a></li></ul></div><div><h4>Institucional</h4><ul><li><a href="https://www.ib.usp.br" rel="external">Instituto de Biociências</a></li><li><a href="https://www5.usp.br" rel="external">Universidade de São Paulo</a></li></ul></div><div class="rodape-logos"><a href="https://www.ib.usp.br" rel="external"><img class="rodape-logo-ib" src="${r}imagens/logo_ib_bco.png" alt="Instituto de Biociências da USP"></a><a href="https://www5.usp.br" rel="external"><img class="rodape-logo-usp" src="${r}imagens/logo_usp_bco.png" alt="Universidade de São Paulo"></a></div></div><div class="rodape-base"><div class="container">© 2026 Evoluteca · Instituto de Biociências · Universidade de São Paulo — textos em CC BY 4.0, código MIT</div></div>` }),
    criar("nav", { class: "troca-de-variante", "aria-label": "Variantes da porta" }, "variantes",
      ...VARIANTES.map(([arquivo, nome]) => criar("a", { href: `${arquivo}.html`, "aria-current": arquivo === atual ? "page" : null, texto: nome })),
      criar("a", { href: `${r}sala.html`, texto: "a de hoje" })));
}
