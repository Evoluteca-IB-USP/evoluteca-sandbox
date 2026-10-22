// O acervo achatado para as navbars que procuram em frase
import { arvore } from "./site-de-mentira.js";

export const normalizar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const temas = arvore.filhos.find((n) => n.id === "simuladores").filhos;

// as portas de entrada, para quando a lacuna está vazia
export const portas = [
  { id: "inicio", titulo: "Início", onde: "a página inicial" },
  { id: "simuladores", titulo: "Simuladores", onde: "o catálogo inteiro" },
  ...temas.map((t) => ({ id: t.id, titulo: t.titulo, onde: `${t.filhos.length} simuladores` })),
];

export const modelos = temas.flatMap((t) =>
  t.filhos.map((m) => ({ id: m.id, titulo: m.titulo, onde: t.titulo, tema: t.id, descricao: m.descricao ?? "", tipo: m.tipo, previsto: m.previsto })));

export const prontos = modelos.filter((m) => !m.previsto);

export function buscar(texto, { tema = null, naDescricao = false } = {}) {
  const q = normalizar(texto.trim());
  const dentro = tema ? modelos.filter((m) => m.tema === tema) : modelos;
  if (!q) return tema ? dentro : portas;
  const bate = (o) =>
    normalizar(o.titulo).includes(q) || normalizar(o.onde).includes(q) || (naDescricao && normalizar(o.descricao ?? "").includes(q));
  return [...(tema ? [] : portas), ...dentro].filter(bate);
}
