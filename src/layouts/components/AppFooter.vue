<script setup lang="ts">
const year = new Date().getFullYear()

// PLACEHOLDER: as páginas institucionais ainda não existem (href="#").
const links = [
  { label: 'Privacidade', href: '#' },
  { label: 'Termos de Uso', href: '#' },
  { label: 'Segurança Open Finance', href: '#' },
]
</script>

<template>
  <footer class="border-t border-neutral-200 bg-white/60">
    <div
      class="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-xs text-neutral-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-[60px]"
    >
      <p>© {{ year }} Fimap Tecnologias Financeiras S.A. Todos os direitos reservados.</p>
      <ul class="flex flex-wrap gap-x-6 gap-y-2">
        <li v-for="link in links" :key="link.label">
          <a :href="link.href" class="hover:text-neutral-900 hover:underline">{{ link.label }}</a>
        </li>
      </ul>
    </div>
  </footer>
</template>
