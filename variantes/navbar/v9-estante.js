import { paginaAtual, aoNavegar } from "./comum/site-de-mentira.js";
import { buscar, portas, prontos, modelos } from "./comum/acervo-em-lista.js";
import { ligarTeclado } from "./comum/lista-com-teclado.js";
import { miniatura } from "../../paginas/vitrines/miniatura.js";

const CARTOES = 9;

function rotulo(texto) {
  const p = document.createElement("p");
  p.className = "pilula-rotulo";
  p.textContent = texto;
  return p;
}

export function montarEstante(topo) {
  const campo = topo.querySelector(".pilula-campo");
  const painel = topo.querySelector(".pilula-painel");
  const teclado = ligarTeclado(campo, { itens: () => [...painel.querySelectorAll("a")], aoFechar: () => abrir(false) });

  function cartao(o, atual) {
    const a = document.createElement("a");
    a.href = `#${o.id}`;
    a.className = "pilula-cartao";
    a.classList.toggle("atual", o.id === atual);
    a.classList.toggle("previsto", Boolean(o.previsto));
    const fundo = document.createElement("div");
    fundo.className = "pilula-mini-fundo";
    const tela = document.createElement("canvas");
    tela.className = "pilula-mini";
    fundo.append(tela);
    const h3 = document.createElement("h3");
    h3.textContent = o.titulo;
    const onde = document.createElement("small");
    onde.textContent = o.previsto ? "em breve" : o.onde;
    a.append(fundo, h3, onde);
    requestAnimationFrame(() => miniatura(tela, o.tipo, modelos.indexOf(o) + 3));
    return a;
  }

  function ficha(o, atual) {
    const a = document.createElement("a");
    a.href = `#${o.id}`;
    a.className = "pilula-ficha";
    a.classList.toggle("atual", o.id === atual);
    a.textContent = o.titulo;
    if (o.onde?.includes("simuladores")) {
      const n = document.createElement("small");
      n.textContent = o.onde.split(" ")[0];
      a.append(n);
    }
    return a;
  }

  function desenhar() {
    const texto = campo.value.trim();
    const resultados = texto ? buscar(texto, { naDescricao: true }) : [];
    const cartoes = texto ? resultados.filter((o) => o.tema) : prontos;
    const fichas = texto ? resultados.filter((o) => !o.tema) : portas;
    const atual = paginaAtual();
    painel.replaceChildren();

    if (cartoes.length) {
      painel.append(rotulo(texto ? "Simuladores" : "Prontos para usar"));
      const grade = document.createElement("div");
      grade.className = "pilula-cartoes";
      cartoes.slice(0, CARTOES).forEach((o) => grade.append(cartao(o, atual)));
      painel.append(grade);
    }
    if (fichas.length || cartoes.length > CARTOES) {
      painel.append(rotulo(texto ? "Páginas e temas" : "Ou entrar por"));
      const linha = document.createElement("div");
      linha.className = "pilula-fichas";
      fichas.forEach((o) => linha.append(ficha(o, atual)));
      if (cartoes.length > CARTOES) {
        const mais = document.createElement("span");
        mais.className = "pilula-mais";
        mais.textContent = `+${cartoes.length - CARTOES} simuladores`;
        linha.append(mais);
      }
      painel.append(linha);
    }
    if (!cartoes.length && !fichas.length) {
      const p = document.createElement("p");
      p.className = "pilula-nada";
      p.textContent = "Nada com esse nome.";
      painel.append(p);
    }
    painel.querySelectorAll("a").forEach((a, i) => { a.classList.toggle("ativo", i === 0); a.addEventListener("mouseenter", teclado.mouse(i)); });
  }

  function abrir(sim) {
    painel.hidden = !sim;
    if (sim) { teclado.zerar(); desenhar(); }
  }

  campo.addEventListener("focus", () => abrir(true));
  campo.addEventListener("input", () => { teclado.zerar(); desenhar(); });
  topo.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
  document.addEventListener("click", (e) => { if (!topo.contains(e.target)) abrir(false); });
  aoNavegar(() => { campo.value = ""; campo.blur(); abrir(false); });
}
