// Setas, Enter e Esc sobre uma lista de links; quem desenha a lista marca o primeiro como `ativo`
export function ligarTeclado(campo, { itens, aoFechar }) {
  let ativo = 0;
  const marcar = () => itens().forEach((a, i) => a.classList.toggle("ativo", i === ativo));
  campo.addEventListener("keydown", (e) => {
    const n = itens().length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); ativo = (ativo + 1) % n; marcar(); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); ativo = (ativo - 1 + n) % n; marcar(); }
    else if (e.key === "Enter") { e.preventDefault(); (itens()[ativo] ?? itens()[0])?.click(); }
    else if (e.key === "Escape") { campo.blur(); aoFechar(); }
  });
  return { zerar() { ativo = 0; }, marcar, mouse: (i) => () => { ativo = i; marcar(); } };
}
