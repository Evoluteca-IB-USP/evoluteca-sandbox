/* A conta da deriva, sem sorteio: o que a teoria prevê para comparar com a
   rodada. A perda de variação usa o N efetivo de cada geração (o gargalo e
   a proporção de machos entram); migração e mutação não entram, e com elas
   a página avisa que a conta não vale. */

import { distribuicaoExata } from "./modelo.js";
import { nEfetivoNa } from "./forcas.js";

/* Acima de N = 100 a conta exata fica pesada; a distribuição de uma população
   de 100 no tempo t · 100/N é a mesma pela aproximação de difusão. */
export const N_DA_CONTA = 100;
const CLASSES = 19, FILEIRAS = 30;

export const contaValida = (par) => !(par.migracao > 0) && !(par.mutacao > 0);
export const semOutrasForcas = (par) => contaValida(par) && !(par.gargaloGeracoes > 0) && (par.machos ?? 0.5) === 0.5;

/** o que resta da variação depois de t gerações: ∏ (1 − 1/2Ne) */
export function fatorQueResta(par) {
  const f = [1];
  for (let g = 1; g <= par.geracoes; g++) f.push(f[g - 1] * (1 - 1 / (2 * nEfetivoNa(par, g))));
  return f;
}

export const H0 = ({ p0 }) => 2 * p0 * (1 - p0);
export const heterozigosePrevista = (par) => fatorQueResta(par).map((f) => H0(par) * f);
export const diferencaPrevista = (par) => fatorQueResta(par).map((f) => 1 - f);

/** a faixa p₀ ± 2σ, onde ficam cerca de 95% das populações */
export function faixaPrevista(par) {
  const dp = fatorQueResta(par).map((f) => 2 * Math.sqrt(par.p0 * (1 - par.p0) * (1 - f)));
  return { inf: dp.map((d) => Math.max(0, par.p0 - d)), sup: dp.map((d) => Math.min(1, par.p0 + d)), dp };
}

/** o tempo médio até a população ficar com um só alelo (difusão): −4N[p₀ ln p₀ + q₀ ln q₀] */
export function tempoAteFixar({ N, p0 }) {
  return -4 * N * (p0 * Math.log(p0) + (1 - p0) * Math.log(1 - p0));
}

/** em quantas gerações metade da variação se perde: ln 2 / −ln(1 − 1/2N) */
export const meiaVida = ({ N }) => Math.log(2) / -Math.log(1 - 1 / (2 * N));

let cache = { chave: "" };
function todas({ N, p0, geracoes }) {
  const n = Math.min(N, N_DA_CONTA), escala = n / N, chave = `${n}|${p0}|${geracoes}`;
  if (chave !== cache.chave) cache = { chave, n, escala, x: distribuicaoExata({ N: n, p0, geracoes: Math.round(geracoes * escala) }) };
  return cache;
}

function agrupar(x, n) {
  if (2 * n - 1 <= CLASSES) return x;
  const meio = new Array(CLASSES).fill(0);
  for (let j = 1; j < 2 * n; j++) meio[Math.min(CLASSES - 1, Math.floor(((j - 1) / (2 * n - 1)) * CLASSES))] += x[j];
  return [x[0], ...meio, x[2 * n]];
}

/** a distribuição prevista na geração t, em classes: [só com A₂, …meio…, só com A₁] */
export function corteNa(par, t) {
  const c = todas(par);
  return agrupar(c.x[Math.min(c.x.length - 1, Math.round(t * c.escala))], c.n);
}

/** a fração de vidros que a conta prevê só com A₂ e só com A₁ na geração t */
export function destinosPrevistos(par, t) {
  const c = todas(par), x = c.x[Math.min(c.x.length - 1, Math.round(t * c.escala))];
  return { vazio: x[0], cheio: x[2 * c.n] };
}

export function relevoDaDeriva(par) {
  const c = todas(par), k = Math.min(par.geracoes, FILEIRAS);
  const mostradas = Array.from({ length: k + 1 }, (_, i) => Math.round((i * par.geracoes) / k));
  return {
    fileiras: mostradas.map((t) => ({ t, alturas: agrupar(c.x[Math.round(t * c.escala)], c.n) })),
    aproximado: par.N > N_DA_CONTA,
  };
}

/** os marcos da rodada na linha do tempo */
export function marcosDaDeriva(r, par) {
  const marcos = [], fixou = r.fixacao.filter((t) => t > 0).sort((a, b) => a - b);
  if (fixou.length) marcos.push({ t: fixou[0], rotulo: `a 1ª população ficou com um só alelo (geração ${fixou[0]})` });
  const metade = Math.ceil(par.replicas / 2);
  if (par.replicas > 1 && fixou.length >= metade) marcos.push({ t: fixou[metade - 1], rotulo: `metade das populações ficou com um só alelo (geração ${fixou[metade - 1]})` });
  const t2 = Math.round(meiaVida(par));
  if (t2 <= par.geracoes && semOutrasForcas(par)) marcos.push({ t: t2, rotulo: `pela conta, metade da variação já se perdeu (geração ${t2})`, conta: true });
  return marcos;
}
