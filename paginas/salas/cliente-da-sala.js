/* Fala com o Worker da sala: as rotas HTTP e o WebSocket (com reconexão simples).
   Rotas: servidor/LEIAME.md; mensagens: servidor/AULA.md. `conexao` é { endereco, segredo }. */

async function pedir(endereco, caminho, { metodo = "GET", segredo, corpo } = {}) {
  const cabecalhos = {};
  if (segredo) cabecalhos.Authorization = `Bearer ${segredo}`;
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  const resposta = await fetch(`${endereco}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (!resposta.ok) throw Object.assign(new Error(dados?.erro ?? `erro ${resposta.status}`), { status: resposta.status });
  return dados;
}

export const obterVersao = (endereco) => pedir(endereco, "/versao");

export const listarPlanos = (c) => pedir(c.endereco, "/acervo", { segredo: c.segredo });
export const lerPlano = (c, id) => pedir(c.endereco, `/acervo/${id}`, { segredo: c.segredo });
export const gravarPlano = (c, id, plano) => pedir(c.endereco, `/acervo/${id}`, { metodo: "PUT", segredo: c.segredo, corpo: plano });
export const apagarPlano = (c, id) => pedir(c.endereco, `/acervo/${id}`, { metodo: "DELETE", segredo: c.segredo });

export const criarSala = (c, { titulo, plano }) => pedir(c.endereco, "/salas", { metodo: "POST", segredo: c.segredo, corpo: { titulo, plano } });
export const listarSalas = (c) => pedir(c.endereco, "/salas", { segredo: c.segredo });
export const esquecerSala = (c, id) => pedir(c.endereco, `/salas/${id}`, { metodo: "DELETE", segredo: c.segredo });

/* a conta: o login por senha devolve { sessao }, que serve no lugar do segredo por 30 dias */
export const entrarComSenha = (endereco, senha) => pedir(endereco, "/conta/entrar", { metodo: "POST", corpo: { senha } });
export const lerConta = (c) => pedir(c.endereco, "/conta", { segredo: c.segredo });
export const trocarSenha = (c, senha) => pedir(c.endereco, "/conta/senha", { metodo: "PUT", segredo: c.segredo, corpo: { senha } });

/* devolve { bilhete, papel, participante }; o professor passa o segredo em vez do convite */
export const entrarNaSala = ({ endereco, sala, convite, nome, segredo, participante }) =>
  pedir(endereco, `/salas/${sala}/entrar`, { metodo: "POST", segredo, corpo: { convite, nome, participante } });

/* abre o WebSocket e o reabre se cair, até `fechar()`.
   Devolve { enviar(mensagem), aoReceber(fn), aoMudar(fn), fechar() }; `aoMudar` recebe true/false (conectado). */
export function abrirSocket({ endereco, sala, bilhete }) {
  const url = `${endereco.replace(/^http/, "ws")}/salas/${sala}/ws?bilhete=${encodeURIComponent(bilhete)}`;
  const ouvintes = { mensagem: [], conexao: [] };
  let socket = null;
  let tentativas = 0;
  let fechado = false;
  let espera = null;

  const avisarConexao = (estado) => ouvintes.conexao.forEach((fn) => fn(estado));

  function conectar() {
    socket = new WebSocket(url);
    socket.addEventListener("open", () => { tentativas = 0; avisarConexao(true); });
    socket.addEventListener("message", (evento) => {
      let mensagem;
      try { mensagem = JSON.parse(evento.data); } catch { return; }
      ouvintes.mensagem.forEach((fn) => fn(mensagem));
    });
    socket.addEventListener("close", () => {
      avisarConexao(false);
      if (fechado) return;
      // PENDENTE: com o bilhete vencido (12 h) a reconexão falha para sempre; pedir um bilhete novo
      espera = setTimeout(conectar, Math.min(1000 * 2 ** tentativas++, 10000));
    });
  }
  conectar();

  return {
    enviar(mensagem) {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(mensagem));
      return true;
    },
    aoReceber: (fn) => ouvintes.mensagem.push(fn),
    aoMudar: (fn) => ouvintes.conexao.push(fn),
    fechar() {
      fechado = true;
      clearTimeout(espera);
      socket?.close();
    },
  };
}
