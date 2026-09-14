import { criar } from "escrever-html";
import { formatarValor } from "../formatar-valor-de-parametro.js";

/* Um parâmetro do modelo: rótulo, valor à direita e o slider.
   `escala: "log"` anda em 1000 passos iguais entre min e max — é assim que
   um tamanho de população vai de 10 a 5000 sem os primeiros valores
   ficarem espremidos num canto do trilho. */
export function controleDeParametro(p, valores, aoMudar) {
  const id = `par-${p.nome}`;
  const mostrador = criar("output", { class: "controle-valor", for: id, texto: formatarValor(valores[p.nome], p) });
  const faixa = criar("input", { type: "range", id });

  if (p.escala === "log") {
    faixa.min = 0; faixa.max = 1000; faixa.step = 1;
    faixa.value = Math.round((Math.log(valores[p.nome] / p.min) / Math.log(p.max / p.min)) * 1000);
  } else {
    faixa.min = p.min; faixa.max = p.max; faixa.step = p.passo || 1;
    faixa.value = valores[p.nome];
  }

  faixa.addEventListener("input", () => {
    let v;
    if (p.escala === "log") {
      v = p.min * (p.max / p.min) ** (faixa.value / 1000);
      v = p.passo && p.passo < 1 ? +v.toFixed(3) : Math.round(v);
    } else {
      v = +faixa.value;
    }
    valores[p.nome] = v;
    mostrador.textContent = formatarValor(v, p);
    aoMudar();
  });

  return criar("div", { class: "controle" + (p.avancado ? " controle-avancado" : "") },
    criar("label", { class: "controle-rotulo", for: id }, criar("span", { texto: p.rotulo }), mostrador),
    faixa);
}

/* A semente do sorteio, só no modo avançado: é ela que faz a turma inteira
   rodar a mesma simulação e comparar os mesmos números. */
export function controleDeSemente(semente, aoMudar) {
  const campo = criar("input", { type: "number", id: "par-semente", value: semente, min: 1 });
  campo.addEventListener("change", () => aoMudar(+campo.value || 1));
  return criar("div", { class: "controle controle-avancado" },
    criar("label", { class: "controle-rotulo", for: "par-semente" },
      criar("span", { texto: "Semente" }),
      criar("span", { class: "controle-valor", texto: "reprodutível" })),
    campo);
}
