/* Aba "Caderno": cada rodada que o aluno faz (mexer num slider e soltar, ou
   sortear de novo) vira uma coluna, com os valores e o resumo da ficha. A
   célula que mudou fica em âmbar; quando duas coisas mudam de uma vez, a
   coluna avisa. A rodada anterior aparece em cinza no gráfico; clicar no
   número de uma coluna volta àquela rodada. */

import { criar } from "escrever-html";
import { formulaHtml, simbolos } from "../formulas.js";
import { formatar } from "../escala.js";

const VISIVEIS = 7, ESPERA = 700;

export function montarCaderno(painel, no) {
  const { ficha, sessao } = painel, sims = simbolos(ficha), rodadas = [];
  let atual = -1, restaurando = false, espera = null;
  const nome = (p) => (p.simbolo ? formulaHtml(`{${p.nome}}`, sims) : p.rotulo.toLowerCase());
  const tabela = criar("div", { class: "caderno" });
  no.append(
    criar("p", { class: "abas-nota", html: `Cada rodada que você faz entra numa coluna. <span class="caderno-amostra"></span>Em cinza no gráfico, a rodada anterior.` }),
    tabela);

  const mudancas = (de, para) => ficha.parametros.filter((p) => de.valores[p.nome] !== para.valores[p.nome]);

  function registrar() {
    const nova = { valores: { ...sessao.par }, semente: sessao.semente, res: sessao.res };
    const daVez = rodadas[atual];
    if (daVez && !mudancas(daVez, nova).length && daVez.semente === nova.semente) return;
    const anterior = rodadas.at(-1), mudou = anterior ? mudancas(anterior, nova) : [];
    nova.titulo = !anterior ? "início" : mudou.length ? mudou.map((p) => nome(p)).join(" e ") : "outro sorteio";
    nova.aviso = mudou.length > 1;
    nova.mudou = new Set(mudou.map((p) => p.nome));
    rodadas.push(nova);
    escolher(rodadas.length - 1, false);
  }

  function escolher(k, restaurar = true) {
    atual = k;
    painel.fantasmas.length = 0;
    if (k > 0) painel.fantasmas.push(rodadas[k - 1]);
    if (restaurar) {
      restaurando = true;
      painel.definirValores(rodadas[k].valores, { semente: rodadas[k].semente });
      restaurando = false;
    }
    escrever();
    painel.desenhar();
  }

  function escrever() {
    const inicio = Math.max(0, rodadas.length - VISIVEIS), vistas = rodadas.slice(inicio);
    const colunas = `150px repeat(${VISIVEIS}, 1fr)`;
    const fila = (classe, rotulo, celulas) => criar("div", { class: `caderno-fila ${classe}`, style: `grid-template-columns: ${colunas}` },
      criar("span", { class: "caderno-rotulo", html: rotulo }), ...celulas);

    const cabeca = fila("caderno-cabeca", "", vistas.map((r, i) => {
      const b = criar("button", { type: "button", class: `caderno-no${inicio + i === atual ? " atual" : ""}`, texto: inicio + i + 1, "aria-label": `Voltar à rodada ${inicio + i + 1}` });
      b.addEventListener("click", () => escolher(inicio + i));
      return criar("span", { class: "caderno-celula" }, b);
    }));
    const oQueMudou = fila("caderno-mudou", "o que mudou", vistas.map((r) =>
      criar("span", { class: `caderno-celula${r.aviso ? " aviso" : ""}`, html: r.aviso ? `${r.titulo}<small>duas de uma vez</small>` : r.titulo })));
    const filas = [
      ...ficha.parametros.map((p) => fila("", nome(p), vistas.map((r, i) =>
        criar("span", { class: `caderno-celula${r.mudou.has(p.nome) ? " mudou" : ""}${inicio + i === atual ? " atual" : ""}`, texto: formatar(p, r.valores[p.nome]) })))),
      ...(ficha.resumo ?? []).map((m) => fila("caderno-resumo", m.rotulo, vistas.map((r, i) =>
        criar("span", { class: `caderno-celula${inicio + i === atual ? " atual" : ""}`, texto: m.valor(r.res, r.valores) })))),
    ];
    tabela.replaceChildren(cabeca, oQueMudou, ...filas);
  }

  /* a rodada só entra quando o aluno para de mexer */
  sessao.aoSimular(() => {
    if (restaurando) return;
    clearTimeout(espera);
    espera = setTimeout(registrar, rodadas.length ? ESPERA : 0);
  });

  return { atualizar: () => {} };
}
