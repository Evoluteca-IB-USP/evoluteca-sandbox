/* A porta de entrada dos testes no terminal: `node testes/rodar-no-node.mjs`.
   Registra o resolvedor dos pacotes e só então carrega os testes — no
   navegador (testes/index.html) quem faz esse papel é o importmap. */

import { register } from "node:module";

register("./resolver-pacotes.mjs", import.meta.url);
await import("./testes.js");
