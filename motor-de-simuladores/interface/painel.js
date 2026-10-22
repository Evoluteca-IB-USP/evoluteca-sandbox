/* O bloco de cima da página: réguas à esquerda, o primeiro gráfico da ficha
   e, se a ficha anda no tempo, a linha do tempo. Devolve a sessão e um jeito
   de ouvir cada redesenho, para as abas de baixo andarem junto. */

import { criarSessao } from "./sessao.js";
import { areaDeSaida } from "./graficos-da-pagina/tipos.js";
import { reguaLinha } from "./controles/regua-linha.js";
import { linhaDoTempo, sortearDeNovo } from "./controles/linha-do-tempo.js";

export function montarPainel(ficha, raiz) {
  const sessao = criarSessao(ficha), ouvintes = [];
  const painel = { ficha, sessao, t: 0, fantasmas: [], tempo: null };
  const anda = ficha.parametros.some((p) => p.tempo);

  if (anda) {
    painel.tempo = linhaDoTempo({ geracoes: sessao.total(), aoMudar: (v) => { painel.t = v; painel.desenhar?.(); } });
    raiz.querySelector("#tempo").append(painel.tempo);
  }
  const reguas = ficha.parametros.map((p) => reguaLinha(p, sessao.par[p.nome], (v) => {
    sessao.definir(p.nome, v);
    if (p.tempo) painel.tempo.mudarTotal(v);
  }));
  raiz.querySelector("#controles").append(...reguas);
  if (!ficha.deterministico) raiz.querySelector("#controles").append(sortearDeNovo(() => sessao.sortear()));

  const canvas = document.createElement("canvas");
  canvas.className = "painel-principal";
  raiz.querySelector("#principal").append(canvas);
  painel.principal = areaDeSaida(canvas, ficha.graficos[0], () => ({ res: sessao.res, par: sessao.par, t: painel.t, fantasmas: painel.fantasmas }));

  /** leva vários valores de uma vez aos parâmetros (os que faltam voltam ao padrão da ficha) e simula uma vez */
  painel.definirValores = (valores, { semente } = {}) => {
    ficha.parametros.forEach((p, i) => {
      sessao.par[p.nome] = valores[p.nome] ?? p.valor;
      reguas[i].definir(sessao.par[p.nome]);
    });
    if (semente !== undefined) sessao.semente = semente;
    painel.tempo?.mudarTotal(sessao.total());
    sessao.simular();
  };

  painel.aoDesenhar = (f) => ouvintes.push(f);
  painel.desenhar = () => {
    if (!sessao.res) return;
    painel.principal.redesenhar();
    ouvintes.forEach((f) => f(painel.t));
  };
  painel.comecar = () => {
    sessao.aoSimular(painel.desenhar);
    sessao.simular();
    painel.tempo?.tocar(true);
  };
  return painel;
}
