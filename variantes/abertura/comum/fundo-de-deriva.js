/* O papel de parede das variantes da abertura: o mesmo Wright–Fisher do
   fundo oficial (paginas/home/abertura.js), com o que cada variante muda
   virando opção.

   Dois jeitos de andar:
   - "rolar": a janela anda para a direita sem fim, como na home de hoje;
   - "leque": todas as populações saem de 0,5 na borda esquerda e o gráfico
     se desenha até a direita, como um simulador rodando; depois recomeça.

   API: animarFundo(canvas, opcoes) → { definirN(n) }
        opcoes: modo, N, populacoes, janela, velocidade, destaque (linha âmbar),
                grade ("direita" | "esquerda" | null), rotulos ({ valor: texto } da grade),
                eixoGeracoes (régua no pé), margemTopo (livre em cima: px, ou fração da altura se < 1),
                aoQuadro({ geracoes, cabeca }) */

import { criarRng, rbinom, rnorm } from "r";

const AMARELO = "#fcb421";
const CORES = ["#64c4d2", "#64c4d2", "#1094ab", "#64c4d2", "#64c4d2"];
const EIXO = 46;                                   // px reservados à régua das gerações

function trilhaFoco(L) {
  const rng = criarRng(3);
  const x = [];
  let lento = 0, rapido = 0;
  for (let g = 0; g <= L; g++) {
    lento  += -0.004 * lento  + rnorm(0, 0.006, rng);
    rapido += -0.02  * rapido + rnorm(0, 0.018, rng);
    x.push(lento + rapido);
  }
  const desvio = x[L] - x[0];
  return Array.from({ length: L }, (_, g) => 0.5 + 0.33 * Math.tanh((x[g] - (g / L) * desvio) / 0.22));
}

function trilhasQueRolam(N, quantas, L, yMin, yMax, semente) {
  const rng = criarRng(semente);
  return Array.from({ length: quantas }, () => {
    const pontos = [];
    let p = 0.35 + rng() * 0.3;
    while (pontos.length < L - 1) {
      pontos.push(p);
      p = rbinom(2 * N, p, rng) / (2 * N);
      if (p <= yMin || p >= yMax) { pontos.push(p, NaN); p = 0.35 + rng() * 0.3; }
    }
    pontos.length = L - 1;
    pontos.push(NaN);
    return pontos;
  });
}

function trilhasEmLeque(N, quantas, geracoes, semente) {
  const rng = criarRng(semente);
  return Array.from({ length: quantas }, () => {
    const pontos = [0.5];
    for (let g = 1; g <= geracoes; g++) pontos.push(rbinom(2 * N, pontos[g - 1], rng) / (2 * N));
    return pontos;
  });
}

export function animarFundo(canvas, opcoes = {}) {
  const {
    modo = "rolar", populacoes = 12, janela = 190, velocidade = 7,
    destaque = true, grade = "direita", rotulos = {}, eixoGeracoes = false, margemTopo = 0, aoQuadro = null,
  } = opcoes;
  let N = opcoes.N ?? 150;
  const ctx = canvas.getContext("2d");
  const L = 4800;
  const [yMin, yMax] = modo === "leque" ? [-0.04, 1.04] : [0.12, 0.88];
  const foco = destaque ? trilhaFoco(L) : null;
  let trilhas, rodada = 0, inicioDaRodada = null;

  function sortear() {
    rodada += 1;
    trilhas = modo === "leque"
      ? trilhasEmLeque(N, populacoes, janela, 1000 + rodada)
      : trilhasQueRolam(N, populacoes, L, yMin, yMax, 20260826);
    inicioDaRodada = null;
  }
  sortear();

  let largura = 0, altura = 0;
  function dimensionar() {
    const dpr = window.devicePixelRatio || 1;
    largura = canvas.clientWidth; altura = canvas.clientHeight;
    canvas.width = largura * dpr; canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const topo = () => (margemTopo < 1 ? margemTopo * altura : margemTopo);
  const alturaGrafico = () => altura - topo() - (eixoGeracoes ? EIXO : 0);
  const yDe = (p) => topo() + (1 - (p - yMin) / (yMax - yMin)) * alturaGrafico();
  const em = (g) => ((g % L) + L) % L;

  function desenharGrade() {
    if (!grade) return;
    ctx.font = "12px 'Open Sans', sans-serif";
    ctx.textAlign = grade === "direita" ? "right" : "left";
    ctx.textBaseline = "bottom";
    const xRotulo = grade === "direita" ? largura - 15 : 15;
    for (const v of modo === "leque" ? [0, 0.5, 1] : [0.25, 0.5, 0.75]) {
      const y = yDe(v);
      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(largura, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.fillText(rotulos[v] ?? v.toLocaleString("pt-BR"), xRotulo, y - 3);
    }
  }

  function desenharRegua(inicio, pxPorGeracao) {
    const y = altura - EIXO;
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(largura, y + 0.5); ctx.stroke();
    ctx.font = "12px 'Open Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,.72)";
    for (let g = Math.ceil(inicio / 10) * 10; g <= inicio + janela; g += 10) {
      const x = (g - inicio) * pxPorGeracao;
      const grande = g % 50 === 0;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (grande ? 9 : 5)); ctx.stroke();
      if (grande && g > 0) ctx.fillText(`geração ${g.toLocaleString("pt-BR")}`, x, y + 14);
    }
  }

  function tracar(pontos, de, ate, inicio, pxPorGeracao, indice) {
    ctx.beginPath();
    let novoTraco = true;
    for (let g = de; g <= ate; g++) {
      const p = pontos[indice(g)];
      if (p === undefined || Number.isNaN(p)) { novoTraco = true; continue; }
      const x = (g - inicio) * pxPorGeracao;
      novoTraco ? ctx.moveTo(x, yDe(p)) : ctx.lineTo(x, yDe(p));
      novoTraco = false;
    }
    ctx.stroke();
  }

  function desenhar(inicio, ate) {
    ctx.clearRect(0, 0, largura, altura);
    desenharGrade();
    const pxPorGeracao = largura / janela;
    if (eixoGeracoes) desenharRegua(inicio, pxPorGeracao);
    const indice = modo === "leque" ? (g) => g : em;
    const g0 = Math.floor(inicio) - 1;

    ctx.lineJoin = "round";
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.5;
    trilhas.forEach((pontos, k) => { ctx.strokeStyle = CORES[k % CORES.length]; tracar(pontos, g0, ate, inicio, pxPorGeracao, indice); });
    ctx.globalAlpha = 1;
    if (!foco) return null;

    const recuoPx = Math.min(340, Math.max(120, largura * 0.183));
    const gCabeca = Math.floor(inicio + janela - recuoPx / pxPorGeracao);
    ctx.strokeStyle = AMARELO;
    ctx.lineWidth = 7; ctx.globalAlpha = 0.16; tracar(foco, g0, gCabeca, inicio, pxPorGeracao, em);
    ctx.lineWidth = 2.2; ctx.globalAlpha = 0.95; tracar(foco, g0, gCabeca, inicio, pxPorGeracao, em);
    ctx.globalAlpha = 1;
    const cabeca = { x: (gCabeca - inicio) * pxPorGeracao, y: yDe(foco[em(gCabeca)]), p: foco[em(gCabeca)], geracao: gCabeca };
    const pulso = 0.5 + 0.5 * Math.sin(performance.now() / 450);
    ctx.fillStyle = "rgba(252,180,33,.22)";
    ctx.beginPath(); ctx.arc(cabeca.x, cabeca.y, 9 + 5 * pulso, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cabeca.x, cabeca.y, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = AMARELO;
    ctx.beginPath(); ctx.arc(cabeca.x, cabeca.y, 2.6, 0, Math.PI * 2); ctx.fill();
    return cabeca;
  }

  let t0 = null;
  function quadro(agora) {
    if (t0 === null) t0 = agora;
    const geracoes = ((agora - t0) / 1000) * velocidade;
    let cabeca;
    if (modo === "leque") {
      if (inicioDaRodada === null) inicioDaRodada = agora;
      const g = ((agora - inicioDaRodada) / 1000) * velocidade;
      cabeca = desenhar(0, Math.min(janela, Math.floor(g)));
      if (g > janela + 3 * velocidade) sortear();
    } else {
      cabeca = desenhar(geracoes, Math.ceil(geracoes) + janela + 1);
    }
    aoQuadro?.({ geracoes, cabeca });
    requestAnimationFrame(quadro);
  }

  dimensionar();
  window.addEventListener("resize", dimensionar);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) desenhar(0, janela);
  else requestAnimationFrame(quadro);

  return {
    definirN(n) { N = n; sortear(); },
  };
}
