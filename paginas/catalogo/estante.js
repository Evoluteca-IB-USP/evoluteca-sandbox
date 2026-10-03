/* A estante: a lateral fixa ("só os que já abrem", nível, temas que
   acompanham a rolagem) e, ao lado, um bloco por tema com os cartões. A
   miniatura de cada cartão só anima com o mouse em cima. A busca vem do
   banner, por `buscar(texto)`, que devolve quantos cartões ficaram. */

import { criar } from "escrever-html";
import { miniatura } from "../vitrines/__pacote__.js";
import { laco } from "../desenho-em-canvas/__pacote__.js";
import { passaNoNivel, passaNaBusca } from "./filtros.js";
import { puxarTrilho } from "./trilho-arrastavel.js";

export function criarEstante({ temas }) {
  const estado = { nivel: "todos", busca: "", soProntos: false };

  const niveis = [["todos", "Todos os níveis"], ["medio", "Ensino médio"], ["graduacao", "Graduação"]].map(([valor, rotulo]) => {
    const b = criar("button", { type: "button", class: "estante-opcao", "data-valor": valor, texto: rotulo });
    b.addEventListener("click", () => { estado.nivel = valor; aplicar(); });
    return b;
  });
  const soProntos = criar("input", { type: "checkbox" });
  soProntos.addEventListener("change", () => { estado.soProntos = soProntos.checked; aplicar(); });
  const linksTema = temas.map((t) => criar("a", { href: `#tema-${t.chave}`, class: "estante-link-tema", texto: t.nome }));

  const lateral = criar("aside", { class: "estante-lateral" },
    criar("p", { class: "estante-rotulo", texto: "Filtrar" }),
    criar("label", { class: "estante-so-prontos" }, soProntos, criar("span", { texto: "Só os que já abrem" })),
    criar("p", { class: "estante-rotulo", texto: "Nível" }),
    criar("div", { class: "estante-opcoes estante-trilho" }, ...niveis),
    criar("p", { class: "estante-rotulo", texto: "Temas" }),
    criar("nav", { class: "estante-temas estante-trilho", "aria-label": "Temas" }, ...linksTema));
  const trilhos = lateral.querySelectorAll(".estante-trilho");

  const vazio = criar("p", { class: "estante-vazio", texto: "Nenhum simulador com esses filtros." });
  const secoes = temas.map((t) => {
    const cartoes = t.entradas.map(cartao);
    const contagem = criar("p", { class: "kicker-secao" });
    const secao = criar("section", { class: "estante-tema", id: `tema-${t.chave}` },
      contagem,
      criar("h2", { class: "estante-titulo-tema" }, t.nome, criar("span", { class: "ponto-tema", texto: "." })),
      criar("div", { class: "estante-grade" }, ...cartoes.map((c) => c.no)));
    return { t, secao, cartoes, contagem };
  });

  const no = criar("div", { class: "container estante" }, lateral,
    criar("div", { class: "estante-coluna" }, ...secoes.map((s) => s.secao), vazio));

  function aplicar() {
    niveis.forEach((b) => b.setAttribute("aria-pressed", b.dataset.valor === estado.nivel));
    let total = 0;
    secoes.forEach((s, i) => {
      let n = 0;
      s.cartoes.forEach((c) => {
        const passa = passaNoNivel(c.e, estado.nivel) && passaNaBusca(c.e, estado.busca) && !(estado.soProntos && c.e.previsto);
        c.no.hidden = !passa;
        if (passa) n++;
      });
      s.secao.hidden = n === 0;
      s.contagem.textContent = `Tema ${s.t.numero} · ${n} ${n === 1 ? "simulador" : "simuladores"}`;
      linksTema[i].classList.toggle("estante-sem", n === 0);
      total += n;
    });
    vazio.hidden = total > 0;
    moverCursores();
    return total;
  }
  /* a bolinha de cada trilho vai até o meio do item escolhido */
  function moverCursores() {
    trilhos.forEach((t) => {
      if (t.classList.contains("puxando")) return;
      const item = t.querySelector('[aria-pressed="true"], .estante-atual');
      if (item) t.style.setProperty("--cursor", `${item.offsetTop + item.offsetHeight / 2}px`);
    });
  }
  aplicar();

  /* a lateral desce até o topo da primeira grade visível de cartões */
  function alinharLateral() {
    const grade = secoes.find((s) => !s.secao.hidden)?.secao.querySelector(".estante-grade");
    lateral.style.marginTop = grade ? `${grade.getBoundingClientRect().top - lateral.parentElement.getBoundingClientRect().top - parseFloat(getComputedStyle(lateral.parentElement).paddingTop)}px` : "";
  }
  new ResizeObserver(() => { alinharLateral(); moverCursores(); }).observe(no);

  const [trilhoNivel, trilhoTemas] = trilhos;
  puxarTrilho(trilhoNivel, (b) => { estado.nivel = b.dataset.valor; aplicar(); });
  puxarTrilho(trilhoTemas, (l) => {
    linksTema.forEach((k) => k.classList.toggle("estante-atual", k === l));
    secoes[linksTema.indexOf(l)].secao.scrollIntoView({ behavior: "instant", block: "start" });
  });

  const observador = new IntersectionObserver((vistos) => {
    if (trilhoTemas.classList.contains("puxando")) return;
    vistos.filter((v) => v.isIntersecting).forEach((v) => {
      const i = secoes.findIndex((s) => s.secao === v.target);
      linksTema.forEach((l, k) => l.classList.toggle("estante-atual", k === i));
    });
    moverCursores();
  }, { rootMargin: "-30% 0px -60% 0px" });
  secoes.forEach((s) => observador.observe(s.secao));
  linksTema[0].classList.add("estante-atual");

  return { no, buscar(texto) { estado.busca = texto; return aplicar(); } };
}

function cartao(e) {
  const tela = criar("canvas", { class: "estante-mini", "aria-hidden": "true" });
  const no = criar(e.href ? "a" : "article", { class: `estante-cartao${e.previsto ? " estante-previsto" : ""}`, href: e.href },
    criar("div", { class: "estante-mini-fundo" }, tela),
    criar("h3", { texto: e.titulo }),
    criar("p", { class: "estante-descricao", texto: e.descricao }),
    e.previsto ? criar("span", { class: "em-breve", texto: "em breve" }) : null);

  const semente = e.indice + 3;
  requestAnimationFrame(() => miniatura(tela, e.tipo, semente));
  let parar = null;
  no.addEventListener("mouseenter", () => { parar = laco((t) => { miniatura(tela, e.tipo, semente, t); }); });
  no.addEventListener("mouseleave", () => { parar?.(); miniatura(tela, e.tipo, semente); });
  return { e, no };
}
