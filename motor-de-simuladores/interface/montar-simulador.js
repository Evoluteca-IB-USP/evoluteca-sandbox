/* O motor da Evoluteca. Lê o bloco `meta` de um modelo e monta sozinho a
   página do simulador: o console (cenários, sliders, básico/avançado), o
   laboratório (gráfico + lupa da população + linha do tempo) e o material
   de apoio. Quem escreve um modelo nunca toca neste arquivo.

     montarSimulador(raiz, modulo, textos)
       modulo = { meta, simular, resumo?, aptidoes? }

   Aqui ficam o ESTADO da simulação e a orquestração; cada peça da tela mora
   em controles/ (o que a pessoa manipula) ou em mostradores/ (o que ela lê).
   A seção "Simuladores" da home e o catálogo não passam por aqui — são
   páginas, e moram em paginas/. */

import { criarRng } from "r";
import { criar, icone } from "escrever-html";
import { linhas, barras } from "../graficos/__pacote__.js";
import { alternadorDeModo, controleDeParametro, controleDeSemente, criarCenarios, linhaDoTempo } from "./controles/__pacote__.js";
import { legenda, cabecalhoDoSimulador, criarLupa, materialDeApoio } from "./mostradores/__pacote__.js";
import { numero } from "portugues";
import { formatarValor } from "./formatar-valor-de-parametro.js";
import { lerCores } from "./ler-cores.js";

const novaSemente = () => 1 + Math.floor(Math.random() * 99999); // só a semente é "de verdade" aleatória

export function montarSimulador(raiz, modulo, textos = {}) {
  const { meta, simular } = modulo;
  const saida = meta.saida;
  const eLinhas = saida.tipo === "linhas";
  const unidade = eLinhas ? saida.x || "geração" : "indivíduos";
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = lerCores();

  const padroes = {};
  for (const p of meta.parametros) padroes[p.nome] = p.valor;
  const valores = { ...padroes };

  let modo = "basico";
  let semente = novaSemente();
  let resultado = null;
  let T = 0;                 // último instante da linha do tempo (gerações ou indivíduos)
  let cursor = 0;            // instante mostrado
  let animacao = null;       // { t0, de } enquanto reproduz
  let velocidade = 1;
  let referencia = null;     // rodada guardada para comparar: { series, rotulo }
  let cenarioAtivo = null;

  /* ===== console: cenários, sliders, ações ===== */
  const modos = alternadorDeModo(alternar);
  const btRodar = criar("button", { class: "botao botao-primario", type: "button" }, icone("rodar"), criar("span", { texto: "Rodar de novo" }));
  const btRef = eLinhas ? criar("button", { class: "botao botao-contorno", type: "button", texto: "Guardar como referência" }) : null;

  const cenarios = criarCenarios(meta, aplicarCenario);
  const controles = criar("div", { class: "controles" });
  const consoleEl = criar("section", { class: "console", "aria-label": "Parâmetros da simulação" },
    criar("div", { class: "console-cabeca" },
      criar("div", { class: "console-titulo" }, criar("h2", { texto: "Parâmetros" }), modos.no),
      criar("div", { class: "console-acoes" }, btRodar, btRef)),
    cenarios.no, cenarios.dica, controles);

  function desmarcarCenario() {
    if (!cenarioAtivo) return;
    cenarioAtivo = null;
    cenarios.desmarcar();
  }

  function aplicarCenario(c) {
    Object.assign(valores, padroes, c.valores);
    cenarioAtivo = c;
    montarControles();
    cenarios.montar(modo, cenarioAtivo);
    novaRodada();
  }

  function montarControles() {
    controles.innerHTML = "";
    for (const p of meta.parametros) {
      if (p.avancado && modo === "basico") { valores[p.nome] = p.valor; continue; }
      controles.append(controleDeParametro(p, valores, () => { desmarcarCenario(); agendarRodada(); }));
    }
    if (modo === "avancado") {
      controles.append(controleDeSemente(semente, (v) => { semente = v; parar(); simularAgora(); irPara(T); }));
    }
  }

  function alternar(novo) {
    modo = novo;
    modos.atualizar(modo);
    if (cenarioAtivo?.avancado && modo === "basico") cenarioAtivo = null;
    montarControles();
    cenarios.montar(modo, cenarioAtivo);
    parar();
    simularAgora();
    irPara(T);
  }

  btRodar.addEventListener("click", novaRodada);
  if (btRef) {
    btRef.addEventListener("click", () => {
      referencia = referencia ? null : { series: resultado.map((s) => s.slice()), rotulo: descreverValores() };
      btRef.textContent = referencia ? "Tirar referência" : "Guardar como referência";
      btRef.classList.toggle("botao-ativo", !!referencia);
      desenhar();
    });
  }

  function descreverValores() {
    return meta.parametros
      .filter((p) => !(p.avancado && modo === "basico"))
      .map((p) => `${p.simbolo || p.nome} = ${formatarValor(valores[p.nome], p)}`)
      .join(" · ");
  }

  /* ===== laboratório: gráfico + lupa + linha do tempo ===== */
  const canvas = criar("canvas", {
    class: "lab-grafico",
    role: "img",
    "aria-label": `Gráfico do simulador ${meta.titulo}: ${saida.y || "resultado"}`,
  });
  const legendaGrafico = criar("div", { class: "lab-legenda" });
  const palco = criar("div", { class: "lab-palco" }, canvas, legendaGrafico);
  const lupa = criarLupa({ cores, saida, unidade, aptidoesDe: modulo.aptidoes });

  const tempo = linhaDoTempo({
    alternarToque: () => (animacao ? parar() : tocar()),
    voltarAoInicio: () => { parar(); irPara(0); },
    avancarUmPasso: () => { parar(); irPara(cursor + 1); },
    irPara: (g) => { parar(); irPara(g); },
    mudarVelocidade: (v) => {
      velocidade = v;
      if (animacao) animacao = { t0: performance.now(), de: cursor };
    },
  });
  const resumo = criar("p", { class: "lab-resumo", "aria-live": "polite" });
  const lab = criar("section", { class: "lab", "aria-label": "Simulação" },
    criar("div", { class: "lab-corpo" }, palco, lupa.no), tempo.no, resumo);

  /* --- simulação e linha do tempo --- */
  function simularAgora() {
    resultado = simular({ ...valores }, criarRng(semente));
    if (eLinhas) T = Math.max(1, Math.max(...resultado.map((s) => s.length)) - 1);
    else T = resultado.individuos ? resultado.individuos.length : 0;
    tempo.definirTotal(T);
  }

  function irPara(g) {
    cursor = Math.max(0, Math.min(T, g));
    tempo.posicionar(cursor);
    desenhar();
  }

  let pedidoDesenho = null;
  function agendarRodada() {           // junta arrastes rápidos do slider numa rodada só
    if (pedidoDesenho) return;
    pedidoDesenho = requestAnimationFrame(() => {
      pedidoDesenho = null;
      parar();
      simularAgora();
      irPara(T);
    });
  }

  function novaRodada() {
    parar();
    semente = novaSemente();
    const campo = controles.querySelector("#par-semente");
    if (campo) campo.value = semente;
    simularAgora();
    if (reduzMovimento || T === 0) irPara(T);
    else { irPara(0); tocar(); }
  }

  const duracao = () => Math.min(8000, Math.max(2200, T * 25)) / velocidade;

  function tocar() {
    if (T === 0) return;
    if (cursor >= T) irPara(0);
    animacao = { t0: performance.now(), de: cursor };
    tempo.mostrarTocando(true);
    requestAnimationFrame(quadro);
  }
  function quadro(agora) {
    if (!animacao) return;
    const alvo = animacao.de + Math.floor(((agora - animacao.t0) / duracao()) * T);
    irPara(Math.min(T, alvo));
    if (cursor >= T) { parar(); return; }
    requestAnimationFrame(quadro);
  }
  function parar() {
    animacao = null;
    tempo.mostrarTocando(false);
  }

  /* --- desenho --- */
  function desenhar() {
    if (eLinhas) desenharLinhas();
    else desenharBarras();
    tempo.leitura.textContent = T ? `${unidade} ${numero(cursor)} de ${numero(T)}` : "";
    resumo.textContent = cursor >= T && modulo.resumo ? modulo.resumo(resultado, { ...valores }) : "";
  }

  function desenharLinhas() {
    const refs = (saida.referencias || []).map((r) => ({
      valor: r.parametro != null ? valores[r.parametro] : r.valor,
      rotulo: r.rotulo,
    }));
    linhas(canvas, resultado, {
      x: saida.x, y: saida.y, ylim: saida.ylim,
      ate: cursor, foco: 0, marcador: true, distribuicao: true,
      fantasmas: referencia?.series, referencias: refs,
    });
    const n = resultado.length;
    const itens = n > 1
      ? [{ cor: cores.alelo1, tipo: "linha", texto: `população em foco (1 de ${n})` },
         { cor: cores.feixe, tipo: "linha", texto: n > 4 ? `outras ${n - 1} réplicas` : "outras réplicas" }]
      : [{ cor: cores.alelo1, tipo: "linha", texto: saida.y || "resultado" }];
    for (const r of refs) if (r.rotulo) itens.push({ tipo: "tracejado", texto: r.rotulo });
    if (referencia) itens.push({ cor: cores.fantasma, tipo: "linha", texto: `referência: ${referencia.rotulo}` });
    legenda(legendaGrafico, itens);
    lupa.mostrarPopulacao({ resultado, cursor, valores });
  }

  function desenharBarras() {
    const ind = resultado.individuos;
    let agora = resultado;
    if (ind && cursor < T) {                         // amostra parcial: recalcula o último grupo
      const k = cursor;
      const cont = new Array(resultado.rotulos.length).fill(0);
      for (let i = 0; i < k; i++) cont[ind[i]]++;
      const grupos = resultado.grupos.map((g, j) =>
        j === resultado.grupos.length - 1
          ? { nome: `amostra (${numero(k)} de ${numero(T)})`, valores: cont.map((c) => (k ? c / k : 0)) }
          : g);
      agora = { ...resultado, grupos };
    }
    barras(canvas, agora, { y: saida.y, ylim: saida.ylim, legenda: false });
    legenda(legendaGrafico, agora.grupos.length > 1
      ? [{ tipo: "contorno", borda: cores.feixe, texto: agora.grupos[0].nome },
         ...agora.grupos.slice(1).map((g) => ({ cor: cores.alelo1, texto: g.nome }))]
      : []);
    lupa.mostrarAmostra({ resultado, cursor, total: T });
  }

  /* ===== montagem final ===== */
  const { material, professor } = materialDeApoio(textos);
  raiz.innerHTML = "";
  raiz.append(cabecalhoDoSimulador(meta), consoleEl, lab, material);
  if (professor) raiz.append(professor);
  document.title = `${meta.titulo} · Evoluteca`;

  montarControles();
  cenarios.montar(modo, cenarioAtivo);
  simularAgora();
  if (reduzMovimento || T === 0) irPara(T);
  else { irPara(0); tocar(); }

  let atrasoRedesenho = null;
  window.addEventListener("resize", () => {
    clearTimeout(atrasoRedesenho);
    atrasoRedesenho = setTimeout(desenhar, 150);
  });
}
