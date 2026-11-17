/* Mexer no gráfico de réplicas com o mouse: passar perto de uma linha a
   acende (e acende o vidro dela), clicar a segue, e o ponto do começo, se a
   ficha pedir `arrastar`, muda o parâmetro arrastando para cima e para baixo. */

import { deFracao } from "../escala.js";

const PERTO = 9;

export function ligarEscolhaNaLinha(painel, area, spec) {
  const { canvas } = area, { sessao, ficha } = painel;
  const parametro = spec.arrastar && ficha.parametros.find((p) => p.nome === spec.arrastar);
  let arrastando = false;

  const ponto = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const noComeco = ([x, y]) => parametro && Math.hypot(x - area.x(0), y - area.y(sessao.par[parametro.nome])) < PERTO + 2;

  function linhaPerto([x, y]) {
    if (!sessao.res) return null;
    const series = spec.series(sessao.res), ger = Math.round(area.xInv(x));
    if (ger < 0 || ger > painel.t + 0.5) return null;
    let melhor = null, menor = PERTO;
    series.forEach((s, i) => {
      const d = Math.abs(area.y(s[Math.min(ger, s.length - 1)]) - y);
      if (d < menor) { menor = d; melhor = i; }
    });
    return melhor;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!noComeco(ponto(e))) return;
    arrastando = true;
    canvas.setPointerCapture(e.pointerId);
    painel.tempo?.tocar(false);
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = ponto(e);
    if (arrastando) {
      const f = (area.yInv(p[1]) - parametro.min) / (parametro.max - parametro.min);
      painel.definir(parametro.nome, deFracao(parametro, f));
      return;
    }
    const comeco = noComeco(p), i = comeco ? null : linhaPerto(p);
    canvas.style.cursor = comeco ? "ns-resize" : i !== null ? "pointer" : "";
    if (painel.puxador !== comeco) { painel.puxador = comeco; painel.desenhar(); }
    painel.passar(i);
  });
  canvas.addEventListener("pointerup", () => { arrastando = false; });
  canvas.addEventListener("pointerleave", () => {
    if (arrastando) return;
    if (painel.puxador) { painel.puxador = false; painel.desenhar(); }
    painel.passar(null);
  });
  canvas.addEventListener("click", (e) => {
    const p = ponto(e);
    if (noComeco(p)) return;
    const i = linhaPerto(p);
    painel.escolher(i !== null && i !== painel.escolha ? i : null);
  });
}
