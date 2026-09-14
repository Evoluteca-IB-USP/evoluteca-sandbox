/* O importmap do site (nas páginas HTML) é o que faz `import … from "r"`
   funcionar no navegador — mas o Node não lê importmap. Este hook resolve os
   mesmos três nomes quando os testes rodam no terminal. Se um pacote novo
   entrar no importmap das páginas, entra aqui junto. */

const RAIZ = new URL("../", import.meta.url);

const PACOTES = {
  "r": "motor-de-simuladores/r/__pacote__.js",
  "escrever-html": "escrever-html/__pacote__.js",
  "portugues": "portugues/__pacote__.js",
};

export function resolve(especificador, contexto, proximo) {
  const alvo = PACOTES[especificador];
  if (alvo) return { url: new URL(alvo, RAIZ).href, shortCircuit: true };
  return proximo(especificador, contexto);
}
