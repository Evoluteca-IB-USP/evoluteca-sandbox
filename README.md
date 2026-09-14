# Evoluteca

**Simuladores interativos de evolução e genética, em português, gratuitos e
direto no navegador** — do ensino médio à graduação. Projeto de extensão do
Instituto de Biociências da USP.

> **Status: protótipo.** Este repositório é a primeira versão navegável do site,
> com três simuladores funcionais: deriva genética, Hardy–Weinberg e seleção em
> um locus. O restante do acervo previsto no projeto entra ao longo de 2026–27.

Cada simulador é um pequeno laboratório: a simulação **roda no tempo** (▶,
passo a passo, linha do tempo arrastável), uma **lupa** mostra a população como
bolinhas (alelos, genótipos ou os indivíduos sorteados), há **cenários** de um
clique com uma dica do que observar, e dá para **guardar uma rodada como
referência** e comparar com a seguinte. Tudo isso é montado pelo motor a partir
do bloco `meta` do modelo — quem escreve um modelo não escreve interface.

## Rodando localmente

Precisa de um navegador e Python. Nada mais — não há npm, build ou instalação.

```bash
cd evoluteca_2
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Editou um arquivo? Salve e recarregue.

## Estrutura

```
evoluteca_2/
├── index.html                página inicial (abertura, as quatro seções, sobre)
├── catalogo.html             catálogo: banner (busca, nível, duração, temas, folha de contato) + uma seção por tema
├── simulador.html            um simulador (simulador.html?modelo=<slug>): console + laboratório + material
│
├── escrever-html/            escrever HTML em JS: `criar`, ícones, Markdown → HTML   ← importmap "escrever-html"
├── portugues/                números e palavras como se escrevem em português        ← importmap "portugues"
│
├── aparencia/                TODA a roupagem estética, em camadas
│   ├── __pacote__.css        a base que toda página carrega
│   ├── variaveis/valores/    o que a coisa é: cores, fontes, medidas
│   ├── pagina/               o HTML nu: caixa, texto, larguras, movimento reduzido
│   ├── componentes/          o que se repete em qualquer página
│   ├── secoes-empilhadas/    o sistema de emendas serrilhadas (home e catálogo)
│   ├── simulador/ · home/ · catalogo/   o pacote de cada página
│
├── motor-de-simuladores/     identidade estreita: lógica e construção, nunca cor
│   ├── r/                    o vocabulário do R em JS (rbinom, seq, sd…)             ← importmap "r"
│   ├── graficos/             canvas puro: bases/ (superfície e eixos) e tipos-de-grafico/
│   └── interface/            monta a página do simulador a partir do bloco `meta`
│       ├── montar-simulador.js   o orquestrador (o estado da simulação mora aqui)
│       ├── controles/        o que a pessoa manipula: sliders, cenários, linha do tempo
│       └── mostradores/      o que ela lê: legenda, lupa da população, material de apoio
│
├── paginas/                  o código das páginas do site — nunca entra no motor
│   ├── emenda-entre-secoes.js · titulo-de-secao.js
│   ├── desenho-em-canvas/    o que as figuras animadas têm em comum
│   ├── vitrines/             a vinheta e a vitrine que apresentam um simulador
│   ├── home/                 montar-home.js + abertura, porque-aprender/, o-que-e-um-simulador/, simuladores/
│   └── catalogo/             montar-catalogo.js + banner, folha de contato, seções por tema, palco
│
├── modelos-de-simulacao/     os simuladores: um diretório por slug
│   ├── __pacote__.js         a lista de slugs publicados (o único índice do projeto)
│   ├── niveis-e-temas.js     o vocabulário do bloco `meta`
│   ├── previstos.js          fichas de mentira do acervo previsto (aparecem no catálogo, não abrem)
│   └── <slug>/
│       ├── modelo.js         bloco `meta` + `simular()` — o único código do simulador
│       └── conceito.md · roteiro.md · professor.md
│
├── imagens/                  logos IB e USP (brancas) e o favicon gerado do símbolo do IB
├── testes/                   testes da biologia (`node testes/rodar-no-node.mjs`) e o gerador da aresta
└── CONTRIBUINDO.md           guia para quem sabe R e não sabe JavaScript
```

Cada pasta é um **pacote**: a porta é o `__pacote__.js` (ou `__pacote__.css`) e
quem importa de fora nunca aponta para um arquivo de dentro. Três pacotes são
alcançados por nome curto — `"r"`, `"escrever-html"` e `"portugues"` — pelo
importmap de cada página, para que nenhum arquivo escreva `../../../`. O Node
não lê importmap: quem faz esse papel no terminal é `testes/resolver-pacotes.mjs`.

Adicionar um simulador = copiar uma pasta de `modelos-de-simulacao/`, editar
`modelo.js` e os três textos, e acrescentar o slug em
`modelos-de-simulacao/__pacote__.js`. Ver `CONTRIBUINDO.md`.

## Princípios do projeto

- **Sem etapa de build.** Abre e funciona; mantível por quem sabe R e biologia.
- **Leve.** Primeiro carregamento de um app abaixo de 500 KB, para funcionar no
  celular e em conexão lenta.
- **Acessível.** Contraste WCAG AA, controles por teclado, `aria` nos gráficos.
- **Do domínio.** O cabeçalho segue o padrão dos sites da USP/IB (faixa amarela +
  faixa azul-clara, barra teal, wordmark de texto), como `graduacao.ib.usp.br`.
  Os valores estão levantados em `identidade-visual-ib.md`.
- **Reprodutível.** Todo sorteio passa por um PRNG com semente — nunca
  `Math.random()` num modelo.

## Licenças

Textos e materiais didáticos: **CC BY 4.0** · Código: **MIT** · Ferramentas
adaptadas mantêm as licenças originais, indicadas na ficha de cada simulador.
