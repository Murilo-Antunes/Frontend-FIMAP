# Chat IA

Feature Vue organizada em views, composables, schemas, services e types. A rota `/chat-ia` usa o MainLayout e exige autenticação, sem exigir banco conectado. Histórico e mensagens ficam apenas na memória da view, são limpos ao trocar de usuário e as requisições são canceladas ao sair.

Com `npm run dev`, `/preview/chat-ia` permite visualizar a tela sem login. Essa rota não existe em produção. Sem autenticação, não são carregadas conversas nem enviadas perguntas.

## Integração existente

Base `/v1/ia/chat`, Bearer token do login, injetado pelo cliente HTTP compartilhado:

O login guarda o `access_token` em memória. O cliente HTTP compartilhado usa esse token nas chamadas protegidas, e o logout limpa a sessão.

- `GET /listar-chats`: `{ sucesso, mensagem, conteudo: [{ id, nome, data_criacao }] }`. A API filtra pelo usuário autenticado.
- `POST /iniciar-chat`: `{ nome }` → `{ sucesso, mensagem, id, nome }`. Só chamado no primeiro envio, nunca ao abrir a página ou criar uma conta.
- `GET /listar-chat/:id`: metadados em `conteudo`.
- `POST /mensagens`: `{ id_chat, pergunta, requisicao_id }`. SSE `trecho` (conteudo), `fim` (após persistir) e `erro` (mensagem/codigo). Timeout de 130 segundos apenas nesse endpoint. Texto renderizado por interpolação Vue, sem HTML do modelo.

## Histórico no backend

A branch `minhas-alteracoes` do backend (`Back-end-FIMAP-NovoP`), revisão `be0997c`, expõe a rota que o frontend utiliza:

`GET /v1/ia/chat/listar-chat/:id_chat/mensagens`

Resposta: `{ sucesso: true, mensagem: string, conteudo: [{ id: number, conteudo: string, papel: 0 | 1, data_envio: string }] }`, em ordem cronológica, papel 0 para usuário e 1 para IA. A rota deve autenticar o token e verificar que o chat pertence a `req.usuario.id` antes de consultar o DAO. Nunca confiar em ID de usuário enviado pelo cliente. O middleware existente já verifica o dono nos caminhos `/listar-chat/:id/...`.

Em versões do backend sem essa rota, conversas desta visita permanecem disponíveis na memória. Abrir uma conversa antiga mostra a indisponibilidade do histórico e bloqueia o envio nesse chat. Falha de listagem também não aparece como histórico vazio. Após erro ou interrupção do streaming, consulte o histórico antes de reenviar: não há repetição automática que possa duplicar uma pergunta já persistida.

Sem conversas de demonstração, armazenamento local ou criação antecipada de chats. Contas novas recebem o estado vazio quando a API retorna `conteudo: []`.
