/* A formatação mínima dos blocos de texto e dos enunciados: parágrafos,
   **negrito**, *itálico* e listas com "- ". O HTML é escapado primeiro, então
   o que o professor (ou um aluno) escrever nunca vira marcação.
   Função pura: texto entra, HTML sai. */

import { escapar } from "escrever-html";

function aspas(html) {
  return escapar(html).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* negrito e itálico dentro de uma linha já escapada */
function emLinha(html) {
  return html
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, "<em>$1</em>");
}

/* linhas seguidas viram um parágrafo (com <br> entre elas); "- " no começo faz item de lista; linha em branco separa */
export function formatarTexto(texto) {
  const saida = [];
  let paragrafo = [];
  let itens = [];
  const fecharParagrafo = () => {
    if (paragrafo.length) saida.push(`<p>${paragrafo.join("<br>")}</p>`);
    paragrafo = [];
  };
  const fecharLista = () => {
    if (itens.length) saida.push(`<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`);
    itens = [];
  };
  for (const linha of String(texto ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    if (linha.trim() === "") { fecharParagrafo(); fecharLista(); continue; }
    const item = /^\s*- (.*)$/.exec(linha);
    if (item) {
      fecharParagrafo();
      itens.push(emLinha(aspas(item[1].trim())));
    } else {
      fecharLista();
      paragrafo.push(emLinha(aspas(linha.trim())));
    }
  }
  fecharParagrafo();
  fecharLista();
  return saida.join("");
}
