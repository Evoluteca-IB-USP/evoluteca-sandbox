/** o valor de um parâmetro com as casas decimais que o passo dele pede */
export function formatarValor(v, par) {
  const casas = par.passo && par.passo < 1 ? Math.ceil(-Math.log10(par.passo)) : 0;
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
