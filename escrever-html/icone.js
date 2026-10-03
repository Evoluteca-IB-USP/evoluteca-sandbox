const SVG = "http://www.w3.org/2000/svg";

const CAMINHOS = {
  tocar: "M8 5v14l11-7z",
  pausar: "M6 5h4v14H6zm8 0h4v14h-4z",
  inicio: "M6 6h2v12H6zm3.5 6L18 18V6z",
  passo: "M6 18l8.5-6L6 6zm10-12h2v12h-2z",
  lupa: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14",
  rodar: "M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z",
};

export function icone(nome) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", CAMINHOS[nome]);
  svg.append(path);
  return svg;
}
