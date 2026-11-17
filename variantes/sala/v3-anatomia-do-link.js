/* v3 · a anatomia do link. A frase do link em cima e, embaixo, "Figura 1.":
   o link aberto nas suas três partes (A onde a sala fica, B qual sala,
   C a chave), com colchetes que se acendem conforme cada parte é
   reconhecida no que o aluno colou. O professor fica numa faixa navy que
   parte da letra A: a sala mora na conta dele. */

import { criar } from "escrever-html";
import { lerLinkColado, irParaSala, entrarComoProfessor, campoNaFrase, enderecoLembrado, LINK_DO_CLOUDFLARE } from "./comum/porta-comum.js";

const EXEMPLO = ["evoluteca-salas.prof-ana.workers.dev", "K7Q2M4XPLA", "Xb3vT9qLm2Rw8ZpK4nYc1d"];
const PARTES = [
  { letra: "A", nome: "onde a sala fica", texto: "o endereço da conta do professor", padrao: /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/i },
  { letra: "B", nome: "qual sala", texto: "10 letras e números, um para cada sala", padrao: /^[A-Z2-7]{10}$/ },
  { letra: "C", nome: "a chave da porta", texto: "só quem tem o link inteiro entra", padrao: /^[A-Za-z0-9_-]{22}$/ },
];

/* o que veio colado, parte por parte: { texto, estado: "ok" | "errada" | "falta" } */
function separar(colado) {
  const limpo = colado.trim();
  const depois = limpo.includes("#") ? limpo.slice(limpo.indexOf("#") + 1) : limpo;
  const pedacos = depois ? depois.split("/") : [];
  return PARTES.map((p, i) => {
    const texto = pedacos[i] ?? "";
    return { texto, estado: !texto ? "falta" : p.padrao.test(texto) ? "ok" : "errada" };
  });
}

function figuraDoLink() {
  const comeco = criar("span", { class: "v3-comeco", texto: "…/sala.html#" });
  const blocos = PARTES.map((p) => {
    const valor = criar("span", { class: "v3-valor" });
    const bloco = criar("span", { class: "v3-parte" },
      criar("span", { class: "v3-linha" },
        criar("span", { class: "v3-marcado" }, valor, criar("span", { class: "v3-colchete", "aria-hidden": "true" })),
        p.letra === "C" ? null : criar("span", { class: "v3-barra", texto: "/" })),
      criar("span", { class: "v3-legenda" }, criar("b", { class: "v3-letra", texto: p.letra }), criar("span", { class: "v3-nome", texto: p.nome }), criar("span", { class: "v3-estado" }), criar("small", { texto: p.texto })));
    return { bloco, valor, estado: bloco.querySelector(".v3-estado") };
  });
  const linha = criar("div", { class: "v3-link" }, comeco, ...blocos.map((b) => b.bloco));
  const figura = criar("figure", { class: "v3-figura v3-exemplo" }, linha,
    criar("figcaption", {}, criar("b", { texto: "Figura 1. " }), "As três partes do link de uma sala. A porta só abre com as três. ",
      criar("span", { class: "v3-qual", texto: "Este é um link de exemplo: cole o seu acima e veja as partes se acenderem." })));

  function mostrar(colado) {
    const exemplo = !colado.trim();
    figura.classList.toggle("v3-exemplo", exemplo);
    const partes = exemplo ? EXEMPLO.map((texto) => ({ texto, estado: "ok" })) : separar(colado);
    partes.forEach(({ texto, estado }, i) => {
      const b = blocos[i];
      b.bloco.dataset.estado = estado;
      b.valor.textContent = texto || "·".repeat([12, 10, 14][i]);
      b.estado.textContent = exemplo ? "" : { ok: "✓", errada: "não confere", falta: "falta" }[estado];
    });
    figura.querySelector(".v3-qual").textContent = exemplo ? "Este é um link de exemplo: cole o seu acima e veja as partes se acenderem." : "Este é o link que você colou.";
  }
  mostrar("");
  return { figura, mostrar };
}

function fraseDoAluno(aoMudar) {
  const campo = campoNaFrase({ placeholder: "cole aqui", "aria-label": "Link da sala" });
  const form = criar("form", { class: "v3-entrar" },
    criar("label", { class: "frase" }, criar("span", { texto: "O professor mandou o link" }),
      criar("span", { class: "frase-caixa" }, campo, criar("button", { type: "submit", class: "frase-seta", "aria-label": "Entrar na sala", texto: "→" }))));
  campo.addEventListener("input", () => aoMudar(campo.value));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const link = lerLinkColado(campo.value);
    if (link) irParaSala(link);
    else aoMudar(campo.value);
  });
  return form;
}

function faixaDoProfessor() {
  const endereco = campoNaFrase({ placeholder: "seu-subdominio", "aria-label": "Endereço das suas salas", autocomplete: "username", value: enderecoLembrado() });
  const senha = campoNaFrase({ type: "password", placeholder: "senha", "aria-label": "Senha", autocomplete: "current-password" });
  const entrar = criar("button", { type: "submit", class: "acao-texto", texto: "Entrar →" });
  const erro = criar("p", { class: "v3-erro", "aria-live": "polite" });
  const form = criar("form", { class: "v3-prof-entrar" },
    criar("label", { class: "frase" }, criar("span", { texto: "Minhas salas ficam em" }), criar("span", { class: "frase-caixa" }, endereco)),
    criar("label", { class: "frase" }, criar("span", { texto: "e a senha é" }), criar("span", { class: "frase-caixa" }, senha)),
    criar("p", { class: "v3-prof-acoes" }, entrar), erro,
    criar("p", { class: "v3-prof-primeira" }, "Primeira vez? ", criar("a", { href: LINK_DO_CLOUDFLARE, texto: "Conectar com o Cloudflare →" })));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    entrar.disabled = true;
    erro.textContent = (await entrarComoProfessor(endereco.value, senha.value)) ?? "";
    entrar.disabled = false;
  });

  return criar("section", { class: "v3-faixa" },
    criar("div", { class: "container v3-faixa-grade" },
      criar("div", {},
        criar("p", { class: "kicker", texto: "Para o professor" }),
        criar("h2", {}, "A parte ", criar("span", { class: "v3-letra v3-letra-grande", texto: "A" }), " é a sua conta", criar("span", { class: "v3-ponto", texto: "." })),
        criar("p", { texto: "Cada professor guarda as próprias salas numa conta Cloudflare, que é gratuita. O endereço dela é o começo de todo link que você manda para a turma. As aulas e as respostas ficam lá, e não com a gente." })),
      form));
}

export function montar(raiz) {
  const { figura, mostrar } = figuraDoLink();
  raiz.replaceChildren(
    criar("section", { class: "v3" },
      criar("div", { class: "container" },
        criar("p", { class: "kicker", texto: "Sala de aula" }),
        fraseDoAluno(mostrar),
        figura)),
    faixaDoProfessor());
}
