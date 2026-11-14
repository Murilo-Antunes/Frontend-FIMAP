<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { metasService } from '../services/metas.service'
import { categoriasService } from '../services/categorias.service'
import { contasRendimentoService } from '../services/contas-rendimento.service'
import type { CategoriaMeta, ContaRendimento } from '../types/metas.types'
import { metaFormSchema, CATEGORIA_NOVA } from '../schemas/metas.schemas'
import { monthInputParaData } from '../utils/metas.utils'
import { calcularProjecaoIA } from '../composables/useProjecaoIA'
import SeletorCategoria from '../components/SeletorCategoria.vue'
import SeletorContaRendimento from '../components/SeletorContaRendimento.vue'
import CardProjecaoCriacao from '../components/CardProjecaoCriacao.vue'

const router = useRouter()
const authStore = useAuthStore()

const categorias = ref<CategoriaMeta[]>([])
const contas = ref<ContaRendimento[]>([])

// Campos do formulário
const categoriaId = ref<number | typeof CATEGORIA_NOVA | null>(null)
const categoriaPersonalizadaNome = ref('')
const nomeObjetivo = ref('')
const descricao = ref('')
const valorInicio = ref<number>(0)
const dataAlvo = ref('') // "YYYY-MM"
const aporteMensal = ref<number>(0)
const valorDesejado = ref<number>(0)
const idContaVinculada = ref<number | null>(null)

const erros = ref<Record<string, string>>({})
const enviando = ref(false)
const erroGeral = ref<string | null>(null)

const projecao = computed(() =>
  calcularProjecaoIA({
    valorAtual: valorInicio.value,
    valorDesejado: valorDesejado.value,
    aporteMensal: aporteMensal.value,
    percentualCdi: contas.value.find((c) => c.id === idContaVinculada.value)?.percentualCdi,
  }),
)

onMounted(async () => {
  const idUsuario = authStore.usuario?.id
  const [categoriasApi, contasApi] = await Promise.all([
    categoriasService.listar(idUsuario??0),
    contasRendimentoService.listar(idUsuario??0),
  ])
  categorias.value = categoriasApi
  contas.value = contasApi
  if (contasApi.length > 0) idContaVinculada.value = contasApi[0].id
})

function adicionarValor(valor: number) {
  valorDesejado.value = Number(valorDesejado.value) + valor
}

async function confirmar() {
  erroGeral.value = null
  erros.value = {}

  const resultado = metaFormSchema.safeParse({
    categoriaId: categoriaId.value,
    categoriaPersonalizadaNome: categoriaPersonalizadaNome.value,
    nomeObjetivo: nomeObjetivo.value,
    descricao: descricao.value,
    valorInicio: valorInicio.value,
    dataAlvo: dataAlvo.value,
    aporteMensal: aporteMensal.value,
    valorDesejado: valorDesejado.value,
    idContaVinculada: idContaVinculada.value,
  })

  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      erros.value[String(issue.path[0])] = issue.message
    }
    return
  }

  enviando.value = true
  try {
    const idUsuario = authStore.usuario?.id

    let idCategoriaFinal = resultado.data.categoriaId
    if (idCategoriaFinal === CATEGORIA_NOVA) {
      idCategoriaFinal = await categoriasService.criar(idUsuario??0, {
        nome: resultado.data.categoriaPersonalizadaNome!,
      })
    }

    await metasService.criar(idUsuario??0, {
      nome: resultado.data.nomeObjetivo,
      descricao: resultado.data.descricao || undefined,
      valor_inicio: resultado.data.valorInicio,
      valor_desejado: resultado.data.valorDesejado,
      valor_total: resultado.data.valorInicio, // ao criar, acumulado = valor já economizado
      aporte_mensal: resultado.data.aporteMensal,
      data_alvo: monthInputParaData(resultado.data.dataAlvo).toISOString(),
      status: 1,
      id_categoria: idCategoriaFinal as number,
      id_conta_vinculada: resultado.data.idContaVinculada ?? null,
    })

    router.push({ name: 'metas' })
  } catch (e) {
    erroGeral.value = 'Não foi possível criar a meta agora. Tente novamente.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-8">
    <h1 class="text-2xl font-semibold text-gray-900">Criar Nova Meta</h1>
    <p class="text-sm text-gray-400">Defina seus objetivos e deixe a IA calcular o melhor plano de rentabilidade e prazos.</p>

    <div class="mt-6">
      <SeletorCategoria v-model="categoriaId" :categorias="categorias" />
      <p v-if="erros.categoriaId" class="mt-1 text-xs text-red-500">{{ erros.categoriaId }}</p>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-6">
        <div v-if="categoriaId === CATEGORIA_NOVA">
          <label class="text-sm font-medium text-gray-700">Nome da Categoria</label>
          <input
            v-model="categoriaPersonalizadaNome"
            type="text"
            placeholder="Ex.: Academia Em Casa"
            class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
          />
          <p v-if="erros.categoriaPersonalizadaNome" class="mt-1 text-xs text-red-500">
            {{ erros.categoriaPersonalizadaNome }}
          </p>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">Nome do Objetivo</label>
          <input
            v-model="nomeObjetivo"
            type="text"
            placeholder="Ex.: Reserva de Emergência 2026"
            class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
          />
          <p v-if="erros.nomeObjetivo" class="mt-1 text-xs text-red-500">{{ erros.nomeObjetivo }}</p>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">Descrição da meta</label>
          <textarea
            v-model="descricao"
            rows="4"
            placeholder="Para que serve essa meta?"
            class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Valor Total Desejado</span>
            <span class="text-xs text-gray-400">Meta final</span>
          </div>
          <p class="mt-1 flex items-baseline gap-1">
            <span class="text-sm text-gray-400">R$</span>
            <input
              v-model.number="valorDesejado"
              type="number"
              min="0"
              step="0.01"
              class="w-full text-2xl font-semibold text-gray-900 focus:outline-none"
            />
          </p>
          <p v-if="erros.valorDesejado" class="text-xs text-red-500">{{ erros.valorDesejado }}</p>
          <div class="mt-3 flex gap-2">
            <button
              v-for="chip in [1000, 5000, 10000]"
              :key="chip"
              type="button"
              class="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              @click="adicionarValor(chip)"
            >
              + R$ {{ chip.toLocaleString('pt-BR') }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium tracking-wide text-gray-400">JÁ ECONOMIZADO</label>
            <input
              v-model.number="valorInicio"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <p v-if="erros.valorInicio" class="mt-1 text-xs text-red-500">{{ erros.valorInicio }}</p>
          </div>
          <div>
            <label class="text-xs font-medium tracking-wide text-gray-400">DATA ALVO</label>
            <input
              v-model="dataAlvo"
              type="month"
              class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <p v-if="erros.dataAlvo" class="mt-1 text-xs text-red-500">{{ erros.dataAlvo }}</p>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p class="text-sm font-medium text-gray-700">Aporte Mensal Previsto</p>
          <p class="text-xs text-gray-400">Valor a guardar todo mês</p>
          <input
            v-model.number="aporteMensal"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full text-right text-sm font-semibold text-gray-900 focus:outline-none"
          />
          <p v-if="erros.aporteMensal" class="text-xs text-red-500">{{ erros.aporteMensal }}</p>
        </div>

        <SeletorContaRendimento v-model="idContaVinculada" :contas="contas" />
      </div>
    </div>

    <div class="mt-6">
      <CardProjecaoCriacao
        :projecao="projecao"
        :valor-atual="valorInicio"
        :valor-desejado="valorDesejado"
        :aporte-mensal="aporteMensal"
      />
    </div>

    <p v-if="erroGeral" class="mt-4 text-sm text-red-500">{{ erroGeral }}</p>

    <div class="mt-6 flex flex-col items-center">
      <button
        type="button"
        :disabled="enviando"
        class="flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
        @click="confirmar"
      >
        {{ enviando ? 'Criando…' : 'Confirmar e Criar Meta' }}
        <span aria-hidden="true">→</span>
      </button>
      <p class="mt-2 text-xs text-gray-400">Você poderá editar prazos, aportes e carteiras a qualquer momento.</p>
    </div>
  </div>
</template>
