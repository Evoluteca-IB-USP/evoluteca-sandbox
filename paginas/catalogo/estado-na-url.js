/* O estado dos filtros vive na URL — catalogo.html?q=&nivel=&tema=&tempo=
   e #slug — para se poder mandar à turma um link já filtrado. */

import { semAcento } from "portugues";
import { NIVEIS } from "../../modelos-de-simulacao/niveis-e-temas.js";
import { FAIXAS, minutos } from "./faixas-de-duracao.js";

export function lerEstadoDaURL(grupos) {
  const url = new URLSearchParams(location.search);
  return {
    nivel: url.get("nivel") in NIVEIS ? url.get("nivel") : "todos",
    tema: grupos.some((g) => g.tema === url.get("tema")) ? url.get("tema") : "todos",
    tempo: url.get("tempo") in FAIXAS ? url.get("tempo") : "todos",
    texto: (url.get("q") || "").trim(),
    foco: null,                                  // slug escolhido pela pessoa (vai para o #hash)
  };
}

export function guardarNaURL(estado) {
  const p = new URLSearchParams();
  for (const k of ["nivel", "tema", "tempo"]) if (estado[k] !== "todos") p.set(k, estado[k]);
  if (estado.texto) p.set("q", estado.texto);
  const q = p.toString();
  history.replaceState(null, "", `${location.pathname}${q ? "?" + q : ""}${estado.foco ? "#" + estado.foco : ""}`);
}

/** a entrada passa nos filtros de agora? */
export function passaNoFiltro(e, estado) {
  const t = semAcento(estado.texto);
  return (!t || e.busca.includes(t)) &&
         (estado.nivel === "todos" || (e.meta.nivel || []).includes(estado.nivel)) &&
         (estado.tema === "todos" || (e.meta.tema || "") === estado.tema) &&
         (estado.tempo === "todos" || FAIXAS[estado.tempo].vale(minutos(e)));
}

/** filtrando alguma coisa, ou é o acervo inteiro? */
export const estaFiltrando = (estado) =>
  estado.texto !== "" || ["nivel", "tema", "tempo"].some((k) => estado[k] !== "todos");
