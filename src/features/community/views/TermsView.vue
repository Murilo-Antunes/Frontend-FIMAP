<script setup lang="ts">
import DocumentPage, { type SecaoDocumento } from '../components/DocumentPage.vue'

// ⚠️ ESTRUTURA PROVISÓRIA — não é texto jurídico revisado. Substitua pelo texto real
// dos Termos de Uso Social e remova `provisorio` abaixo.
const secoes: SecaoDocumento[] = [
  {
    titulo: 'Aceitação',
    paragrafos: ['Ao usar o Espaço Social Fimap, você concorda com estes termos e com as Diretrizes da Comunidade.'],
  },
  {
    titulo: 'Sua conta',
    paragrafos: ['Você é responsável pelas atividades feitas na sua conta e por manter seus dados de acesso em sigilo.'],
  },
  {
    titulo: 'Conteúdo publicado',
    paragrafos: [
      'Você é responsável pelo que publica. Ao publicar, permite que o conteúdo seja exibido na comunidade conforme a visibilidade do seu perfil.',
    ],
  },
  {
    titulo: 'Conduta',
    paragrafos: ['Condutas contrárias às Diretrizes da Comunidade podem levar à remoção de conteúdo ou à suspensão do acesso.'],
  },
  {
    titulo: 'Privacidade e dados',
    paragrafos: [
      'Seus dados bancários e financeiros não são exibidos na comunidade. Você controla a visibilidade do seu perfil nas configurações do Espaço Social.',
    ],
  },
  {
    titulo: 'Conteúdo não é recomendação',
    paragrafos: ['O que é publicado por outros membros não constitui recomendação de investimento.'],
  },
  {
    titulo: 'Alterações',
    paragrafos: ['Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas na plataforma.'],
  },
]
</script>

<template>
  <DocumentPage
    titulo="Termos de Uso Social"
    subtitulo="Regras de uso do Espaço Social Fimap."
    :secoes="secoes"
    provisorio
  />
</template>
