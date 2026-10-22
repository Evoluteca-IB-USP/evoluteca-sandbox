import { criar } from "escrever-html";

/* o que toda aposta tem: a linha que lê a aposta (e depois o modelo) e o botão de apostar */
export function partesDaAposta(aoApostar) {
  const lido = criar("p", { class: "aposta-lida" });
  const botao = criar("button", { type: "button", class: "aposta-botao", texto: "apostar" });
  botao.addEventListener("click", aoApostar);
  return {
    lido, botao,
    ler(sua) { lido.innerHTML = `sua aposta: <b>${sua}</b>`; },
    travar() { botao.hidden = true; },
    revelar(sua, modelo, perto) {
      lido.innerHTML = `sua aposta: <b>${sua}</b> · o modelo: <b>${modelo}</b>` +
        `<span class="aposta-veredito" data-perto="${perto}">${perto ? "chegou perto" : "ficou longe"}</span>`;
    },
  };
}
