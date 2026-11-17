/* Os envios da sala em CSV, uma linha por envio, para abrir no R
   (`read.csv`). Colunas fixas, depois `parametro_<nome>` e `valor_<rótulo>` de
   todos os simuladores da aula. Texto que começa com = + - @ ganha um apóstrofo,
   para a planilha não tratá-lo como fórmula. Função pura. */

const COLUNAS = ["bloco", "titulo", "tipo", "participante", "nome", "grupo", "valor_do_grupo", "instante", "opcao", "numero", "texto", "semente"];

function celula(valor) {
  if (valor == null) return "";
  let s = String(valor);
  if (typeof valor === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; // número nunca ganha apóstrofo
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* `blocos` na ordem da aula; `envios` com { bloco, participante, nome, grupo?, conteudo, em } */
export function exportarCsv(blocos, envios) {
  const porId = new Map(blocos.map((b, i) => [b.id, { bloco: b, ordem: i }]));
  const linhas = envios.filter((e) => porId.has(e.bloco)).sort((a, b) => porId.get(a.bloco).ordem - porId.get(b.bloco).ordem || a.em - b.em);
  const parametros = new Set(), rotulos = new Set();
  for (const e of linhas) {
    for (const nome of Object.keys(e.conteudo?.parametros ?? {})) parametros.add(nome);
    for (const rotulo of Object.keys(e.conteudo?.valores ?? {})) rotulos.add(rotulo);
  }
  const cabecalho = [...COLUNAS, ...[...parametros].map((p) => `parametro_${p}`), ...[...rotulos].map((r) => `valor_${r}`)];
  const saida = [cabecalho.map((c) => celula(c)).join(",")];
  for (const e of linhas) {
    const { bloco } = porId.get(e.bloco);
    const c = e.conteudo ?? {};
    const opcao = Number.isInteger(c.opcao) ? bloco.opcoes?.[c.opcao] ?? c.opcao : null;
    const valorDoGrupo = bloco.variar && Number.isInteger(e.grupo) ? bloco.variar.valores[e.grupo] : null;
    saida.push([
      celula(bloco.id), celula(bloco.titulo), celula(bloco.tipo === "pergunta" ? `pergunta-${bloco.formato}` : bloco.tipo),
      celula(e.participante), celula(e.nome), celula(e.grupo != null ? e.grupo + 1 : null), celula(valorDoGrupo),
      celula(new Date(e.em).toISOString()), celula(opcao), celula(c.numero), celula(c.texto), celula(c.semente),
      ...[...parametros].map((p) => celula(c.parametros?.[p])),
      ...[...rotulos].map((r) => celula(c.valores?.[r]?.numero ?? c.valores?.[r]?.texto)),
    ].join(","));
  }
  return saida.join("\n") + "\n";
}
