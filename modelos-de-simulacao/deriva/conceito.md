# O que é deriva genética

Numa população, nem todo indivíduo deixa o mesmo número de descendentes — e boa
parte dessa diferença é **puro acaso**: quem encontrou parceiro, quem escapou de
um predador no dia errado, qual gameta por sorte formou o zigoto. Por causa
disso, a frequência de um alelo muda de uma geração para a outra **mesmo sem
nenhuma seleção**. Esse passeio aleatório é a **deriva genética**.

## O que observar na tela

- Cada linha é uma população independente, começando na mesma frequência.
- As linhas **se espalham** com o tempo: o acaso acumula.
- Mais cedo ou mais tarde, cada linha bate em **0 ou em 1** — o alelo se perde
  ou **fixa**. Uma vez lá, não sai mais (não há mutação neste modelo).
- O espalhamento é muito mais rápido quando **N é pequeno**. Compare N = 20 com
  N = 2000 mantendo todo o resto igual.

> A intuição central: deriva é forte em população pequena e fraca em população
> grande. É por isso que gargalos populacionais e efeito fundador importam tanto
> para a conservação de espécies ameaçadas.

## De onde vem o modelo

Este é o modelo de **Wright–Fisher**: a cada geração, os 2N alelos da geração
seguinte são sorteados (com reposição) dos alelos da geração atual. A frequência
no sorteio é a frequência atual `p` — por isso a média não muda, mas a variância
cresce. A probabilidade de um alelo neutro fixar é simplesmente a sua frequência
inicial `p0`.
