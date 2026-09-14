/* As faixas de duração do filtro, lidas de `meta.tempo` ("15 min"). */

export const FAIXAS = {
  curto: { rotulo: "até 10 min", vale: (m) => m > 0 && m <= 10 },
  medio: { rotulo: "15 min", vale: (m) => m > 10 && m < 20 },
  longo: { rotulo: "20 min ou mais", vale: (m) => m >= 20 },
};

export const minutos = (e) => parseInt((e.meta.tempo || "").replace(/\D+/g, ""), 10) || 0;
