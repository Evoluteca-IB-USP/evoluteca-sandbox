import { SUAVE, FONTE } from "./cores-das-figuras.js";

/** um rótulo no canvas, com os padrões que as figuras usam */
export function rotulo(ctx, texto, x, y, { alinhar = "left", cor = SUAVE, peso = "", tam = 11, base = "top" } = {}) {
  ctx.font = `${peso} ${tam}px ${FONTE}`;
  ctx.fillStyle = cor;
  ctx.textAlign = alinhar;
  ctx.textBaseline = base;
  ctx.fillText(texto, x, y);
}

/** quebra `texto` em linhas que cabem em `larg`, na fonte já ajustada no ctx */
export function quebrar(ctx, texto, larg) {
  const linhas = [];
  let atual = "";
  for (const p of texto.split(" ")) {
    const tenta = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(tenta).width > larg && atual) { linhas.push(atual); atual = p; }
    else atual = tenta;
  }
  if (atual) linhas.push(atual);
  return linhas;
}
