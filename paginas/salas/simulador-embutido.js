/* O simulador de um bloco, visto da sala: o endereço do <iframe>, a semente de
   cada aluno, o valor do parâmetro que o grupo dele recebe e o que sobra da
   rodada quando o aluno envia. O protocolo (URL e postMessage) está em
   servidor/AULA.md. Funções puras, sem DOM. */

import { LIMITES } from "./blocos.js";

export const FONTE_DA_SALA = "evoluteca-sala";
export const FONTE_DO_SIMULADOR = "evoluteca-simulador";

/* um número inteiro estável (1 … 2³¹−2) a partir de um texto: FNV-1a de 32 bits */
export function numeroDoTexto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % (LIMITES.semente - 1)) + 1;
}

/* "cada-aluno": um número derivado do participante; "turma": o mesmo para todos (derivado do bloco); número: ele mesmo */
export function sementeDoBloco(bloco, participante) {
  if (Number.isInteger(bloco.semente)) return bloco.semente;
  if (bloco.semente === "turma") return numeroDoTexto(`turma:${bloco.id}`);
  return numeroDoTexto(`aluno:${participante}`);
}

/* os parâmetros do bloco com o do grupo por cima (`variar`): o grupo 2 roda com valores[1] */
export function parametrosDoAluno(bloco, grupo) {
  const parametros = { ...(bloco.parametros ?? {}) };
  const v = bloco.variar;
  if (v && Array.isArray(v.valores) && v.valores.length) {
    const indice = Number.isInteger(grupo) && grupo >= 0 ? grupo % v.valores.length : 0;
    parametros[v.parametro] = v.valores[indice];
  }
  return parametros;
}

/* os parâmetros que o aluno não pode mexer: os travados do bloco e o que o grupo recebe */
export function travadosDoAluno(bloco) {
  return [...new Set([...(bloco.travados ?? []), ...(bloco.variar ? [bloco.variar.parametro] : [])])];
}

/* simulador.html?modelo=deriva&embutido=1&N=20&p0=0.5&semente=7&travar=N,p0 */
export function urlDoSimulador(bloco, { participante, grupo = null, base = "simulador.html" } = {}) {
  const busca = new URLSearchParams({ modelo: bloco.simulador, embutido: "1" });
  for (const [nome, valor] of Object.entries(parametrosDoAluno(bloco, grupo))) busca.set(nome, String(valor));
  busca.set("semente", String(sementeDoBloco(bloco, participante)));
  const travados = travadosDoAluno(bloco);
  if (travados.length) busca.set("travar", travados.join(","));
  return `${base}?${busca.toString().replace(/%2C/g, ",")}`;
}

/* A mensagem `rodada` do simulador → o `conteudo` do envio, só com o que o bloco pede em `coletar`.
   Devolve null se a mensagem não for uma rodada deste simulador. */
export function conteudoDaRodada(bloco, mensagem) {
  if (!mensagem || typeof mensagem !== "object" || mensagem.fonte !== FONTE_DO_SIMULADOR || mensagem.tipo !== "rodada") return null;
  if (mensagem.modelo !== bloco.simulador || !Array.isArray(mensagem.resumo)) return null;
  const parametros = {};
  for (const [nome, valor] of Object.entries(mensagem.parametros ?? {})) {
    if (typeof valor === "number" && Number.isFinite(valor)) parametros[nome] = valor;
  }
  const valores = {};
  for (const item of mensagem.resumo) {
    if (!item || !bloco.coletar.includes(item.rotulo) || typeof item.texto !== "string") continue;
    valores[item.rotulo] = { texto: item.texto.slice(0, LIMITES.rotulo) };
    if (typeof item.numero === "number" && Number.isFinite(item.numero)) valores[item.rotulo].numero = item.numero;
  }
  const semente = Number.isFinite(mensagem.semente) ? mensagem.semente : null;
  return { parametros, semente, valores };
}
