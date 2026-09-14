/* Mini-renderizador de Markdown: títulos, listas, citação e ênfase — o
   bastante para o conceito, o roteiro e o guia do professor de cada
   simulador. Não é um Markdown completo de propósito. */

import { escapar } from "./escapar-html.js";

function linhaRica(t) {
  return t
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function markdownParaHtml(md) {
  const saida = [];
  // blocos separados por linha em branco; linhas contíguas pertencem ao mesmo bloco
  const blocos = md.replace(/\r/g, "").split(/\n\s*\n/);

  for (const bloco of blocos) {
    const linhas = bloco.split("\n").map((l) => escapar(l.trim())).filter(Boolean);
    if (!linhas.length) continue;

    const titulo = linhas[0].match(/^(#{1,3})\s+(.*)$/);
    if (titulo) {
      const n = titulo[1].length;
      saida.push(`<h${n + 1}>${linhaRica(titulo[2])}</h${n + 1}>`); // h1 do md vira h2 na página
      const resto = linhas.slice(1).join(" ");
      if (resto) saida.push(`<p>${linhaRica(resto)}</p>`);
      continue;
    }

    if (linhas[0].startsWith("&gt;")) {
      const texto = linhas.map((l) => l.replace(/^&gt;\s?/, "")).join(" ");
      saida.push(`<blockquote><p>${linhaRica(texto)}</p></blockquote>`);
      continue;
    }

    const marcador = /^(\d+\.|[-*])\s+/;
    if (marcador.test(linhas[0])) {
      const tipo = /^\d+\./.test(linhas[0]) ? "ol" : "ul";
      const itens = [];
      for (const linha of linhas) {
        if (marcador.test(linha)) itens.push(linha.replace(marcador, ""));
        else itens[itens.length - 1] += " " + linha; // continuação do item anterior
      }
      saida.push(`<${tipo}>` + itens.map((i) => `<li>${linhaRica(i)}</li>`).join("") + `</${tipo}>`);
      continue;
    }

    saida.push(`<p>${linhaRica(linhas.join(" "))}</p>`);
  }
  return saida.join("\n");
}

/** os títulos de segundo nível (## …) de um Markdown — para resumir um texto recolhido */
export function subtitulos(md) {
  return [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

/* ---------- utilidades ---------- */
