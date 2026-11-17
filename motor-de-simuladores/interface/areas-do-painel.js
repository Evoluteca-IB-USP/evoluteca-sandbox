/* As abas do painel: uma área por gráfico da ficha. Cada área é um canvas
   (tipos.js) ou uma peça com HTML próprio (os vidros, o relevo em 3D), e
   pode ter uma miniatura ao lado (`lado`, ou a outra das `curvas`). Todas têm `no`, `redesenhar` e,
   se a ficha der, a legenda em frase de figura, que vai sob a linha do tempo.
   A aba escondida não se desenha: ao aparecer, o ResizeObserver a redesenha.
   Cada aba leva o desenho miúdo do seu gráfico (miniaturas-das-abas.js). */

import { criar } from "escrever-html";
import { areaDeSaida } from "./graficos-da-pagina/tipos.js";
import { ligarEscolhaNaLinha } from "./graficos-da-pagina/escolha-na-linha.js";
import { legendaEmFrase } from "./graficos-da-pagina/legenda-em-frase.js";
import { montarVidros } from "./graficos-da-pagina/vidros.js";
import { montarMiniatura } from "./graficos-da-pagina/miniaturas.js";
import { miniaturaDaAba } from "./graficos-da-pagina/miniaturas-das-abas.js";
import { montarRelevo } from "./abas/relevo.js";
import { montarCurvasEmPar } from "./graficos-da-pagina/curvas-em-par.js";

function montarArea(painel, spec, k, estado) {
  const numero = k + 1;
  if (spec.tipo === "vidros") return montarVidros(painel, criar("div", { class: "painel-principal painel-peca" }), numero);
  if (spec.tipo === "relevo") {
    const no = criar("div", { class: "painel-principal painel-peca" }), legenda = criar("p", { class: "painel-legenda" });
    const relevo = montarRelevo(painel, no, { legenda, numero });
    const mini = spec.lado && montarMiniatura(painel, spec.lado);
    const notas = no.querySelector(".relevo-notas");
    if (mini && notas) {
      const lado = criar("div", { class: "relevo-lado" });
      notas.before(lado);
      lado.append(notas, mini.no);
    }
    return { no, legenda, redesenhar: () => { relevo.atualizar(painel.t); mini?.redesenhar(); } };
  }
  if (spec.curvas) return montarCurvasEmPar(painel, spec, numero, estado);
  const canvas = criar("canvas", { class: "painel-principal" });
  const area = areaDeSaida(canvas, spec, estado);
  if (spec.tipo === "replicas") ligarEscolhaNaLinha(painel, area, spec);
  if (spec.legenda) area.legenda = legendaEmFrase(spec, numero);
  /* a mira do modo avançado: o mouse sobre o gráfico mostra a geração e o valor exatos */
  canvas.addEventListener("pointermove", (e) => {
    if (!painel.avancado) return;
    const r = canvas.getBoundingClientRect();
    painel.mira = { x: e.clientX - r.left, y: e.clientY - r.top };
    area.redesenhar();
  });
  canvas.addEventListener("pointerleave", () => { painel.mira = null; area.redesenhar(); });
  area.no = canvas;
  if (!spec.lado) return area;
  const mini = montarMiniatura(painel, spec.lado);
  const desenharCanvas = area.redesenhar;
  return { ...area, no: criar("div", { class: "painel-principal painel-com-lado" }, canvas, mini.no), redesenhar: () => { desenharCanvas(); mini.redesenhar(); } };
}

export function montarAreas(painel, raiz, estado) {
  const { ficha } = painel;
  const areas = ficha.graficos.map((spec, k) => montarArea(painel, spec, k, estado));
  const miniaturas = [];
  const abas = areas.length > 1 ? ficha.graficos.map((spec, k) => {
    const mini = miniaturaDaAba(painel, spec);
    if (mini) miniaturas.push(mini);
    const aba = criar("button", { type: "button", class: `painel-aba${spec.avancado ? " so-avancado" : ""}`, role: "tab", "aria-selected": String(k === 0) },
      mini?.no,
      criar("span", { class: "painel-aba-nome" },
        criar("span", { class: "painel-aba-numero", "aria-hidden": "true", texto: String(k + 1).padStart(2, "0") }),
        criar("span", { class: "painel-aba-rotulo", texto: spec.aba ?? spec.titulo })));
    aba.addEventListener("click", () => {
      abas.forEach((outra, i) => outra.setAttribute("aria-selected", String(i === k)));
      areas.forEach((area, i) => { area.no.hidden = i !== k; if (area.legenda) area.legenda.hidden = i !== k; });
      painel.principal = areas[k];
      painel.indice = k;
      painel.mira = null;
      painel.desenhar();
    });
    return aba;
  }) : [];
  areas.slice(1).forEach((area) => { area.no.hidden = true; if (area.legenda) area.legenda.hidden = true; });
  raiz.querySelector("#principal").append(criar("div", { class: "painel-abas", role: "tablist" }, ...abas), ...areas.map((area) => area.no));
  raiz.querySelector("#tempo").after(...areas.map((area) => area.legenda).filter(Boolean));
  return { areas, abas, miniaturas };
}
