/* A conexão do professor com o Worker dele: { endereco, segredo }, guardada no
   localStorage. A API devolve isso no fragmento da página (#conectado=…) ou
   avisa o erro (#erro=<codigo>). Em outro aparelho, o professor entra com o
   endereço e a senha, e o `segredo` é a sessão que o login devolve. */

const CHAVE = "evoluteca:salas:conexao";
const CHAVE_DO_ENDERECO = "evoluteca:salas:endereco"; // fica depois de sair, para o próximo login

export function lerConexao() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    return dados && typeof dados.endereco === "string" && typeof dados.segredo === "string" ? dados : null;
  } catch {
    return null;
  }
}

export function guardarConexao(conexao) {
  localStorage.setItem(CHAVE, JSON.stringify(conexao));
  localStorage.setItem(CHAVE_DO_ENDERECO, hostDaConexao(conexao));
}
export const esquecerConexao = () => localStorage.removeItem(CHAVE);
export const enderecoLembrado = () => localStorage.getItem(CHAVE_DO_ENDERECO) ?? "";

/* o que o professor digita no login: o endereço inteiro, só o host ou só o
   subdomínio da conta (fulano → evoluteca-salas.fulano.workers.dev).
   localhost é o Worker do `npx wrangler dev`, sem https. Devolve a URL ou null. */
export function normalizarEndereco(texto) {
  let host = String(texto ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  if (!host) return null;
  if (!host.includes(".") && !host.startsWith("localhost")) host = `evoluteca-salas.${host}.workers.dev`;
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  try { return new URL(`${local ? "http" : "https"}://${host}`).origin; } catch { return null; }
}

/* o host do Worker (sem o https://), como vai no link da sala */
export const hostDaConexao = (conexao) => new URL(conexao.endereco).host;

function decodificar(texto) {
  const padrao = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padrao + "=".repeat((4 - (padrao.length % 4)) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

/* lê o fragmento da página: guarda a conexão que chegou e limpa o fragmento.
   Devolve { erro } se a API avisou um erro, senão null. */
export function aproveitarFragmento() {
  const fragmento = new URLSearchParams(location.hash.replace(/^#/, ""));
  const conectado = fragmento.get("conectado");
  const erro = fragmento.get("erro");
  if (!conectado && !erro) return null;
  history.replaceState(null, "", location.pathname + location.search);
  if (erro) return { erro };
  try {
    const { endereco, segredo } = decodificar(conectado);
    new URL(endereco);
    guardarConexao({ endereco, segredo });
    return null;
  } catch {
    return { erro: "resposta_invalida" };
  }
}
