/* O que a URL de simulador.html diz: valores de parâmetros da ficha pelo nome,
   `semente`, `travar` (nomes separados por vírgula) e `embutido=1`. Função
   pura, sem DOM — a página só entrega `location.search`.

   simulador.html?modelo=deriva&embutido=1&N=20&p0=0.5&semente=7&travar=N,p0 */

import { SEMENTE_MAXIMA } from "./sessao.js";

/** um número da URL ("0,5" ou "0.5"); undefined se não for número */
function numeroDaUrl(texto) {
  const t = String(texto ?? "").trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** põe o valor dentro da régua (min..max) e no passo do parâmetro */
export function ajustarAoParametro(p, v) {
  const passo = p.passo ?? 1;
  const noPasso = +(Math.round(v / passo) * passo).toFixed(6);
  return Math.max(p.min, Math.min(p.max, noPasso));
}

/** `busca` é o `location.search`; `parametros` é o `ficha.parametros`.
    Devolve { valores: { [nome]: número }, semente?: inteiro, travados: [nome], embutido: boolean }.
    O que for inválido ou não for da ficha é ignorado. */
export function lerParametrosDaUrl(busca, parametros = []) {
  const url = new URLSearchParams(busca);
  const valores = {};
  for (const p of parametros) {
    if (!url.has(p.nome)) continue;
    const v = numeroDaUrl(url.get(p.nome));
    if (v !== undefined) valores[p.nome] = ajustarAoParametro(p, v);
  }
  const s = numeroDaUrl(url.get("semente"));
  const semente = s !== undefined && Number.isInteger(s) && s >= 0 && s <= SEMENTE_MAXIMA ? s : undefined;
  const nomes = new Set(parametros.map((p) => p.nome));
  const travados = (url.get("travar") ?? "").split(",").map((n) => n.trim()).filter((n) => nomes.has(n));
  return { valores, semente, travados, embutido: url.get("embutido") === "1" };
}
