# Como mexer na Evoluteca

> **Você sabe R e não sabe JavaScript?** Leia as seções 1 a 5 e pare. Elas cobrem
> quase tudo que se faz aqui no dia a dia. As seções 6 em diante são para quem vai
> mexer no motor do site, o que é raro.

Este projeto foi construído com uma regra: **quem entende de genética tem que
conseguir manter os modelos sem virar programador de web.** Se em algum momento
você precisou aprender algo de JavaScript que não está explicado aqui, isso é um
bug da documentação — abra uma issue.

---

## 1. Onde mexer no quê

Cada simulador é uma pasta em `modelos-de-simulacao/<slug>/` com dois arquivos:

- `modelo.js` — a **biologia** (`simular()`) e a ficha curta que o **catálogo e a home** leem (`meta`);
- `ficha.js` — o que a **página do simulador** mostra: réguas, gráficos, fórmulas, caderno.

| Quero… | Edite | Precisa saber JS? |
|---|---|---|
| mudar a **biologia** de um modelo | `simular()` em `modelo.js` | pouco — seção 4 |
| mudar faixa, passo, padrão ou rótulo de uma régua | `parametros` em `ficha.js` | **não** — é preencher campos |
| mudar o título, a frase ou o tema que aparecem no catálogo | `meta` em `modelo.js` | **não** |
| corrigir ou acrescentar um passo da derivação das fórmulas | `derivacoes` em `ficha.js` | **não** — seção 5.4 |
| mudar o que o caderno anota de cada rodada | `resumo` em `ficha.js` | pouco |
| adicionar um simulador novo | copie uma pasta de `modelos-de-simulacao/` | pouco — seção 3 |
| mudar cores, fonte, espaçamento | `aparencia/variaveis/valores/` | não, é só CSS |
| mudar como a página do simulador é montada | `motor-de-simuladores/interface/` | sim |
| mudar as miniaturas e vitrines da home e do catálogo | `motor-de-simuladores/graficos/` e `paginas/vitrines/` | sim |
| mudar o catálogo (banner, urna de sorteio, filtros, cartões) | `paginas/catalogo/` | sim |
| tirar do catálogo um simulador que ainda não existe | apagar a ficha em `modelos-de-simulacao/previstos.js` | **não** |
| trocar quais simuladores a home mostra | `destaques` em `modelos-de-simulacao/__pacote__.js` | **não** — é uma linha |
| mudar as seções da home (apostas, placa de colônias, poeira) | `paginas/home/` | sim |
| mudar o nome de um tema, ou criar um tema novo | `TEMAS` em `modelos-de-simulacao/niveis-e-temas.js` | **não** — é uma linha |

**Nada neste projeto exige instalar npm, node ou qualquer ferramenta de build.**
Se alguém propuser adicionar isso, veja a seção 8.

---

## 2. Rodando o site na sua máquina

Precisa de: um navegador e Python (que você já tem). Nada mais.

```bash
git clone https://github.com/<...>/evoluteca
cd evoluteca
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Editou um arquivo? Salve e recarregue a página.
Não há compilação, não há "servidor de desenvolvimento", não há passo intermediário.

> Por que não abrir o `index.html` direto com dois cliques? Porque o navegador
> bloqueia módulos JavaScript carregados via `file://`. O `http.server` resolve.

---

## 3. Adicionando um simulador

1. Copie a pasta do simulador mais parecido:
   ```bash
   cp -r modelos-de-simulacao/deriva modelos-de-simulacao/meu-modelo
   ```
2. Em `modelo.js`, reescreva o `meta` (seção 4.1) e o `simular()` (seção 4.2).
3. Em `ficha.js`, diga o que a página mostra (seção 5).
4. Acrescente o slug em `modelos-de-simulacao/__pacote__.js` (a lista de uma linha). Hospedagem
   estática não deixa o navegador "varrer" a pasta `modelos-de-simulacao/`, então esse é o
   único índice do projeto — e a única coisa fácil de esquecer.
5. Abra `simulador.html?modelo=meu-modelo` e confira.
6. Se quiser que ele apareça **por extenso na home**, troque um slug de
   `destaques`, no mesmo arquivo. A home mostra três, sempre; o catálogo mostra
   o acervo inteiro.

---

## 4. O `modelo.js`: a biologia e o cartão do catálogo

### 4.1 O `meta` — o que o catálogo e a home leem

```js
export const meta = {
  titulo: "Deriva genética",
  descricao: "O acaso muda a frequência…",  // 1–2 frases: o que a pessoa vai ver acontecer
  nivel: ["medio", "graduacao"],           // filtro do catálogo: "medio", "graduacao" ou ambos
  tema: "populacoes",                      // chave de TEMAS em niveis-e-temas.js
  tempo: "15 min",                         // duração estimada da atividade
  parametros: [                            // a home roda o simular() com estes valores padrão
    { nome: "N",        rotulo: "Tamanho da população", valor: 100 },
    { nome: "geracoes", rotulo: "Gerações",             valor: 200, avancado: true },
  ],
  saida: { tipo: "linhas", y: "frequência do alelo A" },  // "linhas" ou "barras": o desenho da miniatura
};
```

`avancado: true` tira o parâmetro da frase da home que diz o que dá para mexer.
O `valor` de cada parâmetro aqui e em `ficha.js` deve ser o mesmo.

### 4.2 A função `simular()` — a única parte que é código de verdade

```js
import { rbinom, seq } from "r";

export function simular({ N, p0, geracoes, replicas }, rng) {
  const series = [];
  for (const r of seq(1, replicas)) {
    const p = [p0];
    for (const g of seq(1, geracoes)) {
      p[g] = rbinom(2 * N, p[g - 1], rng) / (2 * N);
    }
    series.push(p);
  }
  return series;
}
```

Compare com o R equivalente — é a mesma coisa:

```r
simular <- function(N, p0, geracoes, replicas) {
  series <- list()
  for (r in 1:replicas) {
    p <- p0
    for (g in 1:geracoes) p[g+1] <- rbinom(1, 2*N, p[g]) / (2*N)
    series[[r]] <- p
  }
  series
}
```

O que `simular()` devolve é com você; a ficha diz à página como ler. A home
espera o formato da miniatura: em `"linhas"`, uma lista de séries
(`[[p0, p1, …], …]`); em `"barras"`, `{ rotulos, grupos }`.

**Regra importante:** todo sorteio aleatório usa o `rng` que chega como argumento.
Nunca chame `Math.random()` direto — isso quebra a reprodutibilidade (a turma
inteira com a mesma semente vê o mesmo resultado) e quebra os testes.

---

## 5. A `ficha.js`: o que a página do simulador mostra

A página é sempre a mesma: réguas à esquerda, o gráfico principal com a linha
do tempo e, embaixo, uma trilha de ferramentas que andam junto com a simulação
— **Caderno**, **De onde vêm as fórmulas**, **Por dentro** e **Dados para o R**.
A ficha só preenche. Uma ferramenta cujo campo a ficha não tem simplesmente não
aparece. Abra `modelos-de-simulacao/deriva/ficha.js` ao lado enquanto lê.

```js
import { simular } from "./modelo.js";

export default {
  titulo: "Deriva genética",
  arquivo: "deriva-genetica",           // nome do CSV em "Dados para o R"
  parametros: [ … ],                    // 5.1
  simular(par, rng) { … },              // 5.2
  graficos: [ … ],                      // 5.3
  derivados: { … },                     // 5.4
  derivacoes: [ … ],                    // 5.4
  lupa: { … },                          // 5.5
  resumo: [ … ],                        // 5.6
};
```

### 5.1 `parametros` — as réguas

```js
{ nome: "N",  rotulo: "Tamanho da população", simbolo: "N",   min: 10,   max: 5000, valor: 100, escala: "log" },
{ nome: "p0", rotulo: "Frequência inicial",   simbolo: "p_0", min: 0.02, max: 0.98, valor: 0.5, passo: 0.01, casas: 2 },
{ nome: "geracoes", rotulo: "Gerações",       min: 10, max: 1000, passo: 10, valor: 200, tempo: true },
```

- `escala: "log"` faz a régua andar em passos multiplicativos (bom para N e taxas).
- `casas` é quantas casas decimais mostrar.
- `simbolo` é como o parâmetro aparece nas fórmulas e no caderno (notação na seção 5.4).
- **`tempo: true`** marca o parâmetro que é o número de gerações: ele liga a linha
  do tempo (▶, passo a passo, arrastar). Um modelo sem tempo (uma amostra, como
  Hardy–Weinberg) não marca nenhum, e a página aparece sem linha do tempo.
- `deterministico: true` (no nível da ficha, não do parâmetro) esconde o
  "Sortear de novo", para modelos sem acaso, como a seleção.

### 5.2 `simular` — a ponte para o `modelo.js`

Em geral chama o `simular()` do `modelo.js` e acrescenta o que os gráficos e as
fórmulas vão precisar, já calculado por geração:

```js
simular(par, rng) {
  const series = simular(par, rng);
  return { series, h: heterozigosidadePorGeracao(series) };
},
```

### 5.3 `graficos` — o primeiro é o principal

Três tipos, todos no mesmo estilo:

| `tipo` | Para quê | Campos |
|---|---|---|
| `"replicas"` | várias populações no tempo; a primeira em destaque | `series: (r) => r.series` |
| `"curva"` | uma série no tempo (uma média, uma trajetória) | `serie: (r) => r.p` |
| `"barras"` | categorias, esperado × medido | `categorias: ["AA", "Aa", "aa"]`, `valores: (r) => ({ esperado, medido })` |

Todos levam `id` (vira o nome da coluna no CSV), `titulo` e `ylim: [0, 1]`.
Opcionais: `referencia: (par) => ({ y: par.p0, rotulo: "p₀" })` (linha tracejada
horizontal), `previsao: (par) => [...]` (a curva da teoria, tracejada),
`faixa: (par) => ({ inf, sup })` (a faixa prevista, sombreada) e
`distribuicao: true` (o histograma das réplicas ao lado, só em `"replicas"`).

Só o primeiro gráfico aparece na página; os outros entram no CSV de "Dados para o R".

### 5.4 `derivacoes` — de onde vêm as fórmulas

Cada derivação é uma lista curta de passos. Cada passo tem uma frase, a fórmula
e o valor dela na rodada; a página mostra a fórmula e, embaixo, a mesma fórmula
com os números no lugar dos símbolos.

```js
{
  texto: "Repetindo a conta geração após geração, desde o começo:",
  formula: "H_t = {H0}(1 − [1|2{N}])^({t})",
  valor: (par, t) => …,          // o número que a fórmula dá agora
  medido: (r, t) => r.h[t],      // opcional: o mesmo número medido nas réplicas
  casas: 3,
}
```

As fórmulas são texto, numa notação curta:

| Escreva | Para ter |
|---|---|
| `H_t`, `p_(t+1)` | índice: H<sub>t</sub>, p<sub>t+1</sub> |
| `p^2`, `(1 − s)^({t})` | expoente |
| `[1|2{N}]` | fração 1 sobre 2N (pode ter fração dentro de fração) |
| `{N}`, `{p0}`, `{t}` | símbolo ligado: um parâmetro, um derivado ou o tempo |

Um **símbolo ligado** vira número na linha de baixo e se acende junto com a
régua do parâmetro quando se passa o mouse. Os números entram do lado direito
do primeiro `=` ou `≈`. Quando a fórmula usa uma quantidade que não é parâmetro
(H₀, a aptidão média, uma frequência da amostra), declare-a em `derivados`:

```js
derivados: {
  H0: { simbolo: "H_0", calcular: (par, t, r) => 2 * par.p0 * (1 - par.p0), casas: 3 },
},
```

### 5.5 `lupa` — "Por dentro"

O que a página desenha como pontos, um por alelo ou por indivíduo:

```js
lupa: {
  aba: "Por dentro de uma população",
  legenda: (par, t) => `Os alelos da população da linha azul-marinho, na geração ${t}.`,
  contar: (r, par, t) => [
    { rotulo: "alelos A", n: …, cor: "navy" },
    { rotulo: "alelos a", n: …, cor: "amarelo" },   // cores: "navy", "amarelo" ou "teal"
  ],
},
```

### 5.6 `resumo` — o que o caderno anota

O caderno faz uma coluna por rodada (os parâmetros e, embaixo, estas linhas) e
avisa quando duas coisas mudaram de uma vez.

```js
resumo: [
  { rotulo: "só com A", valor: (r, par) => `${…} de ${par.replicas}` },
],
```

### 5.7 Dicionário R → JavaScript

O pacote `"r"` existe para que você reconheça as funções. O resto é sintaxe:

| R | JavaScript |
|---|---|
| `x <- 5` | `let x = 5;` (ou `const x = 5;` se nunca muda) |
| `c(1, 2, 3)` | `[1, 2, 3]` |
| `v[1]` | `v[0]` — **índice começa em 0** |
| `length(v)` | `v.length` |
| `for (i in 1:n)` | `for (const i of seq(1, n))` |
| `if (a == b)` | `if (a === b)` — **três iguais** |
| `x^2` | `x ** 2` |
| `function(x) x^2` | `(x) => x ** 2` |
| `list(a = 1, b = 2)` | `{ a: 1, b: 2 }` |
| `v * 2` | `v.map(x => x * 2)` — **JS não vetoriza sozinho** |
| `print(x)` | `console.log(x)` |
| `rbinom(1, n, p)` | `rbinom(n, p, rng)` |
| `rnorm(1, m, s)` | `rnorm(m, s, rng)` |
| `runif(1)` | `rng()` |
| `sample(v, k)` | `sample(v, k, rng)` |
| `seq`, `rep`, `mean`, `sd`, `sum`, `tabulate` | iguais, importadas de `"r"` |

**As três pegadinhas que pegam todo mundo:** índice começa em 0, comparação é
`===` (três iguais), e não há vetorização — operação em vetor pede `.map()`.

Deu erro? Aperte **F12** no navegador e abra a aba *Console*: a mensagem de erro
aparece lá, com o arquivo e a linha.

---

## 6. Testes

Os testes checam **a biologia**, não números específicos. Exemplos do que se
testa em `testes/`:

- a heterozigosidade decai a aproximadamente 1/(2N) por geração;
- a probabilidade de fixação converge para p₀;
- Hardy–Weinberg é atingido em uma geração;
- com a mesma semente, duas execuções dão exatamente o mesmo resultado.

Rode com `node testes/rodar-no-node.mjs`, ou abra `testes/index.html` no
navegador. Se você mudou a biologia de um modelo, rode os testes antes de
enviar. Se um teste passou a falhar, ou você quebrou o modelo, ou o teste
precisa ser atualizado — e a segunda hipótese exige justificativa escrita.

---

## 7. Regras de aparência

O visual segue a identidade do IB-USP. Na prática:

- **Não invente cores.** Use as variáveis de `aparencia/variaveis/valores/cores.css` (`--teal`, `--navy`,
  `--amarelo`, `--alelo-1`, `--alelo-2`…).
- Contraste tem que passar em **WCAG AA** (4,5:1 para texto normal). Para texto
  pequeno e links use `--teal-escuro`, não `--teal`.
- O site é pensado para **computador**, em conexão lenta: primeiro carregamento
  abaixo de 500 KB.
- Controles têm que funcionar por **teclado**, e imagens precisam de texto
  alternativo.

---

## 8. O que **não** fazer

Estas restrições são o que mantém o projeto manutenível. Mudá-las exige discussão:

- **Não adicione etapa de build** (npm, webpack, bundler, TypeScript). No momento
  em que o projeto precisar de `npm install` para rodar, ele deixa de ser
  mantível por um biólogo.
- **Não adicione framework** (React, Vue, Svelte).
- **Não adicione biblioteca pesada de gráficos** (Plotly, D3 inteiro). Os
  gráficos do motor existem justamente para não depender disso, e é o que dá
  consistência visual entre os simuladores.
- **Não misture interface com modelo.** Se você escreveu `document.` dentro de um
  `modelo.js` ou de uma `ficha.js`, algo saiu do lugar: a ficha declara, o motor desenha.
- **Não copie o CSS do site do IB.** Ele é Bootstrap 3, de 2013, e reprova em
  contraste. Replicamos os *valores* (cores, fonte, espaçamentos), não o arquivo.

---

## 9. Enviando sua contribuição

1. Crie um branch: `git checkout -b meu-modelo`.
2. Rode os testes.
3. Abra um Pull Request descrevendo **o que muda para quem usa o site** — não
   precisa descrever o código.

Dúvida sobre biologia ou sobre o conteúdo: abra uma issue com o rótulo
`conteudo`. Dúvida sobre o código: rótulo `codigo`. Não existe pergunta boba
aqui — se você travou, provavelmente outra pessoa vai travar no mesmo ponto, e a
resposta vira documentação.
