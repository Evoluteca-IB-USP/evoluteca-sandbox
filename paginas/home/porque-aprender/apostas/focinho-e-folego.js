/* A aposta do pug, em duas partes: o focinho, arrastando a curva clara na
   figura, e quantos de cada 20 pugs respiram mal, pintando bolinhas. Cada
   bolinha vale 2 pugs: um clique pinta metade, outro a bolinha inteira, o
   terceiro limpa. Começa com 1880 pintado. */

import { criar } from "escrever-html";
import { numero } from "portugues";
import { partesDaAposta } from "./partes-da-aposta.js";

const doCranio = (f) => `${numero(100 * f, f < 0.1 ? 1 : 0)}% do crânio`;
const metades = (n) => Array.from({ length: 10 }, (_, i) => Math.max(0, Math.min(2, n - 2 * i)));

const fileira = (rotulo, pintadas, clicar) => criar("div", { class: "folegos" },
  criar("span", { class: "folegos-rotulo", texto: rotulo }),
  ...pintadas.map((m, i) => {
    const b = criar(clicar ? "button" : "span", { class: "folego", "data-mal": String(m), ...(clicar ? { type: "button", "aria-label": `pugs ${2 * i + 1} e ${2 * i + 2}` } : {}) });
    if (clicar) b.addEventListener("click", () => clicar(i, b));
    return b;
  }));

/** figura: a do pug; inicio: quantos de 20 em 1880; aoApostar({ focinho, doentes }) */
export function focinhoEFolego({ figura, inicio, aoApostar }) {
  const pintadas = metades(inicio);
  const doentes = () => pintadas.reduce((a, b) => a + b, 0);
  let focinho = null, travada = false;
  const ler = () => `${focinho === null ? "—" : doCranio(focinho)} · ${doentes()} de 20 respirando mal`;
  const p = partesDaAposta(() => { if (focinho !== null) aoApostar({ focinho, doentes: doentes() }); });
  const mudou = () => { p.ler(ler()); p.botao.disabled = focinho === null; };
  const sua = fileira("sua aposta", pintadas, (i, b) => {
    if (travada) return;
    pintadas[i] = (pintadas[i] + 1) % 3; b.dataset.mal = String(pintadas[i]); mudou();
  });
  const doModelo = criar("div", { hidden: true });
  figura.aposta((f) => { focinho = f; mudou(); });
  mudou();
  return {
    no: criar("div", { class: "aposta" },
      criar("p", { class: "aposta-instrucao", html: "<em>Arraste a curva clara</em> até onde o focinho estará em 2020." }),
      criar("p", { class: "aposta-instrucao", html: `E quantos pugs vão respirar mal? Cada bolinha são 2 pugs: <em>clique para pintar</em> metade ou a bolinha inteira. Em 1880, eram ${inicio} de 20.` }),
      sua, doModelo, p.lido, p.botao),
    valor: () => (focinho === null ? null : { focinho, doentes: doentes() }),
    travar() { travada = true; sua.querySelectorAll("button").forEach((b) => { b.disabled = true; }); p.travar(); },
    revelar(modelo, perto) {
      doModelo.replaceChildren(fileira("o modelo", metades(modelo.doentes))); doModelo.hidden = false;
      p.revelar(ler(), `${doCranio(modelo.focinho)} · ${modelo.doentes} de 20`, perto);
    },
  };
}
