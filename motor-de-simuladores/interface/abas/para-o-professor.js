/* Ferramenta "Para o professor": o link desta rodada (com os parâmetros que
   ficam travados para a turma), a sala com a turma e a figura em PNG. */

import { criar } from "escrever-html";

const modeloDaPagina = () => new URLSearchParams(location.search).get("modelo") ?? "";

function linkDaRodada(painel, travados) {
  const { sessao } = painel, url = new URL("simulador.html", location.href), busca = new URLSearchParams();
  busca.set("modelo", modeloDaPagina());
  for (const p of nomesNoLink(painel)) busca.set(p.nome, sessao.par[p.nome]);
  busca.set("semente", sessao.semente);
  const travar = nomesNoLink(painel).filter((p) => travados.has(p.nome)).map((p) => p.nome);
  if (travar.length) busca.set("travar", travar.join(","));
  url.search = busca.toString().replaceAll("%2C", ",");
  return url.href;
}

/* os básicos sempre; os avançados só quando saem do padrão */
const nomesNoLink = ({ ficha, sessao }) => ficha.parametros.filter((p) => !p.avancado || sessao.par[p.nome] !== p.valor);

function quebrarLinhas(ctx, texto, largura) {
  const linhas = [];
  let linha = "";
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = linha ? `${linha} ${palavra}` : palavra;
    if (linha && ctx.measureText(tentativa).width > largura) { linhas.push(linha); linha = palavra; } else linha = tentativa;
  }
  return linha ? [...linhas, linha] : linhas;
}

function baixarFigura(painel) {
  const { no, legenda } = painel.principal;
  const telas = no instanceof HTMLCanvasElement ? [no] : [...no.querySelectorAll("canvas")];
  const tela = telas.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!tela) return;
  const escala = tela.clientWidth ? tela.width / tela.clientWidth : window.devicePixelRatio || 1;
  const margem = 24 * escala, saida = document.createElement("canvas"), ctx = saida.getContext("2d");
  ctx.font = `${13 * escala}px "Open Sans", sans-serif`;
  const linhas = legenda && !legenda.hidden ? quebrarLinhas(ctx, legenda.textContent, tela.width) : [];
  const entrelinha = 20 * escala;
  saida.width = tela.width + 2 * margem;
  saida.height = tela.height + 2 * margem + (linhas.length ? margem / 2 + linhas.length * entrelinha : 0);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, saida.width, saida.height);
  ctx.drawImage(tela, margem, margem);
  ctx.font = `${13 * escala}px "Open Sans", sans-serif`;
  ctx.fillStyle = "#3d3d3d";
  ctx.textBaseline = "top";
  linhas.forEach((l, i) => ctx.fillText(l, margem, margem * 1.5 + tela.height + i * entrelinha));
  saida.toBlob((blob) => {
    const a = criar("a", { href: URL.createObjectURL(blob), download: `${painel.ficha.arquivo ?? "figura"}.png` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
}

const bloco = (titulo, texto, ...resto) => criar("section", { class: "professor-bloco" },
  criar("h3", { class: "professor-titulo", texto: titulo }), criar("p", { class: "professor-texto", texto: texto }), ...resto);

export function montarParaOProfessor(painel, no) {
  const travados = new Set();
  const escolhas = criar("div", { class: "professor-travar" });
  const campo = criar("input", { type: "text", class: "professor-campo", readonly: true, "aria-label": "Link desta rodada" });
  const copiar = criar("button", { type: "button", class: "ensino-link", texto: "copiar" });
  const figura = criar("button", { type: "button", class: "ensino-link", texto: "baixar a figura →" });
  const sala = criar("a", { class: "ensino-link", href: `professor.html?modelo=${encodeURIComponent(modeloDaPagina())}`, texto: "Abrir uma sala com a turma →" });

  no.append(criar("div", { class: "professor" },
    bloco("Link desta rodada", "Quem abrir o link vê exatamente este sorteio. Marque o que a turma não pode mudar.",
      escolhas, criar("p", { class: "professor-link" }, campo, copiar)),
    bloco("Sala com a turma", "Monte uma aula com textos, perguntas e este simulador. Os alunos entram por um link, e você vê as respostas da turma.", sala),
    bloco("Figura para a aula", "O gráfico que está aberto agora, com a legenda, em PNG.", figura)));

  copiar.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(campo.value); } catch { campo.select(); document.execCommand("copy"); }
    copiar.textContent = "copiado";
    setTimeout(() => { copiar.textContent = "copiar"; }, 1500);
  });
  figura.addEventListener("click", () => baixarFigura(painel));

  let nomes = "";
  function escreverEscolhas() {
    const ps = nomesNoLink(painel), chave = ps.map((p) => p.nome).join();
    if (chave === nomes) return;
    nomes = chave;
    escolhas.replaceChildren(criar("span", { class: "professor-rotulo", texto: "travar:" }), ...ps.map((p) => {
      const caixa = criar("input", { type: "checkbox", checked: travados.has(p.nome) });
      caixa.addEventListener("change", () => { caixa.checked ? travados.add(p.nome) : travados.delete(p.nome); campo.value = linkDaRodada(painel, travados); });
      return criar("label", { class: "professor-opcao" }, caixa, p.rotulo.toLowerCase());
    }));
  }

  return {
    atualizar() {
      escreverEscolhas();
      const link = linkDaRodada(painel, travados);
      if (campo.value !== link) campo.value = link;
    },
  };
}
