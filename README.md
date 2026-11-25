# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Oportunidades da IA

A página `/recomendacoes` reúne todas as recomendações do usuário, atuais e antigas.
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

`npm run build` verifica TypeScript e gera os arquivos de produção.
