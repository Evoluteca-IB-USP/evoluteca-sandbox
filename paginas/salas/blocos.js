/* O modelo dos blocos de uma aula (servidor/AULA.md): criar um bloco de cada
   tipo com os valores de partida, trocar o formato de uma pergunta e validar.
   Funções puras, sem DOM. O Worker (servidor/sala-do-professor/worker.js) tem
   a sua própria cópia destas regras, porque é um arquivo só; os limites abaixo
   precisam ficar iguais aos de lá. */

export const TIPOS = ["texto", "simulador", "pergunta"];
export const ROTULOS_DOS_TIPOS = { texto: "Texto", simulador: "Simulador", pergunta: "Pergunta" };
export const FORMATOS = ["aberta", "escolha", "numero"];
export const ROTULOS_DOS_FORMATOS = { aberta: "Resposta aberta", escolha: "Múltipla escolha", numero: "Um número" };
export const SEMENTES = ["cada-aluno", "turma"];

export const LIMITES = {
  blocos: 60,
  titulo: 120,
  texto: 8000,
  enunciado: 1000,
  opcoes: 12,
  opcao: 200,
  parametros: 30,
  coletar: 20,
  rotulo: 80,
  valoresDeVariar: 12,
  semente: 2147483647,
};

const PADRAO_DO_ID = /^[A-Za-z0-9]{8}$/;
const PADRAO_DO_SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
const PADRAO_DO_NOME = /^[A-Za-z_][A-Za-z0-9_]{0,29}$/;
const ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";

/* 8 caracteres sorteados; `bytes` só existe para os testes poderem fixar o sorteio */
export function novoIdDeBloco(bytes = globalThis.crypto.getRandomValues(new Uint8Array(8))) {
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/* um bloco novo do tipo pedido; `campos` sobrescreve os valores de partida */
export function criarBloco(tipo, campos = {}) {
  if (!TIPOS.includes(tipo)) throw new Error(`tipo de bloco desconhecido: ${tipo}`);
  const base = { id: novoIdDeBloco(), tipo, titulo: "" };
  if (tipo === "texto") Object.assign(base, { texto: "" });
  if (tipo === "simulador") Object.assign(base, { simulador: "", parametros: {}, travados: [], semente: "cada-aluno", coletar: [] });
  if (tipo === "pergunta") Object.assign(base, { enunciado: "", formato: "aberta", anonima: false });
  const bloco = { ...base, ...campos };
  return bloco.tipo === "pergunta" && bloco.formato === "escolha" && !bloco.opcoes
    ? { ...bloco, opcoes: ["", ""] }
    : bloco;
}

/* muda o formato de uma pergunta: escolha ganha `opcoes`, os outros formatos perdem `opcoes` e `correta` */
export function trocarFormato(bloco, formato) {
  const { opcoes, correta, ...resto } = bloco;
  if (formato === "escolha") return { ...resto, formato, opcoes: opcoes ?? ["", ""], ...(correta != null ? { correta } : {}) };
  return { ...resto, formato };
}

/* uma cópia com ids novos (para duplicar um plano sem repetir ids de bloco) */
export const copiarBlocos = (blocos) => blocos.map((b) => ({ ...structuredClone(b), id: novoIdDeBloco() }));

const ehObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const ehTexto = (v, max) => typeof v === "string" && v.trim() !== "" && v.length <= max;
const ehNumero = (v) => typeof v === "number" && Number.isFinite(v);

/* os problemas de um bloco, em português, para mostrar ao professor; lista vazia = bloco válido */
export function validarBloco(b) {
  if (!ehObjeto(b)) return ["o bloco não é um objeto"];
  const erros = [];
  if (!PADRAO_DO_ID.test(String(b.id))) erros.push("o bloco precisa de um id de 8 caracteres");
  if (!TIPOS.includes(b.tipo)) return [...erros, "tipo de bloco desconhecido"];
  if (!ehTexto(b.titulo, LIMITES.titulo)) erros.push(`dê um título ao bloco (até ${LIMITES.titulo} caracteres)`);

  if (b.tipo === "texto") {
    if (!ehTexto(b.texto, LIMITES.texto)) erros.push(`escreva o texto (até ${LIMITES.texto} caracteres)`);
  }

  if (b.tipo === "simulador") {
    if (!PADRAO_DO_SLUG.test(String(b.simulador))) erros.push("escolha o simulador");
    if (!ehObjeto(b.parametros) || Object.keys(b.parametros).length > LIMITES.parametros
        || !Object.entries(b.parametros).every(([k, v]) => PADRAO_DO_NOME.test(k) && ehNumero(v))) {
      erros.push("os parâmetros precisam ser números");
    }
    if (!Array.isArray(b.travados) || b.travados.length > LIMITES.parametros || !b.travados.every((n) => PADRAO_DO_NOME.test(String(n)))) {
      erros.push("a lista de parâmetros travados é inválida");
    }
    if (!(SEMENTES.includes(b.semente) || (Number.isInteger(b.semente) && b.semente >= 0 && b.semente <= LIMITES.semente))) {
      erros.push("a semente é \"cada-aluno\", \"turma\" ou um número inteiro");
    }
    if (!Array.isArray(b.coletar) || b.coletar.length > LIMITES.coletar || !b.coletar.every((r) => ehTexto(r, LIMITES.rotulo))) {
      erros.push("a lista do que coletar é inválida");
    }
    if (b.variar != null) {
      const v = b.variar;
      if (!ehObjeto(v) || !PADRAO_DO_NOME.test(String(v.parametro)) || !Array.isArray(v.valores)
          || v.valores.length < 2 || v.valores.length > LIMITES.valoresDeVariar || !v.valores.every(ehNumero)) {
        erros.push("para variar, escolha um parâmetro e pelo menos dois valores");
      }
    }
  }

  if (b.tipo === "pergunta") {
    if (!ehTexto(b.enunciado, LIMITES.enunciado)) erros.push(`escreva o enunciado (até ${LIMITES.enunciado} caracteres)`);
    if (!FORMATOS.includes(b.formato)) erros.push("formato de pergunta desconhecido");
    if (typeof b.anonima !== "boolean") erros.push("anonima precisa ser sim ou não");
    if (b.formato === "escolha") {
      if (!Array.isArray(b.opcoes) || b.opcoes.length < 2 || b.opcoes.length > LIMITES.opcoes || !b.opcoes.every((o) => ehTexto(o, LIMITES.opcao))) {
        erros.push(`escreva de 2 a ${LIMITES.opcoes} opções, nenhuma vazia`);
      } else if (b.correta != null && !(Number.isInteger(b.correta) && b.correta >= 0 && b.correta < b.opcoes.length)) {
        erros.push("a opção correta não existe");
      }
    } else if (b.opcoes != null || b.correta != null) {
      erros.push("só a múltipla escolha tem opções");
    }
  }
  return erros;
}

/* os problemas de uma lista de blocos; cada erro vem com o título (ou a posição) do bloco */
export function validarBlocos(blocos) {
  if (!Array.isArray(blocos)) return ["os blocos precisam ser uma lista"];
  const erros = [];
  if (blocos.length > LIMITES.blocos) erros.push(`no máximo ${LIMITES.blocos} blocos`);
  const vistos = new Set();
  blocos.forEach((b, i) => {
    const nome = ehObjeto(b) && typeof b.titulo === "string" && b.titulo.trim() ? `"${b.titulo.trim()}"` : `#${i + 1}`;
    for (const e of validarBloco(b)) erros.push(`Bloco ${nome}: ${e}`);
    if (ehObjeto(b) && vistos.has(b.id)) erros.push(`Bloco ${nome}: id repetido`);
    if (ehObjeto(b)) vistos.add(b.id);
  });
  return erros;
}

/* uma frase curta sobre o bloco, para as listas */
export function resumirBloco(b) {
  if (b.tipo === "texto") return "texto";
  if (b.tipo === "simulador") return `simulador ${b.simulador || "?"}${b.variar ? ` · varia ${b.variar.parametro}` : ""}`;
  return `pergunta · ${(ROTULOS_DOS_FORMATOS[b.formato] ?? b.formato).toLowerCase()}`;
}
