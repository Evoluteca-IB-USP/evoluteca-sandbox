/* A coluna de controles do painel: o interruptor do modo avançado, as
   réguas e o sortear. No avançado, as réguas marcadas com `avancado` formam
   um segundo grupo ("outras forças"), escolhido por duas palavras no alto,
   para a coluna continuar cabendo na tela; aparece também a semente, ao lado
   do sortear, para repetir uma rodada. */

import { criar } from "escrever-html";
import { sortearDeNovo } from "./linha-do-tempo.js";
import { modoBasicoAvancado } from "./modo-basico-avancado.js";

export function montarControles(painel, lugar, reguas, { temModo, aoMudarModo }) {
  const { ficha, sessao } = painel;
  const modo = modoBasicoAvancado(aoMudarModo);
  const basicas = reguas.filter((_, i) => !ficha.parametros[i].avancado);
  const forcas = reguas.filter((_, i) => ficha.parametros[i].avancado);
  const grupoBasico = criar("div", { class: "controles-grupo" }, ...basicas);
  const grupoForcas = criar("div", { class: "controles-grupo", hidden: "" }, ...forcas);

  const escolherGrupo = (k) => {
    grupoBasico.hidden = k !== 0;
    grupoForcas.hidden = k !== 1;
    abasDoGrupo.forEach((b, i) => b.setAttribute("aria-selected", String(i === k)));
  };
  const abasDoGrupo = forcas.length ? ["população", "outras forças"].map((rotulo, k) => {
    const b = criar("button", { type: "button", class: "controles-aba", "aria-selected": String(k === 0), texto: rotulo });
    b.addEventListener("click", () => escolherGrupo(k));
    return b;
  }) : [];

  const extras = criar("div", { class: "controles-extras" });
  if (!ficha.deterministico) {
    const semente = criar("input", { type: "text", class: "controles-semente", inputmode: "numeric", maxlength: 5, size: 4, "aria-label": "semente do sorteio" });
    const ajustar = () => { semente.style.width = `${Math.max(1, semente.value.length) + 1}ch`; };
    semente.addEventListener("input", () => { semente.value = semente.value.replace(/\D/g, "").slice(0, 5); ajustar(); });
    semente.addEventListener("change", () => {
      if (semente.value === "") { semente.value = String(sessao.semente); ajustar(); return; }
      sessao.semente = Number(semente.value);
      sessao.simular();
    });
    sessao.aoSimular(() => { if (document.activeElement !== semente) semente.value = String(sessao.semente); ajustar(); });
    extras.append(criar("div", { class: "controles-sorteio" },
      sortearDeNovo(() => sessao.sortear()),
      criar("label", { class: "controles-linha so-avancado", title: "A mesma semente com os mesmos valores repete a rodada" }, "semente ", semente)));
  }

  lugar.append(
    ...(temModo ? [modo] : []),
    ...(abasDoGrupo.length ? [criar("div", { class: "controles-abas so-avancado" }, ...abasDoGrupo)] : []),
    grupoBasico, grupoForcas, extras);
  return { modo, aoSairDoAvancado: () => escolherGrupo(0) };
}
