import { criar } from "escrever-html";
import { pontos } from "../../graficos/__pacote__.js";
import { legenda } from "./legenda-de-cores.js";
import { numero, porcentagem } from "portugues";

/* A lupa: o gráfico mostra a população de longe, ao longo do tempo; aqui ela
   aparece de perto, um indivíduo por bolinha, no instante em que a linha do
   tempo está parada. Três leituras, conforme o modelo:

     alelos    população finita — os 2N alelos da população em foco
     genótipos população infinita — p², 2pq e q² sob cruzamento ao acaso
     amostra   os indivíduos sorteados até agora, na ordem em que saíram

   `cores.alelo1` e `cores.alelo2` são as duas metades de um heterozigoto. */
export function criarLupa({ cores, saida, unidade, aptidoesDe }) {
  const titulo = criar("h2", { class: "lupa-titulo" });
  const dados = criar("dl", { class: "lupa-dados" });
  const aptidoes = criar("div", { class: "lupa-aptidoes" });
  const tela = criar("canvas", { class: "lupa-pontos", "aria-hidden": "true" });
  const rodape = criar("div", { class: "lupa-legenda" });
  const nota = criar("p", { class: "lupa-nota" });
  const no = criar("aside", { class: "lupa", "aria-label": "População em foco" },
    titulo, dados, aptidoes, tela, rodape, nota);

  const corA = cores.alelo1, cora = cores.alelo2;

  function mostrarDados(pares) {
    dados.innerHTML = "";
    for (const [rotulo, valor] of pares) {
      dados.append(criar("div", { class: "dado" }, criar("dd", { texto: String(valor) }), criar("dt", { texto: rotulo })));
    }
  }

  /* as barras de aptidão de cada genótipo, quando o modelo as expõe */
  function mostrarAptidoes(w, A, a) {
    const maior = Math.max(w.AA, w.Aa, w.aa) || 1;
    aptidoes.append(criar("h3", { texto: "Aptidões" }));
    for (const [gen, cor] of [["AA", corA], ["Aa", [corA, cora]], ["aa", cora]]) {
      const barra = criar("span", { class: "aptidao-barra" });
      barra.style.width = `${(w[gen] / maior) * 100}%`;
      barra.style.background = Array.isArray(cor) ? `linear-gradient(90deg, ${cor[0]} 50%, ${cor[1]} 50%)` : cor;
      aptidoes.append(criar("div", { class: "aptidao" },
        criar("span", { class: "aptidao-nome", texto: gen.replace("A", A).replace("a", a).replace(/^(.)(.)$/, "$1$2") }),
        criar("span", { class: "aptidao-trilho" }, barra),
        criar("span", { class: "aptidao-valor", texto: numero(w[gen], 3) })));
    }
  }

  function esconder() { no.hidden = true; }

  /** modelos de saída em linhas: a população em foco na geração `cursor` */
  function mostrarPopulacao({ resultado, cursor, valores }) {
    if (!saida.alelos) return esconder();
    no.hidden = false;
    const [A, a] = saida.alelos;
    const serie = resultado[0];
    const g = Math.min(cursor, serie.length - 1);
    const p = serie[g];
    const q = 1 - p;
    aptidoes.innerHTML = "";

    if (saida.N) {                                   // população finita: os 2N alelos da população em foco
      const N = valores[saida.N];
      const dois = 2 * N;
      const vagas = Math.min(dois, 400);
      const nA = Math.round(p * vagas);
      titulo.textContent = `População em foco · ${unidade} ${numero(g)}`;
      pontos(tela, [{ n: nA, cor: corA }, { n: vagas - nA, cor: cora }]);
      const exato = dois <= 400;
      legenda(rodape, [
        { cor: corA, texto: exato ? `${A}: ${nA} de ${dois}` : `${A}: ${porcentagem(p)}` },
        { cor: cora, texto: exato ? `${a}: ${dois - nA}` : `${a}: ${porcentagem(q)}` },
      ]);
      nota.textContent = exato
        ? `Os 2N = ${numero(dois)} alelos da população em foco, nesta ${unidade}.`
        : `Grade representativa: 400 bolinhas para os 2N = ${numero(dois)} alelos da população em foco.`;
      const fixou = resultado.filter((s) => s[Math.min(g, s.length - 1)] >= 1).length;
      const perdeu = resultado.filter((s) => s[Math.min(g, s.length - 1)] <= 0).length;
      mostrarDados([
        [`frequência de ${A}`, numero(p, 3)],
        ["heterozigosidade 2pq", numero(2 * p * q, 3)],
        [`fixaram ${A}`, `${fixou} de ${resultado.length}`],
        [`perderam ${A}`, `${perdeu} de ${resultado.length}`],
      ]);
    } else {                                         // população infinita: genótipos sob cruzamento ao acaso
      const n = 200;
      const nAA = Math.round(p * p * n);
      const naa = Math.round(q * q * n);
      const nAa = Math.max(0, n - nAA - naa);
      titulo.textContent = `Genótipos na população · ${unidade} ${numero(g)}`;
      pontos(tela, [{ n: nAA, cor: corA }, { n: nAa, cor: [corA, cora] }, { n: naa, cor: cora }]);
      legenda(rodape, [
        { cor: corA, texto: `${A}${A}: ${porcentagem(p * p)}` },
        { cor: [corA, cora], texto: `${A}${a}: ${porcentagem(2 * p * q)}` },
        { cor: cora, texto: `${a}${a}: ${porcentagem(q * q)}` },
      ]);
      nota.textContent = `${n} indivíduos representativos, supondo cruzamentos ao acaso (p², 2pq, q²).`;
      const pares = [[`frequência de ${A}`, numero(p, 3)], [`Δp nesta ${unidade}`, g > 0 ? (p - serie[g - 1] >= 0 ? "+" : "−") + numero(Math.abs(p - serie[g - 1]), 4) : "—"]];
      if (aptidoesDe) {
        const w = aptidoesDe({ ...valores });
        const wBar = p * p * w.AA + 2 * p * q * w.Aa + q * q * w.aa;
        pares.push(["aptidão média w̄", numero(wBar, 3)]);
        mostrarAptidoes(w, A, a);
      }
      mostrarDados(pares);
    }
  }

  /** modelos de saída em barras: a amostra sorteada até o indivíduo `cursor` */
  function mostrarAmostra({ resultado, cursor, total }) {
    const ind = resultado.individuos;
    if (!ind || !saida.alelos) return esconder();
    no.hidden = false;
    const [A, a] = saida.alelos;
    const k = cursor;
    const vagas = Math.min(total, 400);
    const classes = [{ cor: corA }, { cor: [corA, cora] }, { cor: cora }];
    pontos(tela, classes, { sequencia: ind.slice(0, Math.min(k, vagas)), total: vagas, destacar: k > 0 && k <= vagas ? k - 1 : undefined });
    const cont = [0, 0, 0];
    for (let i = 0; i < k; i++) cont[ind[i]]++;
    titulo.textContent = `Amostra · ${numero(k)} de ${numero(total)} indivíduos`;
    legenda(rodape, resultado.rotulos.map((r, i) => ({ cor: classes[i].cor, texto: `${r}: ${numero(cont[i])}` })));
    nota.textContent = total > 400
      ? `A grade mostra os primeiros 400 indivíduos sorteados; as barras usam todos os ${numero(total)}.`
      : "Cada bolinha é um indivíduo sorteado, na ordem em que saiu.";
    const pObs = k ? (2 * cont[0] + cont[1]) / (2 * k) : null;
    mostrarDados([
      ["amostrados", numero(k)],
      [`p̂ de ${A} na amostra`, pObs == null ? "—" : numero(pObs, 3)],
      [`heterozigotos ${A}${a}`, k ? porcentagem(cont[1] / k) : "—"],
    ]);
    aptidoes.innerHTML = "";
  }

  return { no, mostrarPopulacao, mostrarAmostra, esconder };
}
