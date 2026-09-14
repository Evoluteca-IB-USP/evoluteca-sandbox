/* O título de uma seção troca a etiqueta em caixa alta do IB por um kicker
   numerado e termina num sinal âmbar: o ponto final, ou a própria
   interrogação, quando o título é uma pergunta. */

/* o kicker numerado, inserido antes de `antesDe` — o próprio título, ou o
   cabeçalho da seção quando o título mora dentro de um flex (como em
   "Simuladores", onde o kicker fica acima da linha inteira) */
export function kicker(antesDe, texto) {
  const p = document.createElement("p");
  p.className = "kicker-secao";
  p.textContent = texto;
  antesDe.before(p);
}

/* a pontuação-tema: o sinal FINAL do título fica âmbar */
export function pontuar(h2) {
  const texto = h2.textContent.replace(/\s+$/, "");
  const fim = document.createElement("span");
  fim.className = "ponto-tema";
  if (/[?!]$/.test(texto)) {
    h2.textContent = texto.slice(0, -1);
    fim.textContent = texto.slice(-1);
  } else {
    h2.textContent = texto;
    fim.textContent = ".";
  }
  h2.append(fim);
}
