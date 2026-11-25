import { rbinom, seq, mean } from "r";

/* O que o catálogo e a home leem deste simulador. A página do simulador
   lê a ficha.js, ao lado. */
export const meta = {
  titulo: "Mutação e deriva",
  descricao:
    "Alelos novos surgem e quase todos se perdem. Veja o equilíbrio entre a taxa de mutação e o tamanho da população.",
  nivel: ["graduacao"],
  tema: "populacoes",
  tempo: "15 min",
  parametros: [
    { nome: "N",        rotulo: "Tamanho da população", valor: 100 },
    { nome: "mu",       rotulo: "Taxa de mutação",      valor: 0.002 },
    { nome: "replicas", rotulo: "Réplicas",             valor: 20 },
    { nome: "geracoes", rotulo: "Gerações",             valor: 400, avancado: true },
  ],
  saida: { tipo: "linhas", y: "heterozigosidade (H)" },
};

/* Modelo de alelos infinitos (Kimura–Crow) em uma população diploide de N
   indivíduos (2N cópias gênicas), começando monomórfica (H_0 = 0).
   A cada geração: amostragem de Wright–Fisher das 2N cópias e, em seguida,
   cada cópia sofre mutação com probabilidade mu para um alelo inédito. */

function heterozigosidade(contagens, M) {
  let somaQuad = 0;
  for (let i = 0; i < contagens.length; i++) {
    const p = contagens[i] / M;
    somaQuad += p * p;
  }
  return 1 - somaQuad;
}

function resumoTopo(contagens, M) {
  let n1 = 0, n2 = 0;
  for (let i = 0; i < contagens.length; i++) {
    const c = contagens[i];
    if (c >= n1) { n2 = n1; n1 = c; }
    else if (c > n2) { n2 = c; }
  }
  return [n1, n2, M - n1 - n2];
}

function avancarGeracao(contagens, M, mu, rng) {
  /* 1. Amostragem multinomial de Wright–Fisher via binomiais sequenciais */
  const sorteados = [];
  let restante = M;
  let massa = M;
  for (let i = 0; i < contagens.length && restante > 0; i++) {
    const c = contagens[i];
    const n = i === contagens.length - 1 || c >= massa
      ? restante
      : rbinom(restante, c / massa, rng);
    if (n > 0) sorteados.push(n);
    restante -= n;
    massa -= c;
  }

  /* 2. Mutação (alelos infinitos): cada mutante funda um alelo inédito */
  if (mu <= 0) return sorteados;
  const proxima = [];
  let novos = 0;
  for (let i = 0; i < sorteados.length; i++) {
    const n = sorteados[i];
    const m = rbinom(n, mu, rng);
    if (n - m > 0) proxima.push(n - m);
    novos += m;
  }
  for (let i = 0; i < novos; i++) proxima.push(1);
  return proxima;
}

export function simularDetalhado({ N, mu, geracoes, replicas }, rng) {
  const M = 2 * N;
  const series = [];
  const kPorReplica = [];
  const topo = [];

  for (const r of seq(1, replicas)) {
    let contagens = [M];
    const h = [0];
    const k = [1];
    if (r === 1) topo.push(resumoTopo(contagens, M));

    for (const g of seq(1, geracoes)) {
      contagens = avancarGeracao(contagens, M, mu, rng);
      h[g] = heterozigosidade(contagens, M);
      k[g] = contagens.length;
      if (r === 1) topo[g] = resumoTopo(contagens, M);
    }
    series.push(h);
    kPorReplica.push(k);
  }

  const hMedio = series[0].map((_, t) => mean(series.map((s) => s[t])));
  const alelos = kPorReplica[0].map((_, t) => mean(kPorReplica.map((s) => s[t])));
  return { series, hMedio, alelos, topo };
}

export function simular(par, rng) {
  return simularDetalhado(par, rng).series;
}
