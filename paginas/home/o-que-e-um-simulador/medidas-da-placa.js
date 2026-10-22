/* O que as lupas precisam saber da placa, medido enquanto ela cresce:
   a última divisão capturada (para o replay), as duas colônias que as
   lupas acompanham e quanto amarelo uma delas tem na beirada.
   `naJanela(x, y)` diz, em px da seção, onde esses pontos podem ficar
   para não cair sob o texto. */

const A = 10;                             // raio, em células, da vizinhança capturada
const CICLO = 3800;                       // ms do replay de uma divisão
const VIZ = [-1, 1, 0, 0, -1, -1, 1, 1];
const VIY = [0, 0, -1, 1, -1, 1, -1, 1];

export function criarMedidas(p, naJanela) {
  const m = { A, captura: null, colNascimento: 0, colVantagem: 0, vantagem: null };
  let agora = 0, ultimaMedida = -1e9, pedindo = true;

  m.px = (i) => [(i % p.W + .5) * p.CEL, (Math.floor(i / p.W) + .5) * p.CEL];
  m.centroDa = (c) => {
    const [fx, fy] = p.lugares[c];
    return [Math.round(fx * p.W), Math.round(fy * p.H)];
  };

  /* as duas colônias da janela mais longe das bordas da placa, para caberem inteiras */
  function escolherColonias() {
    const folga = (c) => { const [x, y] = m.centroDa(c); return Math.min(x, p.W - x, y, p.H - y); };
    const todas = p.lugares.map((_, c) => c);
    const dentro = todas.filter((c) => {
      const [x, y] = m.centroDa(c);
      return naJanela((x + .5) * p.CEL, (y + .5) * p.CEL);
    }).sort((a, b) => folga(b) - folga(a));
    const lista = dentro.length ? dentro : todas;
    [m.colNascimento, m.colVantagem] = [lista[0], lista[1 % lista.length]];
  }

  /* quanto da beirada da colônia do amarelo é amarela, e até onde ela chegou */
  function medir() {
    const c = m.colVantagem, [cx, cy] = m.centroDa(c);
    let amarelas = 0, borda = 0, raio = 0;
    for (const i of p.frente) {
      if (p.colonia[i] !== c) continue;
      const x = i % p.W, y = Math.floor(i / p.W);
      let livre = false;
      for (let k = 0; k < 8 && !livre; k++) {
        const nx = x + VIZ[k], ny = y + VIY[k];
        if (nx >= 0 && ny >= 0 && nx < p.W && ny < p.H && p.grade[ny * p.W + nx] === -1) livre = true;
      }
      if (!livre) continue;
      borda++;
      if (p.grade[i] === p.AMARELO) amarelas++;
      raio = Math.max(raio, Math.hypot(x - cx, y - cy));
    }
    if (!borda) return;
    const antes = m.vantagem, parte = amarelas / borda;
    m.vantagem = {
      raio: Math.max(raio, antes ? antes.raio : 0),
      amarelo: parte, amarelo0: antes ? antes.amarelo0 : parte,
    };
  }

  /* captura a vizinhança de uma divisão quando ela acontece, para o replay */
  function capturar(mae, filha) {
    const [x, y] = m.px(mae);
    if (!naJanela(x, y) || p.vazios(mae).length < 2) return;
    const mx = mae % p.W, my = Math.floor(mae / p.W), lado = 2 * A + 1;
    const celulas = new Int8Array(lado * lado).fill(-1);
    for (let dy = -A; dy <= A; dy++) for (let dx = -A; dx <= A; dx++) {
      const nx = mx + dx, ny = my + dy;
      if (nx >= 0 && ny >= 0 && nx < p.W && ny < p.H) celulas[(dy + A) * lado + dx + A] = p.grade[ny * p.W + nx];
    }
    m.captura = { celulas, mae, fdx: filha % p.W - mx, fdy: Math.floor(filha / p.W) - my, cor: p.grade[mae], t: agora };
    pedindo = false;
  }

  m.aoDividir = (mae, filha) => { if (pedindo) capturar(mae, filha); };
  m.recomecou = () => {
    m.vantagem = null; m.captura = null; pedindo = true;
    escolherColonias();
    medir();
  };

  m.passo = (t) => {
    agora = t;
    if (!m.captura || t - m.captura.t > CICLO) pedindo = true;
    if (t - ultimaMedida > 500) { ultimaMedida = t; medir(); }
  };

  escolherColonias();
  medir();
  return m;
}
