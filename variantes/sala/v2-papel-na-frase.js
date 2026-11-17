/* v2 · o papel na frase. Uma frase só, grande e centrada, que começa por
   "Sou aluno · professor". A palavra escolhida troca o resto da frase. O
   sublinhado de cada campo é uma trajetória de deriva: tracejada vazia, ela
   se pinta de teal enquanto se escreve e ganha a cabecinha âmbar quando o
   que foi escrito serve. */

import { criar } from "escrever-html";
import { criarRng, rnorm } from "r";
import { lerLinkColado, irParaSala, entrarComoProfessor, enderecoLembrado, LINK_DO_CLOUDFLARE } from "./comum/porta-comum.js";

const PONTOS = 60, ALTURA = 22;

function trajetoria(semente) {
  const rng = criarRng(semente);
  let lento = 0, rapido = 0;
  const pts = [];
  for (let i = 0; i <= PONTOS; i++) {
    lento += -0.1 * lento + rnorm(0, 1.2, rng);
    rapido += -0.4 * rapido + rnorm(0, 1, rng);
    pts.push([(i / PONTOS) * 1000, ALTURA / 2 + Math.tanh((lento + rapido) / 5) * ALTURA * 0.4]);
  }
  return pts;
}

/* um campo cujo sublinhado é uma trajetória; `medir(valor)` dá 0..1 e se já serve */
function campoComTrajetoria(semente, atributos, medir, classe = "") {
  const pts = trajetoria(semente);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const campo = criar("input", { type: "text", class: "v2-campo", autocomplete: "off", spellcheck: "false", ...atributos });
  const linha = criar("span", { class: "v2-linha", "aria-hidden": "true", html:
    `<svg viewBox="0 0 1000 ${ALTURA}" preserveAspectRatio="none"><path class="v2-vazia" pathLength="1" d="${d}"/><path class="v2-cheia" pathLength="1" d="${d}"/></svg>` +
    `<span class="v2-cabeca" style="top: ${pts.at(-1)[1].toFixed(1)}px"></span>` });
  const caixa = criar("span", { class: `v2-caixa ${classe}` }, campo, linha);
  const atualizar = () => {
    const { parte, serve } = medir(campo.value);
    linha.style.setProperty("--parte", serve ? 1 : Math.min(parte, 0.92));
    caixa.classList.toggle("v2-serve", serve);
  };
  campo.addEventListener("input", atualizar);
  atualizar();
  return { caixa, campo };
}

function fraseDoAluno() {
  const { caixa, campo } = campoComTrajetoria(11, { placeholder: "cole aqui", "aria-label": "Link da sala" },
    (v) => ({ parte: v.trim().length / 70, serve: !!lerLinkColado(v) }));
  const ir = criar("button", { type: "submit", class: "v2-ir", texto: "entrar na sala →" });
  const dica = criar("p", { class: "v2-dica", texto: "A linha se completa quando o link está inteiro." });
  const form = criar("form", { class: "v2-palco" },
    criar("p", { class: "v2-frase" }, "e o professor mandou o link ", caixa),
    criar("p", { class: "v2-rodape" }, ir), dica);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const link = lerLinkColado(campo.value);
    if (link) return irParaSala(link);
    dica.textContent = campo.value.trim() ? "Esse link não parece de uma sala. Confira se copiou ele inteiro." : "Cole o link que o professor mandou.";
    dica.classList.add("v2-erro");
  });
  return { form, foco: campo };
}

function fraseDoProfessor() {
  const endereco = campoComTrajetoria(29, { placeholder: "seu-subdominio", "aria-label": "Endereço das suas salas", autocomplete: "username", value: enderecoLembrado() },
    (v) => ({ parte: v.trim().length / 14, serve: v.trim().length >= 3 }), "v2-curta");
  const senha = campoComTrajetoria(47, { type: "password", placeholder: "senha", "aria-label": "Senha", autocomplete: "current-password" },
    (v) => ({ parte: v.length / 8, serve: v.length >= 8 }), "v2-curta");
  const ir = criar("button", { type: "submit", class: "v2-ir", texto: "abrir minhas aulas →" });
  const dica = criar("p", { class: "v2-dica" }, "Primeira vez? ", criar("a", { href: LINK_DO_CLOUDFLARE, texto: "Conecte a sua conta Cloudflare →" }), criar("br"),
    "É de graça, e as aulas e as respostas ficam guardadas nela, não com a gente.");
  const erro = criar("p", { class: "v2-dica v2-erro", "aria-live": "polite" });
  const form = criar("form", { class: "v2-palco" },
    criar("p", { class: "v2-frase" }, "e minhas salas ficam em ", endereco.caixa, criar("br"), "com a senha ", senha.caixa),
    criar("p", { class: "v2-rodape" }, ir), erro, dica);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    ir.disabled = true;
    erro.textContent = (await entrarComoProfessor(endereco.campo.value, senha.campo.value)) ?? "";
    ir.disabled = false;
  });
  return { form, foco: endereco.campo };
}

export function montar(raiz) {
  const palco = criar("div", { class: "v2-troca" });
  const papeis = { aluno: fraseDoAluno, professor: fraseDoProfessor };
  const botoes = Object.keys(papeis).map((papel) => {
    const b = criar("button", { type: "button", class: "v2-papel", texto: papel });
    b.addEventListener("click", () => escolher(papel, true));
    return b;
  });

  function escolher(papel, focar) {
    botoes.forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === papel)));
    const { form, foco } = papeis[papel]();
    palco.replaceChildren(form);
    history.replaceState(null, "", papel === "professor" ? "#professor" : location.pathname);
    if (focar) foco.focus();
  }

  raiz.replaceChildren(criar("section", { class: "v2" },
    criar("div", { class: "container v2-centro" },
      criar("p", { class: "kicker", texto: "Sala de aula" }),
      criar("p", { class: "v2-frase v2-quem" }, "Sou ", botoes[0], criar("span", { class: "v2-ou", texto: " · " }), botoes[1]),
      palco)));
  escolher(location.hash === "#professor" ? "professor" : "aluno", false);
}
