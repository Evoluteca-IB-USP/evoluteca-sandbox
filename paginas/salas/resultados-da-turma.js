/* Desenha os resultados de um bloco (barras de DOM, sem biblioteca): escolha em
   barras, número em histograma com a média, resposta aberta em lista e o
   simulador em quadros de valores coletados. Serve ao professor (ao vivo) e aos
   alunos (quando o bloco é revelado). */

import { criar } from "escrever-html";
import { agregarBloco } from "./agregar.js";

const formato = (n) => (n == null ? "—" : Number(n.toPrecision(4)).toLocaleString("pt-BR"));

function barras(itens) {
  const maior = Math.max(1, ...itens.map((i) => i.n));
  return criar("div", { class: "sala-barras" }, ...itens.map((i) =>
    criar("div", { class: `sala-barra${i.correta ? " correta" : ""}` },
      criar("span", { class: "sala-barra-rotulo", texto: i.rotulo }),
      criar("span", { class: "sala-barra-trilha" }, criar("span", { class: "sala-barra-cheia", style: `width:${(i.n / maior) * 100}%` })),
      criar("span", { class: "sala-barra-n", texto: String(i.n) }))));
}

function histograma(faixas) {
  const maior = Math.max(1, ...faixas.map((f) => f.n));
  return criar("div", { class: "sala-histograma" }, ...faixas.map((f) =>
    criar("div", { class: "sala-coluna", title: `${formato(f.de)}${f.ate !== f.de ? ` a ${formato(f.ate)}` : ""}: ${f.n}` },
      criar("span", { class: "sala-coluna-n", texto: f.n ? String(f.n) : "" }),
      criar("span", { class: "sala-coluna-barra", style: `height:${(f.n / maior) * 100}%` }),
      criar("span", { class: "sala-coluna-rotulo", texto: formato(f.de) }))));
}

function quadro(titulo, q) {
  return criar("div", { class: "sala-quadro" },
    criar("h4", { texto: `${titulo} · ${q.total} rodada${q.total === 1 ? "" : "s"}` }),
    criar("table", { class: "sala-tabela" },
      criar("thead", {}, criar("tr", {}, ...["Resultado", "Soma", "Média", "Mín.–máx.", "Respostas"].map((t) => criar("th", { texto: t })))),
      criar("tbody", {}, ...q.itens.map((i) => criar("tr", {},
        criar("td", { texto: i.rotulo }), criar("td", { texto: i.n ? formato(i.soma) : "—" }), criar("td", { texto: formato(i.media) }),
        criar("td", { texto: i.n ? `${formato(i.minimo)}–${formato(i.maximo)}` : "—" }), criar("td", { texto: String(i.respostas) }))))));
}

/* `envios`: os do bloco; opções: `destaque` (id), `aoDestacar(id | null)` (só o professor passa), `mostrarNomes` */
export function desenharResultado(destino, bloco, envios, { destaque = null, aoDestacar = null, mostrarNomes = true } = {}) {
  const r = agregarBloco(bloco, envios, destaque);
  const rodape = (texto) => criar("p", { class: "nota", texto });
  if (r.tipo === "texto") return destino.replaceChildren();
  if (r.total === 0) return destino.replaceChildren(rodape("Nenhuma resposta ainda."));
  if (r.tipo === "escolha") {
    destino.replaceChildren(barras(r.contagens.map((c) => ({ rotulo: c.texto, n: c.n, correta: c.correta }))),
      rodape(`${r.total} resposta${r.total === 1 ? "" : "s"}${r.acertos != null ? ` · ${r.acertos} certa${r.acertos === 1 ? "" : "s"}` : ""}`));
  } else if (r.tipo === "numero") {
    destino.replaceChildren(histograma(r.histograma),
      rodape(`${r.total} resposta${r.total === 1 ? "" : "s"} · média ${formato(r.media)} · mediana ${formato(r.mediana)} · de ${formato(r.minimo)} a ${formato(r.maximo)}`));
  } else if (r.tipo === "aberta") {
    destino.replaceChildren(criar("ul", { class: "sala-respostas" }, ...r.lista.map((e) => {
      const botao = aoDestacar ? criar("button", { type: "button", class: "botao botao-contorno botao-mini", texto: e.destaque ? "Tirar destaque" : "Destacar" }) : null;
      botao?.addEventListener("click", () => aoDestacar(e.destaque ? null : e.id));
      return criar("li", { class: e.destaque ? "destaque" : null },
        criar("span", { texto: e.texto }), mostrarNomes && e.nome ? criar("small", { class: "nota", texto: ` — ${e.nome}` }) : null, botao ? " " : null, botao);
    })));
  } else {
    destino.replaceChildren(
      quadro("A turma", r.geral),
      ...(r.grupos ?? []).map((g) => quadro(`Grupo ${g.indice + 1} (${g.parametro} = ${formato(g.valor)})`, g)),
    );
  }
}
