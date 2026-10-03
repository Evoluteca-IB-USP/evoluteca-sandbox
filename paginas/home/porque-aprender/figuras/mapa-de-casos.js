import { criar } from "escrever-html";
import { criarRng, rnorm, rpois } from "r";
import { numero } from "portugues";
import { canvasNo, rotulo, NAVY, TEAL_CLARO, AMARELO, SUAVE } from "../../../desenho-em-canvas/__pacote__.js";
import { legenda } from "./legenda-de-bolinhas.js";
import { animar, suave } from "./animacao-com-fim.js";

/* rpois não aguenta médias de milhares de casos */
const poisson = (l, rng) => (l < 30 ? rpois(l, rng) : Math.max(0, Math.round(rnorm(l, Math.sqrt(l), rng))));

/* casos por semana de cada vírus */
function sortearSemanas({ inicio, rComum, rNova, semanas = 16, casos = 2000, semente = 2021 }) {
  const rng = criarRng(semente), saida = [];
  let comum = casos, nova = Math.round(casos * inicio / (1 - inicio));
  for (let s = 0; s <= semanas; s++) {
    saida.push({ comum, nova, f: nova / (comum + nova) });
    comum = poisson(comum * rComum, rng); nova = poisson(nova * rNova, rng);
  }
  return saida;
}
const semanaDaMetade = (fs) => { const k = fs.findIndex((f) => f >= 0.5); return k < 0 ? fs.length - 1 : k; };

/* um mapa de casos: cada quadradinho é um caso. Quantos são da variante
   nova sai do modelo de sempre (1,5× por semana); onde eles caem, não —
   quase sempre ao lado de um caso da variante, porque contágio é de
   perto. As pintas viram manchas, e as manchas se juntam. Em cima, a
   barra da semana com a marca da metade. */
export function mosaico(palco, pe, opts) {
  const SEM = 16, VEL = 1.1, CEL = 11, PERTO = 0.94;
  const { ctx, W, H } = canvasNo(palco);
  const conta = criar("p", { class: "vivo-nota" });
  pe.replaceChildren(criar("div", {}, conta, legenda([[TEAL_CLARO, "um caso do vírus de antes"], [NAVY, "um caso da variante nova"], [AMARELO, "onde ela começou: 1% dos casos"]])));
  const Y0 = 52, C = Math.floor((W - 4) / CEL), L = Math.floor((H - Y0 - 4) / CEL), N = C * L;
  const ox = (W - C * CEL) / 2, larg = C * CEL - 2, rng = criarRng(2021);
  const tom = Float32Array.from({ length: N }, () => 0.88 + 0.12 * rng());
  const semanas = sortearSemanas({ ...opts, semanas: SEM }), fs = semanas.map((s) => s.f), metade = semanaDaMetade(fs);
  const vez = new Int32Array(N).fill(N), fila = [];        // vez[i]: em que posição da fila o caso i passa a ser da variante
  const tomar = (i) => { vez[i] = fila.length; fila.push(i); };
  const n0 = Math.max(1, Math.round(fs[0] * N));
  while (fila.length < n0) { const i = Math.floor(rng() * N); if (vez[i] === N) tomar(i); }
  while (fila.length < N) {
    let i = -1;
    if (rng() < PERTO) for (let tenta = 0; tenta < 12 && i < 0; tenta++) {
      const j = fila[Math.floor(rng() * fila.length)], x = (j % C) + Math.floor(rng() * 3) - 1, y = Math.floor(j / C) + Math.floor(rng() * 3) - 1;
      if (x >= 0 && y >= 0 && x < C && y < L && vez[y * C + x] === N) i = y * C + x;
    }
    if (i < 0) do i = Math.floor(rng() * N); while (vez[i] !== N);
    tomar(i);
  }
  function barra(f, k) {
    const y = 22, xm = ox + larg / 2;
    ctx.fillStyle = TEAL_CLARO; ctx.fillRect(ox, y, larg, 8);
    ctx.fillStyle = NAVY; ctx.fillRect(ox, y, larg * f, 8);
    ctx.strokeStyle = f >= 0.5 ? "#fff" : NAVY; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xm, y - 3); ctx.lineTo(xm, y + 11); ctx.stroke();
    rotulo(ctx, `semana ${k}`, ox, 4, { cor: NAVY, peso: "600" });
    rotulo(ctx, `a variante é ${numero(f * 100)}% dos casos`, ox + 66, 4, { cor: SUAVE });
    rotulo(ctx, k >= metade ? `passou da metade na semana ${metade}` : "metade", xm, 4, { alinhar: k >= metade ? "left" : "center", cor: k >= metade ? NAVY : SUAVE, peso: k >= metade ? "600" : "" });
  }
  function desenhar(t) {
    const s = t * VEL, k = Math.min(SEM, Math.floor(s)), u = k < SEM ? suave(s - k) : 0;
    const a = fs[k] * N, b = fs[Math.min(SEM, k + 1)] * N, n = a * (b / a) ** u;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const x = ox + (i % C) * CEL, y = Y0 + Math.floor(i / C) * CEL;
      ctx.globalAlpha = tom[i]; ctx.fillStyle = vez[i] < n ? NAVY : TEAL_CLARO;
      ctx.fillRect(x, y, CEL - 2, CEL - 2);
      if (vez[i] < n0) { ctx.globalAlpha = 1; ctx.fillStyle = AMARELO; ctx.beginPath(); ctx.arc(x + (CEL - 2) / 2, y + (CEL - 2) / 2, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    barra(n / N, k);
    conta.textContent = "Cada quadradinho é um caso; a variante passa para quem está perto.";
  }
  const DUR = (SEM + 0.6) / VEL;
  let parar = null;
  return {
    preparar() { desenhar(0); },
    revelar(fim) { parar = animar(desenhar, DUR, () => fim(metade)); },
    parar() { if (parar) parar(); },
    captura(t) { desenhar(Math.min(t, DUR)); },
  };
}
