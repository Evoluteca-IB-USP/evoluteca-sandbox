/* ============================================================
   testes/testes.js — testes que checam a BIOLOGIA, não números
   mágicos. Rodam no navegador (testes/index.html) e também no
   Node (`node testes/rodar-no-node.mjs`), sem instalar nada.
   ============================================================ */

import { criarRng, rbinom, mean } from "r";
import * as deriva from "../modelos-de-simulacao/deriva/modelo.js";
import * as hw from "../modelos-de-simulacao/hardy-weinberg/modelo.js";
import * as selecao from "../modelos-de-simulacao/selecao-1-locus/modelo.js";
import * as mutacaoDeriva from "../modelos-de-simulacao/mutacao-deriva/modelo.js";
import * as selecaoDeriva from "../modelos-de-simulacao/selecao-deriva/modelo.js";

const resultados = [];

function teste(nome, fn) {
  try {
    fn();
    resultados.push({ nome, ok: true });
  } catch (erro) {
    resultados.push({ nome, ok: false, erro: erro.message });
  }
}

function esperar(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

/* ---------- reprodutibilidade ---------- */

teste("mesma semente ⇒ exatamente o mesmo resultado", () => {
  const parametros = { N: 50, p0: 0.5, geracoes: 100, replicas: 5 };
  const a = deriva.simular(parametros, criarRng(42));
  const b = deriva.simular(parametros, criarRng(42));
  esperar(JSON.stringify(a) === JSON.stringify(b), "duas execuções com semente 42 divergiram");
});

/* ---------- rbinom ---------- */

teste("rbinom fica dentro de [0, n] e tem média ≈ n·p", () => {
  const rng = criarRng(7);
  const sorteios = Array.from({ length: 4000 }, () => rbinom(100, 0.3, rng));
  esperar(sorteios.every((k) => k >= 0 && k <= 100), "sorteio fora de [0, n]");
  const m = mean(sorteios);
  esperar(Math.abs(m - 30) < 1.5, `média ${m.toFixed(2)}, esperado ≈ 30`);
});

/* ---------- deriva ---------- */

teste("deriva: probabilidade de fixação converge para p0", () => {
  const p0 = 0.3;
  const series = deriva.simular({ N: 20, p0, geracoes: 600, replicas: 400 }, criarRng(1));
  const fixadas = series.filter((s) => s[s.length - 1] >= 1).length;
  const fracao = fixadas / series.length;
  esperar(Math.abs(fracao - p0) < 0.08, `fração fixada ${fracao.toFixed(3)}, esperado ≈ ${p0}`);
});

teste("deriva: heterozigosidade decai ~(1 − 1/2N) por geração", () => {
  const N = 50, t = 50, p0 = 0.5;
  const series = deriva.simular({ N, p0, geracoes: t, replicas: 1500 }, criarRng(2));
  const hFinal = mean(series.map((s) => 2 * s[t] * (1 - s[t])));
  const hEsperado = 2 * p0 * (1 - p0) * (1 - 1 / (2 * N)) ** t;
  esperar(
    Math.abs(hFinal - hEsperado) < 0.05,
    `H após ${t} gerações = ${hFinal.toFixed(3)}, teoria prevê ${hEsperado.toFixed(3)}`
  );
});

/* ---------- Hardy–Weinberg ---------- */

teste("HW: frequências esperadas e amostrais somam 1", () => {
  const r = hw.simular({ p: 0.3, N: 500 }, criarRng(3));
  for (const grupo of r.grupos) {
    const soma = grupo.valores.reduce((a, b) => a + b, 0);
    esperar(Math.abs(soma - 1) < 1e-9, `frequências de "${grupo.nome}" somam ${soma}`);
  }
});

teste("HW: amostra grande converge para p², 2pq, q²", () => {
  const r = hw.simular({ p: 0.4, N: 5000 }, criarRng(4));
  const [esperado, amostra] = r.grupos.map((g) => g.valores);
  for (let i = 0; i < 3; i++) {
    esperar(
      Math.abs(esperado[i] - amostra[i]) < 0.03,
      `classe ${r.rotulos[i]}: amostra ${amostra[i].toFixed(3)} vs esperado ${esperado[i].toFixed(3)}`
    );
  }
});

teste("HW: a lista de indivíduos bate com as frequências da amostra", () => {
  const r = hw.simular({ p: 0.3, N: 200 }, criarRng(8));
  esperar(r.individuos.length === 200, "faltam indivíduos na lista");
  const cont = [0, 0, 0];
  for (const g of r.individuos) cont[g]++;
  const amostra = r.grupos[1].valores;
  for (let i = 0; i < 3; i++) {
    esperar(Math.abs(cont[i] / 200 - amostra[i]) < 1e-9, `classe ${r.rotulos[i]}: lista dá ${cont[i] / 200}, barras dão ${amostra[i]}`);
  }
});

/* ---------- seleção ---------- */

teste("seleção: com s = 0 nada muda; com s > 0, p sobe toda geração", () => {
  const neutro = selecao.simular({ p0: 0.2, s: 0, h: 0.5, geracoes: 50 }, criarRng(5))[0];
  esperar(neutro.every((v) => Math.abs(v - 0.2) < 1e-12), "p mudou sem seleção");

  const sob = selecao.simular({ p0: 0.05, s: 0.2, h: 0.5, geracoes: 200 }, criarRng(6))[0];
  for (let g = 1; g < sob.length; g++) {
    esperar(sob[g] > sob[g - 1], `p caiu na geração ${g} com s > 0`);
  }
  esperar(sob[sob.length - 1] > 0.95, "alelo vantajoso não chegou perto da fixação");
});

/* ---------- mutação e deriva ---------- */

teste("mutação e deriva: com μ = 0 e população monomórfica, H permanece 0", () => {
  const series = mutacaoDeriva.simular({ N: 50, mu: 0, geracoes: 80, replicas: 5 }, criarRng(10));
  esperar(series.every((s) => s.every((h) => h === 0)), "H mudou sem mutação");
});

teste("mutação e deriva: H converge para o equilíbrio 4Nμ / (1 + 4Nμ)", () => {
  const N = 50, mu = 0.005, theta = 4 * N * mu;
  const hEq = theta / (1 + theta);
  const series = mutacaoDeriva.simular({ N, mu, geracoes: 400, replicas: 200 }, criarRng(11));
  const hFinal = mean(series.map((s) => s[400]));
  esperar(
    Math.abs(hFinal - hEq) < 0.05,
    `H médio = ${hFinal.toFixed(3)}, equilíbrio teórico 4Nμ/(1+4Nμ) = ${hEq.toFixed(3)}`
  );
});

teste("mutação e deriva: mesma semente ⇒ exatamente o mesmo resultado", () => {
  const par = { N: 60, mu: 0.004, geracoes: 100, replicas: 4 };
  const a = mutacaoDeriva.simular(par, criarRng(12));
  const b = mutacaoDeriva.simular(par, criarRng(12));
  esperar(JSON.stringify(a) === JSON.stringify(b), "duas execuções com semente 12 divergiram");
});

/* ---------- seleção e deriva ---------- */

teste("seleção e deriva: com s = 0, probabilidade de fixação converge para p0", () => {
  const p0 = 0.35;
  const series = selecaoDeriva.simular({ N: 20, s: 0, p0, geracoes: 500, replicas: 400 }, criarRng(13));
  const fracao = series.filter((s) => s.at(-1) >= 1).length / series.length;
  esperar(Math.abs(fracao - p0) < 0.08, `fração fixada ${fracao.toFixed(3)}, esperado ≈ ${p0}`);
});

teste("seleção e deriva: probabilidade de fixação segue a fórmula de Kimura", () => {
  const par = { N: 30, s: 0.05, p0: 0.2, geracoes: 400, replicas: 500 };
  const uEsperado = selecaoDeriva.probabilidadeFixacao(par);
  const series = selecaoDeriva.simular(par, criarRng(14));
  const fracao = series.filter((s) => s.at(-1) >= 1).length / series.length;
  esperar(
    Math.abs(fracao - uEsperado) < 0.06,
    `fração fixada ${fracao.toFixed(3)}, Kimura prevê ${uEsperado.toFixed(3)}`
  );
});

teste("seleção e deriva: mesma semente ⇒ exatamente o mesmo resultado", () => {
  const par = { N: 50, s: 0.02, p0: 0.2, geracoes: 100, replicas: 5 };
  const a = selecaoDeriva.simular(par, criarRng(15));
  const b = selecaoDeriva.simular(par, criarRng(15));
  esperar(JSON.stringify(a) === JSON.stringify(b), "duas execuções com semente 15 divergiram");
});

/* ---------- saída ---------- */

const passaram = resultados.filter((r) => r.ok).length;

if (typeof document !== "undefined") {
  const lista = document.getElementById("resultados");
  for (const r of resultados) {
    const item = document.createElement("li");
    item.className = r.ok ? "ok" : "falha";
    item.textContent = (r.ok ? "✓ " : "✗ ") + r.nome + (r.erro ? ` — ${r.erro}` : "");
    lista.append(item);
  }
  document.getElementById("placar").textContent =
    `${passaram} de ${resultados.length} testes passaram`;
} else {
  for (const r of resultados) {
    console.log((r.ok ? "✓" : "✗"), r.nome, r.erro ? `— ${r.erro}` : "");
  }
  console.log(`\n${passaram}/${resultados.length} testes passaram`);
  if (passaram < resultados.length) process.exitCode = 1;
}
