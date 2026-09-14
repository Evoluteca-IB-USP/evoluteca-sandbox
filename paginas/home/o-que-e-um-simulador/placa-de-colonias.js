/* O modelo de Eden: a regra do modelo é uma só — uma célula da frente,
   sorteada, ocupa uma casa vazia vizinha e passa a cor adiante. Com seleção,
   a cor escura se divide 30% mais rápido; com mutação, uma em 300 nasce de
   outra cor. Mudar a regra recomeça a colônia DO MESMO PONTO DE PARTIDA,
   para a comparação ser justa.

   A placa cobre a seção inteira: a seção seguinte a corta numa emenda
   (paginas/emenda-entre-secoes.js), por isso duas das cinco sementes nascem
   perto do topo — para a colônia alcançar o dente da serra. A paleta é
   amortecida (sem o âmbar puro do navy) para não disputar com o âmbar do
   texto. */

import { criarRng } from "r";

const CEL = 2;                                       // px por célula
const CORES = ["#2f4bab", "#0d7f95", "#d99920", "#4da8b8"];   // não disputa com o âmbar/teal do texto
const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const TAXA = 5200;                                   // divisões por segundo
const SEMENTE = 6;                                   // raio inicial de uma colônia, em células
const VANTAGEM = 1.3;                                // com seleção, a cor escura divide 30% mais rápido
const MUTACAO = 1 / 300;                             // com mutação, uma em 300 nasce de outra cor
/* duas das cinco nascem perto do topo, para a colônia encostar na emenda */
const SEMENTES = [[0.16, 0.5], [0.46, 0.42], [0.8, 0.53], [0.3, 0.07], [0.86, 0.1]];

export function criarPlacaDeColonias(secao, tela) {
  const rng = criarRng(7);
  const regra = { selecao: false, mutacao: false };
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ctx = tela.getContext("2d");
  let W = 0, H = 0, LW = 0, LH = 0, grade = null, frente = [];
  let sementes = [];

  function dimensionar() {
    const dpr = window.devicePixelRatio || 1;
    LW = secao.clientWidth || 1200; LH = secao.clientHeight || 700;
    tela.width = Math.round(LW * dpr); tela.height = Math.round(LH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LW, LH);
    W = Math.floor(LW / CEL); H = Math.floor(LH / CEL);
    grade = new Int8Array(W * H).fill(-1);
    frente = [];
  }
  function pintarCel(i) {
    ctx.fillStyle = CORES[grade[i]];
    ctx.fillRect((i % W) * CEL, Math.floor(i / W) * CEL, CEL, CEL);
  }
  function plantar(s) {
    const cx = Math.round(s.fx * W), cy = Math.round(s.fy * H);
    const cores = s.cores || [];
    let k = 0;
    for (let dy = -SEMENTE; dy <= SEMENTE; dy++) {
      for (let dx = -SEMENTE; dx <= SEMENTE; dx++) {
        if (dx * dx + dy * dy > SEMENTE * SEMENTE) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        if (grade[i] !== -1) { k++; continue; }
        if (cores[k] == null) cores[k] = Math.floor(rng() * CORES.length);
        grade[i] = cores[k++];
        frente.push(i); pintarCel(i);
      }
    }
    s.cores = cores;
  }
  function crescer(n) {
    for (let k = 0; k < n && frente.length; k++) {
      const j = Math.floor(rng() * frente.length), i = frente[j];
      if (regra.selecao && grade[i] !== 0 && rng() * VANTAGEM > 1) continue;
      const x = i % W, y = Math.floor(i / W);
      let cand = -1, vazios = 0;
      for (const [dx, dy] of VIZ) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (grade[ni] !== -1) continue;
        vazios++;
        if (rng() * vazios < 1) cand = ni;
      }
      if (cand < 0) { frente[j] = frente[frente.length - 1]; frente.pop(); continue; }
      grade[cand] = regra.mutacao && rng() < MUTACAO ? Math.floor(rng() * CORES.length) : grade[i];
      frente.push(cand); pintarCel(cand);
    }
  }
  const parado = () => crescer(Math.round(W * H / 4));   // ~1/4 da placa, em qualquer tamanho

  function recomecarNovo() {
    dimensionar();
    sementes = SEMENTES.map(([fx, fy]) =>
      ({ fx: fx + (rng() - .5) * .06, fy: fy + (rng() - .5) * .08 }));
    for (const s of sementes) plantar(s);
    if (reduzido) parado();
  }
  function recomecarMesmo() {
    dimensionar();
    for (const s of sementes) plantar(s);
    if (reduzido) parado();
  }

  /* o gesto: clicar no fundo semeia outra colônia */
  tela.addEventListener("pointerdown", (e) => {
    const r = tela.getBoundingClientRect();
    const s = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
    sementes.push(s); plantar(s);
  });

  let ultimo = null;
  function quadro(agora) {
    if (ultimo === null) ultimo = agora;
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    const r = secao.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) crescer(Math.round(TAXA * dt));
    requestAnimationFrame(quadro);
  }

  function comecar() {
    recomecarNovo();
    /* sem animação não há laço para regar a colônia replantada: cresce aqui */
    if (reduzido) parado();
    else requestAnimationFrame(quadro);
    window.addEventListener("resize", () => { recomecarNovo(); if (reduzido) parado(); });
  }

  return { regra, comecar, recomecarNovo, recomecarMesmo };
}
