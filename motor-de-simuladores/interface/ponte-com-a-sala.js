/* A conversa do simulador embutido (<iframe> da sala) com a página da sala,
   por postMessage:
     sala → simulador   { fonte: "evoluteca-sala", tipo: "pedir-rodada" }
     simulador → sala   { fonte: "evoluteca-simulador", tipo: "rodada", modelo, parametros, semente, resumo }
   Só liga quando a página está dentro de outra (window.parent !== window). */

import { resumoDaRodada } from "./resumo.js";

export function ligarPonteComASala(painel, modelo) {
  if (window.parent === window) return;
  const { ficha, sessao } = painel;

  const enviar = () => {
    if (!sessao.res) return;
    /* targetOrigin "*": o simulador não sabe a origem da sala, e a mensagem não
       leva segredo algum — só os valores e o resumo de uma simulação pública. */
    window.parent.postMessage({
      fonte: "evoluteca-simulador", tipo: "rodada", modelo,
      parametros: { ...sessao.par }, semente: sessao.semente,
      resumo: resumoDaRodada(ficha, sessao.res, sessao.par),
    }, "*");
  };

  sessao.aoSimular(enviar);
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    if (e.data?.fonte === "evoluteca-sala" && e.data.tipo === "pedir-rodada") enviar();
  });
}
