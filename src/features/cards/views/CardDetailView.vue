<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useCardsStore } from '@/stores/cards.store'
import { useConnectionStore } from '@/stores/connection.store'
import CardCategorySpending from '../components/CardCategorySpending.vue'
import CardFace from '../components/CardFace.vue'
import CardInvoiceSummary from '../components/CardInvoiceSummary.vue'
import CardsErrorState from '../components/CardsErrorState.vue'
import CardTransactionHistory from '../components/CardTransactionHistory.vue'
import { useCardDetail } from '../composables/useCardDetail'

const props = defineProps<{ cartaoId: string }>()

const router = useRouter()
const auth = useAuthStore()
const connection = useConnectionStore()
const store = useCardsStore()

const { fatura, categorias, transacoes, recarregar } = useCardDetail(() => props.cartaoId)

const cartao = computed(() => store.getById(props.cartaoId))
const carregandoLista = computed(
  () => store.status === 'idle' || store.status === 'carregando' || store.status === 'sincronizando',
)
const titular = computed(() => auth.usuario?.nome ?? null)

function abrirCartao(id: string): void {
  if (id === props.cartaoId) return
  void router.replace({ name: 'card-detail', params: { cartaoId: id } })
}

function verExtrato(): void {
  void router.push({ name: 'card-statement', params: { cartaoId: props.cartaoId } })
}

async function tentarNovamente(): Promise<void> {
  await store.carregar(await connection.requireItemId(), { forcar: true })
}

onMounted(async () => {
  await store.carregar(await connection.requireItemId())
})

// Mantém o cartão marcado para que o "voltar" anime de volta até ele na carteira.
watch(
  () => props.cartaoId,
  (id) => store.marcarTransicao(id),
  { immediate: true },
)
</script>

<template>
  <main class="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-10 sm:px-[60px]">
    <header>
      <h1 class="text-[28px] font-semibold tracking-tight text-neutral-900">Cartão</h1>
      <p class="mt-1 text-sm text-neutral-500">Visualize as principais informações sobre seu cartão</p>
    </header>

    <div v-if="!cartao && carregandoLista" class="mt-8 animate-pulse" aria-busy="true">
      <div class="h-[250px] w-full max-w-[470px] rounded-3xl bg-neutral-200" />
    </div>

    <div v-else-if="!cartao" class="mt-8">
      <CardsErrorState
        :mensagem="store.erro ?? 'Cartão não encontrado.'"
        @tentar="tentarNovamente"
      />
      <p class="text-center">
        <button
          type="button"
          class="text-xs font-medium text-neutral-900 underline"
          @click="router.push({ name: 'cards' })"
        >
          Voltar para seus cartões
        </button>
      </p>
    </div>

    <div v-else class="mt-8 grid gap-6 lg:grid-cols-[470px_minmax(0,1fr)] lg:items-start">
      <div class="flex min-w-0 flex-col gap-6">
        <div
          v-if="store.cartoes.length > 1"
          class="flex flex-wrap gap-2"
          role="group"
          aria-label="Seus cartões"
        >
          <button
            v-for="c in store.cartoes"
            :key="c.id"
            type="button"
            class="rounded-full border px-3 py-1 text-xs transition"
            :class="
              c.id === cartaoId
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
            "
            :aria-pressed="c.id === cartaoId"
            @click="abrirCartao(c.id)"
          >
            {{ c.nome }}{{ c.finalNumero ? ` · ${c.finalNumero}` : '' }}
          </button>
        </div>

        <Transition name="card-swap" mode="out-in">
          <CardFace
            :key="cartao.id"
            :cartao="cartao"
            :titular="titular"
            :style="{ viewTransitionName: 'cartao-ativo' }"
          />
        </Transition>

        <CardInvoiceSummary
          :fatura="fatura.dados.value"
          :status="fatura.status.value"
          :erro="fatura.erro.value"
          @tentar="recarregar"
        />
      </div>

      <div class="flex min-w-0 flex-col gap-6">
        <CardCategorySpending
          :categorias="categorias.dados.value"
          :status="categorias.status.value"
          :erro="categorias.erro.value"
          @tentar="recarregar"
        />
        <CardTransactionHistory
          :transacoes="transacoes.dados.value"
          :status="transacoes.status.value"
          :erro="transacoes.erro.value"
          @tentar="recarregar"
          @ver-extrato="verExtrato"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.card-swap-enter-active,
.card-swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-swap-enter-from,
.card-swap-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .card-swap-enter-active,
  .card-swap-leave-active {
    transition: none;
  }
}
</style>
