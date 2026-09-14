import { criar, markdownParaHtml, subtitulos } from "escrever-html";

/* O material que vem junto do simulador: o conceito explicado, o roteiro de
   atividade e — recolhido, porque é para depois da aula — o guia do
   professor. Os três são Markdown solto em modelos-de-simulacao/<slug>/. */
export function materialDeApoio(textos = {}) {
  const material = criar("div", { class: "material" });

  if (textos.conceito) {
    const artigo = criar("article", { class: "prosa material-conceito", html: markdownParaHtml(textos.conceito) });
    artigo.querySelector("h2")?.classList.add("titulo-secao");
    material.append(artigo);
  }
  if (textos.roteiro) {
    material.append(criar("aside", { class: "roteiro", "aria-label": "Roteiro de atividade", html: markdownParaHtml(textos.roteiro) }));
  }

  let professor = null;
  if (textos.professor) {
    const temas = subtitulos(textos.professor).map((t) => t.toLowerCase()).join(" · ");
    professor = criar("details", { class: "professor" },
      criar("summary", {}, criar("span", { class: "professor-titulo", texto: "Para o professor" }), criar("span", { class: "professor-temas", texto: temas })),
      criar("div", { class: "prosa", html: markdownParaHtml(textos.professor) }));
  }

  return { material, professor };
}
