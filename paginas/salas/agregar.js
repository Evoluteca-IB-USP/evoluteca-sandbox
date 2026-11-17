/* O que o professor vê dos envios de um bloco: contagens de uma escolha,
   histograma e média de um número, lista de respostas abertas e, nos
   simuladores, os valores coletados somados (e por grupo, com `variar`).
   Funções puras, sem DOM. Um envio é { id, bloco, grupo?, nome?, conteudo, em }. */

const ehNumero = (v) => typeof v === "number" && Number.isFinite(v);
const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;

/* escolha: quantos marcaram cada opção (a correta vem marcada) */
export function agregarEscolha(bloco, envios) {
  const contagens = bloco.opcoes.map((texto, i) => ({ opcao: i, texto, n: 0, correta: bloco.correta === i }));
  let total = 0;
  for (const e of envios) {
    const i = e.conteudo?.opcao;
    if (Number.isInteger(i) && contagens[i]) { contagens[i].n++; total++; }
  }
  const acertos = bloco.correta != null ? (contagens[bloco.correta]?.n ?? 0) : null;
  return { tipo: "escolha", total, contagens, acertos };
}

/* número: média, mediana, extremos e um histograma. Se os valores são inteiros e cabem em
   até 16 valores diferentes, cada valor tem a sua barra; senão, faixas iguais (regra de Sturges, até 12). */
export function agregarNumero(envios) {
  const valores = envios.map((e) => e.conteudo?.numero).filter(ehNumero).sort((a, b) => a - b);
  const total = valores.length;
  if (!total) return { tipo: "numero", total: 0, media: null, mediana: null, minimo: null, maximo: null, histograma: [] };
  const minimo = valores[0], maximo = valores[total - 1];
  const meio = total >> 1;
  const mediana = total % 2 ? valores[meio] : (valores[meio - 1] + valores[meio]) / 2;
  let histograma;
  if (minimo === maximo) {
    histograma = [{ de: minimo, ate: maximo, n: total }];
  } else if (valores.every(Number.isInteger) && maximo - minimo < 16) {
    histograma = Array.from({ length: maximo - minimo + 1 }, (_, i) => ({ de: minimo + i, ate: minimo + i, n: 0 }));
    for (const v of valores) histograma[v - minimo].n++;
  } else {
    const faixas = Math.min(12, Math.ceil(Math.log2(total)) + 1);
    const largura = (maximo - minimo) / faixas;
    histograma = Array.from({ length: faixas }, (_, i) => ({ de: minimo + i * largura, ate: minimo + (i + 1) * largura, n: 0 }));
    for (const v of valores) histograma[Math.min(faixas - 1, Math.floor((v - minimo) / largura))].n++;
  }
  return { tipo: "numero", total, media: media(valores), mediana, minimo, maximo, histograma };
}

/* resposta aberta: da mais antiga para a mais nova; a destacada vai marcada */
export function agregarAberta(envios, destaque = null) {
  const lista = envios
    .filter((e) => typeof e.conteudo?.texto === "string")
    .sort((a, b) => a.em - b.em)
    .map((e) => ({ id: e.id, nome: e.nome ?? null, texto: e.conteudo.texto, destaque: e.destaque === true || e.id === destaque }));
  return { tipo: "aberta", total: lista.length, lista };
}

/* um quadro do simulador: por rótulo coletado, quantos mandaram número, a soma, a média e os extremos */
function quadroDoSimulador(coletar, envios) {
  const itens = coletar.map((rotulo) => {
    const numeros = envios.map((e) => e.conteudo?.valores?.[rotulo]?.numero).filter(ehNumero);
    const textos = envios.filter((e) => e.conteudo?.valores?.[rotulo]).length;
    return {
      rotulo,
      respostas: textos,
      n: numeros.length,
      soma: numeros.reduce((a, b) => a + b, 0),
      media: numeros.length ? media(numeros) : null,
      minimo: numeros.length ? Math.min(...numeros) : null,
      maximo: numeros.length ? Math.max(...numeros) : null,
    };
  });
  return { total: envios.length, itens };
}

/* simulador: o quadro da turma e, com `variar`, um quadro por grupo (o valor do parâmetro vai junto) */
export function agregarSimulador(bloco, envios) {
  const geral = quadroDoSimulador(bloco.coletar, envios);
  const grupos = bloco.variar
    ? bloco.variar.valores.map((valor, indice) => ({
        indice,
        valor,
        parametro: bloco.variar.parametro,
        ...quadroDoSimulador(bloco.coletar, envios.filter((e) => e.grupo === indice)),
      }))
    : null;
  return { tipo: "simulador", total: envios.length, geral, grupos };
}

/* o agregado certo para o bloco; `envios` são só os dele. `destaque` é o id do envio destacado. */
export function agregarBloco(bloco, envios, destaque = null) {
  if (bloco.tipo === "simulador") return agregarSimulador(bloco, envios);
  if (bloco.tipo !== "pergunta") return { tipo: "texto", total: 0 };
  if (bloco.formato === "escolha") return agregarEscolha(bloco, envios);
  if (bloco.formato === "numero") return agregarNumero(envios);
  return agregarAberta(envios, destaque);
}
