/* Quando a linha do tempo do painel sai da tela (o aluno desceu para ler as
   abas), ela passa para uma barra presa ao pé da janela, com uma miniatura
   do gráfico principal; quando o painel volta à vista, ela volta ao lugar.
   É o mesmo elemento que muda de lugar, então o relógio é um só. */

import { criar } from "escrever-html";
import { grafico, linha, cabeca, valorEm } from "../graficos-da-pagina/pecas.js";

export function montarTempoFlutuante(painel, lugar) {
  const { ficha, sessao } = painel, spec = ficha.graficos[0];
  const miniatura = criar("canvas", { class: "flutuante-miniatura" });
  const vaga = criar("div", { class: "container flutuante-inner" }, miniatura);
  const barra = criar("div", { class: "flutuante", "aria-hidden": "true" }, vaga);
  document.body.append(barra);

  const g = grafico(miniatura, { xlim: [0, 1], ylim: spec.ylim, margem: { esq: 2, dir: 6, topo: 4, base: 4 }, desenhar: (g) => {
    if (!sessao.res) return;
    const t = painel.t;
    if (spec.tipo === "replicas") {
      const series = spec.series(sessao.res);
      g.xlim = [0, series[0].length - 1];
      series.slice(1).forEach((s) => linha(g, s, { ate: t, alfa: 0.5, largura: 1 }));
      linha(g, series[0], { cor: g.cores.destaque, largura: 1.6, ate: t });
      cabeca(g, t, valorEm(series[0], t));
    } else {
      const s = spec.serie(sessao.res);
      g.xlim = [0, s.length - 1];
      linha(g, s, { cor: g.cores.destaque, largura: 1.6, ate: t });
    }
  } });

  /* flutua só quando o painel ficou para cima, não antes de chegar nele */
  let flutuando = false;
  new IntersectionObserver(([e]) => {
    const deveFlutuar = !e.isIntersecting && e.boundingClientRect.top < 0;
    if (deveFlutuar === flutuando) return;
    flutuando = deveFlutuar;
    lugar.style.minHeight = flutuando ? `${lugar.offsetHeight}px` : "";
    (flutuando ? vaga : lugar).append(painel.tempo);
    barra.classList.toggle("visivel", flutuando);
    barra.setAttribute("aria-hidden", flutuando ? "false" : "true");
    g.redesenhar();
  }).observe(lugar);

  painel.aoDesenhar(() => { if (flutuando) g.redesenhar(); });
}
