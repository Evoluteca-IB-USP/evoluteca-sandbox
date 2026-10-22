/* A nota de rodapé da abertura, viva: quantas gerações o fundo já andou desde
   que a página abriu e quanto tempo isso seria numa população de verdade. O
   dado sorteia outra espécie, sem repetir a que está.

   API: contarGeracoes(nota)
        nota: o bloco com [data-geracoes], [data-especie], [data-tempo] e o botão [data-sortear] */

import { numero } from "portugues";
import { VELOCIDADE } from "./abertura.js";

const MINUTO = 1 / 1440;                           // tudo em dias

/* [nome na frase, dias por geração] */
const ESPECIES = [
  ["humanos", 25 * 365],
  ["bactérias como a E. coli", 20 * MINUTO],
  ["vírus como o da covid", 5],
  ["moscas-das-frutas", 14],
  ["camundongos", 90],
  ["pés de milho", 365],
  ["baleias-da-groenlândia", 50 * 365],
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
  const tempo = nota.querySelector("[data-tempo]");
  const sortear = nota.querySelector("[data-sortear]"), dado = sortear.firstElementChild;
  let k = 0, voltas = 0;

  sortear.addEventListener("click", () => {
    const outras = ESPECIES.map((_, i) => i).filter((i) => i !== k);
    k = outras[Math.floor(Math.random() * outras.length)];
    especie.textContent = ESPECIES[k][0];
    dado.style.transform = `rotate(${++voltas * 360}deg)`;
    especie.classList.add("sorteada");               // acende em âmbar e apaga devagar
    requestAnimationFrame(() => requestAnimationFrame(() => especie.classList.remove("sorteada")));
  });

  const t0 = performance.now();
  (function quadro(agora) {
    const g = Math.floor(((agora - t0) / 1000) * VELOCIDADE);
    geracoes.textContent = `${numero(g)} ${g === 1 ? "geração" : "gerações"}`;
    tempo.textContent = duracao(g * ESPECIES[k][1]);
    requestAnimationFrame(quadro);
  })(t0);
}
