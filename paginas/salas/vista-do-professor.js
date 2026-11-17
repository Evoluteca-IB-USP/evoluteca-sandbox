/* A sala vista pelo professor: o cabeçalho (estado, link dos alunos, projetor),
   a barra da aula (modo, pausa, cronômetro, aviso), o roteiro dos blocos, o
   palco com o bloco atual e os resultados ao vivo, e a turma.
   Cada região se desenha sozinha; a barra é montada uma vez para uma mensagem
   nova não tirar o cursor de quem está digitando. O editor de bloco e o
   "salvar como aula" abrem num <dialog>. */

import { criar } from "escrever-html";
import { formatarTexto } from "./texto-formatado.js";
import { desenharResultado } from "./resultados-da-turma.js";
import { montarEditorDeBloco } from "./editor-de-blocos.js";
import { criarBloco, TIPOS, ROTULOS_DOS_TIPOS, resumirBloco } from "./blocos.js";
import { exportarCsv } from "./exportar-csv.js";
import { gravarPlano } from "./cliente-da-sala.js";
import { formatarLink } from "./link-da-sala.js";
import { lista as SIMULADORES } from "../../modelos-de-simulacao/__pacote__.js";

/* replaceChildren escreve "null" se receber null: aqui os nulos somem */
const trocar = (destino, ...filhos) => destino.replaceChildren(...filhos.filter((f) => f != null));
const formatarTempo = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const botao = (texto, aoClicar, { classe = "ferramenta", desligado = false, titulo = null } = {}) => {
  const b = criar("button", { type: "button", class: classe, texto, disabled: desligado, title: titulo });
  b.addEventListener("click", (e) => { e.stopPropagation(); aoClicar(e); });
  return b;
};
const rotulo = (texto) => criar("p", { class: "aula-rotulo", texto });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/* o bloco como o aluno o lê, sem os campos de resposta (para o professor e para o projetor) */
function descreverBloco(b, s) {
  if (b.tipo === "texto") return criar("div", { class: "sala-texto", html: formatarTexto(b.texto) });
  if (b.tipo === "pergunta") {
    return criar("div", { class: "sala-texto" }, criar("div", { html: formatarTexto(b.enunciado) }),
      b.formato === "escolha" ? criar("ol", { type: "A", class: "aula-opcoes" }, ...b.opcoes.map((o, i) => criar("li", { class: s.revelados.includes(b.id) && b.correta === i ? "correta" : null, texto: o }))) : null);
  }
  const parametros = Object.entries(b.parametros);
  return criar("div", { class: "sala-texto" },
    criar("p", {}, "Simulador ", criar("strong", { texto: b.simulador })),
    parametros.length ? criar("div", { class: "aula-parametros" }, ...parametros.map(([k, v]) => criar("span", { class: "aula-parametro", texto: `${k} = ${v}${b.travados.includes(k) ? " 🔒" : ""}` }))) : null,
    b.variar ? criar("p", { class: "nota", texto: `A turma varia ${b.variar.parametro}: ${b.variar.valores.join(", ")} (um valor por grupo)` }) : null);
}

export function iniciarVistaDoProfessor(caixa, { sessao, socket, conexao, link }) {
  const enviar = (m) => socket.enviar(m);
  const el = {
    topo: criar("header", { class: "aula-topo" }), avisos: criar("div", { class: "aula-avisos" }), recusa: criar("p", { class: "aviso", hidden: true }),
    barra: criar("section", { class: "aula-barra", "aria-label": "Controles da aula" }),
    roteiro: criar("aside", { class: "aula-roteiro", "aria-label": "Roteiro" }), palco: criar("section", { class: "aula-palco" }),
    resultados: criar("div", { class: "aula-resultados" }), turma: criar("aside", { class: "aula-turma", "aria-label": "Turma" }),
  };
  const dialogo = criar("dialog", { class: "aula-dialogo" });
  caixa.className = "container sala aula";
  caixa.replaceChildren(el.topo, el.avisos, el.recusa, el.barra, criar("div", { class: "aula-grade" }, el.roteiro, el.palco, el.turma), dialogo);
  const projetor = criar("div", { class: "sala-projetor", hidden: true });
  document.body.append(projetor);
  const local = { avisoCampo: null, botoes: {}, cronometroCampo: null };
  const agora = () => Date.now() + sessao.desvio;
  const sala = () => sessao.sala;
  const atual = () => sala().blocos.find((b) => b.id === sala().atual) ?? null;
  const enviosDe = (id) => sessao.envios.filter((e) => e.bloco === id);
  const alunos = () => sessao.participantes.filter((p) => p.papel === "aluno");
  const salvarBlocos = (blocos) => enviar({ tipo: "blocos", blocos });
  const linkDosAlunos = formatarLink({ site: new URL(".", location.href).href, host: link.host, sala: link.sala, convite: link.convite });

  /* ---- o cabeçalho ---- */
  function desenharTopo() {
    const s = sala();
    const estado = s.encerrada ? "Aula encerrada" : sessao.conectado ? "Ao vivo" : "Reconectando…";
    const copiar = botao("Copiar link dos alunos", () => navigator.clipboard.writeText(linkDosAlunos).then(
      () => { copiar.textContent = "Link copiado ✓"; setTimeout(() => { copiar.textContent = "Copiar link dos alunos"; }, 2000); },
      () => { copiar.textContent = "Copie da barra de endereço"; }));
    const csv = botao("Baixar CSV", () => {
      const url = URL.createObjectURL(new Blob([exportarCsv(s.blocos, sessao.envios)], { type: "text/csv;charset=utf-8" }));
      const a = criar("a", { href: url, download: `${(s.titulo || "aula").replace(/[^\p{L}\p{N}]+/gu, "-")}.csv` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, { classe: "aula-discreto" });
    trocar(el.topo,
      criar("div", { class: "aula-topo-texto" },
        criar("a", { class: "aula-voltar", href: "professor.html#salas", texto: "← Painel" }),
        criar("p", { class: `aula-estado${s.encerrada ? " encerrada" : sessao.conectado ? " ao-vivo" : ""}`, texto: estado }),
        criar("h1", { class: "aula-titulo" }, s.titulo, criar("span", { texto: "." }))),
      criar("div", { class: "aula-topo-acoes" },
        s.encerrada ? null : copiar,
        botao("Projetor", () => abrirProjetor(), { classe: "botao botao-primario botao-mini" }),
        criar("div", { class: "aula-topo-mais" },
          botao("Salvar como aula", () => abrirSalvarPlano(), { classe: "aula-discreto" }), csv,
          s.encerrada ? null : botao("Encerrar a aula", () => { if (confirm("Encerrar a aula? Ninguém mais entra nem envia.")) enviar({ tipo: "encerrar" }); }, { classe: "aula-discreto perigo" }))));
  }

  /* ---- a barra da aula: montada uma vez ---- */
  function montarBarra() {
    const b = local.botoes;
    b.seguir = botao("Todos no mesmo bloco", () => enviar({ tipo: "modo", modo: "seguir" }), { titulo: "Os alunos veem o bloco que você abrir" });
    b.livre = botao("Cada um no seu ritmo", () => enviar({ tipo: "modo", modo: "livre" }), { titulo: "Os alunos navegam pelos blocos liberados" });
    b.pausar = botao("Pausar a turma", () => enviar({ tipo: "pausar", sim: !sala().pausada }), { titulo: "As telas dos alunos mostram \"Olhe para o professor\"" });
    local.cronometroCampo = criar("input", { type: "number", min: "1", max: "180", class: "aula-numero", placeholder: "min", "aria-label": "Minutos" });
    local.cronometroCampo.addEventListener("keydown", (e) => { if (e.key === "Enter") iniciarCronometro(); });
    const iniciarCronometro = () => { const m = Number(local.cronometroCampo.value); if (m > 0) { enviar({ tipo: "cronometro", segundos: m * 60 }); local.cronometroCampo.value = ""; } };
    local.tempo = criar("span", { class: "aula-tempo" });
    b.parar = botao("Parar", () => enviar({ tipo: "cronometro", segundos: null }), { classe: "aula-discreto" });
    local.avisoCampo = criar("input", { type: "text", class: "aula-aviso-campo", placeholder: "Mandar um aviso à turma…", maxlength: "500", "aria-label": "Aviso para a turma" });
    const avisar = () => { const t = local.avisoCampo.value.trim(); if (t && enviar({ tipo: "aviso", texto: t })) local.avisoCampo.value = ""; };
    local.avisoCampo.addEventListener("keydown", (e) => { if (e.key === "Enter") avisar(); });
    el.barra.replaceChildren(
      criar("div", { class: "aula-grupo" }, criar("span", { class: "aula-grupo-rotulo", texto: "Turma" }), criar("div", { class: "segmentado" }, b.seguir, b.livre), b.pausar),
      criar("div", { class: "aula-grupo" }, criar("span", { class: "aula-grupo-rotulo", texto: "Cronômetro" }),
        ...[1, 3, 5].map((m) => botao(`${m} min`, () => enviar({ tipo: "cronometro", segundos: m * 60 }))),
        local.cronometroCampo, botao("Iniciar", iniciarCronometro), local.tempo, b.parar),
      criar("div", { class: "aula-grupo aula-grupo-aviso" }, local.avisoCampo, botao("Avisar", avisar)),
    );
  }

  function atualizarBarra() {
    const s = sala(), b = local.botoes;
    b.seguir.classList.toggle("ativa", s.modo === "seguir");
    b.livre.classList.toggle("ativa", s.modo === "livre");
    b.seguir.setAttribute("aria-pressed", String(s.modo === "seguir"));
    b.livre.setAttribute("aria-pressed", String(s.modo === "livre"));
    b.pausar.textContent = s.pausada ? "▶ Retomar a turma" : "❚❚ Pausar a turma";
    b.pausar.classList.toggle("alerta", s.pausada);
    el.barra.classList.toggle("desligada", s.encerrada);
    el.barra.querySelectorAll("button, input").forEach((c) => { c.disabled = s.encerrada; });
    contar();
  }

  function contar() {
    const c = sala()?.cronometro;
    const restante = c ? c.ate - agora() : null;
    local.tempo.textContent = restante == null ? "" : restante > 0 ? formatarTempo(restante) : "Tempo!";
    local.tempo.classList.toggle("acabou", restante != null && restante <= 0);
    local.botoes.parar.hidden = restante == null;
  }
  setInterval(contar, 500);

  /* ---- o roteiro: clicar no bloco abre para a turma ---- */
  function desenharRoteiro() {
    const s = sala();
    const mover = (i, d) => { const l = [...s.blocos]; [l[i], l[i + d]] = [l[i + d], l[i]]; salvarBlocos(l); };
    const item = (b, i) => {
      const n = enviosDe(b.id).length;
      const marcas = [s.liberados.includes(b.id) && "liberado", s.revelados.includes(b.id) && "revelado", s.fechados.includes(b.id) && "fechado"].filter(Boolean);
      const li = criar("li", { class: `aula-item aula-item-${b.tipo}${b.id === s.atual ? " atual" : ""}` },
        criar("button", { type: "button", class: "aula-item-abrir", title: b.id === s.atual ? "Aberto para a turma" : "Abrir para a turma" },
          criar("span", { class: "aula-item-numero", texto: String(i + 1) }),
          criar("span", { class: "aula-item-texto" },
            criar("span", { class: "aula-item-tipo", texto: ROTULOS_DOS_TIPOS[b.tipo] }),
            criar("strong", { texto: b.titulo }),
            criar("span", { class: "aula-item-meta", texto: [b.tipo === "texto" ? null : plural(n, "resposta", "respostas"), ...marcas].filter(Boolean).join(" · ") }))),
        criar("div", { class: "aula-item-acoes" },
          botao(s.liberados.includes(b.id) ? "Esconder" : "Liberar", () => enviar({ tipo: "liberar", bloco: b.id, sim: !s.liberados.includes(b.id) }), { classe: "aula-discreto", titulo: "No modo \"cada um no seu ritmo\", os alunos podem abrir os blocos liberados" }),
          botao("Editar", () => abrirEditor(b, (novo) => salvarBlocos(s.blocos.map((x) => (x.id === b.id ? novo : x)))), { classe: "aula-discreto" }),
          botao("↑", () => mover(i, -1), { classe: "aula-discreto", desligado: i === 0, titulo: "Subir" }),
          botao("↓", () => mover(i, 1), { classe: "aula-discreto", desligado: i === s.blocos.length - 1, titulo: "Descer" }),
          botao("Apagar", () => { if (confirm(`Apagar "${b.titulo}" e as respostas dele?`)) salvarBlocos(s.blocos.filter((x) => x.id !== b.id)); }, { classe: "aula-discreto perigo" })));
      li.querySelector(".aula-item-abrir").addEventListener("click", () => enviar({ tipo: "ir", bloco: b.id }));
      return li;
    };
    trocar(el.roteiro,
      criar("div", { class: "aula-secao-cabeca" }, rotulo(`Roteiro · ${s.blocos.length}`)),
      s.blocos.length ? criar("ol", { class: "aula-itens" }, ...s.blocos.map(item)) : criar("p", { class: "nota", texto: "A sala está vazia. Crie o primeiro bloco." }),
      criar("div", { class: "aula-novo" }, criar("span", { texto: "Bloco novo" }), ...TIPOS.map((t) => botao(`+ ${ROTULOS_DOS_TIPOS[t]}`, () => blocoNaHora(t)))),
    );
  }

  function abrirDialogo(titulo, ...conteudo) {
    const fechar = botao("✕", () => dialogo.close(), { classe: "aula-dialogo-fechar", titulo: "Fechar" });
    trocar(dialogo, criar("header", { class: "aula-dialogo-cabeca" }, criar("h2", { texto: titulo }), fechar), ...conteudo);
    if (!dialogo.open) dialogo.showModal();
  }

  function abrirEditor(bloco, aoSalvar, rotuloDoBotao) {
    const editor = montarEditorDeBloco(bloco, { rotuloDoBotao, aoSalvar: (b) => { dialogo.close(); aoSalvar(b); }, aoCancelar: () => dialogo.close() });
    abrirDialogo(rotuloDoBotao === "Criar e abrir" ? `Novo bloco: ${ROTULOS_DOS_TIPOS[bloco.tipo].toLowerCase()}` : "Editar bloco", editor);
  }

  /* cria o bloco, põe no fim da lista e abre para a turma */
  function blocoNaHora(tipo) {
    const novo = criarBloco(tipo, { titulo: tipo === "pergunta" ? "Pergunta rápida" : ROTULOS_DOS_TIPOS[tipo], ...(tipo === "simulador" ? { simulador: SIMULADORES[0] } : {}) });
    abrirEditor(novo, (b) => { salvarBlocos([...sala().blocos, b]); enviar({ tipo: "ir", bloco: b.id }); }, "Criar e abrir");
  }

  function abrirSalvarPlano() {
    const origem = localStorage.getItem(`evoluteca:salas:origem:${link.sala}`);
    const titulo = criar("input", { type: "text", class: "sala-campo", value: sala().titulo });
    const mensagem = criar("p", { class: "nota", role: "status" });
    const gravar = async (id) => {
      try { await gravarPlano(conexao, id, { titulo: titulo.value.trim() || sala().titulo, blocos: sala().blocos }); mensagem.textContent = "Aula salva no seu painel."; if (id !== origem) localStorage.setItem(`evoluteca:salas:origem:${link.sala}`, id); }
      catch (e) { mensagem.textContent = `Não salvou: ${e.message}`; }
    };
    abrirDialogo("Salvar como aula",
      criar("p", { class: "nota", texto: "Guarda os blocos desta sala, do jeito que estão agora, entre as aulas programadas do painel." }),
      criar("label", { class: "prof-campo" }, criar("span", { texto: "Título da aula" }), titulo),
      criar("div", { class: "aula-dialogo-acoes" },
        origem ? botao("Atualizar a aula original", () => gravar(origem)) : null,
        botao("Salvar como aula nova", () => gravar(crypto.randomUUID().replace(/-/g, "").slice(0, 10)), { classe: "botao botao-primario botao-mini" })),
      mensagem);
  }

  /* ---- o palco: o bloco aberto ---- */
  function desenharPalco() {
    const s = sala(), b = atual();
    if (!b) {
      trocar(el.palco, criar("div", { class: "aula-palco-vazio" },
        criar("p", { class: "aula-palco-icone", texto: "▶" }),
        criar("h2", { texto: s.blocos.length ? "Nenhum bloco aberto" : "Comece montando a aula" }),
        criar("p", { texto: s.blocos.length ? "Clique num bloco do roteiro para abri-lo na tela dos alunos." : "Crie um bloco no roteiro ao lado: um texto, um simulador ou uma pergunta." })));
      return;
    }
    const revelado = s.revelados.includes(b.id), fechado = s.fechados.includes(b.id);
    const pede = b.tipo !== "texto";
    const posicao = s.blocos.findIndex((x) => x.id === b.id);
    const respostas = enviosDe(b.id).length;
    trocar(el.palco,
      criar("article", { class: `aula-bloco aula-bloco-${b.tipo}` },
        criar("div", { class: "aula-bloco-cabeca" },
          rotulo(`Bloco ${posicao + 1} de ${s.blocos.length} · ${ROTULOS_DOS_TIPOS[b.tipo]}`),
          criar("div", { class: "aula-passos" },
            botao("← Anterior", () => enviar({ tipo: "ir", bloco: s.blocos[posicao - 1].id }), { classe: "aula-discreto", desligado: posicao <= 0 }),
            botao("Próximo →", () => enviar({ tipo: "ir", bloco: s.blocos[posicao + 1].id }), { classe: "aula-discreto", desligado: posicao >= s.blocos.length - 1 }))),
        criar("h2", { class: "aula-bloco-titulo", texto: b.titulo }),
        descreverBloco(b, s)),
      pede ? criar("section", { class: "aula-respostas" },
        criar("div", { class: "aula-respostas-cabeca" },
          criar("div", {},
            rotulo("Respostas ao vivo"),
            criar("p", { class: "aula-respostas-conta" }, criar("strong", { texto: String(respostas) }), ` de ${alunos().length} · `, criar("span", { class: revelado ? "visivel" : "oculto", texto: revelado ? "a turma está vendo" : "só você vê" }))),
          criar("div", { class: "aula-respostas-acoes" },
            botao(revelado ? "Esconder da turma" : "Mostrar à turma", () => enviar({ tipo: "revelar", bloco: b.id, sim: !revelado }), { classe: revelado ? "ferramenta ativa" : "botao botao-primario botao-mini" }),
            botao(fechado ? "Reabrir respostas" : "Fechar respostas", () => enviar({ tipo: "fechar", bloco: b.id, sim: !fechado })),
            botao("Limpar", () => { if (confirm("Apagar todas as respostas deste bloco?")) enviar({ tipo: "limpar", bloco: b.id }); }, { classe: "aula-discreto perigo" }))),
        el.resultados) : null,
    );
    desenharResultados();
  }

  function desenharResultados() {
    const s = sala(), b = atual();
    if (!b || b.tipo === "texto") return;
    desenharResultado(el.resultados, b, enviosDe(b.id), { destaque: s.destaques[b.id] ?? null, aoDestacar: (envio) => enviar({ tipo: "destacar", bloco: b.id, envio }) });
  }

  /* ---- a turma ---- */
  function desenharTurma() {
    const s = sala(), b = atual();
    const lista = alunos(), online = lista.filter((p) => p.online);
    const respondeu = new Set(b ? enviosDe(b.id).map((e) => e.participante) : []);
    const maos = lista.filter((p) => p.mao);
    const termometro = [["entendi", "Entendi"], ["mais-ou-menos", "Mais ou menos"], ["perdido", "Perdido"]].map(([v, texto]) => {
      const n = online.filter((p) => p.termometro === v).length;
      return criar("div", { class: `aula-termo aula-termo-${v}` },
        criar("span", { texto }), criar("span", { class: "aula-termo-trilha" }, criar("span", { style: `width:${online.length ? (n / online.length) * 100 : 0}%` })), criar("strong", { texto: String(n) }));
    });
    const ordenados = [...lista].sort((a, c) => Number(c.online) - Number(a.online) || a.nome.localeCompare(c.nome));
    trocar(el.turma,
      criar("div", { class: "aula-secao-cabeca" }, rotulo("Turma")),
      criar("p", { class: "aula-online" }, criar("strong", { texto: String(online.length) }), criar("span", { texto: online.length === 1 ? " aluno na sala" : " alunos na sala" })),
      maos.length ? criar("div", { class: "aula-maos" },
        criar("div", { class: "aula-maos-cabeca" }, criar("strong", { texto: `✋ ${plural(maos.length, "mão levantada", "mãos levantadas")}` }), maos.length > 1 ? botao("Baixar todas", () => enviar({ tipo: "baixar-mao", participante: null }), { classe: "aula-discreto" }) : null),
        ...maos.map((p) => criar("div", { class: "aula-mao" }, criar("span", { texto: p.nome }), botao("Baixar", () => enviar({ tipo: "baixar-mao", participante: p.participante }), { classe: "aula-discreto" })))) : null,
      criar("div", { class: "aula-termometro" }, criar("p", { class: "aula-subrotulo", texto: "Como estão" }), ...termometro),
      criar("p", { class: "aula-subrotulo", texto: b && b.tipo !== "texto" ? `Responderam ${lista.filter((p) => respondeu.has(p.participante)).length} de ${lista.length}` : "Na sala" }),
      lista.length ? criar("ul", { class: "aula-alunos" }, ...ordenados.map((p) => criar("li", { class: p.online ? "online" : "offline" },
        criar("span", { class: "aula-ponto" }), criar("span", { class: "aula-aluno-nome", texto: p.nome }),
        p.mao ? criar("span", { title: "Mão levantada", texto: "✋" }) : null,
        respondeu.has(p.participante) ? criar("span", { class: "aula-respondeu", title: "Respondeu", texto: "✓" }) : null)))
        : criar("div", { class: "aula-ninguem" }, criar("p", { texto: "Ninguém entrou ainda." }), criar("p", { class: "nota", texto: "Mande o link dos alunos (botão lá em cima)." })),
    );
  }

  /* ---- o modo projetor ---- */
  function abrirProjetor() {
    projetor.hidden = false;
    desenharProjetor();
    projetor.requestFullscreen?.().catch(() => { /* a tela cheia pode ser negada; o painel já cobre a janela */ });
  }
  function fecharProjetor() { projetor.hidden = true; if (document.fullscreenElement) document.exitFullscreen?.(); }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !projetor.hidden) fecharProjetor(); });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) projetor.hidden = true; });

  function desenharProjetor() {
    if (projetor.hidden) return;
    const s = sala(), b = atual();
    const corpo = criar("div", { class: "sala-projetor-corpo" });
    if (b) {
      corpo.append(criar("h1", { texto: b.titulo }), descreverBloco(b, s));
      if (b.tipo !== "texto" && s.revelados.includes(b.id)) {
        const r = criar("div", { class: "sala-projetor-resultado" });
        desenharResultado(r, b, enviosDe(b.id), { destaque: s.destaques[b.id] ?? null, mostrarNomes: !(b.tipo === "pergunta" && b.anonima) });
        corpo.append(r);
      }
    } else corpo.append(criar("h1", { texto: s.titulo }));
    trocar(projetor, botao("Sair (Esc)", fecharProjetor, { classe: "ferramenta sala-projetor-sair" }), s.pausada ? criar("h1", { texto: "Olhe para o professor" }) : corpo,
      s.cronometro ? criar("p", { class: "sala-tempo-grande", texto: local.tempo.textContent }) : null);
  }
  setInterval(() => { if (!projetor.hidden && sala()?.cronometro) desenharProjetor(); }, 1000);

  montarBarra();
  const tudo = () => {
    if (!sala()) return;
    document.title = `${sala().titulo} · Evoluteca`;
    desenharTopo(); atualizarBarra(); desenharRoteiro(); desenharPalco(); desenharTurma(); desenharProjetor();
  };

  return {
    aoConexao() {
      el.avisos.replaceChildren(...(sessao.conectado ? [] : [criar("p", { class: "aviso", texto: "Sem conexão com a sala; tentando de novo…" })]));
      if (sala()) desenharTopo();
    },
    aoMensagem(m) {
      if (m.tipo === "recusada") { el.recusa.hidden = false; el.recusa.textContent = `Recusado: ${m.motivo}`; setTimeout(() => { el.recusa.hidden = true; }, 6000); return; }
      if (m.tipo === "estado") return tudo();
      if (!sala()) return;
      if (m.tipo === "presenca") return desenharTurma();
      if (m.tipo === "envio" || m.tipo === "envios") { desenharRoteiro(); desenharPalco(); desenharTurma(); desenharProjetor(); }
    },
  };
}
