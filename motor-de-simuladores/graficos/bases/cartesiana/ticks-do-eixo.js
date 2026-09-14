/* marcas de eixo "redondas": 0, 0.25, 0.5… em vez de 0.137, 0.274… */
export function ticks(min, max, alvo = 5) {
  const bruto = (max - min) / alvo;
  const mag = 10 ** Math.floor(Math.log10(bruto || 1));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => (max - min) / p <= alvo) || mag * 10;
  const inicio = Math.ceil(min / passo) * passo;
  const v = [];
  for (let t = inicio; t <= max + 1e-9; t += passo) v.push(+t.toFixed(10));
  return v;
}

/* o número como se escreve em português: 1.000 e 0,25 */
export function formatar(x) {
  if (Math.abs(x) >= 1000) return x.toLocaleString("pt-BR");
  return (+x.toFixed(4)).toString().replace(".", ",");
}
