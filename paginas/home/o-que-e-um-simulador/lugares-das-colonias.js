/* Onde as colônias do fundo nascem a cada rodada: pontos sorteados da
   seção, afastados entre si e fora das áreas `ocupada` (o texto, a lupa
   grande e o fio entre os dois). As primeiras caem onde as lupas podem
   apontar (`naJanela`), para sempre haver colônia para elas mostrarem; as
   outras só enfeitam. O afastamento mínimo vai afrouxando se o sorteio não
   acha lugar. */

const QUANTAS = 7;
const PARA_AS_LUPAS = 3;

export function criarSorteio(secao, ocupada, naJanela) {
  return (rng) => {
    const LW = secao.clientWidth, LH = secao.clientHeight;
    const base = Math.min(LW, LH) * .24, lugares = [];

    function sortear(aceita) {
      for (let k = 0; k < 300; k++) {
        const x = (.04 + .92 * rng()) * LW, y = (.09 + .79 * rng()) * LH, folga = base * (1 - k / 600);
        if (ocupada(x, y) || !aceita(x, y) || lugares.some(([ax, ay]) => Math.hypot(ax - x, ay - y) < folga)) continue;
        lugares.push([x, y]);
        return true;
      }
      return false;
    }

    for (let k = 0; k < PARA_AS_LUPAS; k++) sortear(naJanela);
    while (lugares.length < QUANTAS && sortear(() => true));
    return lugares.map(([x, y]) => [x / LW, y / LH]);
  };
}
