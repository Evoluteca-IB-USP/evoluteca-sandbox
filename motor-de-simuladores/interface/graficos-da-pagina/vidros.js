/* A aba dos vidros, no lugar do gráfico: uma população por vidro, na mesma
   geração que a linha do tempo mostra. Ao lado, a régua dos destinos e o
   vidro em foco com a conta das cópias. Com um vidro
   escolhido, a área grande pode trocar a grade por uma cena: o sorteio da
   geração seguinte, as cópias juntadas em indivíduos ou uma cópia seguida
   no tempo. A escolha (painel.escolher) é a mesma das outras abas. */

import { criar } from "escrever-html";
import { grafico } from "./pecas.js";
import { vidro, vagaDeVidro, grade, copiasPorPonto } from "./desenho-dos-vidros.js";
import { cenaDoSorteio } from "./cena-do-sorteio.js";
import { cenaDosIndividuos } from "./cena-dos-individuos.js";
import { cenaDeUmaCopia, LIMITE_DE_COPIAS } from "./cena-de-uma-copia.js";

const ACOES = [
  ["sorteio", "ver o sorteio da geração seguinte"],
  ["individuos", "juntar as cópias em indivíduos"],
  ["copia", "seguir uma cópia no tempo"],
];

export function montarVidros(painel, no, numero) {
  const { ficha, sessao } = painel, spec = ficha.vidros, trajetorias = ficha.graficos[0];
  const parametro = ficha.parametros.find((p) => p.nome === spec.acrescentar);
  const titulo = criar("p", { class: "painel-vidros-titulo" });
  const canvas = criar("canvas", { class: "painel-vidros-grade", "aria-label": "as populações, uma por círculo" });
  const barra = criar("div", { class: "painel-vidros-barra" });
  const contas = criar("div", { class: "painel-vidros-contas" });
  const esperado = criar("p", { class: "painel-vidros-esperado so-avancado" });
  const quem = criar("p", { class: "painel-vidros-quem" });
  const zoom = criar("canvas", { class: "painel-vidros-zoom" });
  const conta = criar("div", { class: "painel-vidros-conta" });
  const acoes = criar("div", { class: "painel-vidros-acoes" });
  const dica = criar("p", { class: "painel-vidros-dica", texto: spec.dica });
  const legenda = criar("p", { class: "painel-legenda" });
  no.classList.add("painel-vidros");
  no.append(
    criar("div", { class: "painel-vidros-esquerda" }, titulo, canvas),
    criar("div", { class: "painel-vidros-direita" },
      criar("div", { class: "painel-vidros-destino" }, barra, contas, esperado),
      criar("div", { class: "painel-vidros-foco" }, quem, criar("div", { class: "painel-vidros-par" }, zoom, conta), acoes),
      dica));

  let disposicao = null, vaga = false, sobreVaga = false, kGrade = 1, kZoom = null, cena = null;
  const t = () => Math.floor(painel.t);
  const n = () => sessao.res ? trajetorias.series(sessao.res).length : 0;
  const contarNa = (i, g) => spec.contar(sessao.res, sessao.par, i, g);
  const contar = (i) => contarNa(i, t());
  const focado = () => { const i = painel.escolha ?? painel.sobre; return i !== null && i < n() ? i : null; };
  const semMargem = { esq: 0, dir: 0, topo: 0, base: 0 };

  const g = grafico(canvas, { xlim: [0, 1], ylim: [0, 1], margem: semMargem, desenhar: (g) => {
    if (!sessao.res || !g.W) return;
    if (cena) {
      if (cena.objeto.desenhar(g.ctx, g.W, g.H, performance.now())) requestAnimationFrame(() => g.redesenhar());
      return;
    }
    const quantos = n();
    vaga = Boolean(parametro) && quantos < parametro.max;
    disposicao = grade(quantos + (vaga ? 1 : 0), g.W, g.H, 84);
    const { R, centro } = disposicao;
    kGrade = copiasPorPonto(contar(0).total, R);
    for (let i = 0; i < quantos; i++) {
      const foco = i === painel.escolha ? "escolha" : i === painel.sobre ? "sobre" : null;
      vidro(g.ctx, ...centro(i), R, contar(i), kGrade, { indice: i, foco });
    }
    if (vaga) vagaDeVidro(g.ctx, ...centro(quantos), R * 0.8, sobreVaga);
    escreverLegenda();
  } });

  const z = grafico(zoom, { xlim: [0, 1], ylim: [0, 1], margem: semMargem, desenhar: (z) => {
    const i = focado(), R = Math.min(z.W, z.H) / 2 - 6;
    kZoom = null;
    if (i === null || R < 4) return;
    const c = contar(i);
    kZoom = copiasPorPonto(c.total, R, 3.6);
    vidro(z.ctx, z.W / 2, z.H / 2, R, c, kZoom, { indice: i, pontoMinimo: 1.1 });
    escreverLegenda();
  } });

  function abrirCena(tipo) {
    const i = painel.escolha;
    if (i === null) return;
    painel.tempo?.tocar(false);
    const base = { indice: i, t: t(), nomes: spec.nomes };
    if (tipo === "sorteio") {
      if (t() >= sessao.total()) return;
      const fim = () => { cena = null; painel.tempo?.ir(base.t + 1); };
      cena = { tipo, indice: i, objeto: cenaDoSorteio({ ...base, antes: contar(i), depois: contarNa(i, t() + 1), fim }) };
    }
    if (tipo === "individuos") cena = { tipo, indice: i, t: t(), objeto: cenaDosIndividuos({ ...base, contagem: contar(i) }) };
    if (tipo === "copia") cena = { tipo, indice: i, objeto: cenaDeUmaCopia({ ...base, contarNa: (gg) => contarNa(i, gg), tempo: t }) };
    redesenhar();
  }

  function escreverAcoes(i) {
    if (cena) {
      const voltar = criar("button", { type: "button", class: "painel-vidros-acao", texto: "← voltar às populações" });
      voltar.addEventListener("click", () => { cena = null; redesenhar(); });
      return acoes.replaceChildren(voltar);
    }
    if (painel.escolha === null) return acoes.replaceChildren(criar("p", { class: "painel-vidros-miudo", texto: "Clique na população para fixá-la e ver mais." }));
    const grande = contar(i).total > LIMITE_DE_COPIAS;
    acoes.replaceChildren(...ACOES.map(([tipo, rotulo]) => {
      const desligada = (tipo === "copia" && grande) || (tipo === "sorteio" && t() >= sessao.total());
      const b = criar("button", { type: "button", class: "painel-vidros-acao", texto: `${rotulo} →`, ...(desligada ? { disabled: "" } : {}) });
      if (tipo === "copia" && grande) b.title = `Para seguir uma cópia, use até ${LIMITE_DE_COPIAS / 2} indivíduos por população.`;
      b.addEventListener("click", () => abrirCena(tipo));
      return b;
    }));
  }

  function destinos() {
    const soma = [0, 0, 0];
    for (let i = 0; i < n(); i++) {
      const c = contar(i);
      soma[c.cheio <= 0 ? 0 : c.cheio >= c.total ? 2 : 1]++;
    }
    barra.replaceChildren(...soma.map((s, j) => criar("span", { class: `painel-vidros-parte parte-${j}`, style: `flex-grow: ${s}` })));
    contas.replaceChildren(...soma.map((s, j) => criar("span", { class: `parte-${j}`, texto: `${s} ${spec.destinos[j]}` })));
    const e = spec.esperado?.(sessao.par, t());
    if (!e) { esperado.textContent = spec.esperado ? "Com as outras forças ligadas, a conta não vale aqui." : ""; return; }
    const pct = (x) => `${Math.round(x * 100)}%`;
    barra.append(criar("i", { class: "painel-vidros-marca", style: `left: ${e.vazio * 100}%` }), criar("i", { class: "painel-vidros-marca", style: `left: ${(1 - e.cheio) * 100}%` }));
    esperado.textContent = `Os traços são a conta, sem sorteio: ${pct(e.vazio)} ${spec.destinos[0]} e ${pct(e.cheio)} ${spec.destinos[2]}. No fim, a chance de ficar só com ${spec.nomes.cheio} é p₀.`;
  }

  function escreverLegenda() {
    const vale = (k) => (k > 1 ? `${k} cópias` : "1 cópia");
    const valor = kZoom === null || kZoom === kGrade ? vale(kGrade) : `${vale(kGrade)} nos círculos pequenos e ${vale(kZoom)} no grande`;
    legenda.innerHTML = `<b>Figura ${numero}.</b> Cada círculo é uma população, a de uma linha das Trajetórias; ` +
      `<i class="ponto-a"></i> cópias de ${spec.nomes.cheio}, <i class="ponto-b"></i> cópias de ${spec.nomes.vazio} ` +
      `(cada ponto vale ${valor}). Círculo de contorno forte: a população já ficou só com um alelo. ${spec.nota}`;
  }

  const TITULOS = { sorteio: "como nasce a geração seguinte", individuos: "as cópias juntadas em indivíduos", copia: "seguindo uma cópia" };
  function redesenhar() {
    if (!sessao.res) return;
    if (cena && painel.escolha !== cena.indice) cena = null;
    if (cena?.tipo === "individuos" && cena.t !== t()) {
      cena.t = t();
      cena.objeto = cenaDosIndividuos({ indice: cena.indice, t: t(), nomes: spec.nomes, contagem: contar(cena.indice) });
    }
    titulo.textContent = cena ? `População ${cena.indice + 1}: ${TITULOS[cena.tipo]}` : spec.titulo(sessao.par, t());
    no.classList.toggle("com-cena", Boolean(cena));
    const i = focado();
    no.classList.toggle("com-foco", i !== null);
    if (i !== null) {
      quem.textContent = spec.quem(i, t());
      conta.innerHTML = spec.conta(sessao.par, contar(i), painel.avancado);
      escreverAcoes(i);
    }
    destinos();
    g.redesenhar();
    z.redesenhar();
  }

  const qual = (e) => {
    if (!disposicao || cena) return -1;
    const r = canvas.getBoundingClientRect(), i = disposicao.onde(e.clientX - r.left, e.clientY - r.top);
    return i < n() + (vaga ? 1 : 0) ? i : -1;
  };
  canvas.addEventListener("pointermove", (e) => {
    if (cena) { canvas.style.cursor = cena.tipo === "copia" ? "crosshair" : ""; return; }
    const i = qual(e), naVaga = vaga && i === n();
    canvas.style.cursor = i >= 0 ? "pointer" : "";
    if (naVaga !== sobreVaga) { sobreVaga = naVaga; g.redesenhar(); }
    painel.passar(i >= 0 && !naVaga ? i : null);
  });
  canvas.addEventListener("pointerleave", () => { sobreVaga = false; if (!cena) painel.passar(null); });
  canvas.addEventListener("click", (e) => {
    if (cena) {
      const r = canvas.getBoundingClientRect();
      if (cena.objeto.clicar?.(e.clientX - r.left, e.clientY - r.top)) g.redesenhar();
      return;
    }
    const i = qual(e);
    if (vaga && i === n()) return painel.definir(parametro.nome, n() + 1);
    painel.escolher(i >= 0 && i !== painel.escolha ? i : null);
  });

  return { no, legenda, redesenhar };
}
