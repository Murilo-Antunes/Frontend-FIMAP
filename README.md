# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Oportunidades da IA

A página `/recomendacoes` reúne todas as recomendações do usuário, atuais e antigas.
A rotina do back-end analisa a visão financeira do FIMAP a cada 10 minutos por padrão. A página consulta os cartões salvos ao abrir e enquanto está visível.
A página mostra o histórico do mais novo ao mais antigo. O back-end salva outra orientação geral quando mudam os dados do resumo ou a própria orientação. O horário no cartão indica quando ele foi gerado.
Os cartões aparecem somente nessa página, com tipo e prévia de até 180 caracteres.
Clicar ou pressionar Enter no cartão abre a mensagem completa em um diálogo acessível.
Não existem botões de ação dentro dos cartões.

Configure somente a URL pública do back-end em `.env`:

```dotenv
VITE_API_URL=http://localhost:8080
```

Reinicie o back-end FimapBack-F com a nova rota `GET /v1/ia/recomendacoes` carregada,
execute `npm run dev`, faça login e abra a opção Recomendações.
O front envia o JWT da sessão; credenciais Pluggy e o token do Worker ficam no back-end.

A API fornece lista paginada, filtros por tipo e contagens reais. O texto completo é preservado;
o limite de 180 caracteres afeta somente a prévia. Os registros não desaparecem da lista
quando o destaque expira. A atualização automática ocorre a cada minuto na primeira página
visível; ao carregar páginas antigas, a navegação da lista é preservada.
Em desenvolvimento, o botão **Testar orientação geral** gera um cartão temporário com dados simulados.

`npm run build` verifica TypeScript e gera os arquivos de produção.

## Sessão ao atualizar a página

Inicie o FimapBack-F com `/v1/openfinance/usuario/sessao` e entre novamente para iniciar a sessão com cookie. No ambiente local, abra o frontend e a API com o mesmo hostname, por exemplo `localhost` nas duas URLs.

Em produção, sirva o frontend e a API por HTTPS no mesmo site e configure `BROWSER_SESSION_ORIGINS` no back-end com as origens exatas do frontend, separadas por vírgula. A sessão usa a validade do JWT configurada em `JWT_EXPIRATION`.
