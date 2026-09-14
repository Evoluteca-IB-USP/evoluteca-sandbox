import { criar, icone } from "escrever-html";

/* O transporte da simulação: início, tocar/pausar, um passo, o trilho das
   gerações (ou dos indivíduos sorteados) e a velocidade. Ele não sabe nada
   da simulação — avisa o orquestrador e mostra o que ele mandar. */
export function linhaDoTempo(acoes) {
  const inicio = criar("button", { type: "button", class: "transporte-botao", "aria-label": "Voltar ao início" }, icone("inicio"));
  const tocar = criar("button", { type: "button", class: "transporte-botao transporte-tocar", "aria-label": "Reproduzir" }, icone("tocar"));
  const passo = criar("button", { type: "button", class: "transporte-botao", "aria-label": "Avançar um passo" }, icone("passo"));
  const barra = criar("input", { type: "range", class: "transporte-barra", min: 0, max: 0, step: 1, value: 0, "aria-label": "Linha do tempo" });
  const leitura = criar("output", { class: "transporte-leitura" });
  const velocidade = criar("select", { class: "transporte-velocidade", "aria-label": "Velocidade da reprodução" });
  for (const [v, r] of [[0.5, "½×"], [1, "1×"], [2, "2×"], [4, "4×"]]) {
    const o = criar("option", { value: v, texto: r });
    if (v === 1) o.selected = true;
    velocidade.append(o);
  }
  const no = criar("div", { class: "transporte" }, inicio, tocar, passo, barra, leitura, velocidade);

  tocar.addEventListener("click", acoes.alternarToque);
  inicio.addEventListener("click", acoes.voltarAoInicio);
  passo.addEventListener("click", acoes.avancarUmPasso);
  barra.addEventListener("input", () => acoes.irPara(+barra.value));
  velocidade.addEventListener("change", () => acoes.mudarVelocidade(+velocidade.value));

  return {
    no, barra, leitura,
    definirTotal(T) {
      barra.max = T;
      no.hidden = T === 0;
    },
    posicionar(cursor) { barra.value = cursor; },
    mostrarTocando(tocando) {
      tocar.replaceChildren(icone(tocando ? "pausar" : "tocar"));
      tocar.setAttribute("aria-label", tocando ? "Pausar" : "Reproduzir");
    },
  };
}
