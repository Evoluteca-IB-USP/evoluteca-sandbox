/* O que a placa mostra para cada trecho do texto. Três são quadros de
   perto, para o que o olho não alcança:

     regra       o replay de uma divisão de verdade: a mãe, o lugar vazio,
                 a filha da mesma cor;
     nascimento  uma colônia desde a semente, em câmera lenta e sem mudar o
                 zoom, com o círculo de onde ela começou;
     mutante     uma filha que nasceu de outra cor e a mancha que sai dela,
                 em câmera lenta e com só a família dela acesa.

   A quarta, vantagem, não tem quadro: as amarelas se veem na própria
   placa, e ela só diz onde fica a colônia e a `medida` da borda dela.

   `foco` é o ponto da placa que cada lupa mostra, em px da seção. Criar
   depois de `p.comecar()`. */

import { criarMedidas } from "./medidas-da-placa.js";
import { criarTrechos, quadroDaVez } from "./trechos-em-camera-lenta.js";
import { criarVista } from "./vista-ampliada.js";

export function criarLentes(p, { naJanela }) {
  const m = criarMedidas(p, naJanela), v = criarVista(p);
  const T = criarTrechos(p, { naJanela, centroDa: m.centroDa, px: m.px });
  const centroDe = (g) => [(g.cx + .5) * p.CEL, (g.cy + .5) * p.CEL];

  p.aoDividir = (mae, filha, outra) => { m.aoDividir(mae, filha); T.aoDividir(mae, filha, outra); };
  p.aoRecomecar = () => { m.recomecou(); T.recomecou(m.colNascimento); };
  T.recomecou(m.colNascimento);

  const regra = {
    foco: null,
    desenhar(canvas, t) {
      const { g, largura, altura } = v.preparar(canvas), cap = m.captura, A = m.A;
      if (!cap) return v.aviso(g, largura, altura, ["procurando uma divisão…"]);
      const Z = Math.min(largura, altura) / 9, idade = t - cap.t, lado = 2 * A + 1;
      const fase = idade < 1000 ? 0 : idade < 1900 ? 1 : 2;
      const ponto = (dx, dy) => [largura / 2 + (dx - .5) * Z, altura / 2 + (dy - .5) * Z];
      g.fillStyle = `rgb(${v.FUNDO})`; g.fillRect(0, 0, largura, altura);
      for (let dy = -A; dy <= A; dy++) for (let dx = -A; dx <= A; dx++) {
        let c = cap.celulas[(dy + A) * lado + dx + A];
        if (dx === cap.fdx && dy === cap.fdy) c = fase === 2 ? cap.cor : -1;
        const [x, y] = ponto(dx, dy);
        if (c === -1) { g.fillStyle = "rgba(255, 255, 255, .08)"; g.fillRect(x + Z / 2 - 1, y + Z / 2 - 1, 2, 2); continue; }
        const folga = Math.max(.5, Z * .08);
        g.fillStyle = p.CORES[c];
        g.beginPath(); g.roundRect(x + folga, y + folga, Z - 2 * folga, Z - 2 * folga, Z * .25); g.fill();
      }
      const [mx, my] = ponto(0, 0), [fx, fy] = ponto(cap.fdx, cap.fdy);
      const n = Math.hypot(cap.fdx, cap.fdy) || 1, ux = cap.fdx / n, uy = cap.fdy / n;
      g.lineWidth = Math.max(1, Math.min(2, Z / 8));
      g.strokeStyle = "#fff"; g.strokeRect(mx, my, Z, Z);
      if (fase >= 1) {
        g.strokeStyle = "#fcb421";
        if (fase === 1) g.setLineDash([4, 3]);
        g.strokeRect(fx, fy, Z, Z); g.setLineDash([]);
      }
      if (v.pequeno(largura)) return;
      v.rotulo(g, "mãe", mx + Z / 2 - ux * Z * 1.3, my + Z / 2 - uy * Z * 1.3);
      if (fase >= 1) v.rotulo(g, fase === 1 ? "lugar vazio" : "filha", fx + Z / 2 + ux * Z * 1.5, fy + Z / 2 + uy * Z * 1.5);
    },
  };

  const nascimento = {
    foco: null,
    desenhar(canvas, t) {
      const c = v.preparar(canvas), { g, largura, altura } = c, gr = T.nascimento;
      if (!gr) return v.aviso(g, largura, altura, ["a colônia está nascendo…"]);
      const k = quadroDaVez(gr, t, { 0: 1400 });
      const [ox, oy, s] = v.trecho(c, gr.quadros[k], gr.lado)(gr.lado >> 1, gr.lado >> 1);
      const r0 = (p.SEMENTE + .5) * s;
      g.strokeStyle = "rgba(255, 255, 255, .9)"; g.lineWidth = 1.5; g.setLineDash([3, 3]);
      g.beginPath(); g.arc(ox, oy, r0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      if (k === 0 && !v.pequeno(largura)) v.rotulo(g, "o começo", ox, oy - r0 - 12, 11);
    },
  };

  const mutante = {
    foco: null,
    desenhar(canvas, t) {
      const c = v.preparar(canvas), { g, largura, altura } = c, gr = T.mutante;
      if (!(p.regra.mutacao > 0)) return v.aviso(g, largura, altura, ["Com a regra de agora,", "toda filha sai igual à mãe."]);
      if (!gr) return v.aviso(g, largura, altura, ["esperando uma filha", "de outra cor…"]);
      const k = quadroDaVez(gr, t, { 0: 700, 1: 1600 });
      if (p.regra.mutacao >= 1) return void v.trecho(c, gr.quadros[k], gr.lado);
      let acesas = null;
      if (k > 0) {
        acesas = new Uint8Array(gr.lado * gr.lado);
        for (let j = 0; j < gr.ate[k]; j++) acesas[gr.membros[j]] = 1;
      }
      const [ox, oy, s] = v.trecho(c, gr.quadros[k], gr.lado, acesas)(...gr.origem), r = Math.max(6, s * 1.8);
      if (k === 0) return;
      g.strokeStyle = "#fcb421"; g.lineWidth = 2;
      g.beginPath(); g.arc(ox, oy, r, 0, Math.PI * 2); g.stroke();
      if (!v.pequeno(largura)) v.rotulo(g, k === 1 ? "nasceu de outra cor" : "a família dela", ox, oy - r - 10, 11);
    },
  };

  const vantagem = { foco: null, medida: null };

  function passo(t) {
    m.passo(t);
    const [vx, vy] = m.centroDa(m.colVantagem);
    regra.foco = m.captura ? m.px(m.captura.mae) : null;
    nascimento.foco = T.nascimento ? centroDe(T.nascimento) : null;
    const mu = p.regra.mutacao > 0 && T.mutante;
    mutante.foco = mu ? [(mu.x0 + mu.origem[0] + .5) * p.CEL, (mu.y0 + mu.origem[1] + .5) * p.CEL] : null;
    vantagem.foco = m.vantagem ? [(vx + .5) * p.CEL, (vy + .5) * p.CEL] : null;
    vantagem.medida = m.vantagem;
  }

  return { regra, nascimento, mutante, vantagem, passo };
}
