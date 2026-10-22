/* Aba "Derivação": de onde vêm as fórmulas, em poucos passos. Cada passo
   tem uma frase, a fórmula e, embaixo, a mesma fórmula com os números da
   rodada e o resultado; quando a ficha sabe medir, o valor nas réplicas. */

import { criar } from "escrever-html";
import { formulaHtml, substituidaHtml, simbolos } from "../formulas.js";
import { numero } from "../graficos-da-pagina/pecas.js";

export function montarDerivacao(painel, no) {
  const { ficha, sessao } = painel, sims = simbolos(ficha), passos = [];
  no.append(criar("div", { class: "derivacoes" }, ...ficha.derivacoes.map((d) =>
    criar("section", { class: "derivacao" },
      criar("h3", { class: "eq-titulo", texto: d.titulo }),
      criar("ol", { class: "derivacao-passos" }, ...d.passos.map((p) => {
        const valores = criar("p", { class: "eq eq-valores" });
        const medido = p.medido ? criar("p", { class: "derivacao-medido" }) : null;
        passos.push({ p, valores, medido });
        return criar("li", { class: "derivacao-passo" },
          criar("p", { class: "derivacao-texto", texto: p.texto }),
          criar("p", { class: "eq", html: formulaHtml(p.formula, sims) }),
          valores, medido);
      }))))));

  return {
    atualizar(t) {
      const g = Math.floor(t);
      for (const { p, valores, medido } of passos) {
        /* os números entram do lado direito do primeiro "=" ou "≈" */
        const k = p.formula.search(/[=≈]/), sinal = k >= 0 ? p.formula[k] : "=";
        const lado = k >= 0 ? p.formula.slice(k + 1) : p.formula;
        valores.innerHTML = `${sinal} ${substituidaHtml(lado, sims, sessao.par, g, sessao.res)} = <b>${numero(p.valor(sessao.par, g, sessao.res), p.casas ?? 3)}</b>`;
        if (medido) medido.innerHTML = `<span class="eq-medido">nas réplicas, agora <b>${numero(p.medido(sessao.res, g, sessao.par), p.casas ?? 3)}</b></span>`;
      }
    },
  };
}
