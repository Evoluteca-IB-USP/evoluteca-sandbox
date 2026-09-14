import { criar } from "escrever-html";

/* Básico / Avançado: o quanto do console fica à mostra. */
export function alternadorDeModo(aoTrocar) {
  const no = criar("div", { class: "seg", role: "group", "aria-label": "Nível de detalhe" });
  const basico = criar("button", { type: "button", "aria-pressed": "true", texto: "Básico" });
  const avancado = criar("button", { type: "button", "aria-pressed": "false", texto: "Avançado" });
  no.append(basico, avancado);

  basico.addEventListener("click", () => aoTrocar("basico"));
  avancado.addEventListener("click", () => aoTrocar("avancado"));

  return {
    no,
    atualizar(modo) {
      basico.setAttribute("aria-pressed", String(modo === "basico"));
      avancado.setAttribute("aria-pressed", String(modo === "avancado"));
    },
  };
}
