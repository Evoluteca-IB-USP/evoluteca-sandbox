/* Ferramenta "Por dentro": o que a ficha conta na população (ou na amostra)
   no instante mostrado, um ponto por unidade, agrupados por tipo — os alelos
   da réplica em destaque, os indivíduos sorteados. Com muitos, cada ponto
   passa a valer alguns. A ficha diz o nome da aba, a frase e a cor de cada
   grupo (navy, amarelo ou teal). */

import { criar } from "escrever-html";
import { grafico } from "../graficos-da-pagina/pecas.js";
import { NAVY, AMARELO, TEAL } from "../cores.js";

const CORES = { navy: NAVY, amarelo: AMARELO, teal: TEAL }, MAXIMO = 600;

export function montarLupa(painel, no) {
  const { ficha, sessao } = painel;
  const canvas = criar("canvas", { class: "lupa-canvas" });
  const contas = criar("div", { class: "lupa-contas" });
  no.append(criar("div", { class: "lupa" }, canvas, contas));
  let grupos = [];

  const g = grafico(canvas, { xlim: [0, 1], ylim: [0, 1], margem: { esq: 0, dir: 0, topo: 0, base: 0 }, desenhar: (g) => {
    const total = grupos.reduce((s, x) => s + x.n, 0);
    if (!total) return;
    const porPonto = Math.ceil(total / MAXIMO), pontos = grupos.map((x) => Math.round(x.n / porPonto));
    const n = pontos.reduce((a, b) => a + b, 0);
    const colunas = Math.min(Math.floor(g.W / 22) || 1, Math.ceil(Math.sqrt((n * g.W) / g.H))), passo = Math.min(22, g.W / colunas, g.H / Math.ceil(n / colunas));
    let k = 0;
    pontos.forEach((quantos, i) => {
      g.ctx.fillStyle = CORES[grupos[i].cor];
      for (let j = 0; j < quantos; j++, k++) {
        g.ctx.beginPath();
        g.ctx.arc((k % colunas + 0.5) * passo, (Math.floor(k / colunas) + 0.5) * passo, passo * 0.36, 0, 2 * Math.PI);
        g.ctx.fill();
      }
    });
  } });

  return {
    atualizar(t) {
      grupos = ficha.lupa.contar(sessao.res, sessao.par, Math.floor(t));
      const total = grupos.reduce((s, x) => s + x.n, 0), porPonto = Math.ceil(total / MAXIMO);
      contas.replaceChildren(
        criar("p", { class: "abas-nota", texto: ficha.lupa.legenda(sessao.par, Math.floor(t)) }),
        ...grupos.map((x, i) => criar("p", { class: "lupa-conta" },
          criar("span", { class: "lupa-amostra", style: `background: ${CORES[x.cor]}` }),
          criar("b", { texto: x.n.toLocaleString("pt-BR") }), ` ${x.rotulo}`,
          criar("small", { texto: `${Math.round((x.n / total) * 100)}%` }))),
        criar("p", { class: "abas-nota", texto: porPonto > 1 ? `Cada ponto vale ${porPonto}.` : `${total.toLocaleString("pt-BR")} ao todo.` }));
      g.redesenhar();
    },
  };
}
