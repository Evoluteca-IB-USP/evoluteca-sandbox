/* Como uma lupa desenha a placa ampliada num canvas: um trecho gravado da
   placa, os rótulos com contorno escuro e o aviso de quando ainda não há o
   que mostrar. */

const FUNDO = [16, 27, 72];
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));

export function criarVista(p) {
  const RGB = p.CORES.map(hex).map((c) => c.map((v, q) => Math.round(.92 * v + .08 * FUNDO[q])));
  const v = { FUNDO, pequeno: (largura) => largura < 120 };

  v.preparar = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const largura = canvas.clientWidth, altura = canvas.clientHeight;
    if (canvas.width !== Math.round(largura * dpr) || canvas.height !== Math.round(altura * dpr)) {
      canvas.width = Math.round(largura * dpr); canvas.height = Math.round(altura * dpr);
    }
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, largura, altura, dpr };
  };

  /* um quadro gravado (`lado` x `lado` células) ocupando o canvas inteiro;
     com `acesas`, uma máscara da janela, as outras células ficam atenuadas */
  v.trecho = ({ g, largura, altura, dpr }, celulas, lado, acesas = null) => {
    const s = Math.max(largura, altura) / lado;
    const N = Math.round(largura * dpr), M = Math.round(altura * dpr);
    const img = g.createImageData(N, M), d = img.data;
    for (let yy = 0; yy < M; yy++) {
      const y = Math.floor(((yy + .5) / dpr - altura / 2) / s + lado / 2);
      for (let xx = 0; xx < N; xx++) {
        const x = Math.floor(((xx + .5) / dpr - largura / 2) / s + lado / 2);
        const j = y * lado + x, dentro = x >= 0 && y >= 0 && x < lado && y < lado;
        const c = dentro ? celulas[j] : -1, cor = c < 0 ? FUNDO : RGB[c], q = (yy * N + xx) * 4;
        if (acesas && c >= 0 && !acesas[j]) {
          d[q] = (cor[0] + 2 * FUNDO[0]) / 3; d[q + 1] = (cor[1] + 2 * FUNDO[1]) / 3; d[q + 2] = (cor[2] + 2 * FUNDO[2]) / 3;
        } else { d[q] = cor[0]; d[q + 1] = cor[1]; d[q + 2] = cor[2]; }
        d[q + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return (x, y) => [(x + .5 - lado / 2) * s + largura / 2, (y + .5 - lado / 2) * s + altura / 2, s];
  };

  v.rotulo = (g, texto, x, y, tam = 12) => {
    g.font = `600 ${tam}px 'Open Sans', sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 4; g.strokeStyle = "rgba(9, 16, 45, .9)"; g.strokeText(texto, x, y);
    g.fillStyle = "#fff"; g.fillText(texto, x, y);
  };

  v.aviso = (g, largura, altura, linhas, tam = 12.5) => {
    g.fillStyle = `rgb(${FUNDO})`; g.fillRect(0, 0, largura, altura);
    if (v.pequeno(largura)) linhas = ["–"];
    g.fillStyle = "rgba(255, 255, 255, .85)";
    g.font = `600 ${tam}px 'Open Sans', sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    linhas.forEach((l, k) => g.fillText(l, largura / 2, altura / 2 + (k - (linhas.length - 1) / 2) * tam * 1.45));
  };

  return v;
}
