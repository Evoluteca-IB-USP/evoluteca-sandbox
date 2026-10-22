/* ============================================================
   CÓDIGO MORTO, guardado de propósito.

   O percurso pelos simuladores — a forma ANTIGA da seção 03 da home,
   substituída em 2026-09 pela poeira (home/quando-usar/). Nenhuma página o
   importa e aparencia/home/percurso.css está fora do pacote da home, então
   nada disto é carregado. Fica aqui porque a forma pode voltar; apague os
   dois arquivos quando isso deixar de valer.

   O percurso pelos simuladores da página inicial

   Não é uma grade de cards nem uma cópia do catálogo: é um
   PERCURSO. À esquerda, os simuladores em destaque passam um de
   cada vez, em tamanho grande; à direita, o palco fica parado e
   roda a simulação daquele que está no meio da tela. No fim do
   percurso o palco vira um mosaico com o acervo inteiro e a
   saída é o catálogo.

   O percurso NÃO cresce com o acervo: mostra sempre os três de
   `modelos-de-simulacao/__pacote__.js` (`destaques`). Quem escala para dezenas de
   simuladores é o catálogo — aqui a rolagem é curta e fixa.

   API:
     montarPercurso(raiz, entradas, opcoes)
       entradas  = [{ slug, meta }, …]   o acervo inteiro (para o mosaico)
       opcoes.destaques = ["deriva", …]  quais entram no percurso
       opcoes.quantos   = 3              teto de passos
       opcoes.linkPara(slug) → href
       opcoes.tom = "claro"              vitrines e mosaico direto sobre a
                                         página clara, sem o palco navy
   ============================================================ */

import { criar } from "escrever-html";
import { plural, minuscula, doisDigitos } from "portugues";
import { NIVEIS, TEMAS } from "../../modelos-de-simulacao/niveis-e-temas.js";
import { miniatura, vitrine, LEGENDAS_DAS_VITRINES } from "../vitrines/__pacote__.js";

const QUANTOS = 3;             // simuladores no percurso, independente do acervo
const FUNDIDO = 600;           // ms do fundido entre cenas (= transição do CSS)
const COLUNAS_MAX = 5;         // colunas do mosaico do acervo
const COM_NOME = 12;           // até esse tamanho, o mosaico ainda cabe rótulos


export function montarPercurso(raiz, entradas, opcoes = {}) {
  const link = opcoes.linkPara || ((slug) => `simulador.html?modelo=${slug}`);
  const linkCatalogo = opcoes.linkCatalogo || "catalogo.html";
  const claro = opcoes.tom === "claro";
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const e of entradas) e.tipo = e.meta.miniatura || e.meta.saida?.tipo || "linhas";

  /* ---- quem entra no percurso: os destaques; na falta deles, os primeiros ---- */
  const pedidos = (opcoes.destaques || []).map((s) => entradas.find((e) => e.slug === s)).filter(Boolean);
  const escolhidos = (pedidos.length ? pedidos : entradas).slice(0, opcoes.quantos ?? QUANTOS);
  const restantes = entradas.length - escolhidos.length;

  /* ================= a coluna que rola ================= */
  const passos = criar("div", { class: "percurso-passos" });

  escolhidos.forEach((e, i) => {
    const { meta } = e;
    const basicos = meta.parametros.filter((p) => !p.avancado).map((p) => minuscula(p.rotulo));
    const rodape = [(meta.nivel || []).map((n) => NIVEIS[n] || n).join(" e "),
                    meta.tempo && `cerca de ${meta.tempo}`].filter(Boolean).join(" · ");

    e.corpo = criar("div", { class: "percurso-corpo", "data-i": String(i) },
      criar("p", { class: "percurso-conta", texto: `${doisDigitos(i + 1)} / ${doisDigitos(escolhidos.length)} · ${TEMAS[meta.tema] || meta.tema || ""}` }),
      criar("h3", {}, criar("a", { href: link(e.slug), texto: meta.titulo })),
      criar("p", { class: "percurso-desc", texto: meta.descricao || "" }),
      criar("p", { class: "percurso-dado" },
        criar("b", { texto: "Você controla" }),
        criar("span", { texto: basicos.join(", ") })),
      criar("div", { class: "percurso-acoes" },
        criar("a", { class: "botao botao-primario", href: link(e.slug) },
          criar("span", { texto: "Abrir simulador" }), criar("span", { class: "seta", "aria-hidden": "true", texto: "→" })),
        criar("span", { class: "percurso-pe", texto: rodape })));
    e.no = criar("article", { class: "percurso-passo" }, e.corpo);
    passos.append(e.no);
  });

  /* ---- o fecho: o percurso acaba no acervo, não num quarto simulador ---- */
  const corpoFecho = criar("div", { class: "percurso-corpo", "data-i": String(escolhidos.length) },
    criar("p", { class: "percurso-conta", texto: "O acervo" }),
    criar("h3", { texto: restantes > 0 ? `E mais ${plural(restantes, "simulador", "simuladores")}` : "O catálogo" }),
    criar("p", { class: "percurso-desc", texto: restantes > 0
      ? "O catálogo põe o acervo inteiro numa tela só: um tema por coluna, com busca e filtro por nível, e o simulador em foco rodando na faixa de cima."
      : "Estes são o começo do acervo. O catálogo é o mapa deles — um tema por coluna, o simulador em foco rodando na faixa de cima — e é lá que entram os próximos." }),
    criar("div", { class: "percurso-acoes" },
      criar("a", { class: "botao botao-primario", href: linkCatalogo },
        criar("span", { texto: "Ver o catálogo" }), criar("span", { class: "seta", "aria-hidden": "true", texto: "→" })),
      criar("span", { class: "percurso-pe", texto: plural(entradas.length, "simulador no ar", "simuladores no ar") })));
  const fecho = criar("article", { class: "percurso-passo percurso-fecho" }, corpoFecho);
  passos.append(fecho);

  /* ================= o palco, parado ================= */
  const telas = [criar("canvas"), criar("canvas")];
  const legenda = criar("p", { class: "percurso-legenda" });

  // mosaico: o acervo inteiro em vinhetas — é o que mostra o tamanho da coisa
  const mosaico = criar("div", { class: "percurso-mosaico" });
  // até cinco, o acervo cabe numa fileira só; daí em diante, um quadrado
  const colunas = entradas.length <= COLUNAS_MAX
    ? entradas.length
    : Math.min(COLUNAS_MAX, Math.ceil(Math.sqrt(entradas.length)));
  mosaico.style.setProperty("--colunas", String(colunas));
  for (const [i, e] of entradas.entries()) {
    const tela = criar("canvas");
    if (!claro) tela.dataset.tom = "escuro";
    e.telaMosaico = tela;
    const item = criar("span", { class: "mosaico-item" }, tela);
    if (entradas.length <= COM_NOME) item.append(criar("small", { texto: e.meta.titulo }));
    mosaico.append(item);
  }
  mosaico.addEventListener("click", () => { location.href = linkCatalogo; });   // atalho do mouse; o botão faz o mesmo

  const cena = criar("div", { class: "percurso-cena", "aria-hidden": "true" }, ...telas, mosaico, legenda);
  const trilho = criar("ol", { class: "percurso-trilho" });
  const palco = criar("div", { class: "percurso-palco" }, cena, trilho);

  /* ---- trilho: onde estamos no percurso (e atalho para cada passo) ---- */
  const nos = [...escolhidos.map((e) => e.no), fecho];
  const corpos = [...escolhidos.map((e) => e.corpo), corpoFecho];
  const rotulos = [...escolhidos.map((e) => e.meta.titulo), "Catálogo"];
  const botoes = rotulos.map((rotulo, i) => {
    const b = criar("button", { type: "button", title: rotulo, texto: rotulo });
    b.addEventListener("click", () => nos[i].scrollIntoView({ block: "center", behavior: "smooth" }));
    trilho.append(criar("li", {}, b));
    return b;
  });

  raiz.append(criar("div", { class: "percurso" }, passos, palco));

  /* ================= qual passo está no meio da tela ================= */
  let atual = -1, frente = 0, inicio = 0, saindo = null;
  const noFecho = () => atual === escolhidos.length;

  function escolher(i) {
    if (i === atual || i < 0 || i >= nos.length) return;
    const primeira = atual < 0;
    const anterior = atual;
    atual = i;
    nos.forEach((no, k) => no.toggleAttribute("data-ativo", k === i));
    botoes.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
    cena.toggleAttribute("data-mosaico", noFecho());
    legenda.textContent = noFecho()
      ? plural(entradas.length, "simulador no acervo", "simuladores no acervo")
      : LEGENDAS_DAS_VITRINES[escolhidos[i].tipo] || "";
    if (noFecho()) {
      for (const t of telas) t.style.opacity = 0;      // o mosaico entra no lugar da cena
      inicio = performance.now();
      dimensionarMosaico();
    } else {
      // o fundido: a cena nova entra por cima da que estava
      if (!primeira && anterior < escolhidos.length) {
        saindo = { tela: telas[frente], i: anterior, inicio, ate: performance.now() + FUNDIDO };
        frente = 1 - frente;
      }
      inicio = performance.now();
      telas[frente].style.opacity = 1;
      telas[1 - frente].style.opacity = 0;
    }
    if (reduzMovimento) desenharParado();
  }

  const olho = new IntersectionObserver((eventos) => {
    for (const ev of eventos) if (ev.isIntersecting) escolher(+ev.target.dataset.i);
  }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
  for (const corpo of corpos) olho.observe(corpo);

  /* ================= desenho ================= */
  const MINI = { folga: 5, vao: 3, linha: 1.5 };        // vinheta pequena: margens e traços mais finos

  /** a altura de cada vinheta vem do número de linhas: 3 simuladores ou 30,
      o mosaico tem de caber na cena sem rolar */
  function dimensionarMosaico() {
    const linhas = Math.ceil(entradas.length / colunas);
    const rotulo = entradas.length <= COM_NOME ? 17 : 0;
    const livre = cena.clientHeight - 68 - (linhas - 1) * 9;      // 68 = respiros + legenda
    mosaico.style.setProperty("--vinheta", `${Math.max(22, Math.min(72, Math.floor(livre / linhas) - rotulo))}px`);
  }

  function desenharMosaico(t) {
    for (const [i, e] of entradas.entries()) miniatura(e.telaMosaico, e.tipo, 7 + i, t == null ? null : t + i * 1.3, MINI);
  }
  const TOM = claro ? { tom: "claro" } : {};
  function desenharParado() {
    if (noFecho()) desenharMosaico(null);
    else vitrine(telas[frente], escolhidos[atual].tipo, 7 + atual, null, TOM);
  }

  function naTela() {
    const r = palco.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function quadro(agora) {
    if (atual >= 0 && naTela()) {
      if (noFecho()) desenharMosaico((agora - inicio) / 1000);
      else {
        vitrine(telas[frente], escolhidos[atual].tipo, 7 + atual, (agora - inicio) / 1000, TOM);
        if (saindo) {
          if (agora < saindo.ate) vitrine(saindo.tela, escolhidos[saindo.i].tipo, 7 + saindo.i, (agora - saindo.inicio) / 1000, TOM);
          else saindo = null;
        }
      }
    }
    requestAnimationFrame(quadro);
  }

  escolher(0);
  window.addEventListener("resize", dimensionarMosaico);
  if (reduzMovimento) {
    desenharParado();
    window.addEventListener("resize", desenharParado);
  } else {
    inicio = performance.now();
    requestAnimationFrame(quadro);
  }
}
