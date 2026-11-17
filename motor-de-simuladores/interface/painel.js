/* O bloco de cima da página, que cabe numa tela: controles à esquerda, os
   gráficos da ficha em abas (trajetórias, vidros, distribuição…) e a linha
   do tempo. Guarda o que o painel inteiro compartilha: a geração mostrada,
   a réplica escolhida (`escolha`) ou sob o mouse (`sobre`), o modo e a
   escala do tempo. */

import { criar } from "escrever-html";
import { criarSessao } from "./sessao.js";
import { montarAreas } from "./areas-do-painel.js";
import { reguaLinha } from "./controles/regua-linha.js";
import { linhaDoTempo } from "./controles/linha-do-tempo.js";
import { montarControles } from "./controles/controles-do-painel.js";
import { ligarProjetor } from "./controles/projetor.js";

/** `inicial` vem da URL (parametros-da-url.js): { valores, semente, travados }; sem ele, a ficha como sempre foi */
export function montarPainel(ficha, raiz, inicial = {}) {
  const sessao = criarSessao(ficha), ouvintes = [];
  Object.assign(sessao.par, inicial.valores);
  if (inicial.semente !== undefined) sessao.semente = inicial.semente;
  const travados = new Set(inicial.travados);
  const painel = { ficha, sessao, t: 0, fantasmas: [], tempo: null, escolha: null, sobre: null, avancado: false, puxador: false, mira: null };
  const anda = ficha.parametros.some((p) => p.tempo);

  if (anda) {
    painel.tempo = linhaDoTempo({ geracoes: sessao.total(), velocidade: ficha.velocidade && ((t) => ficha.velocidade(t, sessao.res, sessao.par)), aoMudar: (v) => { painel.t = v; painel.desenhar?.(); } });
    raiz.querySelector("#tempo").append(painel.tempo);
  }
  const reguas = ficha.parametros.map((p) => reguaLinha(p, sessao.par[p.nome], (v) => {
    sessao.definir(p.nome, v);
    if (p.tempo) painel.tempo.mudarTotal(v);
  }, { travada: travados.has(p.nome) }));

  /* sem nada marcado como avançado na ficha, não há o que escolher: a página mostra tudo, como antes */
  const temModo = ficha.parametros.some((p) => p.avancado) || ficha.graficos.some((g) => g.avancado || g.legenda?.some((item) => item.avancado)) || Boolean(ficha.vidros?.esperado);
  const controles = montarControles(painel, raiz.querySelector("#controles"), reguas, {
    temModo,
    aoMudarModo: (sim) => {
      painel.avancado = sim;
      raiz.classList.toggle("modo-avancado", sim);
      if (!sim) {
        controles?.aoSairDoAvancado();
        if (ficha.graficos[painel.indice]?.avancado) painel.mostrarAba(0);
      }
      marcarTempo();
      painel.desenhar();
    },
  });

  const estado = () => ({
    res: sessao.res, par: sessao.par, t: painel.t, fantasmas: painel.fantasmas, escolha: painel.escolha, sobre: painel.sobre,
    avancado: painel.avancado, puxador: painel.puxador, mira: painel.mira,
    trechos: ficha.faixasDeTempo?.(sessao.par) ?? [],
  });
  const { areas, abas, miniaturas } = montarAreas(painel, raiz, estado);
  painel.principal = areas[0];
  painel.indice = 0;

  function marcarTempo() {
    if (!painel.tempo || !sessao.res) return;
    painel.tempo.marcar((ficha.marcos?.(sessao.res, sessao.par) ?? []).filter((m) => painel.avancado || !m.conta));
  }

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
  /** um parâmetro só, vindo de fora das réguas (o ponto arrastado no gráfico, o vidro a mais) */
  painel.definir = (nome, v) => {
    const i = ficha.parametros.findIndex((p) => p.nome === nome);
    if (i < 0 || travados.has(nome) || sessao.par[nome] === v) return;
    reguas[i].definir(v);
    sessao.definir(nome, v);
    if (ficha.parametros[i].tempo) painel.tempo.mudarTotal(v);
  };
  painel.definirModo = (sim) => { if (temModo && sim !== painel.avancado) controles.modo.marcar(sim); };
  painel.mostrarAba = (k) => abas[k]?.click();
  painel.escolher = (i) => { painel.escolha = i; painel.desenhar(); };
  painel.passar = (i) => { if (painel.sobre !== i) { painel.sobre = i; painel.desenhar(); } };

  painel.aoDesenhar = (f) => ouvintes.push(f);
  painel.aoDesenhar(() => miniaturas.forEach((m) => m.redesenhar()));
  painel.desenhar = () => {
    if (!sessao.res) return;
    painel.principal.redesenhar();
    ouvintes.forEach((f) => f(painel.t));
  };
  painel.comecar = () => {
    sessao.aoSimular(() => {
      const n = ficha.graficos[0].series?.(sessao.res).length ?? 0;
      if (painel.escolha !== null && painel.escolha >= n) painel.escolha = null;
      marcarTempo();
      painel.tempo?.rodadaNova();
      painel.desenhar();
    });
    controles.modo.marcar(!temModo);
    sessao.simular();
    painel.tempo?.tocar(true);
  };
  ligarProjetor(raiz, painel);
  return painel;
}
