/* O que as ferramentas de ensino mostram sobre a deriva: as premissas do
   modelo, as ideias erradas mais comuns (Price et al. 2014, Genetic Drift
   Inventory) e casos reais. Os alelos são A₁ e A₂. */

export const premissas = [
  {
    desenho: "geracoes", titulo: "Gerações separadas",
    texto: "Os pais têm filhos todos de uma vez e saem de cena. A geração nova ocupa o lugar deles.",
    seNaoValer: { texto: "Se pais e filhos convivem, a deriva fica um pouco mais lenta, mas continua acontecendo." },
  },
  {
    desenho: "acaso", titulo: "Cópias sorteadas ao acaso",
    texto: "Cada cópia do gene na geração nova é sorteada entre as cópias dos pais, como tirar bolinhas de um saco.",
    seNaoValer: { texto: "Se cada um escolhesse parceiro parecido consigo, haveria mais A₁A₁ e A₂A₂ e menos A₁A₂, mas a frequência dos alelos mudaria do mesmo jeito." },
  },
  {
    desenho: "tamanho", titulo: "Tamanho fixo",
    texto: "Toda população tem sempre N indivíduos, ou seja, 2N cópias do gene.",
    seNaoValer: {
      texto: "Se a população encolhe por um tempo, a deriva fica muito mais forte nesse tempo.",
      rotulo: "veja um gargalo", valores: { N: 500, gargaloN: 10, gargaloGeracoes: 5 },
    },
  },
  {
    desenho: "semSelecao", titulo: "Sem seleção",
    texto: "Ter A₁ ou A₂ não muda a chance de sobreviver nem de ter filhos.",
    seNaoValer: { texto: "Com seleção, o alelo que ajuda tende a subir em quase todas as populações. Este simulador não tem seleção." },
  },
  {
    desenho: "isolados", titulo: "Populações isoladas",
    texto: "Nenhum indivíduo passa de uma população para outra. Cada população sorteia por conta própria.",
    seNaoValer: {
      texto: "Com um pouco de troca entre populações, elas param de se afastar tanto umas das outras.",
      rotulo: "veja", valores: { N: 100, migracao: 0.02 },
    },
  },
  {
    desenho: "semMutacao", titulo: "Sem mutação",
    texto: "Uma cópia de A₁ nunca vira A₂, nem o contrário.",
    seNaoValer: {
      texto: "Com mutação, um alelo que sumiu pode voltar a aparecer.",
      rotulo: "veja", valores: { N: 50, mutacao: 0.005 },
    },
  },
  {
    desenho: "casais", titulo: "Machos e fêmeas meio a meio",
    texto: "Metade dos pais são machos e metade são fêmeas, e todos têm a mesma chance de ter filhos.",
    seNaoValer: {
      texto: "Se só poucos machos se reproduzem, a população se comporta como se fosse menor, e a deriva fica mais forte.",
      rotulo: "veja", valores: { N: 100, machos: 0.05 },
    },
  },
];

export const ideiasErradas = [
  {
    frase: "A deriva só acontece em populações pequenas.",
    resposta: "Ela acontece em qualquer população. Numa população grande ela é lenta: as linhas se afastam do começo devagar, mas se afastam.",
    valores: { N: 5000, geracoes: 1000 }, aba: 0,
  },
  {
    frase: "O alelo raro sempre some, e o comum sempre se fixa.",
    resposta: "O alelo comum tem mais chance, mas não certeza. Um alelo que começa com 10% das cópias acaba sozinho em cerca de 1 a cada 10 populações.",
    valores: { N: 20, p0: 0.1, replicas: 100, geracoes: 300 }, aba: 1,
  },
  {
    frase: "Na deriva, a população muda para se adaptar ao ambiente.",
    resposta: "Na deriva nenhum alelo é melhor que o outro. Um alelo sobe numa população e desce em outra. Se fosse adaptação, ele subiria em quase todos.",
    valores: { N: 30, replicas: 20 }, aba: 0,
  },
  {
    frase: "Sem mutações novas, não existe deriva.",
    resposta: "A deriva usa a variação que já existe. Aqui não há nenhuma mutação, e mesmo assim as frequências mudam a cada geração.",
    valores: { N: 50 }, aba: 0,
  },
  {
    frase: "Populações que começam iguais mudam na mesma direção.",
    resposta: "Cada população sorteia por conta própria. Populações que começam iguais vão para lados diferentes, e a diferença entre eles cresce com o tempo.",
    valores: { N: 50, replicas: 50 }, aba: 4,
  },
  {
    frase: "A deriva só acontece depois de uma catástrofe.",
    resposta: "Uma catástrofe deixa a deriva mais forte por um tempo. Mas o sorteio acontece em toda geração, mesmo quando nada de especial acontece.",
    valores: { N: 200, geracoes: 500 }, aba: 0,
  },
  {
    frase: "Na deriva, o que se conta são os indivíduos que têm o alelo.",
    resposta: "O que se sorteia são as cópias do gene. Cada indivíduo tem duas, então uma população com N indivíduos tem 2N cópias. Um A₁A₂ leva uma cópia de cada.",
    valores: { N: 10, replicas: 6 }, aba: 1,
  },
];

export const casos = [
  {
    titulo: "Os 107 vidros de Buri", lugar: "Laboratório, Estados Unidos, 1956",
    texto: "Peter Buri montou 107 vidros de moscas-das-frutas, cada um com 16 moscas e as duas versões de um gene meio a meio. A cada geração, ele sorteava 16 moscas para formar a próxima. Depois de 19 gerações, cerca de 30 vidros tinham só uma versão e cerca de 30 tinham só a outra.",
    fonte: "Buri, P. (1956). Gene frequency in small populations of mutant Drosophila. Evolution 10: 367–402.",
    valores: { N: 16, p0: 0.5, replicas: 100, geracoes: 20 }, aba: 1,
  },
  {
    titulo: "O elefante-marinho-do-norte", lugar: "Costa do Pacífico, México e Estados Unidos",
    texto: "No fim do século 19, a caça deixou a espécie com cerca de 20 a 30 animais. Hoje eles passam de 100 mil, mas têm muito pouca variação genética. O gargalo passou, e a marca ficou.",
    fonte: "Bonnell, M. L. & Selander, R. K. (1974). Elephant seals: genetic variation and near extinction. Science 184: 908–909.",
    valores: { N: 1000, p0: 0.5, replicas: 20, geracoes: 100, gargaloN: 20, gargaloGeracoes: 2 }, aba: 3,
  },
  {
    titulo: "A ilha que não vê cores", lugar: "Atol de Pingelap, Micronésia",
    texto: "Por volta de 1775, um tufão deixou só cerca de 20 sobreviventes na ilha. Ao que tudo indica, um deles tinha uma cópia de um alelo raro que causa acromatopsia, que é não enxergar cores. Hoje, de 5% a 10% das pessoas da ilha nascem com ela; no resto do mundo, cerca de 1 em 30 mil.",
    fonte: "Sundin, O. H. et al. (2000). Genetic basis of total colourblindness among the Pingelapese islanders. Nature Genetics 25: 289–293.",
    valores: { N: 1000, p0: 0.02, replicas: 100, geracoes: 100, gargaloN: 10, gargaloGeracoes: 3 }, aba: 0,
  },
  {
    titulo: "Guepardos quase iguais", lugar: "África",
    texto: "Os guepardos têm muito pouca variação genética. Em testes, alguns aceitaram enxertos de pele de outros guepardos sem parentesco, como se fossem gêmeos. A explicação mais aceita são gargalos fortes, um deles há cerca de 10 mil anos.",
    fonte: "O'Brien, S. J. et al. (1985). Genetic basis for species vulnerability in the cheetah. Science 227: 1428–1434.",
    valores: { N: 2000, p0: 0.5, replicas: 20, geracoes: 300, gargaloN: 10, gargaloGeracoes: 20 }, aba: 3,
  },
];
