/* Ferramenta "Dados para o R": a rodada em tabela, para baixar como CSV, e o
   código em R que lê o arquivo e refaz o primeiro gráfico. Os parâmetros e
   a semente vão no começo do arquivo como comentários (# N = 100).
   Gráficos no tempo viram uma linha por geração; barras, uma por categoria. */

import { criar } from "escrever-html";
import { numero } from "../graficos-da-pagina/pecas.js";

function colunas(ficha, res, par) {
  const primeiro = ficha.graficos[0];
  if (primeiro.tipo === "barras") {
    const { esperado, medido } = primeiro.valores(res, par);
    return [{ nome: "categoria", valores: primeiro.categorias }, { nome: "esperado", valores: esperado }, { nome: "amostra", valores: medido }];
  }
  const cols = [];
  for (const spec of ficha.graficos) {
    if (spec.tipo === "replicas") spec.series(res).forEach((s, i) => cols.push({ nome: `${spec.id}_${i + 1}`, valores: s }));
    else if (spec.tipo === "curva") cols.push({ nome: spec.id, valores: spec.serie(res) });
  }
  return [{ nome: "geracao", valores: cols[0].valores.map((_, t) => t) }, ...cols];
}

function codigoR(ficha) {
  const spec = ficha.graficos[0];
  const ler = `dados <- read.csv("${ficha.arquivo}.csv",\n                  comment.char = "#")`;
  if (spec.tipo === "barras") {
    return `${ler}
barplot(t(as.matrix(dados[, c("esperado", "amostra")])),
        beside = TRUE, names.arg = dados$categoria,
        col = c("white", "#142560"), ylab = "${spec.titulo}")`;
  }
  if (spec.tipo === "replicas") {
    return `${ler}
replicas <- grep("^${spec.id}_", names(dados))
matplot(dados$geracao, dados[, replicas],
        type = "l", lty = 1, col = "#64c4d2",
        xlab = "geração", ylab = "${spec.titulo}")
lines(dados$geracao, dados$${spec.id}_1,
      lwd = 2, col = "#142560")`;
  }
  return `${ler}
plot(dados$geracao, dados$${spec.id}, type = "l",
     xlab = "geração", ylab = "${spec.titulo}")`;
}

export function montarDados(painel, no) {
  const { ficha, sessao } = painel;
  const previa = criar("div", { class: "dados-previa" });
  const baixar = criar("button", { type: "button", class: "sortear", html: `<span class="sortear-dado" aria-hidden="true">↓</span> Baixar ${ficha.arquivo}.csv` });
  const codigo = criar("pre", { class: "dados-codigo", texto: codigoR(ficha) });
  const copiar = criar("button", { type: "button", class: "dados-copiar", texto: "Copiar" });
  no.append(criar("div", { class: "dados" }, previa,
    criar("div", { class: "dados-lado" }, baixar, criar("div", { class: "dados-caixa" }, copiar, codigo))));

  baixar.addEventListener("click", () => {
    const cols = colunas(ficha, sessao.res, sessao.par);
    const cabeca = ficha.parametros.map((p) => `# ${p.nome} = ${sessao.par[p.nome]}`).concat(`# semente = ${sessao.semente}`);
    const linhas = cols[0].valores.map((_, i) => cols.map((c) => c.valores[i]).join(","));
    const blob = new Blob([[...cabeca, cols.map((c) => c.nome).join(","), ...linhas].join("\n")], { type: "text/csv" });
    const a = criar("a", { href: URL.createObjectURL(blob), download: `${ficha.arquivo}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  });
  copiar.addEventListener("click", async () => {
    await navigator.clipboard.writeText(codigo.textContent);
    copiar.textContent = "Copiado";
    setTimeout(() => { copiar.textContent = "Copiar"; }, 1500);
  });

  /* a prévia: as primeiras colunas; no tempo, as primeiras gerações e a mostrada */
  const celula = (c, i) => (typeof c.valores[i] === "string" || c.nome === "geracao" ? String(c.valores[i]) : numero(c.valores[i], 3));
  return {
    atualizar(t) {
      const cols = colunas(ficha, sessao.res, sessao.par), vistas = cols.slice(0, 5), g = Math.floor(t);
      const noTempo = cols[0].nome === "geracao";
      const linhas = noTempo ? [...new Set([0, 1, 2, 3, Math.max(0, g - 1), g])].filter((x) => x <= g) : cols[0].valores.map((_, i) => i);
      const resto = cols.length - vistas.length;
      previa.replaceChildren(criar("table", { class: "dados-tabela" },
        criar("thead", {}, criar("tr", {}, ...vistas.map((c) => criar("th", { texto: c.nome })), resto > 0 ? criar("th", { texto: `… ${resto} colunas` }) : null)),
        criar("tbody", {}, ...linhas.flatMap((x, i) => [
          i && x - linhas[i - 1] > 1 ? criar("tr", { class: "dados-pulo" }, criar("td", { colspan: vistas.length + 1, texto: "⋮" })) : null,
          criar("tr", { class: noTempo && x === g ? "agora" : "" }, ...vistas.map((c) => criar("td", { texto: celula(c, x) })), resto > 0 ? criar("td") : null),
        ].filter(Boolean)))));
    },
  };
}
