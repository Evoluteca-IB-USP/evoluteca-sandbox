/* Ferramenta "relevo": uma distribuição que muda no tempo, em barras 3D —
   frequência na largura, gerações na profundidade, probabilidade na altura.
   As fileiras sobem conforme a linha do tempo anda; arrastar gira a vista.
   A ficha dá `calcular(par)` → { fileiras: [{ t, alturas }] }, os nomes dos
   eixos, os das duas colunas das pontas (paredes) e a frase da legenda. */

import { criar } from "escrever-html";
import { grafico, texto } from "../graficos-da-pagina/pecas.js";
import { NAVY, TEAL, TEAL_ESCURO, AMARELO, TINTA_SUAVE } from "../cores.js";

const MEIO = { topo: "#e6f3f5", frente: TEAL, lado: TEAL_ESCURO };
const ESQUERDA = { topo: "#fde3a7", frente: AMARELO, lado: "#d9971a" };
const DIREITA = { topo: "#c9cfe3", frente: NAVY, lado: "#0d1a45" };
const TRACO = "rgba(20, 37, 96, .45)", ALTURA = 0.55, VAO = 0.16;

export function montarRelevo(painel, no) {
  const { ficha, sessao } = painel, spec = ficha.relevo;
  const canvas = criar("canvas", { class: "relevo-canvas", "aria-label": `${spec.eixoX} ao longo das gerações, em 3D` });
  const notas = criar("div", { class: "relevo-notas" });
  no.append(criar("div", { class: "relevo" }, canvas, notas));

  let chave = "", r = null, t = 0;
  let giro = -0.55, inclinacao = 0.5;

  const g = grafico(canvas, { xlim: [0, 1], ylim: [0, 1], margem: { esq: 0, dir: 0, topo: 0, base: 0 }, desenhar: (g) => {
    if (r) desenhar(g.ctx, g.W, g.H);
  } });

  function projetar(x, y, z, esc, cx, cy) {
    const X = x - 0.5, Z = z - 0.5;
    const rx = X * Math.cos(giro) - Z * Math.sin(giro);
    const rz = X * Math.sin(giro) + Z * Math.cos(giro);
    return [cx + rx * esc, cy - (y * Math.cos(inclinacao) - rz * Math.sin(inclinacao)) * esc, rz * Math.cos(inclinacao) + y * Math.sin(inclinacao)];
  }

  function desenhar(ctx, W, H) {
    const esc = Math.min(W, H * 1.4) * 0.6, cx = W / 2, cy = H * 0.62;
    const P = (x, y, z) => projetar(x, y, z, esc, cx, cy);
    const { fileiras } = r, nx = fileiras[0].alturas.length, nz = fileiras.length;
    /* a escala vem das fileiras depois da primeira: o começo (tudo numa barra só) passaria do teto */
    const maior = Math.max(...fileiras.slice(nz > 1 ? 1 : 0).flatMap((f) => f.alturas));
    /* o vetor que aponta para a câmera: uma face aparece se sua normal concorda com ele */
    const vista = [Math.sin(giro) * Math.cos(inclinacao), Math.sin(inclinacao), Math.cos(giro) * Math.cos(inclinacao)];

    const barras = [];
    fileiras.forEach((f, k) => {
      const crescer = k === 0 ? 1 : Math.max(0, Math.min(1, (t - fileiras[k - 1].t) / (f.t - fileiras[k - 1].t || 1)));
      if (!crescer) return;
      const suave = 1 - (1 - crescer) ** 3;
      f.alturas.forEach((v, i) => {
        const h = Math.min(1, v / maior) * ALTURA * suave;
        if (h < 1e-3) return;
        const x0 = (i + VAO) / nx, x1 = (i + 1 - VAO) / nx, z0 = (k + VAO) / nz, z1 = (k + 1 - VAO) / nz;
        const cores = i === 0 ? ESQUERDA : i === nx - 1 ? DIREITA : MEIO;
        barras.push({ x0, x1, z0, z1, h, cores, prof: P((x0 + x1) / 2, 0, (z0 + z1) / 2)[2] });
      });
    });

    /* chão: o retângulo das fileiras, para dar o plano mesmo quando quase tudo é zero */
    ctx.beginPath();
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([x, z], m) => { const [a, b] = P(x, 0, z); ctx[m ? "lineTo" : "moveTo"](a, b); });
    ctx.closePath();
    ctx.fillStyle = "rgba(20, 37, 96, .04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 37, 96, .15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    barras.sort((a, b) => a.prof - b.prof);   // do fundo para a frente
    for (const b of barras) caixa(ctx, P, vista, b);

    const rotulo = (x, z, txt, alinhar = "center", fonte = "11px") => { const [a, b] = P(x, 0, z); texto(ctx, txt, a, b, alinhar, TINTA_SUAVE, fonte); };
    const frente = vista[2] > 0 ? 1.07 : -0.07, lado = vista[0] > 0 ? 1.08 : -0.08;
    rotulo(0.5 / nx, frente, "0");
    rotulo(1 - 0.5 / nx, frente, "1");
    rotulo(0.5, frente + Math.sign(frente - 0.5) * 0.06, spec.eixoX, "center", "italic 11px");
    rotulo(lado, 0.5 / nz, String(fileiras[0].t));
    rotulo(lado, 1 - 0.5 / nz, String(fileiras[nz - 1].t));
    rotulo(lado + Math.sign(lado - 0.5) * 0.08, 0.5, spec.eixoZ, "center", "italic 11px");
  }

  function caixa(ctx, P, vista, { x0, x1, z0, z1, h, cores }) {
    const v = [P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1), P(x0, h, z0), P(x1, h, z0), P(x1, h, z1), P(x0, h, z1)];
    const faces = [
      [[0, 1, 5, 4], [0, 0, -1], cores.frente], [[2, 3, 7, 6], [0, 0, 1], cores.frente],
      [[1, 2, 6, 5], [1, 0, 0], cores.lado], [[3, 0, 4, 7], [-1, 0, 0], cores.lado],
      [[4, 5, 6, 7], [0, 1, 0], cores.topo],
    ];
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = TRACO;
    for (const [ids, n, cor] of faces) {
      if (n[0] * vista[0] + n[1] * vista[1] + n[2] * vista[2] <= 0) continue;
      ctx.beginPath();
      ids.forEach((k, m) => ctx[m ? "lineTo" : "moveTo"](v[k][0], v[k][1]));
      ctx.closePath();
      ctx.fillStyle = cor;
      ctx.fill();
      ctx.stroke();
    }
  }

  let arrasto = null;
  canvas.addEventListener("pointerdown", (e) => { arrasto = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    giro += (e.clientX - arrasto[0]) * 0.008;
    inclinacao = Math.max(0.08, Math.min(1.35, inclinacao + (e.clientY - arrasto[1]) * 0.006));
    arrasto = [e.clientX, e.clientY];
    g.redesenhar();
  });
  canvas.addEventListener("pointerup", () => { arrasto = null; });

  const parede = (cores, rotulo) => criar("p", { class: "lupa-conta" }, criar("span", { class: "lupa-amostra", style: `background: ${cores.frente}` }), rotulo);

  return {
    atualizar(agora) {
      const nova = JSON.stringify(sessao.par);
      if (nova !== chave) { chave = nova; r = spec.calcular(sessao.par); }
      t = agora;
      notas.replaceChildren(
        criar("p", { class: "abas-nota", texto: spec.legenda(sessao.par, Math.floor(t), r) }),
        parede(ESQUERDA, spec.paredes.esquerda),
        parede(DIREITA, spec.paredes.direita),
        criar("p", { class: "abas-nota", texto: "Arraste o gráfico para girar." }));
      g.redesenhar();
    },
  };
}
