/* O "teste aqui →" das ferramentas de ensino: leva valores ao painel, liga o
   modo avançado se algum parâmetro ou gráfico pedir, escolhe a aba e sobe a
   página até o painel. */

import { criar } from "escrever-html";

export function testarNoPainel(painel, { valores = {}, aba, semente }) {
  const { ficha } = painel;
  const avancado = Object.keys(valores).some((nome) => ficha.parametros.find((p) => p.nome === nome)?.avancado)
    || Boolean(aba !== undefined && ficha.graficos[aba]?.avancado);
  if (avancado) painel.definirModo?.(true);
  painel.definirValores(valores, { semente: semente ?? painel.sessao.semente });
  if (aba !== undefined) painel.mostrarAba(aba);
  painel.tempo?.ir?.(0);
  painel.tempo?.tocar?.(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function linkDeTeste(painel, rotulo, item) {
  const link = criar("button", { type: "button", class: "ensino-link", texto: `${rotulo} →` });
  link.addEventListener("click", () => testarNoPainel(painel, item));
  return link;
}
