/* Variante 2 — o arquipélago. Vinte e quatro ilhas começam iguais e
   isoladas; em cada uma, a próxima geração é um sorteio da anterior.
   Embaixo, cada ilha é uma ficha que desliza até a frequência de A na
   sua população: o monte do começo se abre e termina dividido entre as
   duas paredes. Antes de tocar, dá para apostar quantas ficam só com A. */

import { criar } from "escrever-html";
import { criarRng, rbinom } from "r";
import { campo, tocador, palco } from "./comum/comum.js";
import { desenharMar, desenharFichas, ilhaSob } from "./arquipelago-desenho.js";

const ILHAS = 24, COLUNAS = 8;

export function montarArquipelago() {
  let N = 10, p0 = 50, aposta = null, semente = 1;
  let rng, ilhas, geracao, relogio = 0, tocando = false, foco = -1;

  const mar = palco(document.getElementById("mar"), () => {});
  const fichas = palco(document.getElementById("fichas"), () => {});
  const rotuloGeracao = document.getElementById("geracao");
  const veredito = document.getElementById("veredito");
  const botoes = tocador({
    aoReiniciar: () => reiniciar(),
    aoAlternar: () => { if (terminou()) reiniciar(); tocar(!tocando); },
    aoPassar: () => { tocar(false); if (!terminou()) avancar(); },
  });
  document.getElementById("tocador").append(botoes);
  document.getElementById("frase").append(
    "Ilhas de ", campo({ valor: N, min: 2, max: 40, rotulo: "Indivíduos por ilha", aoMudar: (v) => { N = v; reiniciar(); } }),
    " indivíduos, todas começando com ", campo({ valor: p0, min: 5, max: 95, sufixo: "%", rotulo: "Frequência inicial de A", aoMudar: (v) => { p0 = v; reiniciar(); } }),
    " de alelos ", criar("strong", { class: "arq-A", texto: "A" }), ".");
  document.getElementById("aposta").append(
    "Aposto que ", campo({ valor: "", placeholder: "?", min: 0, max: ILHAS, rotulo: "Sua aposta", aoMudar: (v) => { aposta = v; escrever(); } }),
    ` das ${ILHAS} vão terminar só com A.`);

  const total = () => 2 * N;
  const fixada = (ilha) => ilha.nA === 0 || ilha.nA === total();
  const terminou = () => ilhas.every(fixada);

  function reiniciar() {
    rng = criarRng(semente++);
    geracao = 0;
    const nA = Math.round((p0 / 100) * total());
    ilhas = Array.from({ length: ILHAS }, (_, k) => novaIlha(k, nA));
    tocar(false);
    escrever();
  }

  /* a forma da ilha e o lugar de cada indivíduo são sorteados uma vez só */
  function novaIlha(k, nA) {
    const forma = [0.1 + rng() * 0.08, rng() * 6.3, 0.05 + rng() * 0.06, rng() * 6.3];
    const pontos = Array.from({ length: total() }, (_, i) => {
      const ang = rng() * 2 * Math.PI, raio = Math.sqrt(rng()) * 0.72;
      return { ang, raio, fase: rng() * 6.3, vel: 0.6 + rng(), A: i < nA, mudou: -9 };
    });
    return { k, col: k % COLUNAS, lin: Math.floor(k / COLUNAS), forma, pontos, nA, x: null, y: null };
  }

  /* uma geração: a ilha sorteia quantos A terá; só os pontos que mudam de cor piscam */
  function avancar() {
    geracao++;
    for (const ilha of ilhas) {
      if (fixada(ilha)) continue;
      const novo = rbinom(total(), ilha.nA / total(), rng);
      let falta = novo - ilha.nA;
      const candidatos = ilha.pontos.filter((p) => p.A === (falta < 0));
      while (falta !== 0) {
        const p = candidatos.splice(Math.floor(rng() * candidatos.length), 1)[0];
        p.A = !p.A;
        p.mudou = relogio;
        falta += falta > 0 ? -1 : 1;
      }
      ilha.nA = novo;
    }
    escrever();
  }

  function tocar(sim) { tocando = sim; botoes.marcar(sim); }

  function escrever() {
    rotuloGeracao.innerHTML = `geração <b>${geracao}</b>`;
    const soA = ilhas.filter((i) => i.nA === total()).length, soa = ilhas.filter((i) => i.nA === 0).length;
    if (terminou()) {
      tocar(false);
      veredito.innerHTML = `<b>${soA}</b> de ${ILHAS} ilhas ficaram só com <span class="legenda-A"></span>A.` +
        (aposta === null ? "" : ` Você apostou <b>${aposta}</b>.`);
    } else {
      veredito.innerHTML = `<span class="legenda-A"></span>só A <b>${soA}</b><span class="arq-sep"></span>` +
        `<span class="legenda-a"></span>só a <b>${soa}</b><span class="arq-sep"></span>misturadas <b>${ILHAS - soA - soa}</b>`;
    }
  }

  /* começa devagar para dar tempo de olhar, e acelera quando o feixe já se abriu */
  const intervalo = () => Math.max(0.12, 0.7 * 0.97 ** geracao);

  let antes = null, desdeUltima = 0;
  requestAnimationFrame(function quadro(agora) {
    const dt = antes === null ? 0 : Math.min(0.1, (agora - antes) / 1000);
    antes = agora;
    relogio += dt;
    if (tocando && (desdeUltima += dt) >= intervalo()) { desdeUltima = 0; avancar(); }
    const estado = { ilhas, total: total(), relogio, foco, p0: p0 / 100 };
    desenharMar(mar, estado, COLUNAS);
    desenharFichas(fichas, estado, dt);
    requestAnimationFrame(quadro);
  });

  document.getElementById("mar").addEventListener("mousemove", (ev) => {
    const caixa = ev.currentTarget.getBoundingClientRect();
    foco = ilhaSob(mar, ilhas, COLUNAS, ev.clientX - caixa.left, ev.clientY - caixa.top);
  });
  document.getElementById("mar").addEventListener("mouseleave", () => { foco = -1; });

  reiniciar();
}
