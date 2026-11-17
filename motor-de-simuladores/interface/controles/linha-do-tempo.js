/* A linha do tempo: a cápsula do tocador (uma geração atrás, tocar/pausar,
   uma geração à frente), o recomeçar no começo da régua das gerações, os
   marcos da rodada sobre ela e, na ponta, o interruptor da animação. Sem animação, cada rodada
   nova já aparece na última geração e o tocar fica desligado; as setas ainda
   andam geração por geração. `relogio` é a geração mostrada, fracionária durante
   a animação, para as pontas das linhas andarem sem saltos. Aqui também
   mora o "Sortear de novo", que fica com os controles. */

import { criar } from "escrever-html";

const ICONES = {
  inicio: `<svg viewBox="0 0 24 24" class="icone-traco"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9"/></svg>`,
  antes: `<svg viewBox="0 0 16 16" class="icone-traco"><path d="M10.5 3 5.5 8l5 5"/></svg>`,
  tocar: `<svg viewBox="0 0 24 24"><path d="M8.5 5.5v13l10-6.5z"/></svg>`,
  pausar: `<svg viewBox="0 0 24 24" class="icone-traco"><path d="M9.5 7v10M14.5 7v10"/></svg>`,
  passo: `<svg viewBox="0 0 16 16" class="icone-traco"><path d="M5.5 3l5 5-5 5"/></svg>`,
  animacao: `<svg viewBox="0 0 24 24" class="icone-traco"><path d="M3 16c3-9 6-9 9-3s6 5 9-5"/><path class="icone-corte" d="M4 4l16 16"/></svg>`,
};

function botao(nome, rotulo, fn, extra = "") {
  const b = criar("button", { type: "button", class: `tocador-botao ${extra}`, "aria-label": rotulo, html: ICONES[nome] });
  b.addEventListener("click", fn);
  return b;
}

export function linhaDoTempo({ geracoes, velocidade = 30, aoMudar }) {
  let total = geracoes, relogio = 0, tocando = false, animar = true;
  const entrada = criar("input", { type: "range", class: "tempo-entrada", min: 0, max: total, step: 1, value: 0, "aria-label": "Geração" });
  const rotulo = criar("span", { class: "tempo-rotulo" });
  const marcos = criar("div", { class: "tempo-marcos" });
  const tocar = botao("tocar", "Tocar", () => { if (relogio >= total) ir(0); marcar(!tocando); }, "tocador-principal");
  const estado = criar("b", { texto: "ligada" });
  const interruptor = criar("button", { type: "button", class: "tocador-animacao", "aria-pressed": "true", title: "Desligada, cada mudança mostra logo a última geração" },
    criar("span", { class: "tocador-botao", html: ICONES.animacao }),
    criar("span", { class: "tocador-animacao-rotulo" }, "animação", estado));
  interruptor.addEventListener("click", () => {
    animar = !animar;
    interruptor.setAttribute("aria-pressed", String(animar));
    estado.textContent = animar ? "ligada" : "desligada";
    tocar.disabled = !animar;
    capsula.classList.toggle("tocador-parado", !animar);
    if (!animar) { marcar(false); ir(total); }
  });
  const capsula = criar("div", { class: "tocador" },
    botao("antes", "Uma geração atrás", () => { marcar(false); ir(Math.max(0, Math.floor(relogio) - 1)); }, "tocador-lateral"),
    tocar,
    botao("passo", "Uma geração à frente", () => { marcar(false); ir(Math.min(total, Math.floor(relogio) + 1)); }, "tocador-lateral"));
  const no = criar("div", { class: "tempo" },
    capsula,
    criar("div", { class: "tempo-regua" },
      botao("inicio", "Recomeçar", () => { marcar(false); ir(0); }, "tocador-recomecar"),
      criar("div", { class: "tempo-trilho" }, entrada, marcos)),
    rotulo, interruptor);

  function ir(t) {
    relogio = t;
    entrada.value = Math.floor(t);
    entrada.style.setProperty("--cheio", `${((t / total) * 100).toFixed(2)}%`);
    rotulo.innerHTML = `geração <b>${Math.floor(t)}</b> de ${total}`;
    aoMudar(t);
  }
  function marcar(sim) {
    tocando = sim;
    tocar.innerHTML = ICONES[sim ? "pausar" : "tocar"];
    tocar.setAttribute("aria-label", sim ? "Pausar" : "Tocar");
  }
  entrada.addEventListener("input", () => { marcar(false); ir(+entrada.value); });

  /* a animação inteira não passa de uns 8 s, seja qual for o número de gerações;
     a ficha pode pedir outro ritmo, em gerações por segundo, que muda com o tempo */
  let antes = null;
  requestAnimationFrame(function quadro(agora) {
    const dt = antes === null ? 0 : Math.min(0.1, (agora - antes) / 1000);
    antes = agora;
    if (tocando) {
      const ritmo = typeof velocidade === "function" ? velocidade(relogio) : Math.max(velocidade, total / 8);
      const t = Math.min(total, relogio + dt * ritmo);
      if (t >= total) marcar(false);
      ir(t);
    }
    requestAnimationFrame(quadro);
  });

  /* os marcos da rodada (a ficha diz quais): tracinhos sobre a régua; clicar leva até a geração */
  no.marcar = (lista) => {
    marcos.replaceChildren(...lista.filter((m) => m.t <= total).map((m) => {
      const b = criar("button", { type: "button", class: `tempo-marco${m.conta ? " tempo-marco-conta" : ""}`, style: `left: ${((m.t / total) * 100).toFixed(2)}%`, "aria-label": m.rotulo, "data-rotulo": m.rotulo });
      b.addEventListener("click", () => { marcar(false); ir(m.t); });
      return b;
    }));
  };
  no.ir = ir;
  no.tocar = (sim) => { if (sim && !animar) ir(total); else marcar(sim); };
  no.rodadaNova = () => { if (!animar) ir(total); };
  no.mudarTotal = (n) => { total = n; entrada.max = n; ir(animar ? Math.min(relogio, n) : n); };
  ir(0);
  return no;
}

export function sortearDeNovo(aoClicar) {
  const b = criar("button", { type: "button", class: "sortear", html: `<span class="sortear-dado" aria-hidden="true">⚄</span> Sortear de novo` });
  b.addEventListener("click", aoClicar);
  return b;
}
