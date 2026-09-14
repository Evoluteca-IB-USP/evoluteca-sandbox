/** plural(1, "simulador", "simuladores") → "1 simulador" */
export const plural = (n, um, muitos) => `${n} ${n === 1 ? um : muitos}`;

/** só a inicial: "Alelo A" → "alelo A" (toLowerCase() inteiro estragaria o "A") */
export const minuscula = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** "Genética de populações" → "genetica de populacoes", para a busca */
export const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** 7 → "07", a numeração do acervo */
export const doisDigitos = (n) => String(n).padStart(2, "0");
