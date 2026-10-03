/* Puxar a bolinha de um trilho como um slider: ela segue o mouse e, ao
   soltar, encaixa no item mais perto. `aoPassar(item)` roda a cada item
   novo sob a bolinha. Um arraste não vira clique no item onde começou. */

const centro = (item) => item.offsetTop + item.offsetHeight / 2;

export function puxarTrilho(trilho, aoPassar) {
  let arrastou = false;

  trilho.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    const inicio = ev.clientY;
    let atual = null;
    arrastou = false;

    const mover = (m) => {
      if (!arrastou && Math.abs(m.clientY - inicio) < 4) return;
      arrastou = true;
      trilho.classList.add("puxando");
      const caixa = trilho.getBoundingClientRect();
      const y = Math.min(Math.max(m.clientY - caixa.top, 0), caixa.height);
      trilho.style.setProperty("--cursor", `${y}px`);
      const itens = [...trilho.children].filter((i) => !i.classList.contains("estante-sem"));
      const perto = itens.reduce((a, b) => (Math.abs(centro(b) - y) < Math.abs(centro(a) - y) ? b : a), itens[0]);
      if (perto && perto !== atual) { atual = perto; aoPassar(perto); }
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      trilho.classList.remove("puxando");
      if (atual) trilho.style.setProperty("--cursor", `${centro(atual)}px`);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  });

  trilho.addEventListener("click", (ev) => {
    if (!arrastou) return;
    ev.preventDefault();
    ev.stopPropagation();
    arrastou = false;
  }, true);
}
