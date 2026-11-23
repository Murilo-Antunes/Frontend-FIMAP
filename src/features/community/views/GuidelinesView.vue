<script setup lang="ts">
import DocumentPage, { type SecaoDocumento } from '../components/DocumentPage.vue'

// Rascunho baseado no resumo da tela de configurações ("Respeito mútuo, sigilo estrito
// de senhas e dados confidenciais"). Revise o conteúdo e remova `provisorio` abaixo.
const secoes: SecaoDocumento[] = [
  {
    titulo: 'Respeito mútuo',
    paragrafos: [
      'Trate os outros investidores com cordialidade. Discordar de uma estratégia é bem-vindo; atacar a pessoa, não.',
      'Não são permitidos ofensas, discriminação, assédio ou ameaças.',
    ],
  },
  {
    titulo: 'Sigilo de senhas e dados confidenciais',
    paragrafos: [
      'Nunca publique senhas, códigos de verificação, dados de cartão, números de conta ou documentos pessoais em posts, comentários ou conversas.',
      'Desconfie de quem pedir esses dados, mesmo dizendo representar o Fimap.',
    ],
  },
  {
    titulo: 'Conteúdo financeiro responsável',
    paragrafos: [
      'Compartilhe estratégias como experiência pessoal, sem prometer retornos garantidos nem pressionar ninguém a investir.',
      'O conteúdo da comunidade não substitui orientação profissional.',
    ],
  },
  {
    titulo: 'Sem spam ou golpes',
    paragrafos: [
      'Não divulgue ofertas suspeitas, esquemas de pirâmide, links duvidosos nem faça autopromoção repetitiva.',
    ],
  },
  {
    titulo: 'Denúncias e moderação',
    paragrafos: [
      'Qualquer membro pode denunciar uma publicação. Publicações que recebem muitas denúncias são ocultadas automaticamente.',
    ],
  },
  {
    titulo: 'Privacidade e bloqueios',
    paragrafos: [
      'Você escolhe quem vê seu perfil e pode bloquear qualquer usuário a qualquer momento, nas configurações do Espaço Social.',
    ],
  },
]
</script>

<template>
  <DocumentPage
    titulo="Diretrizes da Comunidade Fimap"
    subtitulo="Respeito mútuo, sigilo estrito de senhas e dados confidenciais."
    :secoes="secoes"
    provisorio
  />
</template>
