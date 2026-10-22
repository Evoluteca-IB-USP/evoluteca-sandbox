/* Monta a página de um simulador a partir da ficha do modelo
   (modelos-de-simulacao/<slug>/ficha.js): o painel em cima e, embaixo, a
   trilha de ferramentas que andam junto com a simulação. Cada ferramenta
   só aparece se a ficha tiver o que ela precisa. Quem escreve um modelo
   escreve a ficha; não escreve interface. */

import { montarPainel } from "./painel.js";
import { ligarAoPassarOMouse } from "./sessao.js";
import { montarTempoFlutuante } from "./controles/tempo-flutuante.js";
import { montarAbas } from "./abas/abas.js";
import { montarCaderno } from "./abas/caderno.js";
import { montarDerivacao } from "./abas/derivacao.js";
import { montarLupa } from "./abas/lupa.js";
import { montarDados } from "./abas/dados.js";

export function montarSimulador(raiz, ficha) {
  raiz.querySelector("#titulo").firstChild.textContent = ficha.titulo;
  document.title = `${ficha.titulo} · Evoluteca`;

  const painel = montarPainel(ficha, raiz);
  montarAbas(painel, raiz.querySelector("#ferramentas"), [
    { rotulo: "Caderno", montar: (no) => montarCaderno(painel, no) },
    ficha.derivacoes && { rotulo: "De onde vêm as fórmulas", montar: (no) => montarDerivacao(painel, no) },
    ficha.lupa && { rotulo: ficha.lupa.aba, montar: (no) => montarLupa(painel, no) },
    { rotulo: "Dados para o R", montar: (no) => montarDados(painel, no) },
  ].filter(Boolean));
  if (painel.tempo) montarTempoFlutuante(painel, raiz.querySelector("#tempo"));
  painel.comecar();
  ligarAoPassarOMouse(raiz);
}
