/* A linha do tempo: o tocador (recomeçar, tocar/pausar, uma geração) e a
   régua das gerações. `relogio` é a geração mostrada, fracionária durante
   a animação, para as pontas das linhas andarem sem saltos. Aqui também
   mora o "Sortear de novo", que fica com os controles. */

import { criar } from "escrever-html";

const ICONES = {
  inicio: `<svg viewBox="0 0 24 24"><path d="M7 6v12M18 6l-8 6 8 6z"/></svg>`,
  tocar: `<svg viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z"/></svg>`,
  pausar: `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`,
  passo: `<svg viewBox="0 0 24 24"><path d="M6 6l8 6-8 6zM17 6v12"/></svg>`,
};

function botao(nome, rotulo, fn, extra = "") {
  const b = criar("button", { type: "button", class: `tocador-botao ${extra}`, "aria-label": rotulo, html: ICONES[nome] });
  b.addEventListener("click", fn);
  return b;
}

export function linhaDoTempo({ geracoes, velocidade = 30, aoMudar }) {
  let total = geracoes, relogio = 0, tocando = false;
  const entrada = criar("input", { type: "range", class: "tempo-entrada", min: 0, max: total, step: 1, value: 0, "aria-label": "Geração" });
  const rotulo = criar("span", { class: "tempo-rotulo" });
  const tocar = botao("tocar", "Tocar", () => { if (relogio >= total) ir(0); marcar(!tocando); }, "tocador-principal");
  const no = criar("div", { class: "tempo" },
    criar("div", { class: "tocador" },
      botao("inicio", "Recomeçar", () => { marcar(false); ir(0); }),
      tocar,
      botao("passo", "Uma geração", () => { marcar(false); ir(Math.min(total, Math.floor(relogio) + 1)); })),
    entrada, rotulo);

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

  /* a animação inteira não passa de uns 8 s, seja qual for o número de gerações */
  let antes = null;
  requestAnimationFrame(function quadro(agora) {
    const dt = antes === null ? 0 : Math.min(0.1, (agora - antes) / 1000);
    antes = agora;
    if (tocando) {
      const t = Math.min(total, relogio + dt * Math.max(velocidade, total / 8));
      if (t >= total) marcar(false);
      ir(t);
    }
    requestAnimationFrame(quadro);
  });

  no.ir = ir;
  no.tocar = marcar;
  no.mudarTotal = (n) => { total = n; entrada.max = n; ir(Math.min(relogio, n)); };
  ir(0);
  return no;
}

export function sortearDeNovo(aoClicar) {
  const b = criar("button", { type: "button", class: "sortear", html: `<span class="sortear-dado" aria-hidden="true">⚄</span> Sortear de novo` });
  b.addEventListener("click", aoClicar);
  return b;
}
