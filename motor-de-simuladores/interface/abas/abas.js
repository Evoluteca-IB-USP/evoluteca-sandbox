/* As ferramentas sob o painel, escolhidas numa trilha de passos: cada nó é
   uma ferramenta. Cada uma é { rotulo, montar(no) } e `montar` devolve
   { atualizar(t) }; só a ferramenta à vista se atualiza a cada quadro, e a
   que acaba de aparecer se atualiza na hora. */

import { criar } from "escrever-html";
import { trilhaDePassos } from "./trilha-de-passos.js";

export function montarAbas(painel, destino, abas) {
  const corpo = criar("div", { class: "abas-corpo" });
  const montadas = abas.map((aba) => {
    const no = criar("div", { class: "abas-painel", role: "tabpanel" });
    corpo.append(no);
    return { rotulo: aba.rotulo, no, ...aba.montar(no) };
  });
  const trilha = trilhaDePassos({ entradas: montadas.map((m) => ({ titulo: m.rotulo })), semente: 41, aoEscolher: mostrar });
  destino.append(criar("div", { class: "abas-trilha", role: "tablist" }, trilha), corpo);

  let ativa = 0;
  function mostrar(i) {
    ativa = i;
    montadas.forEach((m, k) => { m.no.hidden = k !== i; });
    if (painel.sessao.res) montadas[i].atualizar(painel.t);
  }

  painel.aoDesenhar((t) => montadas[ativa].atualizar(t));
  mostrar(0);
}
