/* A seção "Simuladores" da página inicial.

   O que esta seção É: a apresentação dos simuladores do acervo. Não é uma
   aula de evolução (isso é a seção 01, porque-aprender/) nem a explicação do
   que é um simulador (a 02, o-que-e-um-simulador/). Quem chega aqui já sabe
   as duas coisas e pergunta: então, o que vocês têm? Se a legenda de um passo
   estiver ensinando o conceito em vez de apresentar o simulador, a seção
   virou a 01.

   A forma: a pergunta de cada simulador aparece em tipo grande, feita de
   quatro mil pontos lidos do próprio canvas; quando a frase termina, as
   letras se soltam e os mesmos pontos formam a SAÍDA DO PRÓPRIO SIMULADOR —
   o `simular()` do modelo rodando aqui, com valores que ele aceita. Embaixo,
   a ficha: o nome, o que a figura mostra, os controles (lidos de
   `meta.parametros`) e a porta de entrada.

   Cada passo mostra também uma coisa diferente que esses modelos fazem —
   sortear uma amostra contra o previsto, rodar muitas populações de uma vez,
   guardar rodadas para comparar — e é essa escadinha que dá a ordem. No fim
   a poeira volta a ser frase, conclui e PARA: a seção não entra em laço.

     montar(secao, entradas, opcoes)
       entradas = [{ slug, modulo }, …]   modulo = { meta, simular }
       opcoes.destaques   = ["deriva", …] quais podem entrar
       opcoes.linkPara(slug) → href
       opcoes.linkCatalogo   → href */

import { criar } from "escrever-html";
import { criarRng } from "r";
import { numero, minuscula } from "portugues";
import { preparar, naTela, laco, clamp, suaveIO, NAVY } from "../../desenho-em-canvas/__pacote__.js";
import { PONTOS, poeiraDeTexto, poeiraDeLinhas, poeiraDeBarras, area } from "./poeira/__pacote__.js";
import { moldura, letreiros } from "./moldura-e-letreiros.js";
import { PERGUNTAS, FECHO } from "./perguntas.js";

const TEMPOS = { texto: 2.6, vai: 2, figura: 4.2, volta: 1.4 };   // segundos de cada fase
const TEMPOS_FECHO = { texto: 6, vai: 0, figura: 0, volta: 0 };   // o fecho não vira figura nem volta
const soma = (d) => d.texto + d.vai + d.figura + d.volta;

export function montar(secao, entradas, opcoes = {}) {
  const container = secao.querySelector(".container");
  const link = opcoes.linkPara || ((slug) => `simulador.html?modelo=${slug}`);
  const linkCatalogo = opcoes.linkCatalogo || "catalogo.html";
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tela = criar("canvas", { class: "poeira-tela" });
  const viva = criar("p", { class: "sr-viva", "aria-live": "polite" });
  const ficha = criar("p", { class: "vivo-nota poeira-ficha" });
  const elo = criar("a", { class: "link-seta", href: linkCatalogo, texto: "Ver os simuladores" });
  const deNovo = criar("button", { type: "button", class: "vivo-elo poeira-denovo", hidden: true, texto: "ver de novo" });
  const pe = criar("div", { class: "poeira-pe" }, ficha, criar("span", { class: "poeira-acoes" }, deNovo, elo));
  const trilha = criar("div", { class: "poeira-trilha" });

  container.append(
    criar("div", { class: "poeira-cabeca" },
      criar("p", { class: "vivo-frase", html: "Cada simulador nasce de <b>uma pergunta que não se responde de cabeça</b>." }),
      criar("p", { class: "vivo-texto", html:
        "A figura que se forma abaixo não é ilustração: é a saída do próprio simulador que responde a pergunta, " +
        "rodando aqui com valores que ele aceita. Cada um mostra também uma coisa que esses modelos sabem fazer." })),
    criar("div", { class: "poeira-palco" }, tela, viva), pe, trilha);

  /* ---------- os passos vêm do acervo, na ordem de PERGUNTAS ---------- */
  const podem = new Set(opcoes.destaques || entradas.map((e) => e.slug));
  const passos = [];
  for (const slug of Object.keys(PERGUNTAS)) {
    const entrada = entradas.find((e) => e.slug === slug);
    if (!entrada || !podem.has(slug)) continue;
    const { meta } = entrada.modulo;
    const padrao = Object.fromEntries(meta.parametros.map((p) => [p.nome, p.valor]));
    passos.push({ ...entrada, cfg: PERGUNTAS[slug], valores: { ...padrao, ...PERGUNTAS[slug].ajuste } });
  }
  if (!passos.length) return;                      // acervo sem nenhuma pergunta escrita: seção fica só com o título
  passos.push({ fecho: true });

  /* "Tamanho da população, Frequência inicial (p₀)" → "tamanho da população e
     frequência inicial". Só a inicial vai para minúscula: `toLowerCase()`
     inteiro transformaria "alelo A" em "alelo a". */
  const listar = (meta) => {
    const nomes = meta.parametros.filter((p) => !p.avancado)
      .map((p) => p.rotulo.replace(/\s*\(.*\)$/, ""))
      .map(minuscula);
    return nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}` : nomes[0];
  };

  const barras = passos.map((p, i) => {
    const cheio = criar("i");
    const b = criar("button", { type: "button", class: "poeira-passo" },
      criar("span", { class: "poeira-barra" }, cheio),
      criar("span", { class: "poeira-n", texto: p.fecho ? "—" : String(i + 1).padStart(2, "0") }),
      criar("span", { texto: p.fecho ? "A conclusão" : p.modulo.meta.titulo }));
    b.addEventListener("click", () => { k = i; t0 = null; preparo = null; fim = false; deNovo.hidden = true; });
    trilha.append(b);
    return { b, cheio };
  });
  deNovo.addEventListener("click", () => { k = 0; t0 = null; preparo = null; fim = false; deNovo.hidden = true; });

  /* ---------- estado ---------- */
  let k = 0, t0 = null, preparo = null, largura = -1, ultimo = null, fim = false;

  function preparar1(W, H) {
    const passo = passos[k];
    const rng = criarRng(4000 + k * 31);
    const m = area(W, H);

    if (passo.fecho) {                             // a poeira fica sendo a frase: é o fim
      const texto = poeiraDeTexto(W, H, FECHO.texto, rng);
      return { fig: { pts: texto, eixos: null }, texto, textoProx: texto,
               atraso: texto.map(() => 0), dur: TEMPOS_FECHO,
               ficha: FECHO.ficha, href: linkCatalogo, rotulo: "Ver os simuladores" };
    }

    const { meta, simular } = passo.modulo;
    let fig;
    if (passo.cfg.rodadas) {                       // várias rodadas do mesmo modelo, para comparar
      const series = passo.cfg.rodadas.map((r) => simular({ ...passo.valores, ...r }, criarRng(11))[0]);
      const px = (f) => m.e + f * (m.d - m.e), py = (v) => m.b - v * (m.b - m.t);
      const notas = series.map((serie, j) => {
        const G = serie.length - 1;
        const meio = serie.findIndex((v) => v >= 0.5);   // onde a curva cruza 0,5, como na página do app
        const g = meio >= 0 ? meio : G;
        return { x: px(g / G) + (meio >= 0 ? 8 : -8), y: py(serie[g]) + (meio >= 0 ? 18 : -14),
                 alinhar: meio >= 0 ? "left" : "right",
                 rotulo: `s = ${numero(passo.cfg.rodadas[j].s, 2)}`, ultimo: j === series.length - 1 };
      });
      fig = { pts: poeiraDeLinhas(series, m, rng, series.length - 1),
              eixos: { x: "gerações", y: meta.saida.y, grade: true, notas } };
    } else if (meta.saida.tipo === "barras") {
      fig = poeiraDeBarras(simular(passo.valores, criarRng(97 + k * 13)), m, rng);
    } else {
      fig = { pts: poeiraDeLinhas(simular(passo.valores, criarRng(97 + k * 13)), m, rng, 0),
              eixos: { x: "gerações", y: meta.saida.y, grade: true } };
    }

    const texto = poeiraDeTexto(W, H, passo.cfg.pergunta, rng);
    const prox = passos[k + 1];
    const textoProx = poeiraDeTexto(W, H, prox.fecho ? FECHO.texto : prox.cfg.pergunta, criarRng(4000 + (k + 1) * 31));
    /* o atraso escalonado pela posição horizontal: a nuvem escorre da esquerda
       para a direita, como a simulação que ela vai virar */
    const atraso = texto.map((_, i) => (fig.pts[i][0] / W) * 0.42);
    return { fig, texto, textoProx, atraso, dur: TEMPOS,
             ficha: `<b>${meta.titulo}.</b> ${passo.cfg.mostra} Os controles: ${listar(meta)}.`,
             href: link(passo.slug), rotulo: "Abrir o simulador" };
  }

  function aplicarPe(p) {
    ficha.innerHTML = p.ficha;
    elo.href = p.href;
    elo.textContent = p.rotulo;
    viva.textContent = ficha.textContent;
    pe.toggleAttribute("data-fecho", !!passos[k].fecho);
  }

  function desenhar(fase, forcar = false) {
    const marca = `${k}:${Math.round(fase * 30)}`;       // as fases paradas não redesenham
    if (!forcar && marca === ultimo) return;
    ultimo = marca;
    const { ctx, W, H } = preparar(tela);
    const p = preparo, d = p.dur;
    const para = p.fig.pts;
    let f, de, brilho;
    if (fase < d.texto) { f = 0; de = p.texto; brilho = 0; }
    else if (fase < d.texto + d.vai) { f = (fase - d.texto) / d.vai; de = p.texto; brilho = f; }
    else if (fase < d.texto + d.vai + d.figura) { f = 1; de = p.texto; brilho = 1; }
    else { f = d.volta ? clamp(1 - (fase - d.texto - d.vai - d.figura) / d.volta) : 0; de = p.textoProx; brilho = f; }

    const aLetra = brilho > 0.45 && p.fig.eixos ? (brilho - 0.45) / 0.55 : 0;
    if (aLetra) moldura(ctx, W, H, p.fig.eixos, aLetra);

    const grupos = new Map();                            // um caminho por cor: 4.000 arcos por quadro
    for (let i = 0; i < para.length; i++) {
      const u = suaveIO(clamp((f * 1.42 - p.atraso[i]) / 1));
      const x = de[i][0] + (para[i][0] - de[i][0]) * u;
      const y = de[i][1] + (para[i][1] - de[i][1]) * u;
      const cor = u > 0.45 ? para[i][2] : NAVY;
      let g = grupos.get(cor);
      if (!g) grupos.set(cor, (g = []));
      g.push(x, y, u);
    }
    for (const [cor, v] of grupos) {
      ctx.fillStyle = cor;
      ctx.beginPath();
      for (let i = 0; i < v.length; i += 3) {
        const r = 1.15 + 0.55 * Math.sin(v[i + 2] * Math.PI);   // engorda no meio do voo
        ctx.moveTo(v[i] + r, v[i + 1]);
        ctx.arc(v[i], v[i + 1], r, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
    if (aLetra) letreiros(ctx, W, H, p.fig.eixos, aLetra);
  }
  function quadro(t) {
    if (!naTela(secao, 120)) { if (!fim) t0 = null; return; }     // fora da tela, a apresentação espera
    const W = tela.clientWidth;
    if (W !== largura) { largura = W; preparo = null; }
    if (!preparo) { preparo = preparar1(W, tela.clientHeight); t0 = t; ultimo = null; aplicarPe(preparo); }
    if (fim) return;
    if (t0 === null) t0 = t;
    const total = soma(preparo.dur);
    const fase = t - t0;
    barras.forEach((b, i) => {
      b.b.toggleAttribute("data-ativo", i === k);
      b.cheio.style.width = i === k ? `${clamp(fase / total) * 100}%` : i < k ? "100%" : "0%";
    });
    if (fase >= total) {
      if (passos[k].fecho) {                                // fim da apresentação: para aqui e espera
        fim = true;
        deNovo.hidden = false;
        barras[k].cheio.style.width = "100%";
        desenhar(preparo.dur.texto - 0.01, true);
        return;
      }
      k += 1; preparo = null; return;
    }
    desenhar(fase);
  }

  if (reduzMovimento) {
    const ver = () => {
      largura = tela.clientWidth;
      preparo = preparar1(tela.clientWidth, tela.clientHeight);
      aplicarPe(preparo);
      desenhar(TEMPOS.texto + TEMPOS.vai + 0.1, true);       // sem animação: a figura já formada
    };
    ver();
    window.addEventListener("resize", ver);
    barras.forEach((b, i) => { b.cheio.style.width = i === 0 ? "100%" : "0%"; b.b.toggleAttribute("data-ativo", i === 0); });
  } else {
    laco(quadro);
  }
}
