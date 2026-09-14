/* A página de catálogo. Monta o acervo inteiro a partir dos blocos `meta` dos
   modelos: quem adiciona um simulador não mexe nesta página nem no HTML.

   Duas partes — o banner navy com os filtros e a folha de contato
   (banner-com-filtros.js, folha-de-contato.js) e, embaixo, uma seção por
   tema (secoes-por-tema.js) com o simulador em foco rodando ao vivo ao lado
   do índice (palco-do-tema.js).

   Aqui fica o que amarra os três: o filtro, a escolha do que está no palco e
   o laço que desenha. O filtro ESMAECE em vez de esconder.

     montarCatalogo(main, entradas, opcoes)  entradas = [{ slug, meta }, …]
       main             o <main> da página (o banner e as seções entram nele)
       opcoes.banner    onde o banner é montado (padrão: <div id="banner">)
       opcoes.linkPara  slug → href */

import { agruparPorTema } from "./agrupar-por-tema.js";
import { lerEstadoDaURL, guardarNaURL, passaNoFiltro, estaFiltrando } from "./estado-na-url.js";
import { criarBanner } from "./banner-com-filtros.js";
import { criarFolhaDeContato } from "./folha-de-contato.js";
import { criarSecoesPorTema } from "./secoes-por-tema.js";
import { escreverFicha, desenharQuadro, desenharEstatico, opcoesDaVitrine } from "./palco-do-tema.js";
import { vitrine } from "../vitrines/__pacote__.js";

const DURACAO = 9;                  // segundos por simulador na troca automática
const FUNDIDO = 700;                // ms do fundido entre cenas (= transição do CSS)

export function montarCatalogo(main, entradas, opcoes = {}) {
  const link = opcoes.linkPara || ((slug) => `simulador.html?modelo=${slug}`);
  const casaBanner = opcoes.banner || document.getElementById("banner");
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const grupos = agruparPorTema(entradas);
  const estado = lerEstadoDaURL(grupos);
  const passa = (e) => passaNoFiltro(e, estado);

  const banner = criarBanner({
    grupos, estado,
    aoMudar: aplicar,
    aoEscolherTema: (g) => {
      const jaEstava = estado.tema === g.tema;
      estado.tema = jaEstava ? "todos" : g.tema;
      aplicar();
      if (!jaEstava) g.secao.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    aoLimpar: () => {
      estado.nivel = estado.tema = estado.tempo = "todos";
      estado.texto = "";
      aplicar();
    },
  });
  casaBanner.append(banner.no);

  const folha = criarFolhaDeContato({ grupos, entradas, link, aoFocar: escolherPessoa, reduz });
  banner.esteira.append(folha.no);

  const { linhas } = criarSecoesPorTema({ grupos, entradas, main, link, aoFocar: escolherPessoa, reduz });

  /* ================= filtrar: esmaecer, não esconder ================= */
  function aplicar() {
    banner.marcarFiltros();

    let dentro = 0;
    entradas.forEach((e, i) => {
      const ok = passa(e);
      linhas[i].toggleAttribute("data-fora", !ok);
      folha.marcarFora(i, !ok);
      if (ok) dentro++;
    });
    for (const g of grupos) {
      g.dentro = g.membros.filter((i) => passa(entradas[i])).length;
      g.etiqueta.textContent = banner.etiquetaDoTema(g);
      folha.contarTema(g);
      banner.contarTema(g);
      g.secao.classList.toggle("tema-vazio", g.dentro === 0);
      // o simulador no palco saiu do filtro: o palco passa para o primeiro que ficou
      if (g.atual >= 0 && g.dentro > 0 && !passa(entradas[g.atual])) escolher(g, doFiltro(g, 0));
    }

    banner.contar(dentro, entradas.length, estaFiltrando(estado));
    guardarNaURL(estado);
  }

  /** o k-ésimo simulador do tema dentro do filtro depois do que está no palco */
  function doFiltro(g, passo) {
    const ordem = g.membros.filter((i) => passa(entradas[i]));
    if (!ordem.length) return g.atual >= 0 ? g.atual : g.membros[0];
    const pos = ordem.indexOf(g.atual);
    return ordem[(Math.max(0, pos) + passo) % ordem.length];
  }

  /* ================= o palco de cada seção ================= */
  function escolher(g, i) {
    if (i == null || i === g.atual || !entradas[i]) return;
    const primeira = g.atual < 0, anterior = g.atual;
    g.atual = i;

    const e = entradas[i];
    escreverFicha(g.ficha, e, link(e.slug));

    for (const k of g.membros) linhas[k].toggleAttribute("aria-current", k === i);
    folha.acender(i);
    folha.rolarAte(i);

    if (!primeira) {                             // fundido: a cena nova entra por cima da antiga
      g.saindo = { tela: g.telas[g.frente], i: anterior, inicio: g.inicio, ate: performance.now() + FUNDIDO };
      g.frente = 1 - g.frente;
    }
    g.inicio = performance.now();
    g.progresso = 0;
    g.telas[g.frente].style.opacity = 1;
    g.telas[1 - g.frente].style.opacity = 0;
    if (reduz) desenharEstatico(g, entradas);
  }

  /* a escolha da pessoa desliga a troca automática daquele tema e vai para a URL */
  function escolherPessoa(i) {
    const g = grupos.find((x) => x.membros.includes(i));
    if (!g) return;
    g.automatico = false;
    estado.foco = entradas[i].slug;
    escolher(g, i);
    guardarNaURL(estado);
  }

  function naTela(g) {
    const r = g.palco.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  let ultimo = null;
  function quadro(agora) {
    if (ultimo === null) ultimo = agora;
    const dt = Math.min(0.1, (agora - ultimo) / 1000);   // aba escondida: não pula vários de uma vez
    ultimo = agora;
    for (const g of grupos) {
      if (g.atual < 0 || !naTela(g)) continue;           // só o que está na tela desenha e avança
      desenharQuadro(g, entradas[g.atual], (agora - g.inicio) / 1000);
      if (g.saindo) {
        const es = entradas[g.saindo.i];
        if (agora < g.saindo.ate) vitrine(g.saindo.tela, es.tipo, 7 + g.saindo.i, (agora - g.saindo.inicio) / 1000, opcoesDaVitrine(g, g.saindo.tela, es));
        else g.saindo = null;
      }
      if (g.automatico) {
        g.progresso += dt / DURACAO;
        if (g.progresso >= 1) escolher(g, doFiltro(g, 1));
      }
    }
    requestAnimationFrame(quadro);
  }

  /* ================= início ================= */
  const pedido = entradas.findIndex((e) => `#${e.slug}` === location.hash);
  aplicar();
  for (const g of grupos) {
    if (!g.membros.length) continue;
    const seu = pedido >= 0 && g.membros.includes(pedido);
    if (seu) { g.automatico = false; estado.foco = entradas[pedido].slug; }
    escolher(g, seu ? pedido : doFiltro(g, 0));
    if (seu) requestAnimationFrame(() => g.secao.scrollIntoView({ block: "start" }));
  }
  if (reduz) window.addEventListener("resize", () => grupos.forEach((g) => desenharEstatico(g, entradas)));
  else requestAnimationFrame(quadro);
}
