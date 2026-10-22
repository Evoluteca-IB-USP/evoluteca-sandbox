/* ============================================================
   O fundo da abertura: deriva genética como
   textura, pré-calculada. Veio do <script> do index.html; o
   catálogo abre com a mesma figura, então ela mora aqui.

   Tudo é sorteado uma vez, com semente fixa, e depois só
   "rebobinado" na tela: nenhum sorteio durante a animação. A
   janela anda sempre da esquerda para a direita; os dados formam
   um laço de L gerações.
   - 12 populações de N = 150 (azuis): quando saem da faixa
     visível (0,12–0,88) o traço some pela borda e outra
     população começa.
   - A trajetória em destaque (amarela) NÃO é uma simulação: é um
     passeio aleatório em dois ritmos (um lento, de centenas de
     gerações, e um tremor rápido), com um puxão suave para o
     centro e comprimido nas bordas por tanh — sobe e desce por
     quase toda a faixa sem nunca fixar. Uma rampa imperceptível
     faz o fim do laço encontrar o começo.

   Cabem 190 gerações na largura da tela: com menos gerações por tela,
   cada passo fica mais largo e as curvas, mais abertas.

   API: animarAbertura(canvas)
        VELOCIDADE: gerações por segundo do fundo
   ============================================================ */

import { criarRng, rbinom, rnorm } from "r";

export const VELOCIDADE = 7;                       // gerações por segundo

export function animarAbertura(canvas) {
  const ctx = canvas.getContext("2d");
  const N = 150, POPULACOES = 12, JANELA = 190;
  const Y_MIN = 0.12, Y_MAX = 0.88;                // faixa visível ("zoom")
  const L = 4800;                                  // tamanho do laço, em gerações (~11 min a 7 ger/s)
  const AMARELO = "#fcb421";
  const cores = ["#64c4d2", "#64c4d2", "#1094ab", "#64c4d2", "#64c4d2"];

  // trajetória em destaque: passeio aleatório de dois ritmos, fechado em laço, sem fixar
  function trilhaFoco() {
    const rng = criarRng(3);
    const x = [];
    let lento = 0, rapido = 0;
    for (let g = 0; g <= L; g++) {
      lento  += -0.004 * lento  + rnorm(0, 0.006, rng);   // sobe-e-desce de centenas de gerações
      rapido += -0.02  * rapido + rnorm(0, 0.018, rng);   // tremor de deriva, dezenas de gerações
      x.push(lento + rapido);
    }
    const desvio = x[L] - x[0];                            // rampa: o fim do laço encontra o começo
    return Array.from({ length: L }, (_, g) => 0.5 + 0.33 * Math.tanh((x[g] - (g / L) * desvio) / 0.22));
  }
  const foco = trilhaFoco();
  canvas.dataset.laco = L;

  // as outras populações: reiniciam quando saem da faixa; NaN encerra um traço
  const rng = criarRng(20260826);
  const trilhas = Array.from({ length: POPULACOES }, (_, k) => {
    const pontos = [];
    let p = 0.35 + rng() * 0.3;
    while (pontos.length < L - 1) {
      pontos.push(p);
      p = rbinom(2 * N, p, rng) / (2 * N);
      if (p <= Y_MIN || p >= Y_MAX) {              // saiu da faixa: encerra o traço…
        pontos.push(p, NaN);                       // (último ponto fora da tela, para o traço cruzar a borda)
        p = 0.35 + rng() * 0.3;                    // …e uma nova população começa
      }
    }
    pontos.length = L - 1;
    pontos.push(NaN);                              // fim do laço: o traço encerra e outra população começa
    return { cor: cores[k % cores.length], pontos };
  });

  let largura = 0, altura = 0;
  function dimensionar() {                         // só aqui o buffer do canvas é realocado
    const dpr = window.devicePixelRatio || 1;
    largura = canvas.clientWidth; altura = canvas.clientHeight;
    canvas.width = largura * dpr; canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const yDe = (p) => (1 - (p - Y_MIN) / (Y_MAX - Y_MIN)) * altura;
  const em = (g) => ((g % L) + L) % L;             // índice no laço

  function desenhar(inicio) {                      // inicio: geração (fracionária) na borda esquerda
    ctx.clearRect(0, 0, largura, altura);

    // grade discreta: dá ao fundo a leitura de um gráfico (0,25 · 0,5 · 0,75)
    ctx.font = "12px 'Open Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    for (const v of [0.25, 0.5, 0.75]) {
      const y = yDe(v);
      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(largura, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.fillText(v.toLocaleString("pt-BR"), largura - 15, y - 3);
    }

    const pxPorGeracao = largura / JANELA;
    const g0 = Math.floor(inicio) - 1;
    const g1 = Math.ceil(inicio) + JANELA + 1;
    const tracar = (pontos, ate) => {
      ctx.beginPath();
      let novoTraco = true;
      for (let g = g0; g <= ate; g++) {
        const p = pontos[em(g)];
        if (Number.isNaN(p)) { novoTraco = true; continue; }
        const x = (g - inicio) * pxPorGeracao;
        novoTraco ? ctx.moveTo(x, yDe(p)) : ctx.lineTo(x, yDe(p));
        novoTraco = false;
      }
      ctx.stroke();
    };

    ctx.lineJoin = "round";
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.5;
    for (const t of trilhas) { ctx.strokeStyle = t.cor; tracar(t.pontos, g1); }

    // população em destaque: termina antes da borda, onde fica a cabeça
    // recuo da cabeça: 18,3% da largura da tela (o que dava 250px numa janela de 1366px),
    // com limites para não sumir em telas estreitas nem exagerar em telas muito largas
    const recuoPx = Math.min(340, Math.max(120, largura * 0.183));
    const gCabeca = Math.floor(inicio + JANELA - recuoPx / pxPorGeracao);
    ctx.strokeStyle = AMARELO;
    ctx.lineWidth = 7; ctx.globalAlpha = 0.16; tracar(foco, gCabeca);   // halo (barato: sem shadowBlur)
    ctx.lineWidth = 2.2; ctx.globalAlpha = 0.95; tracar(foco, gCabeca);
    ctx.globalAlpha = 1;

    const cx = (gCabeca - inicio) * pxPorGeracao, cy = yDe(foco[em(gCabeca)]);
    const pulso = 0.5 + 0.5 * Math.sin(performance.now() / 450);
    ctx.fillStyle = "rgba(252,180,33,.22)";
    ctx.beginPath(); ctx.arc(cx, cy, 9 + 5 * pulso, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = AMARELO;
    ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
  }

  dimensionar();
  desenhar(0);

  let atrasoRedimensionar = null;
  window.addEventListener("resize", () => {
    clearTimeout(atrasoRedimensionar);
    atrasoRedimensionar = setTimeout(() => { dimensionar(); desenhar(posicaoAtual); }, 120);
  });

  /* animação: sempre para a frente; como os dados formam um laço, nunca acaba */
  let posicaoAtual = 0, t0 = null;
  function quadro(agora) {
    if (t0 === null) t0 = agora;
    posicaoAtual = ((agora - t0) / 1000) * VELOCIDADE;
    desenhar(posicaoAtual);
    requestAnimationFrame(quadro);
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    requestAnimationFrame(quadro);
  }
}
