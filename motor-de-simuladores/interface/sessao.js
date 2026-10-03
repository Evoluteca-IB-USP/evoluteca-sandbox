/* O estado de uma página de simulador, qualquer que seja a ficha: os valores
   dos parâmetros, a semente e o último resultado. Quem quiser saber quando
   o resultado muda se inscreve com aoSimular. Uma ficha sem parâmetro de
   tempo (uma amostra, como Hardy–Weinberg) tem total 0. */

import { criarRng } from "r";

export function criarSessao(ficha) {
  const par = Object.fromEntries(ficha.parametros.map((p) => [p.nome, p.valor]));
  const tempo = ficha.parametros.find((p) => p.tempo);
  const ouvintes = [];
  const s = { ficha, par, semente: 1, res: null };
  s.total = () => (tempo ? par[tempo.nome] : 0);
  s.simular = () => { s.res = ficha.simular(par, criarRng(s.semente)); ouvintes.forEach((f) => f()); };
  s.definir = (nome, v) => { par[nome] = v; s.simular(); };
  s.sortear = () => { s.semente++; s.simular(); };
  s.aoSimular = (f) => ouvintes.push(f);
  return s;
}

/** acende juntos tudo o que fala do mesmo parâmetro: termos das fórmulas e réguas */
export function acender(nome, sim) {
  document.querySelectorAll(`[data-liga="${nome}"], [data-nome="${nome}"]`).forEach((n) => n.classList.toggle("acesa", sim));
}

export function ligarAoPassarOMouse(raiz) {
  raiz.querySelectorAll("[data-liga], [data-nome]").forEach((n) => {
    const nome = n.dataset.liga ?? n.dataset.nome;
    n.addEventListener("mouseenter", () => acender(nome, true));
    n.addEventListener("mouseleave", () => acender(nome, false));
  });
}
