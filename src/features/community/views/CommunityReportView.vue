<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { isCancel } from 'axios'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Loader2, PenLine, RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { reportService } from '../services/report.service'
import type { CategoriaDenuncia, ReportTarget } from '../types/community.types'
import { ui } from '../ui'

const TITLE_MAX = 100

const props = defineProps<{ tipo: ReportTarget['tipo']; id: number }>()

const auth = useAuthStore()
const router = useRouter()

const target = computed<ReportTarget>(() => ({ tipo: props.tipo, id: props.id }))

const categories = ref<CategoriaDenuncia[]>([])
const categoriesStatus = ref<'loading' | 'ready' | 'error'>('loading')
const categoriesError = ref('')
const categoryId = ref<number | null>(null)

const titulo = ref('')
const descricao = ref('')
const sending = ref(false)
const sent = ref(false)
const submitError = ref('')
const touched = ref(false)

const controller = new AbortController()

const canSubmit = computed(
  () =>
    categoryId.value !== null && titulo.value.trim().length > 0 && descricao.value.trim().length > 0 && !sending.value,
)

const subjectLabel = computed(() => (props.tipo === 'post' ? 'post' : 'perfil'))

async function loadCategories(): Promise<void> {
  categoriesStatus.value = 'loading'
  categoriesError.value = ''
  try {
    categories.value = await reportService.listCategories(controller.signal)
    categoryId.value = categories.value[0]?.id ?? null
    categoriesStatus.value = 'ready'
  } catch (error) {
    if (isCancel(error)) return
    categoriesError.value = toApiError(error).mensagem
    categoriesStatus.value = 'error'
  }
}

async function submit(): Promise<void> {
  touched.value = true
  if (!canSubmit.value || categoryId.value === null) return

  sending.value = true
  submitError.value = ''
  try {
    await reportService.create(target.value, auth.usuario?.id??0, {
      idCategoria: categoryId.value,
      titulo: titulo.value,
      descricao: descricao.value,
    })
    sent.value = true
  } catch (error) {
    submitError.value = toApiError(error).mensagem
  } finally {
    sending.value = false
  }
}

function goBack(): void {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'community' })
}

void loadCategories()
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <div :class="ui.page">
    <section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header class="mb-8">
        <h1 class="text-lg font-semibold text-neutral-900">Relatar um problema</h1>
        <p class="mt-1 text-[11px] text-neutral-400">Faça uma denúncia de um post ou perfil</p>
      </header>

      <!-- Enviada -->
      <div v-if="sent" role="status" :class="[ui.card, 'mx-auto max-w-lg p-10 text-center']">
        <CheckCircle2 class="mx-auto size-8 text-neutral-900" aria-hidden="true" />
        <p class="mt-3 text-base font-semibold text-neutral-900">Denúncia enviada</p>
        <p class="mt-1 text-sm text-neutral-500">
          Obrigado por avisar. Vamos analisar este {{ subjectLabel }}.
        </p>
        <RouterLink :to="{ name: 'community' }" :class="[ui.btnBlack, 'mt-6']">Voltar à comunidade</RouterLink>
      </div>

      <!-- Categorias com erro -->
      <div v-else-if="categoriesStatus === 'error'" role="alert" :class="[ui.card, 'mx-auto max-w-lg p-8 text-center']">
        <AlertCircle class="mx-auto size-6 text-red-500" aria-hidden="true" />
        <p class="mt-2 text-sm font-medium text-neutral-900">Não foi possível carregar as categorias.</p>
        <p class="mt-1 text-sm text-neutral-500">{{ categoriesError }}</p>
        <button type="button" :class="[ui.btnBlack, 'mt-4']" @click="loadCategories">
          <RefreshCw class="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>

      <div v-else class="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <!-- Categorias -->
        <nav aria-label="Categorias de denúncia">
          <div v-if="categoriesStatus === 'loading'" class="space-y-2 animate-pulse" aria-busy="true" aria-label="Carregando categorias">
            <div v-for="n in 5" :key="n" class="h-12 rounded-xl bg-[#eeeeee]" />
          </div>

          <ul v-else class="space-y-2">
            <li v-for="category in categories" :key="category.id">
              <button
                type="button"
                :aria-pressed="categoryId === category.id"
                class="flex h-12 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm font-medium text-neutral-900 outline-none transition focus-visible:ring-2 focus-visible:ring-black/30"
                :class="
                  categoryId === category.id
                    ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_22px_rgba(0,0,0,0.05)]'
                    : 'hover:bg-white/60'
                "
                @click="categoryId = category.id"
              >
                {{ category.nome }}
                <ChevronDown v-if="categoryId === category.id" class="size-4 text-neutral-600" aria-hidden="true" />
                <ChevronRight v-else class="size-4 text-neutral-500" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>

        <!-- Formulário -->
        <form novalidate @submit.prevent="submit">
          <div :class="[ui.card, 'space-y-5 rounded-2xl p-6']">
            <div>
              <label for="report-title" class="mb-2 block text-sm text-neutral-900">Título da denúncia</label>
              <div class="relative">
                <PenLine class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  id="report-title"
                  v-model="titulo"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :disabled="sending"
                  autocomplete="off"
                  class="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 disabled:opacity-60"
                  :aria-invalid="touched && !titulo.trim()"
                />
              </div>
              <p v-if="touched && !titulo.trim()" class="mt-1 text-xs text-red-600">Informe um título.</p>
            </div>

            <div>
              <label for="report-description" class="mb-2 block text-sm text-neutral-900">Descrição da denúncia</label>
              <textarea
                id="report-description"
                v-model="descricao"
                :disabled="sending"
                rows="8"
                class="min-h-[220px] w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 disabled:opacity-60"
                :aria-invalid="touched && !descricao.trim()"
              />
              <p v-if="touched && !descricao.trim()" class="mt-1 text-xs text-red-600">Descreva o que aconteceu.</p>
            </div>
          </div>

          <p v-if="submitError" role="alert" class="mt-4 text-sm text-red-600">{{ submitError }}</p>

          <button
            type="submit"
            :disabled="sending || categoryId === null"
            class="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white outline-none transition hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <Loader2 v-if="sending" class="size-4 animate-spin" aria-hidden="true" />
            Enviar
          </button>
          <button type="button" class="mx-auto mt-3 block text-xs text-neutral-500 hover:text-neutral-900" @click="goBack">
            Cancelar
          </button>
        </form>
      </div>
    </section>
  </div>
</template>
