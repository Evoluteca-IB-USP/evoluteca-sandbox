// Mockup: a "página" é o que vem depois do #, então os cliques não saem daqui e a navbar não volta para a original
import { lista, previstos, TEMAS } from "../../../modelos-de-simulacao/__pacote__.js";

const publicados = await Promise.all(
  lista.map(async (slug) => ({ slug, meta: (await import(`../../../modelos-de-simulacao/${slug}/modelo.js`)).meta })),
);
const modelos = [...publicados, ...previstos];

export const arvore = {
  id: "raiz",
  titulo: "Evoluteca",
  filhos: [
    { id: "inicio", titulo: "Início" },
    {
      id: "simuladores",
      titulo: "Simuladores",
      filhos: Object.entries(TEMAS).map(([tema, titulo]) => ({
        id: tema,
        titulo,
        tema: true,
        filhos: modelos
          .filter((m) => m.meta.tema === tema)
          .map((m) => ({ id: m.slug, titulo: m.meta.titulo, descricao: m.meta.descricao, tipo: m.meta.saida?.tipo, previsto: Boolean(m.meta.previsto) })),
      })),
    },
  ],
};

export function caminhoAte(id, no = arvore) {
  if (no.id === id) return [no];
  for (const filho of no.filhos ?? []) {
    const resto = caminhoAte(id, filho);
    if (resto.length) return [no, ...resto];
  }
  return [];
}

export const paginaAtual = () => decodeURIComponent(location.hash.slice(1)) || "deriva";
export const aoNavegar = (fn) => addEventListener("hashchange", () => fn(paginaAtual()));

export function montarPaginaDeMentira(main) {
  const desenhar = (id) => {
    const caminho = caminhoAte(id);
    const no = caminho.at(-1);
    const tema = caminho.find((n) => n.tema);
    const linha = id === "inicio" ? "A evolução, em tempo de aula."
      : id === "simuladores" ? `${modelos.length} simuladores no acervo.`
      : no.previsto ? "Em breve." : "Simulador pronto para usar.";
    main.innerHTML = `
      <p class="exemplo-sobrancelha">${tema ? tema.titulo : "&nbsp;"}</p>
      <h1>${no.titulo}<span>.</span></h1>
      <p class="exemplo-lede">${linha}</p>
      <div class="exemplo-grade"><div></div><div></div><div></div></div>
      <p class="exemplo-aviso">Mockup da navbar: os cliques trocam esta página aqui mesmo, sem sair.</p>`;
  };
  aoNavegar(desenhar);
  desenhar(paginaAtual());
}
