/* Os formulários para montar blocos: um por tipo, sem JSON. `montarEditorDeBloco`
   edita um bloco (a sala usa para mudar um bloco no meio da aula);
   `montarEditorDeLista` edita a lista inteira de um plano, com subir/descer. */

import { criar } from "escrever-html";
import { lista as SIMULADORES } from "../../modelos-de-simulacao/__pacote__.js";
import { TIPOS, ROTULOS_DOS_TIPOS, FORMATOS, ROTULOS_DOS_FORMATOS, criarBloco, novoIdDeBloco, trocarFormato, validarBloco, resumirBloco } from "./blocos.js";
import { carregarFicha, passoDoParametro } from "./ficha-do-modelo.js";

const botao = (texto, aoClicar, classe = "botao-contorno") => {
  const b = criar("button", { type: "button", class: `botao ${classe} botao-mini`, texto });
  b.addEventListener("click", aoClicar);
  return b;
};
const campo = (rotulo, controle) => criar("label", {}, rotulo, controle);
const entrada = (atributos, aoMudar) => {
  const i = criar(atributos.tag ?? "input", { class: "sala-campo", ...atributos });
  if (atributos.value != null && i.tagName === "TEXTAREA") i.value = atributos.value;
  i.addEventListener("input", () => aoMudar(i.value));
  return i;
};
const caixa = (rotulo, marcado, aoMudar) => {
  const c = criar("input", { type: "checkbox", checked: marcado });
  c.checked = marcado;
  c.addEventListener("change", () => aoMudar(c.checked));
  return criar("label", { class: "sala-opcao" }, c, ` ${rotulo}`);
};

/* edita uma cópia de `inicial`; `aoSalvar(bloco)` só é chamado com o bloco válido */
export function montarEditorDeBloco(inicial, { aoSalvar, aoCancelar, rotuloDoBotao = "Salvar bloco" }) {
  let b = structuredClone(inicial);
  const raiz = criar("div", { class: "sala-editor" });
  const erros = criar("p", { class: "aviso", hidden: true });
  const corpo = criar("div");

  const refazer = () => {
    const partes = [campo("Título", entrada({ type: "text", maxlength: "120", value: b.titulo }, (v) => { b.titulo = v; }))];
    if (b.tipo === "texto") {
      partes.push(campo("Texto (linha em branco separa parágrafos; **negrito**, *itálico*, \"- \" para listas)",
        entrada({ tag: "textarea", rows: "6", maxlength: "8000", value: b.texto }, (v) => { b.texto = v; })));
    } else if (b.tipo === "pergunta") partes.push(...formularioDaPergunta());
    else partes.push(...formularioDoSimulador());
    corpo.replaceChildren(...partes);
  };

  function formularioDaPergunta() {
    const formato = criar("select", { class: "sala-campo" }, ...FORMATOS.map((f) => criar("option", { value: f, texto: ROTULOS_DOS_FORMATOS[f], selected: f === b.formato })));
    formato.addEventListener("change", () => { b = trocarFormato(b, formato.value); refazer(); });
    const partes = [
      campo("Enunciado", entrada({ tag: "textarea", rows: "3", maxlength: "1000", value: b.enunciado }, (v) => { b.enunciado = v; })),
      campo("Formato da resposta", formato),
      caixa("Respostas anônimas (a turma não vê quem respondeu)", b.anonima, (v) => { b.anonima = v; }),
    ];
    if (b.formato === "escolha") {
      const opcoes = criar("div", { class: "sala-opcoes" });
      const desenhar = () => opcoes.replaceChildren(...b.opcoes.map((texto, i) => {
        const certa = criar("input", { type: "radio", name: "correta", checked: b.correta === i, title: "opção correta" });
        certa.checked = b.correta === i;
        certa.addEventListener("change", () => { b.correta = i; });
        const t = entrada({ type: "text", maxlength: "200", value: texto, placeholder: `Opção ${i + 1}` }, (v) => { b.opcoes[i] = v; });
        return criar("div", { class: "sala-linha" }, certa, t,
          botao("Remover", () => { if (b.opcoes.length > 2) { b.opcoes.splice(i, 1); if (b.correta === i) delete b.correta; else if (b.correta > i) b.correta--; desenhar(); } }));
      }));
      desenhar();
      partes.push(criar("p", { class: "nota", texto: "A bolinha marca a opção correta (opcional)." }), opcoes,
        botao("Mais uma opção", () => { if (b.opcoes.length < 12) { b.opcoes.push(""); desenhar(); } }),
        botao("Sem opção correta", () => { delete b.correta; desenhar(); }));
    }
    return partes;
  }

  function formularioDoSimulador() {
    const slug = criar("select", { class: "sala-campo" },
      criar("option", { value: "", texto: "(escolha)", selected: !b.simulador }),
      ...SIMULADORES.map((s) => criar("option", { value: s, texto: s, selected: s === b.simulador })));
    const ficha = criar("div", { texto: b.simulador ? "Carregando a ficha…" : "" });
    slug.addEventListener("change", () => { b = { ...b, simulador: slug.value, parametros: {}, travados: [], coletar: [], variar: undefined }; delete b.variar; carregar(); });
    const carregar = () => {
      if (!b.simulador) return ficha.replaceChildren();
      carregarFicha(b.simulador).then((f) => ficha.replaceChildren(...formularioDaFicha(f)), (e) => ficha.replaceChildren(criar("p", { class: "aviso", texto: `Não foi possível ler a ficha: ${e.message}` })));
    };
    carregar();
    return [campo("Simulador", slug), ficha];
  }

  function formularioDaFicha(f) {
    const parametros = f.parametros.map((p) => {
      const definido = p.nome in b.parametros;
      const passo = passoDoParametro(p);
      const numero = criar("input", { type: "number", class: "sala-numero", min: p.min, max: p.max, step: passo, value: b.parametros[p.nome] ?? p.valor, disabled: !definido });
      const regua = criar("input", { type: "range", min: p.min, max: p.max, step: passo, value: b.parametros[p.nome] ?? p.valor, disabled: !definido });
      const aplicar = (v) => { const n = Math.min(p.max, Math.max(p.min, Number(v))); if (Number.isFinite(n)) { b.parametros[p.nome] = n; numero.value = n; regua.value = n; } };
      numero.addEventListener("input", () => aplicar(numero.value));
      regua.addEventListener("input", () => aplicar(regua.value));
      const usar = caixa(`${p.rotulo} (${p.nome})`, definido, (v) => {
        numero.disabled = regua.disabled = !v;
        if (v) aplicar(numero.value); else { delete b.parametros[p.nome]; b.travados = b.travados.filter((t) => t !== p.nome); trava.querySelector("input").checked = false; }
      });
      const trava = caixa("travar", b.travados.includes(p.nome), (v) => {
        b.travados = b.travados.filter((t) => t !== p.nome);
        if (v) { b.travados.push(p.nome); if (!(p.nome in b.parametros)) { usar.querySelector("input").checked = true; usar.querySelector("input").dispatchEvent(new Event("change")); } }
      });
      return criar("div", { class: "sala-linha" }, usar, regua, numero, trava);
    });
    const semente = criar("select", { class: "sala-campo" },
      criar("option", { value: "cada-aluno", texto: "uma para cada aluno (réplicas independentes)", selected: b.semente === "cada-aluno" }),
      criar("option", { value: "turma", texto: "a mesma para a turma toda", selected: b.semente === "turma" }),
      criar("option", { value: "numero", texto: "um número fixo", selected: Number.isInteger(b.semente) }));
    const fixa = criar("input", { type: "number", class: "sala-numero", min: "0", step: "1", value: Number.isInteger(b.semente) ? b.semente : 1, hidden: !Number.isInteger(b.semente) });
    const aplicarSemente = () => { b.semente = semente.value === "numero" ? Math.max(0, Math.round(Number(fixa.value) || 0)) : semente.value; fixa.hidden = semente.value !== "numero"; };
    semente.addEventListener("change", aplicarSemente);
    fixa.addEventListener("input", aplicarSemente);
    const coletar = f.rotulos.map((r) => caixa(r, b.coletar.includes(r), (v) => { b.coletar = b.coletar.filter((x) => x !== r); if (v) b.coletar.push(r); }));
    const nomes = criar("select", { class: "sala-campo" }, ...f.parametros.map((p) => criar("option", { value: p.nome, texto: p.rotulo, selected: p.nome === b.variar?.parametro })));
    const valores = criar("input", { type: "text", class: "sala-campo", placeholder: "Valores, separados por vírgula: 20, 200, 2000", value: (b.variar?.valores ?? []).join(", ") });
    const lerVariar = () => { b.variar = { parametro: nomes.value, valores: valores.value.split(/[,;\s]+/).filter(Boolean).map(Number).filter(Number.isFinite) }; };
    nomes.addEventListener("change", lerVariar);
    valores.addEventListener("input", lerVariar);
    const variar = criar("div", { class: "sala-variar", hidden: !b.variar }, campo("Parâmetro que varia entre os grupos", nomes), campo("Um valor por grupo", valores));
    return [
      criar("h4", { texto: "Parâmetros" }), criar("p", { class: "nota", texto: "Marque os que o bloco fixa; os outros ficam no valor de partida do simulador. \"Travar\" impede o aluno de mexer na régua." }), ...parametros,
      campo("Semente", semente), fixa,
      criar("h4", { texto: "O que cada aluno envia à turma" }), ...(coletar.length ? coletar : [criar("p", { class: "nota", texto: "Este simulador não tem resultados para coletar." })]),
      caixa("Dividir a turma em grupos que variam um parâmetro", Boolean(b.variar), (v) => { variar.hidden = !v; if (v) lerVariar(); else delete b.variar; }), variar,
    ];
  }

  const salvar = botao("Pronto", () => {
    const problemas = validarBloco(b);
    erros.hidden = problemas.length === 0;
    erros.replaceChildren(...problemas.flatMap((p) => [p, criar("br")]));
    if (!problemas.length) aoSalvar(structuredClone(b));
  }, "botao-primario");
  salvar.textContent = rotuloDoBotao;
  refazer();
  raiz.append(corpo, erros, salvar, " ", botao("Cancelar", () => aoCancelar?.()));
  return raiz;
}

/* a lista de blocos de um plano: `aoMudar(blocos)` a cada mudança; devolve { elemento, blocos() } */
export function montarEditorDeLista(inicial, { aoMudar = () => {} } = {}) {
  let blocos = structuredClone(inicial);
  let editando = null;
  const elemento = criar("div", { class: "sala-lista-de-blocos" });
  const mudou = () => { aoMudar(blocos); desenhar(); };
  const mover = (i, d) => { [blocos[i], blocos[i + d]] = [blocos[i + d], blocos[i]]; mudou(); };

  function desenhar() {
    const itens = blocos.map((b, i) => {
      const linha = criar("li", { class: `sala-item sala-item-${b.tipo}${editando === b.id ? " editando" : ""}` },
        criar("div", { class: "sala-item-cabeca" },
          criar("span", { class: "sala-item-numero", texto: String(i + 1) }),
          criar("div", { class: "sala-item-texto" }, criar("span", { class: "sala-item-tipo", texto: ROTULOS_DOS_TIPOS[b.tipo] }), criar("strong", { texto: b.titulo || "(sem título)" }), criar("span", { class: "nota", texto: resumirBloco(b) })),
          criar("div", { class: "sala-item-acoes" },
            botao("↑", () => mover(i, -1)), botao("↓", () => mover(i, 1)), botao(editando === b.id ? "Fechar" : "Editar", () => { editando = editando === b.id ? null : b.id; desenhar(); }),
            botao("Duplicar", () => { blocos.splice(i + 1, 0, { ...structuredClone(b), id: novoIdDeBloco(), titulo: `${b.titulo} (cópia)` }); mudou(); }),
            botao("Apagar", () => { blocos.splice(i, 1); mudou(); }))));
      linha.querySelectorAll("button")[0].disabled = i === 0;
      linha.querySelectorAll("button")[1].disabled = i === blocos.length - 1;
      if (editando === b.id) linha.append(montarEditorDeBloco(b, { aoSalvar: (novo) => { blocos[i] = novo; editando = null; mudou(); }, aoCancelar: () => { editando = null; desenhar(); } }));
      return linha;
    });
    const novo = (tipo) => botao(`+ ${ROTULOS_DOS_TIPOS[tipo]}`, () => {
      const b = criarBloco(tipo, { titulo: ROTULOS_DOS_TIPOS[tipo], ...(tipo === "simulador" ? { simulador: SIMULADORES[0] } : {}) });
      blocos.push(b); editando = b.id; mudou();
    });
    elemento.replaceChildren(
      itens.length ? criar("ol", { class: "sala-itens" }, ...itens) : criar("p", { class: "nota", texto: "Nenhum bloco ainda. Um plano é uma lista de blocos; você muda a ordem quando quiser, inclusive durante a aula." }),
      criar("div", { class: "sala-acrescentar" }, criar("span", { texto: "Acrescentar bloco" }), ...TIPOS.map(novo)));
  }
  desenhar();
  return { elemento, blocos: () => structuredClone(blocos) };
}
