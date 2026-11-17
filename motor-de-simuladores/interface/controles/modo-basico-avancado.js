/* Básico ou avançado: o trilho do site em miniatura, com a palavra
   "avançado" ao lado. Desligado, pontilhado; ligado, a cabecinha âmbar corre
   e o trilho fica contínuo. O avançado acrescenta o que a ficha marca com
   `avancado`: a conta junto do sorteio, outras forças, mais medidas. */

import { criar } from "escrever-html";

export function modoBasicoAvancado(aoMudar) {
  const no = criar("button", { type: "button", class: "trilho-modo", "aria-pressed": "false", title: "Mostrar a conta, outras forças e mais medidas" },
    criar("span", { class: "trilho-modo-trilho", "aria-hidden": "true" }, criar("i")),
    "avançado");
  no.addEventListener("click", () => marcar(no.getAttribute("aria-pressed") !== "true"));
  function marcar(sim) {
    no.setAttribute("aria-pressed", String(sim));
    aoMudar(sim);
  }
  no.marcar = marcar;
  return no;
}
