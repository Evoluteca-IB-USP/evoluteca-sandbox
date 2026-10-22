/** o elemento está na janela (com uma folga)? Figura fora da tela não anima. */
export function naTela(no, folga = 0) {
  const r = no.getBoundingClientRect();
  return r.bottom > -folga && r.top < window.innerHeight + folga;
}
