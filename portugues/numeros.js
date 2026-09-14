/** 1234.5 → "1.234,5" · casas = máximo de casas decimais */
export const numero = (x, casas = 0) =>
  x.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });

/** 0.607 → "60,7%" */
export const porcentagem = (x) =>
  `${(x * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
