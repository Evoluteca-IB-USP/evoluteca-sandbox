/* Dez seletores de básico × avançado, lado a lado, para escolher um. Cada
   um é uma função que recebe o estado inicial e devolve o elemento. */

const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const alternar = (no) => no.addEventListener("click", () => no.setAttribute("aria-pressed", String(no.getAttribute("aria-pressed") !== "true")));

const CURVA = `<svg viewBox="0 0 14 10" class="glifo"><path d="M1 8 C4 8 5 2 8 2 S12 5 13 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ONDA = `<svg viewBox="0 0 26 8" class="s3-onda"><path d="M0 4 Q3 1 6 4 T12 4 T18 4 T26 4" fill="none" stroke="var(--teal-claro)" stroke-width="1.6"/></svg>`;

const SELETORES = [
  ["Trilho em miniatura", "o slider do site encolhido: pontilhado desligado, contínuo ligado",
    (on) => { const b = el(`<button class="s1" aria-pressed="${on}"><span class="s1-trilho"><i></i></span>avançado</button>`); alternar(b); return b; }],
  ["Régua de duas marcas", "uma régua curta com só dois valores; a cabeça âmbar pula entre eles",
    (on) => {
      const b = el(`<div class="s2" data-on="${on}"><span class="s2-linha"><i></i></span><span class="s2-marcas"><button>básico</button><button>avançado</button></span></div>`);
      b.querySelectorAll("button").forEach((x, k) => x.addEventListener("click", () => b.dataset.on = String(k === 1)));
      return b;
    }],
  ["Dois nós da trilha", "a trilha de passos em miniatura; o nó escolhido é teal com anel âmbar",
    (on) => {
      const b = el(`<div class="s3" data-on="${on}"><button>básico</button><i class="s3-no"></i>${ONDA}<i class="s3-no"></i><button>avançado</button></div>`);
      const ir = (v) => () => b.dataset.on = v;
      const [bb, ba] = b.querySelectorAll("button"), [n0, n1] = b.querySelectorAll(".s3-no");
      [bb, n0].forEach((x) => x.addEventListener("click", ir("false")));
      [ba, n1].forEach((x) => x.addEventListener("click", ir("true")));
      return b;
    }],
  ["Traço que desliza", "as duas palavras soltas e o traço âmbar do kicker correndo de uma para a outra",
    (on) => {
      const b = el(`<div class="s4" data-on="${on}"><button>básico</button><button>avançado</button><i></i></div>`);
      b.querySelectorAll("button").forEach((x, k) => x.addEventListener("click", () => b.dataset.on = String(k === 1)));
      return b;
    }],
  ["Ponto final âmbar", "a palavra escolhida ganha o ponto âmbar dos títulos do site",
    (on) => {
      const b = el(`<div class="s5" data-on="${on}"><button>básico<span>.</span></button><button>avançado<span>.</span></button></div>`);
      b.querySelectorAll("button").forEach((x, k) => x.addEventListener("click", () => b.dataset.on = String(k === 1)));
      return b;
    }],
  ["Frase com menu", "controle dentro da frase, sublinhado com setinha, como no resto do site",
    (on) => {
      const b = el(`<div class="s6">mostrando o <button class="s6-escolha"></button><span class="s6-menu" hidden><button data-v="false">básico</button><button data-v="true">avançado</button></span></div>`);
      const escolha = b.querySelector(".s6-escolha"), menu = b.querySelector(".s6-menu");
      const pintar = (v) => { escolha.innerHTML = `${v ? "avançado" : "básico"} <span>▾</span>`; };
      escolha.addEventListener("click", () => { menu.hidden = !menu.hidden; });
      menu.querySelectorAll("button").forEach((x) => x.addEventListener("click", () => { pintar(x.dataset.v === "true"); menu.hidden = true; }));
      pintar(on);
      return b;
    }],
  ["Palavra com desenhinho", "a curva do tamanho de uma letra diz que entra a conta; ＋ vira ✓",
    (on) => { const b = el(`<button class="s7" aria-pressed="${on}"><span class="s7-sinal"></span>${CURVA}<span class="s7-texto">a conta</span></button>`); alternar(b); return b; }],
  ["Camadas", "o desenho de folhas empilhadas: uma no básico, três no avançado",
    (on) => {
      const b = el(`<button class="s8" aria-pressed="${on}"><svg viewBox="0 0 22 18"><path class="c3" d="M11 3 L20 7 L11 11 L2 7 Z"/><path class="c2" d="M11 6 L20 10 L11 14 L2 10 Z"/><path class="c1" d="M11 9 L20 13 L11 17 L2 13 Z"/></svg><span></span></button>`);
      alternar(b);
      return b;
    }],
  ["Sorteio + conta", "os pontos da rodada; ligado, a curva da conta passa por cima deles",
    (on) => {
      const pontos = [[3, 12], [7, 9], [10, 11], [13, 6], [17, 8], [20, 4], [24, 5], [27, 3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join("");
      const b = el(`<button class="s9" aria-pressed="${on}"><svg viewBox="0 0 30 16"><g class="s9-pontos">${pontos}</g><path class="s9-curva" d="M2 13 C9 11 16 7 28 3"/></svg><span>sorteio</span><b>+ conta</b></button>`);
      alternar(b);
      return b;
    }],
  ["Nó que se marca", "um círculo de contorno, como os nós do site; ligado, vira teal com anel âmbar",
    (on) => { const b = el(`<button class="s10" aria-pressed="${on}"><i></i>modo avançado</button>`); alternar(b); return b; }],
];

const grade = document.getElementById("grade");
SELETORES.forEach(([nome, descricao, montar], k) => {
  const item = el(`<section class="item">
    <p class="item-nome"><b>${String(k + 1).padStart(2, "0")}</b> ${nome}</p>
    <p class="item-descricao">${descricao}</p>
    <div class="item-estados"><div><small>básico</small></div><div><small>avançado</small></div></div>
  </section>`);
  const [a, b] = item.querySelectorAll(".item-estados > div");
  a.append(montar(false));
  b.append(montar(true));
  grade.append(item);
});
