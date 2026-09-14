import { criar } from "escrever-html";

/* Os cenários prontos do modelo (`meta.cenarios`): um clique põe vários
   parâmetros de uma vez e traz uma dica do que olhar. Mexer num slider
   desmarca o cenário — os valores já não são os dele. */
export function criarCenarios(meta, aoEscolher) {
  const no = criar("div", { class: "cenarios" });
  const dica = criar("p", { class: "cenario-dica", hidden: true });

  function montar(modo, ativo) {
    no.innerHTML = "";
    const lista = (meta.cenarios || []).filter((c) => !c.avancado || modo === "avancado");
    no.hidden = !lista.length;
    if (!lista.length) { dica.hidden = true; return; }
    no.append(criar("span", { class: "cenarios-rotulo", texto: "Cenários" }));
    for (const c of lista) {
      const b = criar("button", { type: "button", class: "cenario", "aria-pressed": String(ativo === c), texto: c.rotulo });
      b.addEventListener("click", () => aoEscolher(c));
      no.append(b);
    }
    dica.hidden = !ativo?.dica;
    dica.textContent = ativo?.dica || "";
  }

  function desmarcar() {
    for (const b of no.querySelectorAll(".cenario")) b.setAttribute("aria-pressed", "false");
    dica.hidden = true;
  }

  return { no, dica, montar, desmarcar };
}
