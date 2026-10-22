/* A placa de colônias do fundo (modelo de Eden): uma célula da borda,
   sorteada, ocupa uma casa vazia vizinha, e a filha nasce da cor da mãe.
   Para as lupas poderem apontar o que acontece, a placa guarda, para cada
   casa, a colônia e a linhagem (de que célula do começo ela descende) e
   avisa cada divisão em `aoDividir`.

   A regra tem dois botões, em `p.regra`: a chance de a cor da filha ser
   sorteada, em vez de copiada da mãe, e quanto mais rápido o amarelo se
   divide. A cada rodada, inclusive ao mudar a regra, as colônias nascem
   em outros lugares, sorteados por `sortearLugares`. */

import { criarRng } from "r";

const CEL = 2;                                       // px por célula
const CORES = ["#2f4bab", "#0d7f95", "#d99920", "#4da8b8"];
const AMARELO = 2;
const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const RITMO = 5200;                                  // divisões por segundo
const SEMENTE = 6;                                   // raio inicial de uma colônia, em células

/* `sortearLugares(rng)` devolve onde nascem as colônias, como pares [x, y] em fração da seção */
export function criarPlacaDeColonias(secao, tela, sortearLugares) {
  const rng = criarRng(Date.now());                  // fundo da home, não um modelo: a semente muda a cada visita
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = tela.getContext("2d");

  const p = {
    CEL, CORES, AMARELO, SEMENTE, W: 0, H: 0,
    grade: null, colonia: null, linhagem: null, frente: [], lugares: [],
    regra: { mutacao: 0, vantagem: 1 },
    aoDividir: null, aoRecomecar: null,
  };
  let nLinhagens = 0, nColonias = 0;

  function dimensionar() {
    const dpr = window.devicePixelRatio || 1;
    const LW = secao.clientWidth || 1200, LH = secao.clientHeight || 700;
    tela.width = Math.round(LW * dpr); tela.height = Math.round(LH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LW, LH);
    p.W = Math.floor(LW / CEL); p.H = Math.floor(LH / CEL);
    const n = p.W * p.H;
    p.grade = new Int8Array(n).fill(-1);
    p.colonia = new Int16Array(n).fill(-1);
    p.linhagem = new Int32Array(n).fill(-1);
    p.frente = []; nLinhagens = 0; nColonias = 0;
  }

  function pintar(i) {
    ctx.fillStyle = CORES[p.grade[i]];
    ctx.fillRect((i % p.W) * CEL, Math.floor(i / p.W) * CEL, CEL, CEL);
  }

  function plantar(fx, fy) {
    const { W, H } = p;
    const cx = Math.round(fx * W), cy = Math.round(fy * H), c = nColonias++;
    for (let dy = -SEMENTE; dy <= SEMENTE; dy++) {
      for (let dx = -SEMENTE; dx <= SEMENTE; dx++) {
        if (dx * dx + dy * dy > SEMENTE * SEMENTE) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        if (p.grade[i] !== -1) continue;
        p.grade[i] = Math.floor(rng() * CORES.length);
        p.colonia[i] = c;
        p.linhagem[i] = nLinhagens++;
        p.frente.push(i); pintar(i);
      }
    }
  }

  p.vazios = function (i) {
    const { W, H } = p, x = i % W, y = Math.floor(i / W), lista = [];
    for (const [dx, dy] of VIZ) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (p.grade[ni] === -1) lista.push(ni);
    }
    return lista;
  };

  /* a regra, aplicada uma vez: a mãe `i` ocupa a casa vazia `filha` */
  function dividir(i, filha) {
    const sorteada = p.regra.mutacao > 0 && rng() < p.regra.mutacao;
    p.grade[filha] = sorteada ? Math.floor(rng() * CORES.length) : p.grade[i];
    const outra = p.grade[filha] !== p.grade[i];
    p.colonia[filha] = p.colonia[i];
    p.linhagem[filha] = p.linhagem[i];
    p.frente.push(filha); pintar(filha);
    if (p.aoDividir) p.aoDividir(i, filha, outra);
  }

  function crescer(n) {
    for (let k = 0; k < n && p.frente.length; k++) {
      const j = Math.floor(rng() * p.frente.length), i = p.frente[j];
      if (p.regra.vantagem > 1 && p.grade[i] !== AMARELO && rng() * p.regra.vantagem > 1) continue;
      const livres = p.vazios(i);
      if (!livres.length) { p.frente[j] = p.frente[p.frente.length - 1]; p.frente.pop(); continue; }
      dividir(i, livres[Math.floor(rng() * livres.length)]);
    }
  }

  p.recomecar = function () {
    dimensionar();
    p.lugares = sortearLugares(rng);
    for (const [fx, fy] of p.lugares) plantar(fx, fy);
    if (reduzido) crescer(Math.round(p.W * p.H / 4));
    if (p.aoRecomecar) p.aoRecomecar();
  };

  /* o gesto: clicar no fundo semeia outra colônia */
  tela.addEventListener("pointerdown", (e) => {
    const r = tela.getBoundingClientRect();
    plantar((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  let ultimo = null, sobra = 0;
  function quadro(agora) {
    if (ultimo === null) ultimo = agora;
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    const r = secao.getBoundingClientRect();
    if (!reduzido && r.bottom > 0 && r.top < window.innerHeight) {
      sobra += RITMO * dt;
      const n = Math.floor(sobra); sobra -= n;
      crescer(n);
    }
    requestAnimationFrame(quadro);
  }

  p.comecar = function () {
    p.recomecar();
    requestAnimationFrame(quadro);
    window.addEventListener("resize", () => p.recomecar());
  };

  return p;
}
