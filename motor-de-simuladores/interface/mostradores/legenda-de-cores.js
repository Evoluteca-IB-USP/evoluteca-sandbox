import { criar } from "escrever-html";

/* A legenda de um gráfico ou de uma grade de bolinhas.
   itens = [{ cor, tipo, texto, borda }] · cor pode ser [c1, c2] (o
   heterozigoto, meio e meio) e `tipo` é "ponto", "linha", "tracejado"
   ou "contorno". */
export function legenda(caixa, itens) {
  caixa.innerHTML = "";
  for (const it of itens) {
    const amostra = criar("span", { class: `legenda-amostra legenda-${it.tipo || "ponto"}` });
    if (Array.isArray(it.cor)) amostra.style.background = `linear-gradient(90deg, ${it.cor[0]} 50%, ${it.cor[1]} 50%)`;
    else if (it.cor) amostra.style.background = it.cor;
    if (it.tipo === "contorno") amostra.style.borderColor = it.borda;
    caixa.append(criar("span", { class: "legenda-item" }, amostra, criar("span", { texto: it.texto })));
  }
}
