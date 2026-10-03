/* As fórmulas da ficha são texto com uma notação curta, para quem escreve o
   modelo não precisar de HTML (usadas na aba das fórmulas):
     x_t  x_(t+1)      índice           x^2  x^(t)     expoente
     [a|b]             fração           {N} {p0} {t}   símbolo ligado
   Um símbolo ligado é um parâmetro, um derivado da ficha (calculado com os
   parâmetros, o tempo e o resultado da rodada) ou o tempo {t}.
   Embaixo, a mesma fórmula aparece com os números no lugar dos símbolos. */

import { numero } from "./graficos-da-pagina/pecas.js";
import { formatar } from "./escala.js";

/* frações podem ter frações dentro: resolve de dentro para fora */
function fracoes(texto) {
  let antes;
  do {
    antes = texto;
    texto = texto.replace(/\[([^|[\]]+)\|([^[\]]+)\]/g, `<span class="frac"><span>$1</span><span>$2</span></span>`);
  } while (texto !== antes);
  return texto;
}

function marcar(texto) {
  return fracoes(texto
    .replace(/\^\(([^()]*)\)/g, "<sup>$1</sup>")
    .replace(/_\(([^()]*)\)/g, "<sub>$1</sub>")
    .replace(/\^([^\s(){}[\]|<])/g, "<sup>$1</sup>")
    .replace(/_([^\s(){}[\]|<])/g, "<sub>$1</sub>")
  ).replace(/\b([A-Za-z]\u0304?)(?![A-Za-z])/g, (m, l, i, s) => ("{</\u0000".includes(s[i - 1]) && i > 0 ? m : `<i>${l}</i>`));
}

/** os símbolos que uma ficha conhece: parâmetros, derivados e o tempo */
export function simbolos(modelo) {
  const lista = { t: { simbolo: "t" } };
  for (const p of modelo.parametros) if (p.simbolo) lista[p.nome] = p;
  Object.assign(lista, modelo.derivados ?? {});
  return lista;
}

export function formulaHtml(formula, sims) {
  return marcar(formula)
    .replace(/\{(\w+)\}/g, (_, n) => `<span class="eq-termo" data-liga="${n}">${marcar(sims[n]?.simbolo ?? n)}</span>`);
}

/* na linha com números, dois símbolos colados (2{N}, {N}{s}) ganham um ponto de multiplicação */
export function substituidaHtml(formula, sims, par, t, res) {
  const comPonto = formula.replace(/(\d|\})\{/g, "$1·{");
  const valor = (n) => {
    if (n === "t") return String(Math.floor(t));
    const s = sims[n], v = s.calcular ? s.calcular(par, Math.floor(t), res) : par[n];
    return s.calcular ? numero(v, s.casas ?? 2) : formatar(s, v);
  };
  return marcar(comPonto.replace(/\{(\w+)\}/g, (_, n) => `\u0000${n}\u0001`))
    .replace(/\u0000(\w+)\u0001/g, (_, n) => `<span class="eq-termo eq-num" data-liga="${n}">${valor(n)}</span>`);
}
