/* Escrever HTML em JavaScript. A mesma função estava copiada em seis
   arquivos (home, catálogo, app, porque, explica, simuladores), com 200
   e poucos usos: criar elemento é assunto do site inteiro.

   criar("p", { class: "nota", texto: "olá" }, filho, outro)
     texto  → textContent          html → innerHTML
     true   → atributo vazio       null/false → atributo omitido
   Filhos nulos são descartados, para o chamador poder passar
   `condicao && criar(…)` sem filtrar antes. */
export function criar(tag, atributos = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor == null || valor === false) continue;
    if (chave === "texto") n.textContent = valor;
    else if (chave === "html") n.innerHTML = valor;
    else n.setAttribute(chave, valor === true ? "" : valor);
  }
  n.append(...filhos.filter((f) => f != null));
  return n;
}

/** um nó de texto solto, para intercalar frase e botão dentro de um <p> */
export const criarTexto = (s) => document.createTextNode(s);
