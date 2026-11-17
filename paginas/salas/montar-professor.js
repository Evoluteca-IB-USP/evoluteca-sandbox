/* A página do professor (professor.html). Sem conexão, manda para a porta da
   sala de aula (sala.html), onde se entra. Conectado: o painel, com
   as aulas programadas, as salas abertas e a conta. As vistas do painel vêm do
   fragmento: #aulas (padrão), #salas, #conta, #aula=<id> e #aula=nova. */

import { criar } from "escrever-html";
import { aproveitarFragmento, lerConexao, esquecerConexao, hostDaConexao } from "./conexao.js";
import { CHAVE_DO_AVISO, MENSAGENS_DE_ERRO } from "./entrada-da-sala.js";
import { formatarLink } from "./link-da-sala.js";
import { listarPlanos, lerPlano, gravarPlano, apagarPlano, criarSala, listarSalas, esquecerSala, lerConta, trocarSenha } from "./cliente-da-sala.js";
import { montarEditorDeLista } from "./editor-de-blocos.js";
import { validarBlocos, copiarBlocos, ROTULOS_DOS_TIPOS } from "./blocos.js";

const aviso = (texto) => criar("p", { class: "aviso", texto });
const novoId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);
const titulo = (texto) => criar("h1", { class: "prof-titulo", html: `${texto}<span>.</span>` });
const rotulo = (texto) => criar("p", { class: "prof-rotulo", texto });
const botao = (texto, aoClicar, classe = "botao botao-contorno botao-mini") => {
  const b = criar("button", { type: "button", class: classe, texto });
  b.addEventListener("click", aoClicar);
  return b;
};
const discreto = (texto, aoClicar) => botao(texto, aoClicar, "aula-discreto");
const campo = (texto, controle, dica) => criar("label", { class: "prof-campo" }, criar("span", { texto }), controle, dica ? criar("small", { texto: dica }) : null);

const DIA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
function quando(ms) {
  const d = new Date(ms), hoje = new Date();
  const dias = Math.round((new Date(hoje.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return `hoje, ${HORA.format(d)}`;
  if (dias === 1) return `ontem, ${HORA.format(d)}`;
  return DIA.format(d).replace(".", "");
}
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export function montarProfessor(raiz) {
  const falha = aproveitarFragmento();
  const guardado = falha?.erro ?? sessionStorage.getItem(CHAVE_DO_AVISO);
  const conexao = lerConexao();
  /* sem conexão, quem entra é a porta da sala de aula (sala.html), que mostra o erro */
  if (!conexao) {
    if (guardado) sessionStorage.setItem(CHAVE_DO_AVISO, guardado);
    location.replace("sala.html");
    return;
  }
  sessionStorage.removeItem(CHAVE_DO_AVISO);
  mostrarPainel(raiz, conexao, guardado && (MENSAGENS_DE_ERRO[guardado] ?? `Erro na conexão (${guardado}).`));
}

/* ---------- o painel ---------- */

function mostrarPainel(raiz, conexao, mensagem) {
  const dados = { planos: [], salas: [], conta: { temSenha: true }, carregado: false };
  const principal = criar("div", { class: "prof-principal" });
  const menu = criar("nav", { class: "prof-menu", "aria-label": "Painel do professor" });
  const sair = botao("Sair deste aparelho", () => { esquecerConexao(); location.hash = ""; location.reload(); }, "aula-discreto");
  raiz.replaceChildren(criar("div", { class: "container prof-painel" },
    criar("aside", { class: "prof-lateral" }, rotulo("Professor"), menu, criar("div", { class: "prof-lateral-pe" }, criar("small", { texto: hostDaConexao(conexao) }), sair)),
    principal));

  /* a sessão venceu ou a conexão foi trocada em outro aparelho: volta para o login */
  const tentar = async (fn, aoFalhar) => {
    try { return await fn(); } catch (e) {
      if (e.status === 401) { esquecerConexao(); sessionStorage.setItem(CHAVE_DO_AVISO, "sessao"); location.hash = ""; location.reload(); return undefined; }
      aoFalhar?.(e);
      return undefined;
    }
  };

  const carregar = async () => {
    const [planos, salas, conta] = await tentar(() => Promise.all([listarPlanos(conexao), listarSalas(conexao), lerConta(conexao)]),
      (e) => principal.replaceChildren(aviso(`Não foi possível falar com as suas salas (${e.message}). O Worker pode estar fora do ar.`))) ?? [];
    if (!planos) return;
    Object.assign(dados, { planos, salas, conta, carregado: true });
    desenhar();
  };

  const vista = () => {
    const [nome, valor] = location.hash.replace(/^#/, "").split("=");
    return ["aulas", "salas", "conta", "aula"].includes(nome) ? { nome, valor } : { nome: "aulas" };
  };

  function desenharMenu(atual) {
    const item = (nome, texto, n) => {
      const a = criar("a", { href: `#${nome}`, class: "prof-menu-item", "aria-current": atual === nome ? "page" : null }, criar("span", { texto }), n == null ? null : criar("span", { class: "prof-contador", texto: String(n) }));
      return a;
    };
    const abertas = dados.salas.filter((s) => !s.encerrada).length;
    menu.replaceChildren(item("aulas", "Aulas", dados.planos.length), item("salas", "Salas", abertas || null), item("conta", "Conta"));
  }

  function desenhar() {
    if (!dados.carregado) return;
    const v = vista();
    desenharMenu(v.nome === "aula" ? "aulas" : v.nome);
    const topo = [];
    if (mensagem) { topo.push(aviso(mensagem)); mensagem = null; }
    if (!dados.conta.temSenha && v.nome !== "conta") {
      topo.push(criar("div", { class: "prof-faixa" },
        criar("p", {}, criar("strong", { texto: "Crie uma senha " }), "para entrar no painel de outros aparelhos (o computador da escola, o celular)."),
        criar("a", { class: "botao botao-primario botao-mini", href: "#conta", texto: "Criar senha" })));
    }
    const corpo = { aulas: vistaDasAulas, salas: vistaDasSalas, conta: vistaDaConta, aula: vistaDoEditor }[v.nome](v.valor);
    principal.replaceChildren(...topo, corpo);
    window.scrollTo({ top: 0 });
  }

  /* ---- abrir uma sala (de uma aula ou vazia) e devolver o link ---- */
  const site = new URL(".", location.href).href;
  const linkDa = (sala) => formatarLink({ site, host: hostDaConexao(conexao), sala: sala.id, convite: sala.convite });
  async function abrirSala(tituloDaSala, plano) {
    const sala = await criarSala(conexao, { titulo: tituloDaSala, plano });
    if (plano) localStorage.setItem(`evoluteca:salas:origem:${sala.id}`, plano);
    return sala;
  }
  const copiar = (link) => {
    const b = botao("Copiar link", () => navigator.clipboard.writeText(link).then(() => { b.textContent = "Copiado ✓"; setTimeout(() => { b.textContent = "Copiar link"; }, 2000); }, () => { b.textContent = "Copie à mão"; }), "ferramenta");
    return b;
  };

  /* ---- Aulas ---- */
  function vistaDasAulas() {
    const caixa = criar("section");
    const dar = async (p, b) => {
      b.disabled = true;
      await tentar(async () => {
        const sala = await abrirSala(`${p.titulo} · ${DIA.format(new Date()).replace(".", "")}`, p.id);
        location.href = linkDa(sala);
      }, (e) => { b.disabled = false; caixa.prepend(aviso(`Não foi possível abrir a sala: ${e.message}`)); });
    };
    const duplicar = (p) => tentar(async () => {
      const plano = await lerPlano(conexao, p.id);
      await gravarPlano(conexao, novoId(), { titulo: `${plano.titulo} (cópia)`, blocos: copiarBlocos(plano.blocos ?? []) });
      await carregar();
    }, (e) => caixa.prepend(aviso(`Não foi possível duplicar: ${e.message}`)));
    const apagar = (p) => {
      if (!confirm(`Apagar a aula "${p.titulo}"? As salas já abertas com ela não mudam.`)) return;
      tentar(async () => { await apagarPlano(conexao, p.id); await carregar(); }, (e) => caixa.prepend(aviso(`Não foi possível apagar: ${e.message}`)));
    };

    const cartao = (p) => {
      const contagem = Object.entries(p.blocos ?? {}).filter(([, n]) => n > 0);
      const total = contagem.reduce((s, [, n]) => s + n, 0);
      const darBotao = botao("Dar aula", () => dar(p, darBotao), "botao botao-primario botao-mini");
      const mais = criar("details", { class: "prof-mais" },
        criar("summary", { title: "Mais ações", "aria-label": "Mais ações", texto: "⋯" }),
        criar("div", { class: "prof-mais-menu" }, discreto("Duplicar", () => duplicar(p)), botao("Apagar", () => apagar(p), "aula-discreto perigo")));
      return criar("article", { class: "prof-cartao prof-aula" },
        mais,
        criar("a", { class: "prof-aula-titulo", href: `#aula=${p.id}` }, criar("h3", { texto: p.titulo })),
        criar("p", { class: "prof-meta", texto: `${plural(total, "bloco", "blocos")} · alterada ${quando(p.alterado)}` }),
        criar("div", { class: "prof-chips" }, ...contagem.map(([tipo, n]) => criar("span", { class: `prof-chip prof-chip-${tipo}`, texto: `${n} ${ROTULOS_DOS_TIPOS[tipo].toLowerCase()}${n === 1 ? "" : tipo === "simulador" ? "es" : "s"}` }))),
        criar("div", { class: "prof-aula-acoes" },
          darBotao,
          criar("a", { class: "ferramenta", href: `#aula=${p.id}`, texto: "Editar" })));
    };

    caixa.append(
      criar("header", { class: "prof-cabeca" },
        criar("div", {}, rotulo(`Suas aulas · ${dados.planos.length}`), titulo("Aulas programadas")),
        criar("a", { class: "botao botao-primario", href: "#aula=nova", texto: "+ Nova aula" })),
      dados.planos.length
        ? criar("div", { class: "prof-grade" }, ...dados.planos.map(cartao))
        : criar("div", { class: "prof-vazio" },
            criar("h3", { texto: "Nenhuma aula programada ainda" }),
            criar("p", { texto: "Uma aula é uma lista de blocos: um texto para abrir a conversa, um simulador com os parâmetros que você escolhe, uma pergunta para a turma. Monte uma vez e reuse com outras turmas." }),
            criar("a", { class: "botao botao-primario", href: "#aula=nova", texto: "Programar a primeira aula" })));
    return caixa;
  }

  /* ---- Salas ---- */
  function vistaDasSalas(destacar) {
    const caixa = criar("section");
    const nome = criar("input", { type: "text", class: "sala-campo", placeholder: "Ex.: 2º B · Deriva genética", maxlength: "200" });
    const plano = criar("select", { class: "sala-campo" },
      criar("option", { value: "", texto: "Sala vazia (monto a aula lá dentro)" }),
      ...dados.planos.map((p) => criar("option", { value: p.id, texto: p.titulo })));
    const resultado = criar("div");
    const abrir = criar("button", { type: "submit", class: "botao botao-primario", texto: "Abrir sala" });
    const formulario = criar("form", { class: "prof-cartao prof-nova-sala" },
      criar("h2", { texto: "Abrir uma sala" }),
      criar("div", { class: "prof-linha" }, campo("Nome da sala", nome), campo("Aula de partida", plano), abrir),
      resultado);
    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (!nome.value.trim()) { resultado.replaceChildren(aviso("Dê um nome à sala.")); return; }
      abrir.disabled = true;
      tentar(async () => {
        const sala = await abrirSala(nome.value.trim(), plano.value || null);
        await carregar();
        location.hash = `salas=${sala.id}`;
      }, (e) => { abrir.disabled = false; resultado.replaceChildren(aviso(`Não foi possível abrir a sala: ${e.message}`)); });
    });

    const tirar = (s) => {
      if (!confirm(`Tirar "${s.titulo}" da lista? Os alunos que estão nela continuam até você encerrar.`)) return;
      tentar(async () => { await esquecerSala(conexao, s.id); await carregar(); }, (e) => caixa.append(aviso(`Não foi possível tirar da lista: ${e.message}`)));
    };
    const tituloDoPlano = (id) => dados.planos.find((p) => p.id === id)?.titulo;
    const linha = (s) => {
      const link = linkDa(s);
      const origem = s.plano && tituloDoPlano(s.plano);
      const alunos = s.alunos ? `${plural(s.alunos, "aluno", "alunos")}${s.online ? ` (${s.online} agora)` : ""}` : "nenhum aluno ainda";
      return criar("li", { class: `prof-sala${s.encerrada ? " encerrada" : ""}${s.id === destacar ? " nova" : ""}` },
        criar("span", { class: `prof-estado${s.online ? " ao-vivo" : ""}`, texto: s.encerrada ? "Encerrada" : s.online ? "Ao vivo" : "Aberta" }),
        criar("div", { class: "prof-sala-texto" },
          criar("strong", { texto: s.titulo }),
          criar("span", { class: "prof-meta", texto: [quando(s.criada), alunos, origem && `aula: ${origem}`].filter(Boolean).join(" · ") })),
        criar("div", { class: "prof-sala-acoes" },
          s.encerrada ? null : copiar(link),
          criar("a", { class: `botao ${s.encerrada ? "botao-contorno" : "botao-primario"} botao-mini`, href: link, texto: s.encerrada ? "Ver respostas" : "Entrar" }),
          botao("Tirar da lista", () => tirar(s), "aula-discreto perigo")));
    };

    const abertas = dados.salas.filter((s) => !s.encerrada);
    const encerradas = dados.salas.filter((s) => s.encerrada);
    caixa.append(
      criar("header", { class: "prof-cabeca" }, criar("div", {}, rotulo(`${plural(abertas.length, "aberta", "abertas")} · ${plural(encerradas.length, "encerrada", "encerradas")}`), titulo("Salas"))),
      formulario,
      dados.salas.length
        ? criar("div", {},
            abertas.length ? criar("ul", { class: "prof-salas" }, ...abertas.map(linha)) : null,
            encerradas.length ? criar("div", {}, criar("h2", { class: "prof-subtitulo", texto: "Encerradas" }), criar("ul", { class: "prof-salas" }, ...encerradas.map(linha))) : null)
        : criar("p", { class: "nota", texto: "Nenhuma sala ainda. Abra uma aqui, ou pelo botão \"Dar aula\" de uma aula programada." }));
    return caixa;
  }

  /* ---- Conta ---- */
  function vistaDaConta() {
    const host = hostDaConexao(conexao);
    const curto = host.match(/^evoluteca-salas\.([^.]+)\.workers\.dev$/)?.[1];
    const nova = criar("input", { type: "password", class: "sala-campo", autocomplete: "new-password", minlength: "8" });
    const repetir = criar("input", { type: "password", class: "sala-campo", autocomplete: "new-password" });
    const resultado = criar("div");
    const salvar = criar("button", { type: "submit", class: "botao botao-primario", texto: dados.conta.temSenha ? "Trocar senha" : "Criar senha" });
    const formulario = criar("form", { class: "prof-cartao" },
      criar("h2", { texto: dados.conta.temSenha ? "Trocar a senha" : "Criar uma senha" }),
      criar("p", { class: "nota", texto: "Com ela você entra no painel de qualquer aparelho. Fica no banco da sua conta Cloudflare só como hash: ninguém consegue lê-la de volta, nem você nem nós." }),
      campo("Nova senha", nova, "Pelo menos 8 caracteres."), campo("Repita a senha", repetir), resultado, salvar);
    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (nova.value.length < 8) { resultado.replaceChildren(aviso("A senha precisa de pelo menos 8 caracteres.")); return; }
      if (nova.value !== repetir.value) { resultado.replaceChildren(aviso("As duas senhas não são iguais.")); return; }
      salvar.disabled = true;
      tentar(async () => {
        await trocarSenha(conexao, nova.value);
        dados.conta.temSenha = true;
        nova.value = repetir.value = "";
        resultado.replaceChildren(criar("p", { class: "prof-ok", texto: "Senha guardada. Para entrar de outro aparelho, use o endereço acima e esta senha." }));
        salvar.disabled = false;
        salvar.textContent = "Trocar senha";
        desenharMenu("conta");
      }, (e) => { salvar.disabled = false; resultado.replaceChildren(aviso(`Não guardou: ${e.message}`)); });
    });

    return criar("section", {},
      criar("header", { class: "prof-cabeca" }, criar("div", {}, rotulo("Conta"), titulo("Sua conta"))),
      criar("div", { class: "prof-cartao" },
        criar("h2", { texto: "Endereço das suas salas" }),
        criar("p", { class: "prof-endereco", texto: curto ?? host }),
        criar("p", { class: "nota", texto: curto ? `É o que você digita para entrar de outro aparelho (o endereço inteiro é ${host}).` : "É o que você digita para entrar de outro aparelho." })),
      formulario,
      criar("div", { class: "prof-cartao" },
        criar("h2", { texto: "Este aparelho" }),
        criar("p", { class: "nota", texto: "Sair apaga o acesso guardado neste navegador. As aulas e as salas continuam na sua conta." }),
        botao("Sair deste aparelho", () => { esquecerConexao(); location.hash = ""; location.reload(); })));
  }

  /* ---- o editor de uma aula ---- */
  function vistaDoEditor(id) {
    const caixa = criar("section", { class: "prof-editor" }, criar("p", { class: "nota", texto: "Abrindo a aula…" }));
    const nova = !id || id === "nova";
    const montar = (plano) => {
      const nome = criar("input", { type: "text", class: "prof-titulo-campo", maxlength: "200", placeholder: "Título da aula", value: plano.titulo });
      const lista = montarEditorDeLista(plano.blocos ?? []);
      const mensagem = criar("p", { class: "prof-mensagem", role: "status" });
      const guardar = async (depois) => {
        const blocos = lista.blocos();
        const erros = validarBlocos(blocos);
        if (!nome.value.trim()) erros.unshift("dê um título à aula");
        if (erros.length) { mensagem.textContent = `Não salvou: ${erros.join("; ")}`; mensagem.classList.add("erro"); return; }
        const idFinal = nova ? novoId() : id;
        await tentar(async () => {
          await gravarPlano(conexao, idFinal, { titulo: nome.value.trim(), blocos });
          await carregar();
          depois(idFinal);
        }, (e) => { mensagem.textContent = `Não salvou: ${e.message}`; mensagem.classList.add("erro"); });
      };
      caixa.replaceChildren(
        criar("a", { class: "prof-voltar", href: "#aulas", texto: "← Aulas" }),
        rotulo(nova ? "Nova aula" : "Editando a aula"),
        nome,
        criar("p", { class: "nota", texto: "Uma aula é uma lista de blocos. Na sala você vai de um a outro na ordem que quiser e pode mudar qualquer bloco durante a aula." }),
        lista.elemento,
        criar("div", { class: "prof-barra-salvar" },
          mensagem,
          criar("a", { class: "botao botao-contorno botao-mini", href: "#aulas", texto: "Cancelar" }),
          botao("Salvar aula", () => guardar(() => { location.hash = "aulas"; }), "botao botao-primario botao-mini")));
      requestAnimationFrame(() => { if (!nome.value) nome.focus(); });
    };
    if (nova) montar({ titulo: "", blocos: [] });
    else tentar(async () => montar(await lerPlano(conexao, id)), (e) => caixa.replaceChildren(aviso(`Não foi possível abrir a aula: ${e.message}`), criar("a", { href: "#aulas", texto: "← Aulas" })));
    return caixa;
  }

  window.addEventListener("hashchange", desenhar);
  principal.append(criar("p", { class: "nota", texto: "Carregando o painel…" }));
  carregar();
}
