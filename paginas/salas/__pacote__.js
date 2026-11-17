/* As salas de aula: o professor conecta a conta Cloudflare, guarda planos e abre
   salas (professor.html); professor e alunos entram pelo link (sala.html).
   O servidor está em servidor/; o desenho, em servidor/LEIAME.md e a aula
   (blocos, estado, mensagens), em servidor/AULA.md. */

export { montarProfessor } from "./montar-professor.js";
export { montarSala } from "./montar-sala.js";
export { formatarLink, lerLink } from "./link-da-sala.js";
export { criarBloco, validarBloco, validarBlocos } from "./blocos.js";
export { agregarBloco } from "./agregar.js";
export { exportarCsv } from "./exportar-csv.js";
export { formatarTexto } from "./texto-formatado.js";
