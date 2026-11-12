<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useCardsStore } from '@/stores/cards.store'
import { useConnectionStore } from '@/stores/connection.store'
import CardStack from '../components/CardStack.vue'
import CardsErrorState from '../components/CardsErrorState.vue'
import type { Cartao } from '../types/cards.types'

const router = useRouter()
const auth = useAuthStore()
const connection = useConnectionStore()
const store = useCardsStore()

const carregando = computed(
  () => store.status === 'idle' || store.status === 'carregando' || store.status === 'sincronizando',
)
const titular = computed(() => auth.usuario?.nome ?? null)

async function carregar(forcar = false): Promise<void> {
  await connection.load()
  // Garante que enviamos um array de strings
  const ids = (Array.isArray(connection.itemIds) ? connection.itemIds : [connection.itemIds]).flat() as string[]
  return store.carregar(ids, { forcar })
}

onMounted(() => void carregar())

async function abrirCartao(cartao: Cartao): Promise<void> {
  // 1. marca o cartão clicado para receber o view-transition-name
  store.marcarTransicao(cartao.id)
  // 2. espera o DOM aplicar o nome ANTES do router iniciar a transição
  await nextTick()
  await router.push({ name: 'card-detail', params: { cartaoId: cartao.id } })
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-10 sm:px-[60px]">
    <h1 class="text-center text-[28px] font-semibold tracking-tight text-neutral-900">
      Selecione Um Cartão
    </h1>

    <div class="mt-28">
      <div v-if="carregando" class="mx-auto w-[min(470px,100%)]" aria-busy="true" aria-label="Carregando cartões">
        <div class="h-[250px] animate-pulse rounded-3xl bg-neutral-200" />
        <p v-if="store.status === 'sincronizando'" class="mt-4 text-center text-xs text-neutral-400" role="status">
          Sincronizando com o banco…
        </p>
      </div>

      <CardsErrorState
        v-else-if="store.status === 'erro'"
        :mensagem="store.erro"
        @tentar="carregar(true)"
      />

      <p v-else-if="store.cartoes.length === 0" class="py-16 text-center text-sm text-neutral-500">
        Nenhum cartão de crédito encontrado nesta conexão.
      </p>

      <CardStack
        v-else
        :cartoes="store.cartoes"
        :cartao-transicao-id="store.cartaoEmTransicaoId"
        :titular="titular"
        @select="abrirCartao"
      />
    </div>
  </main>
</template>
