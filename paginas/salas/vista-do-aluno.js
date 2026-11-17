/* A sala vista pelo aluno: o bloco atual (ou a navegação entre os liberados, no
   modo livre), a resposta, o simulador embutido, mão, termômetro, pausa,
   cronômetro, avisos e os resultados da turma quando revelados.
   Cada região se desenha sozinha, para uma mensagem nova não tirar o cursor de
   quem está digitando nem recarregar o simulador. */

import { criar } from "escrever-html";
import { formatarTexto } from "./texto-formatado.js";
import { urlDoSimulador, conteudoDaRodada, FONTE_DA_SALA } from "./simulador-embutido.js";
import { desenharResultado } from "./resultados-da-turma.js";
import { ROTULOS_DOS_TIPOS } from "./blocos.js";

const TERMOMETRO = [["entendi", "😀 Entendi"], ["mais-ou-menos", "😐 Mais ou menos"], ["perdido", "😵 Perdido"]];
const guardar = (chave, valor) => { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ } };
const ler = (chave) => { try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; } };
const formatarTempo = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const rotulo = (texto) => criar("p", { class: "aula-rotulo", texto });

/* devolve { aoMensagem, aoConexao }; `sessao` guarda { sala, desvio, participantes, resultados, conectado } */
export function iniciarVistaDoAluno(caixa, { sessao, socket, entrada, link }) {
  const el = {
    titulo: criar("h1", { class: "aula-titulo" }), estado: criar("p", { class: "aula-estado ao-vivo", texto: "Na sala" }),
    tempo: criar("p", { class: "aluno-tempo", hidden: true }), conexao: criar("div"), aviso: criar("div"), recusa: criar("p", { class: "aviso", hidden: true }),
    navegacao: criar("nav", { class: "aluno-navegacao", "aria-label": "Blocos liberados" }),
    bloco: criar("section", { class: "aluno-bloco" }), resultados: criar("section", { class: "aluno-resultados" }),
    sinais: criar("section", { class: "aluno-sinais", "aria-label": "Sinais para o professor" }), pausa: criar("div", { class: "sala-pausa", hidden: true }),
  };
  caixa.className = "container sala aluno";
  caixa.replaceChildren(
    criar("header", { class: "aula-topo aluno-topo" }, criar("div", { class: "aula-topo-texto" }, el.estado, el.titulo), el.tempo),
    el.conexao, el.recusa, el.aviso, el.navegacao, el.bloco, el.resultados, el.sinais, el.pausa);
  const chaveDoEnvio = (bloco) => `evoluteca:salas:envio:${link.sala}:${bloco}`;
  const local = { escolhido: null, avisoVisto: 0, mao: false, termometro: null, assinatura: null, iframe: null, pedindo: null, envioStatus: {} };
  const agora = () => Date.now() + sessao.desvio;

  const blocoDaVez = () => {
    const s = sessao.sala;
    if (!s) return null;
    const id = s.modo === "livre" && local.escolhido && s.blocos.some((b) => b.id === local.escolhido) ? local.escolhido : s.atual;
    return s.blocos.find((b) => b.id === id) ?? null;
  };

  /* ---- o bloco ---- */
  function enviar(bloco, conteudo, status) {
    if (!socket.enviar({ tipo: "envio", bloco: bloco.id, conteudo })) { status.textContent = "Sem conexão com a sala; tente de novo."; return; }
    local.envioStatus[bloco.id] = conteudo;
    status.textContent = "Enviando…";
  }

  function desenharPergunta(b, fechado) {
    const anterior = ler(chaveDoEnvio(b.id));
    const status = criar("p", { class: "aluno-status", role: "status", texto: fechado ? "As respostas deste bloco foram fechadas." : anterior ? "Você já respondeu; pode trocar a resposta." : "" });
    el.status = status;
    let ler_ = () => null;
    let controle;
    if (b.formato === "escolha") {
      let marcada = anterior?.opcao ?? null;
      controle = criar("div", { class: "aluno-escolhas" }, ...b.opcoes.map((texto, i) => {
        const r = criar("input", { type: "radio", name: `r-${b.id}`, disabled: fechado });
        r.checked = marcada === i;
        r.addEventListener("change", () => { marcada = i; });
        return criar("label", { class: "aluno-escolha" }, r, criar("span", { class: "aluno-letra", texto: String.fromCharCode(65 + i) }), criar("span", { texto }));
      }));
      ler_ = () => (marcada == null ? null : { opcao: marcada });
    } else if (b.formato === "numero") {
      controle = criar("input", { type: "number", step: "any", class: "sala-campo aluno-numero", disabled: fechado, placeholder: "Seu número" });
      if (anterior?.numero != null) controle.value = anterior.numero;
      ler_ = () => (controle.value !== "" && Number.isFinite(Number(controle.value)) ? { numero: Number(controle.value) } : null);
    } else {
      controle = criar("textarea", { rows: "4", maxlength: "2000", class: "sala-campo", disabled: fechado, placeholder: "Escreva a sua resposta" });
      controle.value = anterior?.texto ?? "";
      ler_ = () => (controle.value.trim() ? { texto: controle.value.trim() } : null);
    }
    const botao = criar("button", { type: "button", class: "botao botao-primario", texto: anterior ? "Trocar a resposta" : "Enviar resposta", disabled: fechado });
    botao.addEventListener("click", () => { const c = ler_(); if (!c) { status.textContent = "Responda antes de enviar."; return; } enviar(b, c, status); });
    return [criar("div", { class: "sala-texto aluno-enunciado", html: formatarTexto(b.enunciado) }), controle, criar("div", { class: "aluno-enviar" }, botao, status)];
  }

  function desenharSimulador(b, grupo) {
    const status = criar("p", { class: "aluno-status", role: "status" });
    el.status = status;
    const url = urlDoSimulador(b, { participante: entrada.participante, grupo });
    const iframe = criar("iframe", { class: "sala-simulador", src: url, title: b.titulo });
    local.iframe = iframe;
    const botao = criar("button", { type: "button", class: "botao botao-primario", texto: "Enviar minha rodada à turma" });
    botao.addEventListener("click", () => {
      if (!iframe.contentWindow) return;
      local.pedindo = { bloco: b, status };
      status.textContent = "Pedindo a rodada ao simulador…";
      iframe.contentWindow.postMessage({ fonte: FONTE_DA_SALA, tipo: "pedir-rodada" }, location.origin);
      setTimeout(() => { if (local.pedindo?.status === status) { local.pedindo = null; status.textContent = "O simulador não respondeu. Rode uma simulação e tente de novo."; } }, 4000);
    });
    return [
      grupo != null && b.variar ? criar("p", { class: "aluno-grupo", texto: `Você está no grupo ${grupo + 1}: ${b.variar.parametro} = ${b.variar.valores[grupo]}` }) : null,
      iframe, criar("div", { class: "aluno-enviar" }, botao, status),
    ].filter(Boolean);
  }

  function desenharBloco() {
    const s = sessao.sala, b = blocoDaVez();
    const grupo = b ? s.grupos[b.id]?.[entrada.participante] ?? null : null;
    const fechado = b ? s.fechados.includes(b.id) : false;
    const assinatura = JSON.stringify([b, fechado, grupo, s.encerrada]);
    if (assinatura === local.assinatura) return;
    local.assinatura = assinatura;
    local.iframe = null;
    el.bloco.className = `aluno-bloco${b ? ` aula-bloco aula-bloco-${b.tipo}` : ""}`;
    if (!b) {
      el.bloco.replaceChildren(criar("div", { class: "aula-palco-vazio" },
        criar("p", { class: "aula-palco-icone", texto: s.encerrada ? "✓" : "…" }),
        criar("h2", { texto: s.encerrada ? "A aula terminou" : "Aguarde um instante" }),
        criar("p", { texto: s.encerrada ? "Obrigado por participar." : "O professor ainda não abriu nenhum bloco. Ele vai aparecer aqui sozinho." })));
      return;
    }
    el.bloco.replaceChildren(
      rotulo(ROTULOS_DOS_TIPOS[b.tipo]),
      criar("h2", { class: "aula-bloco-titulo", texto: b.titulo }),
      ...(b.tipo === "texto" ? [criar("div", { class: "sala-texto", html: formatarTexto(b.texto) })] : b.tipo === "pergunta" ? desenharPergunta(b, fechado || s.encerrada) : desenharSimulador(b, grupo)),
    );
  }

  function desenharResultados() {
    const b = blocoDaVez(), s = sessao.sala;
    if (!b || !s.revelados.includes(b.id) || b.tipo === "texto") { el.resultados.replaceChildren(); el.resultados.hidden = true; return; }
    const corpo = criar("div");
    desenharResultado(corpo, b, sessao.resultados[b.id] ?? []);
    el.resultados.hidden = false;
    el.resultados.replaceChildren(rotulo("Resultado da turma"), corpo);
  }

  function desenharNavegacao() {
    const s = sessao.sala, b = blocoDaVez();
    if (!s || s.modo !== "livre") { el.navegacao.replaceChildren(); el.navegacao.hidden = true; return; }
    el.navegacao.hidden = false;
    el.navegacao.replaceChildren(...s.blocos.map((x, i) => {
      const botao = criar("button", { type: "button", class: `aluno-aba${x.id === b?.id ? " ativa" : ""}`, "aria-current": x.id === b?.id ? "true" : null },
        criar("span", { class: "aluno-aba-numero", texto: String(i + 1) }), criar("span", { texto: x.titulo }));
      botao.addEventListener("click", () => { local.escolhido = x.id; atualizar(); });
      return botao;
    }));
  }

  /* ---- o resto da tela ---- */
  function desenharSinais() {
    if (el.sinais.dataset.pronto) return;
    el.sinais.dataset.pronto = "1";
    const mao = criar("button", { type: "button", class: "ferramenta aluno-mao", texto: "✋ Levantar a mão", "aria-pressed": "false" });
    mao.addEventListener("click", () => {
      local.mao = !local.mao;
      mao.textContent = local.mao ? "✋ Mão levantada · baixar" : "✋ Levantar a mão";
      mao.classList.toggle("ativa", local.mao);
      mao.setAttribute("aria-pressed", String(local.mao));
      socket.enviar({ tipo: "mao", sim: local.mao });
    });
    const botoes = TERMOMETRO.map(([valor, texto]) => {
      const b = criar("button", { type: "button", class: "ferramenta", texto, "aria-pressed": "false" });
      b.addEventListener("click", () => {
        local.termometro = local.termometro === valor ? null : valor;
        TERMOMETRO.forEach(([v], i) => { botoes[i].classList.toggle("ativa", v === local.termometro); botoes[i].setAttribute("aria-pressed", String(v === local.termometro)); });
        socket.enviar({ tipo: "termometro", valor: local.termometro });
      });
      return b;
    });
    el.sinais.replaceChildren(
      criar("div", { class: "aluno-sinais-grupo" }, criar("span", { class: "aula-grupo-rotulo", texto: "Como você está?" }), criar("div", { class: "segmentado" }, ...botoes)),
      mao);
  }

  function desenharCabecalho() {
    const s = sessao.sala;
    el.titulo.replaceChildren(s?.titulo ?? "Sala", criar("span", { texto: "." }));
    if (s) document.title = `${s.titulo} · Evoluteca`;
    el.estado.textContent = s?.encerrada ? "Aula encerrada" : sessao.conectado ? `Na sala como ${entrada.nome ?? "aluno"}` : "Reconectando…";
    el.estado.className = `aula-estado${s?.encerrada ? " encerrada" : sessao.conectado ? " ao-vivo" : ""}`;
    el.conexao.replaceChildren(...(sessao.conectado ? [] : [criar("p", { class: "aviso", texto: "Sem conexão com a sala; tentando de novo…" })]));
    if (s?.aviso && s.aviso.em > local.avisoVisto) {
      local.avisoVisto = s.aviso.em;
      const fechar = criar("button", { type: "button", class: "ferramenta", texto: "Entendi" });
      fechar.addEventListener("click", () => el.aviso.replaceChildren());
      el.aviso.replaceChildren(criar("div", { class: "aluno-aviso", role: "status" },
        criar("div", {}, criar("p", { class: "aula-rotulo", texto: "Aviso do professor" }), criar("p", { class: "aluno-aviso-texto", texto: s.aviso.texto })), fechar));
    }
    el.pausa.hidden = !s?.pausada;
    if (s?.pausada) el.pausa.replaceChildren(criar("p", { class: "sala-pausa-icone", texto: "👀" }), criar("h2", { texto: "Olhe para o professor" }), criar("p", { class: "sala-tempo-grande", id: "tempo-da-pausa" }));
    el.sinais.hidden = !s || s.encerrada;
  }

  function contar() {
    const s = sessao.sala;
    const restante = s?.cronometro ? s.cronometro.ate - agora() : null;
    const texto = restante == null ? "" : restante > 0 ? formatarTempo(restante) : "Tempo!";
    el.tempo.hidden = restante == null;
    el.tempo.textContent = restante == null ? "" : `⏱ ${texto}`;
    el.tempo.classList.toggle("acabou", restante != null && restante <= 0);
    const g = el.pausa.querySelector("#tempo-da-pausa");
    if (g) g.textContent = restante == null ? "" : texto;
  }
  setInterval(contar, 500);

  function atualizar() {
    if (!sessao.sala) return;
    desenharCabecalho(); desenharNavegacao(); desenharBloco(); desenharResultados(); desenharSinais(); contar();
  }
  desenharCabecalho();

  /* só a rodada que vem do <iframe> do bloco, da nossa origem */
  window.addEventListener("message", (evento) => {
    if (!local.iframe || evento.source !== local.iframe.contentWindow || evento.origin !== location.origin) return;
    const b = blocoDaVez();
    const conteudo = b?.tipo === "simulador" ? conteudoDaRodada(b, evento.data) : null;
    if (!conteudo || !local.pedindo || local.pedindo.bloco.id !== b.id) return;
    const { status } = local.pedindo;
    local.pedindo = null;
    if (sessao.sala.fechados.includes(b.id)) { status.textContent = "As respostas deste bloco foram fechadas."; return; }
    enviar(b, conteudo, status);
  });

  return {
    aoConexao: () => { desenharCabecalho(); },
    aoMensagem(m) {
      if (m.tipo === "recusada") {
        el.recusa.hidden = false;
        el.recusa.textContent = `Não foi possível: ${m.motivo}`;
        setTimeout(() => { el.recusa.hidden = true; }, 6000);
        return;
      }
      if (m.tipo === "recebido") {
        if (local.envioStatus[m.bloco]) guardar(chaveDoEnvio(m.bloco), local.envioStatus[m.bloco]);
        if (blocoDaVez()?.id === m.bloco && el.status) el.status.textContent = "Enviado ✓ Você pode enviar de novo para trocar.";
        return;
      }
      if (m.tipo === "resultados") return desenharResultados();
      atualizar();
    },
  };
}
