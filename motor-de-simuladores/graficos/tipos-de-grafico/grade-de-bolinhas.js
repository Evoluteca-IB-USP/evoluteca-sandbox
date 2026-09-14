import { lerAparencia } from "../ler-aparencia.js";
import { preparar } from "../bases/__pacote__.js";

/* uma bolinha cheia ou em duas metades (heterozigoto: cor = [c1, c2]) */
export function bolinha(ctx, cx, cy, r, cor) {
  if (Array.isArray(cor)) {
    ctx.fillStyle = cor[0];
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cor[1];
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/** Grade de bolinhas — a "lupa" da população.
    classes: [{ n, cor }] · cor pode ser [c1, c2] (bolinha em duas metades: heterozigoto).
    opts.sequencia — índices de classe na ordem de desenho (ex.: amostra na ordem do sorteio);
                     sem ela, as bolinhas saem agrupadas por classe.
    opts.total     — nº de vagas na grade (as vazias ficam em contorno); padrão: nº de bolinhas.
    opts.colunas   — força o nº de colunas; padrão: o que melhor preenche o canvas.
    opts.destacar  — índice (na sequência) da bolinha a marcar com um anel. */
export function pontos(canvas, classes, opts = {}) {
  const C = lerAparencia();
  const { ctx, largura, altura } = preparar(canvas);
  const seq = opts.sequencia || classes.flatMap((c, k) => Array(Math.max(0, c.n)).fill(k));
  const total = opts.total || seq.length;
  if (!total) return;

  const folga = 4;
  const L = largura - 2 * folga, A = altura - 2 * folga;
  const cols = Math.max(1, opts.colunas || Math.round(Math.sqrt((total * L) / A)));
  const rows = Math.ceil(total / cols);
  const celula = Math.min(L / cols, A / rows);
  const r = Math.min(15, Math.max(1.5, celula / 2 - Math.max(1, celula * 0.14)));
  const x0 = folga + (L - cols * celula) / 2;
  const y0 = folga + (A - rows * celula) / 2;

  for (let i = 0; i < total; i++) {
    const cx = x0 + (i % cols) * celula + celula / 2;
    const cy = y0 + Math.floor(i / cols) * celula + celula / 2;
    if (i >= seq.length) {                          // vaga ainda não preenchida
      ctx.strokeStyle = C.grade;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, 2 * Math.PI);
      ctx.stroke();
      continue;
    }
    bolinha(ctx, cx, cy, r, classes[seq[i]].cor);
    if (opts.destacar === i) {
      ctx.strokeStyle = C.foco;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2.5, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}
