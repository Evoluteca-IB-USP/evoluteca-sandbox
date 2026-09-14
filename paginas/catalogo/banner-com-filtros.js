/* O banner navy: o título, a linha de filtros (buscar · nível · duração), os
   TEMAS em tipo grande — que são ao mesmo tempo filtro e atalho para a seção
   do tema — e, no pé, o lugar onde entra a folha de contato.

   O filtro ESMAECE em vez de esconder: a página não muda de forma, e dá para
   ver de relance o que é de ensino médio e o que é de graduação. */

import { criar } from "escrever-html";
import { plural, doisDigitos } from "portugues";
import { NIVEIS } from "../../modelos-de-simulacao/niveis-e-temas.js";
import { FAIXAS } from "./faixas-de-duracao.js";

export function criarBanner({ grupos, estado, aoMudar, aoEscolherTema, aoLimpar }) {
  const campo = criar("input", {
    class: "filtro-busca", type: "search", placeholder: "Buscar um simulador…",
    "aria-label": "Buscar simulador", autocomplete: "off", value: estado.texto,
  });
  campo.addEventListener("input", () => { estado.texto = campo.value.trim(); aoMudar(); });
  const busca = criar("form", { class: "filtro-form", role: "search" }, campo);
  busca.addEventListener("submit", (ev) => ev.preventDefault());

  /* um filtro = uma linha de palavras: rótulo + opções */
  function filtro(rotulo, chave, lista) {
    const caixa = criar("div", { class: "filtro", role: "group", "aria-label": rotulo },
      criar("span", { class: "filtro-rotulo", texto: rotulo }));
    const botoes = [];
    for (const [valor, texto] of lista) {
      const b = criar("button", { class: "filtro-opcao", type: "button", "data-valor": valor, texto });
      b.addEventListener("click", () => { estado[chave] = valor; aoMudar(); });
      caixa.append(b);
      botoes.push(b);
    }
    return { caixa, botoes, chave };
  }
  const filtros = [
    filtro("Nível", "nivel", [["todos", "todos"], ...Object.entries(NIVEIS).map(([k, n]) => [k, n.toLowerCase()])]),
    filtro("Duração", "tempo", [["todos", "qualquer"], ...Object.entries(FAIXAS).map(([k, f]) => [k, f.rotulo])]),
  ];

  const btLimpar = criar("button", { class: "filtro-limpar", type: "button", texto: "Limpar" });
  btLimpar.addEventListener("click", () => { campo.value = ""; aoLimpar(); campo.focus(); });
  const aviso = criar("p", { class: "filtro-aviso", "aria-live": "polite" });

  /* os temas em tipo grande: filtram e levam à seção */
  const navTemas = criar("nav", { class: "cat-temas", "aria-label": "Temas" });
  for (const g of grupos) {
    const conta = criar("span", { class: "cat-tema-conta" });
    const b = criar("button", { class: "cat-tema", type: "button" },
      criar("span", { class: "cat-tema-nome", texto: g.nome }), conta);
    b.addEventListener("click", () => aoEscolherTema(g));
    g.botaoTema = b;
    g.contaTema = conta;
    navTemas.append(b);
  }

  const esteira = criar("div", { class: "cat-esteira" });
  const no = criar("section", { class: "cat-banner" },
    criar("div", { class: "container" },
      criar("h1", { class: "cat-h1" }, criar("span", { texto: "Simuladores" }), criar("span", { class: "ponto-tema", texto: "." })),
      criar("p", { class: "cat-lede", texto:
        "Todo simulador roda geração a geração no navegador e abre na versão básica; a avançada, com mais parâmetros, fica a um clique." }),
      criar("div", { class: "cat-controles" }, busca, filtros[0].caixa, filtros[1].caixa, aviso),
      navTemas),
    esteira);

  return {
    no, esteira,
    /* marca a opção em vigor de cada filtro */
    marcarFiltros() {
      for (const f of filtros) for (const b of f.botoes) b.setAttribute("aria-pressed", String(b.dataset.valor === estado[f.chave]));
      for (const g of grupos) g.botaoTema.setAttribute("aria-pressed", String(estado.tema === g.tema));
    },
    /* a contagem do tema, em tipo grande */
    contarTema(g) { g.contaTema.textContent = g.dentro; },
    /* "12 simuladores de 30", ou o aviso de que nada passou */
    contar(dentro, total, filtrando) {
      aviso.replaceChildren();
      if (dentro === 0) aviso.append(criar("span", { texto: "Nenhum simulador com esses filtros." }), btLimpar);
      else if (filtrando) aviso.append(criar("span", { texto: `${plural(dentro, "simulador", "simuladores")} de ${total}` }), btLimpar);
      else aviso.append(criar("span", { class: "filtro-total", texto: plural(total, "simulador", "simuladores") }));
    },
    etiquetaDoTema: (g) => `Tema ${doisDigitos(g.indice + 1)} · ${plural(g.dentro, "simulador", "simuladores")}`,
  };
}
