/* A deriva da página do simulador, com as outras forças do modo avançado:
   gargalo (o tamanho cai por algumas gerações), migração entre os vidros,
   mutação e machos e fêmeas em número diferente (o N efetivo). Sem elas, é
   o mesmo Wright–Fisher de modelo.js.

   "Mesma sorte": cada vidro, em cada geração, usa um único número sorteado
   (u, entre 0 e 1) e o transforma no número de cópias pela binomial
   invertida. Mudar N não muda os u; muda só o tamanho do passo. Então,
   com a mesma semente, as linhas de N diferentes contam a mesma história. */

export const INICIO_DO_GARGALO = 20;

/** quantos indivíduos o vidro tem na geração g */
export function tamanhoNa({ N, gargaloN = N, gargaloGeracoes = 0 }, g) {
  const noGargalo = gargaloGeracoes > 0 && g > INICIO_DO_GARGALO && g <= INICIO_DO_GARGALO + gargaloGeracoes;
  return noGargalo ? Math.min(N, gargaloN) : N;
}

/** o N efetivo na geração g: com machos e fêmeas desiguais, 4·Nm·Nf / (Nm + Nf) */
export function nEfetivoNa(par, g) {
  const n = tamanhoNa(par, g), r = par.machos ?? 0.5;
  if (r === 0.5) return n;
  const nm = Math.max(1, Math.round(r * n)), nf = Math.max(1, n - nm);
  return (4 * nm * nf) / (nm + nf);
}

export function simularComForcas(par, rng) {
  const { p0, geracoes, replicas, migracao = 0, mutacao = 0 } = par;
  const series = Array.from({ length: replicas }, () => [p0]);
  for (let g = 1; g <= geracoes; g++) {
    const n = tamanhoNa(par, g), dois = 2 * n, sorteio = Math.max(1, Math.round(2 * nEfetivoNa(par, g)));
    const media = series.reduce((s, x) => s + x[g - 1], 0) / replicas;
    for (const s of series) {
      let q = s[g - 1];
      q = (1 - migracao) * q + migracao * media;
      q = q * (1 - mutacao) + (1 - q) * mutacao;
      const k = qbinom(rng(), sorteio, q);
      s.push(Math.round((k / sorteio) * dois) / dois);
    }
  }
  return series;
}

/* a binomial invertida: o menor k com P(X ≤ k) ≥ u. Conta exata quando a
   cauda é curta; pela normal quando a população é grande e o alelo comum. */
export function qbinom(u, n, q) {
  if (q <= 0) return 0;
  if (q >= 1) return n;
  if (q > 0.5) return n - qbinom(1 - u, n, 1 - q);
  if (n * q < 30) {
    let pk = (1 - q) ** n, acum = pk, k = 0;
    while (acum < u && k < n) { pk *= ((n - k) / (k + 1)) * (q / (1 - q)); acum += pk; k++; }
    return k;
  }
  const k = Math.round(n * q + qnorm(u) * Math.sqrt(n * q * (1 - q)));
  return Math.max(0, Math.min(n, k));
}

/* a inversa da normal padrão (aproximação de Acklam, erro < 1e-9) */
function qnorm(p) {
  p = Math.min(1 - 1e-12, Math.max(1e-12, p));
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const cauda = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return cauda(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -cauda(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
