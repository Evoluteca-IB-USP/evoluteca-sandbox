/* O link da sala: https://<site>/sala.html#<host-do-worker>/<id-da-sala>/<convite>
   Tudo vai depois do `#`, que o navegador não manda ao servidor do site.
   Funções puras, sem DOM. */

const PADRAO_DO_HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/i;
const PADRAO_DA_SALA = /^[A-Z2-7]{10}$/;       // 10 caracteres base32
const PADRAO_DO_CONVITE = /^[A-Za-z0-9_-]{22}$/; // 16 bytes em base64url

export function formatarLink({ site, host, sala, convite }) {
  return `${site.replace(/\/+$/, "")}/sala.html#${host}/${sala}/${convite}`;
}

/* lê o fragmento (com ou sem o "#"); devolve { host, sala, convite } ou null se estiver mal formado */
export function lerLink(hash) {
  const partes = String(hash ?? "").replace(/^#/, "").split("/");
  if (partes.length !== 3) return null;
  const [host, sala, convite] = partes;
  if (!PADRAO_DO_HOST.test(host) || !PADRAO_DA_SALA.test(sala) || !PADRAO_DO_CONVITE.test(convite)) return null;
  return { host, sala, convite };
}
