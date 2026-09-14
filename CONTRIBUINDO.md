# Como mexer na Evoluteca

> **Você sabe R e não sabe JavaScript?** Leia as seções 1 a 4 e pare. Elas cobrem
> quase tudo que se faz aqui no dia a dia. As seções 5 em diante são para quem vai
> mexer no motor do site, o que é raro.

Este projeto foi construído com uma regra: **quem entende de genética tem que
conseguir manter os modelos sem virar programador de web.** Se em algum momento
você precisou aprender algo de JavaScript que não está explicado aqui, isso é um
bug da documentação — abra uma issue.

---

## 1. Onde mexer no quê

| Quero… | Edite | Precisa saber JS? |
|---|---|---|
| corrigir um texto, explicação ou roteiro | `modelos-de-simulacao/<slug>/conceito.md`, `roteiro.md`, `professor.md` | **não** — é Markdown |
| mudar faixa, passo, padrão ou rótulo de um parâmetro | bloco `meta` em `modelos-de-simulacao/<slug>/modelo.js` | **não** — é preencher campos |
| mudar a **biologia** de um modelo | função `simular()` em `modelos-de-simulacao/<slug>/modelo.js` | pouco — leia a seção 4 |
| adicionar um simulador novo | copie uma pasta de `modelos-de-simulacao/` | pouco — seção 3 |
| mudar cores, fonte, espaçamento | `aparencia/variaveis/valores/` | não, é só CSS |
| adicionar cenários de um clique, linhas de referência, lupa | bloco `meta` (seção 4.1.1) | **não** |
| mudar como os gráficos se parecem | `motor-de-simuladores/graficos/` | sim |
| mudar como o console, a lupa ou a linha do tempo são montados | `motor-de-simuladores/interface/` | sim |
| mudar o catálogo (banner, folha de contato, filtros, seções por tema) | `paginas/catalogo/` | sim |
| tirar do catálogo um simulador que ainda não existe | apagar a ficha em `modelos-de-simulacao/previstos.js` | **não** |
| trocar quais simuladores a home mostra | `destaques` em `modelos-de-simulacao/__pacote__.js` | **não** — é uma linha |
| mudar as seções da home (apostas, placa de colônias, poeira) | `paginas/home/` | sim |
| mudar quando o header da home deixa de ser transparente | `paginas/home/cabecalho-sobreposto.js` | pouco — é uma linha |
| mudar o nome de um tema, ou criar um tema novo | `TEMAS` em `modelos-de-simulacao/niveis-e-temas.js` | **não** — é uma linha |

**Nada neste projeto exige instalar npm, node ou qualquer ferramenta de build.**
Se alguém propuser adicionar isso, veja a seção 7.

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

1. Copie a pasta de um app parecido:
   ```bash
   cp -r modelos-de-simulacao/deriva modelos-de-simulacao/meu-modelo
   ```
2. Edite `modelos-de-simulacao/meu-modelo/modelo.js` (seção 4).
3. Reescreva os três textos: `conceito.md`, `roteiro.md`, `professor.md`.
4. Acrescente o slug em `modelos-de-simulacao/__pacote__.js` (a lista de uma linha). Hospedagem
   estática não deixa o navegador "varrer" a pasta `modelos-de-simulacao/`, então esse é o
   único índice do projeto — e a única coisa fácil de esquecer.
5. Se quiser que ele apareça **por extenso na home**, troque um slug de
   `destaques`, no mesmo arquivo. A home mostra três, sempre: o percurso não
   cresce com o acervo (quem cresce é o catálogo, e o mosaico no fim do
   percurso já mostra o acervo inteiro). Sem isso, o simulador novo entra no
   catálogo e no mosaico, mas não vira um passo da home.

### Os três textos

| Arquivo | Para quem | O que tem |
|---|---|---|
| `conceito.md` | aluno | o que é o fenômeno, em linguagem simples; o que observar na tela |
| `roteiro.md` | aluno | 3 a 5 perguntas guiadas: "coloque N = 10 e rode 20 vezes. O que muda?" |
| `professor.md` | professor | tempo de aula, pré-requisitos, erros comuns, onde encaixar no currículo |

São Markdown comum. Escreva em português, use `**negrito**` e listas, evite
jargão sem explicar.

---

## 4. Anatomia de um modelo

Todo modelo é um arquivo só, com duas partes.

### 4.1 O bloco `meta` — configuração, não código

```js
export const meta = {
  titulo: "Deriva genética",
  descricao: "O acaso muda a frequência…",  // a frase que aparece no catálogo, em 1–2 linhas
  nivel: ["medio", "graduacao"],        // filtro de nível do catálogo: "medio", "graduacao" ou ambos
  tema: "populacoes",                   // coluna do catálogo — chaves de TEMAS em niveis-e-temas.js
  tempo: "15 min",                      // duração estimada da atividade
  parametros: [
    { nome: "N",        rotulo: "Tamanho da população", min: 10, max: 5000, valor: 100, escala: "log" },
    { nome: "p0",       rotulo: "Frequência inicial",   min: 0,  max: 1,    valor: 0.5, passo: 0.01 },
    { nome: "geracoes", rotulo: "Gerações",             min: 10, max: 1000, valor: 200 },
    { nome: "replicas", rotulo: "Réplicas",             min: 1,  max: 100,  valor: 20 }
  ],
  saida: { tipo: "linhas", x: "geração", y: "frequência do alelo", ylim: [0, 1] }
};
```

Cada item de `parametros` vira um slider na tela, com aquele rótulo. Mudar a
faixa de N é mudar `max: 5000`. Não há mais nada a fazer — a interface se ajusta.

`titulo`, `descricao`, `nivel`, `tema` e `tempo` são o que o catálogo usa. O
`tema` decide em qual coluna do mapa o simulador entra; `nivel` alimenta o
filtro; `titulo` e `descricao` aparecem na faixa do simulador em foco — vale
escrever a `descricao` pensando nisso: uma ou duas frases que digam o que a
pessoa vai ver acontecer na tela.

`escala: "log"` faz o slider andar em passos multiplicativos (útil para N e para
taxas de mutação). Omita para escala linear. `avancado: true` esconde o slider
no modo básico (o parâmetro fica no valor padrão). `simbolo: "p₀"` é como o
parâmetro aparece na etiqueta da rodada guardada como referência.

### 4.1.1 O que mais o `meta` pode declarar (tudo opcional)

A página do app é um laboratório: a simulação **roda no tempo** (▶, passo a
passo, linha do tempo arrastável) e, ao lado do gráfico, uma **lupa** mostra a
população como bolinhas. Isso vem de graça; os campos abaixo só ligam partes
extras. Copie do app mais parecido.

```js
cenarios: [
  // um clique no botão "População pequena" parte dos valores padrão e aplica `valores`;
  // a `dica` aparece embaixo, para dizer ao aluno o que olhar
  { rotulo: "População pequena", valores: { N: 10 }, dica: "Com N = 10, …" },
  { rotulo: "A dominante", valores: { h: 0 }, avancado: true, dica: "…" },   // só no modo avançado
],
saida: {
  tipo: "linhas", x: "geração", y: "frequência do alelo A", ylim: [0, 1],
  alelos: ["A", "a"],   // liga a lupa: bolinhas navy = A, amarelas = a
  N: "N",               // nome do parâmetro com o tamanho da população → a lupa mostra os 2N alelos
                        // da população em foco (sem `N`, mostra genótipos p², 2pq, q² de 200 indivíduos)
  referencias: [        // linhas tracejadas horizontais no gráfico
    { parametro: "p0", rotulo: "p₀ (média esperada)" },   // no valor de um parâmetro…
    { valor: 0.5, rotulo: "0,5" },                        // …ou num número fixo
  ],
},
```

Além do `meta`, o modelo pode exportar duas funções a mais:

- `resumo(resultado, valores)` → uma frase mostrada quando a rodada termina
  ("A fixou em 5 de 20 populações…").
- `aptidoes(valores)` → `{ AA, Aa, aa }`. Se existir, a lupa mostra as aptidões
  como barrinhas e calcula a aptidão média w̄ a cada geração.

**Gráfico de linhas:** `simular()` devolve `[[p0, p1, …], …]` — uma lista por
réplica. A primeira réplica é a "população em foco" (traço escuro e lupa); as
outras formam o feixe claro. Com 5 ou mais réplicas, aparece à direita a
distribuição das réplicas no instante mostrado.

**Gráfico de barras:** `simular()` devolve `{ rotulos, grupos }`. Com mais de
um grupo, o primeiro sai em contorno tracejado (o esperado pela teoria) e os
demais em barras cheias (o observado). Se o resultado trouxer também
`individuos` — o genótipo de cada indivíduo na ordem do sorteio, como índice em
`rotulos` (0 = AA, 1 = Aa, 2 = aa) —, a linha do tempo passa a percorrer a
amostra indivíduo a indivíduo, o último grupo é recalculado com os primeiros
`k` sorteados e a lupa preenche uma bolinha por indivíduo (veja
`modelos-de-simulacao/hardy-weinberg/modelo.js`).

### 4.2 A função `simular()` — a única parte que é código

```js
import { rbinom, seq, rep } from "r";

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

**Regra importante:** todo sorteio aleatório usa o `rng` que chega como argumento.
Nunca chame `Math.random()` direto — isso quebra a reprodutibilidade (o aluno não
consegue repetir o mesmo resultado) e quebra os testes.

### 4.3 Dicionário R → JavaScript

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

## 5. Testes

Os testes checam **a biologia**, não números específicos. Exemplos do que se
testa em `testes/`:

- a heterozigosidade decai a aproximadamente 1/(2N) por geração;
- a probabilidade de fixação converge para p₀;
- Hardy-Weinberg é atingido em uma geração;
- com a mesma semente, duas execuções dão exatamente o mesmo resultado.

Se você mudou a biologia de um modelo, rode os testes daquele app antes de
enviar. Se um teste passou a falhar, ou você quebrou o modelo, ou o teste
precisa ser atualizado — e a segunda hipótese exige justificativa escrita.

---

## 6. Regras de aparência

O visual segue a identidade do IB-USP, documentada em `identidade-visual-ib.md`.
Na prática:

- **Não invente cores.** Use as variáveis de `aparencia/variaveis/valores/cores.css` (`--teal`, `--navy`,
  `--amarelo`, `--alelo-1`, `--alelo-2`…).
- Contraste tem que passar em **WCAG AA** (4,5:1 para texto normal). Para texto
  pequeno e links use `--teal-escuro`, não `--teal`.
- Todo app tem que funcionar em **celular** e em conexão lenta. Meta: primeiro
  carregamento abaixo de 500 KB.
- Controles têm que funcionar por **teclado**, e imagens precisam de texto
  alternativo.

---

## 7. O que **não** fazer

Estas restrições são o que mantém o projeto manutenível. Mudá-las exige discussão:

- **Não adicione etapa de build** (npm, webpack, bundler, TypeScript). No momento
  em que o projeto precisar de `npm install` para rodar, ele deixa de ser
  mantível por um biólogo.
- **Não adicione framework** (React, Vue, Svelte).
- **Não adicione biblioteca pesada de gráficos** (Plotly, D3 inteiro). O
  `motor-de-simuladores/graficos/` existe justamente para não depender disso, e é o que dá
  consistência visual entre os apps.
- **Não misture interface com modelo.** Se você escreveu `document.` dentro de um
  `modelo.js`, algo saiu do lugar.
- **Não copie o CSS do site do IB.** Ele é Bootstrap 3, de 2013, e reprova em
  contraste. Replicamos os *valores* (cores, fonte, espaçamentos), não o arquivo.

---

## 8. Enviando sua contribuição

1. Crie um branch: `git checkout -b meu-modelo`.
2. Rode os testes dos apps que você tocou.
3. Abra um Pull Request descrevendo **o que muda para quem usa o site** — não
   precisa descrever o código.

Dúvida sobre biologia ou sobre o conteúdo: abra uma issue com o rótulo
`conteudo`. Dúvida sobre o código: rótulo `codigo`. Não existe pergunta boba
aqui — se você travou, provavelmente outra pessoa vai travar no mesmo ponto, e a
resposta vira documentação.
