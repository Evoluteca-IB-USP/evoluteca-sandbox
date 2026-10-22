/* A aposta dos vidros: a mesma barra de três partes que fecha a figura
   (só B | misturados | só A), com dois divisores para arrastar. Começa
   toda cinza, "todos ainda misturados"; quando o modelo termina, a barra
   dele aparece embaixo da sua. */

import { criar } from "escrever-html";
import { partesDaAposta } from "./partes-da-aposta.js";

function barra(n, { sem, meio, marca }) {
  const parte = (k, cls) => criar("div", { class: `vidros-parte ${cls}`, style: `flex-grow:${k}` });
  return criar("div", { class: "vidros-barra" }, parte(sem, "vidros-b"), parte(meio, "vidros-meio"), parte(marca, "vidros-a"));
}
const legenda = ({ sem, meio, marca }) => `${sem + marca} com uma versão só, ${meio} misturados`;
const contas = ({ sem, meio, marca }) => criar("p", { class: "vidros-contas" },
  criar("span", { texto: `${sem} só com B` }), criar("span", { texto: `${meio} misturados` }), criar("span", { texto: `${marca} só com A` }));

/** aoApostar({ sem, meio, marca }) */
export function barraDeVidros({ n, aoApostar }) {
  let a = 0, b = n, travada = false;                     // os divisores, em número de vidros
  const valor = () => ({ sem: a, meio: b - a, marca: n - b });
  const p = partesDaAposta(() => aoApostar(valor()));
  const alca = (cls) => criar("span", { class: `vidros-alca ${cls}` });
  const alcaA = alca("vidros-alca-a"), alcaB = alca("vidros-alca-b");
  const sua = criar("div", { class: "vidros-sua" });
  const doModelo = criar("div", { class: "vidros-modelo", hidden: true });
  let suasContas = criar("p");
  function desenhar() {
    sua.replaceChildren(barra(n, valor()), alcaA, alcaB);
    suasContas.replaceWith(suasContas = contas(valor()));
    alcaA.style.left = `${100 * a / n}%`; alcaB.style.left = `${100 * b / n}%`;
    p.ler(legenda(valor()));
  }
  let pegou = null;
  const lugar = (e) => { const r = sua.getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * n); };
  sua.addEventListener("pointerdown", (e) => {
    if (travada) return;
    const x = lugar(e);
    pegou = Math.abs(x - a) < Math.abs(x - b) || (a === b && x < a) ? "a" : "b";
    sua.setPointerCapture(e.pointerId); mover(e);
  });
  function mover(e) {
    if (!pegou) return;
    const x = lugar(e);
    if (pegou === "a") a = Math.min(x, b); else b = Math.max(x, a);
    desenhar();
  }
  sua.addEventListener("pointermove", mover);
  sua.addEventListener("pointerup", () => { pegou = null; });
  desenhar();
  return {
    no: criar("div", { class: "aposta" },
      criar("p", { class: "aposta-instrucao", html: "<em>Arraste os dois divisores</em> da barra para dividir os 107 vidros nos três grupos." }),
      criar("p", { class: "vidros-rotulo", texto: "sua aposta" }), sua, suasContas, doModelo, p.lido, p.botao),
    valor,
    travar() { travada = true; sua.toggleAttribute("data-travada", true); p.travar(); },
    revelar(real, perto) {
      doModelo.replaceChildren(criar("p", { class: "vidros-rotulo", texto: "o modelo" }), barra(n, real), contas(real));
      doModelo.hidden = false;
      p.revelar(legenda(valor()), legenda(real), perto);
    },
  };
}
