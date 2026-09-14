/* ============================================================
   O header sobre a abertura (só na home)

   No alto da home o header não tem fundo próprio: as trajetórias
   da abertura passam por trás dele e o cabeçalho lê como parte
   da figura. Na primeira rolagem ele ganha a faixa cinza das
   outras páginas — sem fundo, o texto da abertura subiria por
   baixo dele e os dois se sobreporiam.

   A aparência inteira está no CSS (`.tem-abertura`, no <body> do
   index). Aqui ficam as duas coisas que o CSS não faz sozinho:

     1. MEDIR o header. A sobreposição é feita com margem
        negativa, e a altura do header depende do conteúdo — muda
        com a largura da tela e com o tamanho da fonte escolhido
        no navegador. A medida vira a variável --altura-topo.

     2. LIGAR a faixa cinza a partir da primeira rolagem, pela
        classe `topo-solido`.

   Nas outras páginas não se chama nada: o header já é a faixa
   cinza por padrão, e sem esta chamada ele continua assim.

   API: ativarTopoSobreposto()
   ============================================================ */

const ROLAGEM = 8;    // px de rolagem para o header ganhar fundo (folga contra tremor de trackpad)

export function ativarTopoSobreposto() {
  const topo = document.querySelector(".topo");
  if (!topo || !document.querySelector(".abertura")) return;   // página sem abertura: nada a fazer

  /* ---- a altura do header vira medida de CSS ----
     É ela que puxa a abertura para cima (margin negativa) e que devolve o
     espaço por dentro (padding). Mexer na margem não muda a altura do header,
     então o ResizeObserver não se realimenta. */
  const medir = () =>
    document.documentElement.style.setProperty("--altura-topo", `${topo.offsetHeight}px`);
  medir();
  if (window.ResizeObserver) new ResizeObserver(medir).observe(topo);
  else window.addEventListener("resize", medir);

  /* ---- fundo cinza a partir da primeira rolagem ----
     Enquanto a página está no alto, o header é o próprio azul da abertura.
     Assim que ela anda, o texto da abertura começa a passar por trás do
     header: sem fundo, os dois se sobreporiam. */
  let agendado = false;
  function conferir() {
    agendado = false;
    topo.classList.toggle("topo-solido", window.scrollY > ROLAGEM);
  }
  const agendar = () => {                        // no máximo uma conferida por quadro
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(conferir);
  };

  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  conferir();                                    // recarga no meio da página já começa cinza
}
