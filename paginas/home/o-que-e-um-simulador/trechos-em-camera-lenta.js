/* Os dois trechos da placa que as lupas repetem em câmera lenta, cada um
   gravado numa janela fixa de células, sem zoom que mude:

     nascimento  uma colônia desde a semente, até a frente passar da janela;
     mutante     uma filha que nasceu de outra cor e a família que saiu dela.

   Os quadros são tirados por acontecimento, e não por tempo: a placa para
   quando sai da tela, e o trecho não se enche de quadros iguais. O
   nascimento ganha um quadro a cada tantas divisões dentro da janela; o
   mutante, a cada FILHAS_POR_QUADRO filhas novas na família dele. Gravam-se
   vários mutantes de uma vez, e fica o primeiro cuja família chega a
   FAMILIA_ALVO; os que não chegam lá, cercados pelas vizinhas, são
   esquecidos. Cada quadro do
   mutante guarda até onde a família ia, para a lupa acender só ela. Com a
   cor sorteada não há família, e o trecho é só a janela em volta dele. */

const QUADROS = 44;
const SOBRA = .12;                        // parte dos lugares vazios que encerra o nascimento
const FAMILIA_ALVO = 60;
const FILHAS_POR_QUADRO = 2;
const CANDIDATOS = 10;
const CONFERIR = 200;                     // de quantas em quantas divisões na janela ver se a família morreu
const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function criarGravacao(p, cx, cy, lado) {
  const x0 = cx - (lado >> 1), y0 = cy - (lado >> 1);
  const g = { cx, cy, x0, y0, lado, quadros: [], divisoes: 0 };
  g.dentro = (i) => {
    const x = i % p.W - x0, y = Math.floor(i / p.W) - y0;
    return x >= 0 && y >= 0 && x < lado && y < lado;
  };
  /* guarda a janela como está e diz quantos lugares vazios ela tem */
  g.fotografar = () => {
    const celulas = new Int8Array(lado * lado);
    let vazias = 0;
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
      const px = x0 + x, py = y0 + y;
      const c = px >= 0 && py >= 0 && px < p.W && py < p.H ? p.grade[py * p.W + px] : -2;
      celulas[y * lado + x] = c;
      if (c === -1) vazias++;
    }
    g.quadros.push(celulas);
    return vazias;
  };
  return g;
}

/* qual quadro mostrar no instante `agora`; `pausas[k]` segura o quadro k por mais tempo */
export function quadroDaVez(g, agora, pausas = {}) {
  const n = g.quadros.length, dur = (k) => (pausas[k] ?? 170) + (k === n - 1 ? 1800 : 0);
  let total = 0;
  for (let k = 0; k < n; k++) total += dur(k);
  let t = agora % total;
  for (let k = 0; k < n; k++) {
    t -= dur(k);
    if (t < 0) return k;
  }
  return n - 1;
}

export function criarTrechos(p, { naJanela, centroDa, px }) {
  const T = { nascimento: null, mutante: null };
  let candidatos = [], nasc = null;

  T.recomecou = (colonia) => {
    const [cx, cy] = centroDa(colonia);
    const g = criarGravacao(p, cx, cy, 44), vazias0 = g.fotografar();
    nasc = { g, vazias0, passo: Math.max(4, Math.ceil(vazias0 * (1 - SOBRA) / (QUADROS - 3))), pronto: false };
    T.nascimento = g;
    T.mutante = null;
    candidatos = [];
  };

  function crescerNascimento(filha) {
    if (nasc.pronto || !nasc.g.dentro(filha) || ++nasc.g.divisoes < nasc.passo) return;
    nasc.g.divisoes = 0;
    nasc.pronto = nasc.g.fotografar() <= nasc.vazias0 * SOBRA || nasc.g.quadros.length >= QUADROS;
  }

  /* uma filha de outra cor que se destaca: longe da semente, onde as cores
     já vêm misturadas, e sem nenhuma vizinha da cor dela */
  function candidatar(filha) {
    if (!naJanela(...px(filha))) return;
    const x = filha % p.W, y = Math.floor(filha / p.W), cor = p.grade[filha];
    const [ccx, ccy] = centroDa(p.colonia[filha]), d = Math.hypot(x - ccx, y - ccy) || 1;
    if (d < p.SEMENTE + 2) return;
    for (const [dx, dy] of VIZ) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < p.W && ny < p.H && p.grade[ny * p.W + nx] === cor) return;
    }
    const g = criarGravacao(p, Math.round(x + (x - ccx) / d * 8), Math.round(y + (y - ccy) / d * 8), 40);
    g.fotografar();
    const antes = g.quadros[0].slice();
    antes[(y - g.y0) * g.lado + x - g.x0] = -1;
    g.quadros.unshift(antes);
    g.origem = [x - g.x0, y - g.y0];
    g.familia = new Set([filha]);
    g.membros = [(y - g.y0) * g.lado + x - g.x0];     // a família, em ordem, como lugares da janela
    g.ate = [0, 1];                                     // quantos membros cada quadro mostra
    candidatos.push(g);
  }

  /* devolve true quando o candidato está pronto para ser mostrado */
  function crescerCandidato(g, mae, filha, outra) {
    if (p.regra.mutacao >= 1) {
      if (!g.dentro(filha) || ++g.divisoes % 12) return false;
      g.fotografar();
      return g.quadros.length >= QUADROS;
    }
    if (g.dentro(filha) && ++g.divisoes % CONFERIR === 0) {
      g.morta = ![...g.familia].some((i) => p.vazios(i).length);
    }
    if (outra || !g.familia.has(mae)) return false;
    g.familia.add(filha);
    if (g.dentro(filha)) g.membros.push((Math.floor(filha / p.W) - g.y0) * g.lado + filha % p.W - g.x0);
    if (g.familia.size % FILHAS_POR_QUADRO === 0) { g.fotografar(); g.ate.push(g.membros.length); }
    return g.familia.size >= FAMILIA_ALVO;
  }

  T.aoDividir = (mae, filha, outra) => {
    if (nasc) crescerNascimento(filha);
    if (T.mutante) return;
    for (const g of candidatos) {
      if (crescerCandidato(g, mae, filha, outra)) { T.mutante = g; candidatos = []; return; }
    }
    candidatos = candidatos.filter((g) => !g.morta);
    if (outra && candidatos.length < CANDIDATOS) candidatar(filha);
  };

  return T;
}
