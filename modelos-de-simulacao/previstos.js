/* ============================================================
   modelos-de-simulacao/previstos.js — FICHAS DE MENTIRA, temporárias.

   Os simuladores do acervo previsto, escritos só com o bloco `meta`
   que o catálogo lê: eles aparecem na página como os outros — na
   folha de contato, no índice do tema, nos filtros e no palco — mas
   NÃO abrem, porque ainda não existe modelo para eles. Servem para
   ver o catálogo cheio, na escala em que ele vai viver, em vez de
   julgá-lo com três simuladores.

   Quando um deles virar simulador de verdade: crie `modelos-de-simulacao/<slug>/`
   com o `modelo.js`, ponha o slug em `modelos-de-simulacao/__pacote__.js` e apague a ficha
   daqui. Para desligar tudo de uma vez, apague este arquivo e a
   linha que o importa em `catalogo.html`.
   ============================================================ */

/* atalhos: P(rotulo) = um parâmetro básico; F(...) = uma ficha */
const P = (rotulo, avancado = false) => ({ nome: rotulo, rotulo, ...(avancado ? { avancado } : {}) });
const F = (slug, titulo, tema, nivel, tempo, tipo, descricao, parametros) =>
  ({ slug, meta: { titulo, tema, nivel, tempo, descricao, parametros, previsto: true, saida: { tipo } } });

export const previstos = [
  F("mutacao-deriva", "Mutação e deriva", "populacoes", ["graduacao"], "15 min", "linhas",
    "Alelos novos surgem e quase todos se perdem. Veja o equilíbrio entre a taxa de mutação e o tamanho da população.",
    [P("Tamanho da população"), P("Taxa de mutação"), P("Gerações", true)]),
  F("migracao-ilhas", "Migração entre ilhas", "populacoes", ["medio", "graduacao"], "15 min", "linhas",
    "Populações separadas trocam migrantes. Quanta migração basta para impedir que a deriva as diferencie?",
    [P("Número de ilhas"), P("Taxa de migração"), P("Tamanho de cada ilha")]),
  F("endogamia", "Endogamia", "populacoes", ["graduacao"], "10 min", "barras",
    "Cruzamentos entre parentes reduzem os heterozigotos sem mudar a frequência dos alelos.",
    [P("Coeficiente de endogamia"), P("Frequência do alelo A")]),
  F("selecao-balanceadora", "Seleção balanceadora", "populacoes", ["graduacao"], "15 min", "curva",
    "Quando o heterozigoto é o mais apto, os dois alelos ficam. A anemia falciforme é o caso clássico.",
    [P("Aptidão de AA"), P("Aptidão de aa"), P("Frequência inicial")]),
  F("gargalo", "Gargalo populacional", "populacoes", ["medio", "graduacao"], "10 min", "linhas",
    "Uma queda brusca de tamanho e depois a recuperação: o que sobra da variação genética?",
    [P("Tamanho antes"), P("Tamanho no gargalo"), P("Duração do gargalo")]),
  F("efeito-fundador", "Efeito fundador", "populacoes", ["medio"], "10 min", "barras",
    "Poucos indivíduos fundam uma população nova. Sorteie os fundadores e compare com a origem.",
    [P("Número de fundadores"), P("Frequência na origem")]),

  F("herdabilidade", "Herdabilidade", "quantitativa", ["graduacao"], "15 min", "barras",
    "Pais e filhos num gráfico de dispersão: a inclinação da reta é a herdabilidade do caráter.",
    [P("Variância genética"), P("Variância ambiental"), P("Número de famílias")]),
  F("resposta-selecao", "Resposta à seleção", "quantitativa", ["medio", "graduacao"], "15 min", "curva",
    "Selecione os maiores a cada geração e veja a média se deslocar — a equação do criador ao vivo.",
    [P("Fração selecionada"), P("Herdabilidade"), P("Gerações")]),
  F("modelo-infinitesimal", "Modelo infinitesimal", "quantitativa", ["graduacao"], "20 min", "linhas",
    "Muitos genes de efeito pequeno somados: de onde vem a curva em sino e por que ela resiste à seleção.",
    [P("Número de loci"), P("Efeito por locus"), P("Tamanho da população", true)]),
  F("norma-reacao", "Norma de reação", "quantitativa", ["graduacao"], "10 min", "curva",
    "O mesmo genótipo em ambientes diferentes. Plasticidade e interação genótipo–ambiente num gráfico só.",
    [P("Número de genótipos"), P("Faixa do ambiente")]),
  F("selecao-truncada", "Seleção truncada", "quantitativa", ["medio"], "10 min", "barras",
    "Só quem passa do corte se reproduz. Compare a distribuição dos pais com a dos filhos.",
    [P("Ponto de corte"), P("Herdabilidade")]),

  F("relogio-molecular", "Relógio molecular", "molecular", ["graduacao"], "15 min", "linhas",
    "Substituições neutras se acumulam num ritmo quase constante. Estime o tempo de divergência a partir das diferenças.",
    [P("Taxa de substituição"), P("Comprimento da sequência"), P("Tempo de divergência")]),
  F("coalescente", "Coalescente", "molecular", ["graduacao"], "20 min", "linhas",
    "A genealogia de uma amostra, das pontas para o ancestral comum. Quanto tempo até todas as linhagens se encontrarem?",
    [P("Tamanho da amostra"), P("Tamanho da população")]),
  F("dn-ds", "dN/dS", "molecular", ["graduacao"], "15 min", "barras",
    "Substituições sinônimas e não sinônimas lado a lado: a assinatura da seleção numa sequência codificadora.",
    [P("Taxa de mutação"), P("Fração sob seleção"), P("Comprimento do gene", true)]),
  F("sitios-segregantes", "Sítios segregantes", "molecular", ["graduacao"], "10 min", "barras",
    "Quantas posições variam numa amostra de sequências, e como isso depende de N e do tamanho da amostra.",
    [P("Tamanho da amostra"), P("Tamanho da população"), P("Taxa de mutação")]),
  F("arvore-genes", "Árvore de genes, árvore de espécies", "molecular", ["graduacao"], "20 min", "curva",
    "Genes diferentes contam histórias diferentes. Veja quando a árvore de um gene discorda da árvore das espécies.",
    [P("Tempo entre especiações"), P("Tamanho das populações")]),
  F("substituicoes-neutras", "Substituições neutras", "molecular", ["medio", "graduacao"], "10 min", "linhas",
    "A taxa de substituição de um alelo neutro é igual à taxa de mutação — não depende de N. Por quê?",
    [P("Taxa de mutação"), P("Tamanho da população")]),

  F("lotka-volterra", "Predador e presa", "ecologia", ["medio", "graduacao"], "15 min", "linhas",
    "Duas populações que dependem uma da outra oscilam juntas, defasadas no tempo. Mude as taxas e veja o ciclo mudar.",
    [P("Taxa de crescimento da presa"), P("Eficiência do predador"), P("Gerações")]),
  F("competicao", "Competição entre espécies", "ecologia", ["graduacao"], "15 min", "linhas",
    "Duas espécies disputam o mesmo recurso. Quando convivem e quando uma exclui a outra?",
    [P("Capacidade de suporte"), P("Força da competição")]),
  F("epidemia", "Epidemia em uma população", "ecologia", ["medio"], "10 min", "curva",
    "Suscetíveis, infectados e recuperados ao longo do tempo. O que muda quando a transmissão cai pela metade?",
    [P("Taxa de transmissão"), P("Taxa de recuperação"), P("Tamanho da população")]),
  F("metapopulacao", "Metapopulação", "ecologia", ["graduacao"], "15 min", "linhas",
    "Manchas de habitat que se extinguem e são recolonizadas. Quanta conexão sustenta o conjunto?",
    [P("Número de manchas"), P("Taxa de extinção"), P("Taxa de colonização")]),
  F("forrageio", "Forrageio ótimo", "ecologia", ["medio", "graduacao"], "10 min", "curva",
    "Quanto tempo vale a pena ficar numa mancha de alimento antes de procurar outra?",
    [P("Riqueza da mancha"), P("Tempo de viagem")]),

  F("parcimonia", "Parcimônia", "filogenetica", ["graduacao"], "15 min", "barras",
    "A árvore que exige menos mudanças. Monte os caracteres e conte os passos de cada topologia.",
    [P("Número de táxons"), P("Número de caracteres")]),
  F("verossimilhanca", "Máxima verossimilhança", "filogenetica", ["graduacao"], "20 min", "curva",
    "Qual árvore torna os dados mais prováveis, dado um modelo de substituição?",
    [P("Modelo de substituição"), P("Comprimento dos ramos")]),
  F("bootstrap", "Suporte por bootstrap", "filogenetica", ["graduacao"], "15 min", "barras",
    "Reamostre as colunas do alinhamento e veja quais ramos aparecem sempre e quais mudam.",
    [P("Réplicas"), P("Comprimento do alinhamento")]),
  F("atracao-ramos", "Atração de ramos longos", "filogenetica", ["graduacao"], "15 min", "linhas",
    "Quando dois ramos longos se juntam por artefato, e não por parentesco.",
    [P("Comprimento dos ramos longos"), P("Comprimento do alinhamento")]),

  F("desequilibrio", "Desequilíbrio de ligação", "genomica", ["graduacao"], "15 min", "barras",
    "Dois locos vizinhos herdados juntos: quanto a recombinação demora a separá-los?",
    [P("Taxa de recombinação"), P("Tamanho da população"), P("Gerações")]),
  F("varredura", "Varredura seletiva", "genomica", ["graduacao"], "20 min", "linhas",
    "Um alelo vantajoso fixa e arrasta consigo o pedaço de cromossomo em volta.",
    [P("Coeficiente de seleção"), P("Taxa de recombinação")]),
  F("gwas", "Associação genômica", "genomica", ["graduacao"], "20 min", "barras",
    "Milhares de marcadores testados de uma vez: o que é sinal e o que é acaso repetido muitas vezes.",
    [P("Número de marcadores"), P("Tamanho da amostra"), P("Efeito real")]),
  F("estrutura-pop", "Estrutura populacional", "genomica", ["medio", "graduacao"], "15 min", "barras",
    "Populações que trocam poucos migrantes se separam nos eixos de uma análise de componentes principais.",
    [P("Número de populações"), P("Taxa de migração")]),
  F("recombinacao", "Recombinação", "genomica", ["medio"], "10 min", "linhas",
    "Cada gameta é um mosaico dos dois cromossomos dos pais. Veja o mosaico se formar.",
    [P("Taxa de recombinação"), P("Comprimento do cromossomo")]),
];
