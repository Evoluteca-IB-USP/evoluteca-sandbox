/* Modo projetor: o painel em tela cheia, com letras e gráfico maiores, para
   o professor usar na aula como quiser. Uma palavra discreta ao lado do
   título liga; Esc (ou a mesma palavra) desliga. */

import { criar } from "escrever-html";

export function ligarProjetor(raiz, painel) {
  const titulo = raiz.querySelector("h1");
  if (!titulo || !document.fullscreenEnabled) return;
  const botao = criar("button", { type: "button", class: "projetor-botao", html: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4"/></svg> projetar` });
  botao.addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : raiz.requestFullscreen()));
  titulo.after(botao);
  document.addEventListener("fullscreenchange", () => {
    const ligado = document.fullscreenElement === raiz;
    raiz.classList.toggle("projetor", ligado);
    botao.lastChild.textContent = ligado ? " sair da tela cheia" : " projetar";
    requestAnimationFrame(() => painel.desenhar());
  });
}
