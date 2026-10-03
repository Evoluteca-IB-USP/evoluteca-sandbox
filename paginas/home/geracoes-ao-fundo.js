/* A nota viva da abertura: quantas gerações o fundo já andou desde que a
   página abriu e quanto tempo isso seria numa população de verdade. A
   população é um elo dentro da frase, como os controles da placa de
   colônias: cada clique troca de espécie.

   API: contarGeracoes(nota)
        nota: o <p> com [data-geracoes], [data-especie], [data-ritmo] e [data-tempo] */

import { numero } from "portugues";
import { VELOCIDADE } from "./abertura.js";

const MINUTO = 1 / 1440;                           // tudo em dias

/* [nome na frase, dias por geração, uma geração por extenso] */
const ESPECIES = [
  ["humanos", 25 * 365, "25 anos"],
  ["bactérias como a E. coli", 20 * MINUTO, "20 minutos"],
  ["vírus como o da covid", 5, "5 dias"],
  ["moscas-das-frutas", 14, "duas semanas"],
  ["camundongos", 90, "três meses"],
  ["pés de milho", 365, "uma safra"],
  ["baleias-da-groenlândia", 50 * 365, "50 anos"],
];

/* dias → a unidade que se lê melhor */
function duracao(dias) {
  const plural = (n, um, varios) => `${numero(n)} ${n === 1 ? um : varios}`;
  if (dias < 1 / 24) return plural(Math.floor(dias * 1440), "minuto", "minutos");
  if (dias < 2) return plural(Math.floor(dias * 24), "hora", "horas");
  if (dias < 60) return plural(Math.floor(dias), "dia", "dias");
  if (dias < 730) return plural(Math.floor(dias / 30.4), "mês", "meses");
  return plural(Math.floor(dias / 365), "ano", "anos");
}

export function contarGeracoes(nota) {
  const geracoes = nota.querySelector("[data-geracoes]");
  const especie = nota.querySelector("[data-especie]");
  const ritmo = nota.querySelector("[data-ritmo]");
  const tempo = nota.querySelector("[data-tempo]");
  let k = 0;

  especie.addEventListener("click", () => {
    k = (k + 1) % ESPECIES.length;
    especie.textContent = ESPECIES[k][0];
    ritmo.textContent = ESPECIES[k][2];
  });

  const t0 = performance.now();
  (function quadro(agora) {
    const g = Math.floor(((agora - t0) / 1000) * VELOCIDADE);
    geracoes.textContent = `${numero(g)} ${g === 1 ? "geração" : "gerações"}`;
    tempo.textContent = duracao(g * ESPECIES[k][1]);
    requestAnimationFrame(quadro);
  })(t0);
}
