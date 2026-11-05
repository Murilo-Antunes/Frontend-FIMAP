<template>
  <div class="p-8 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
    <!-- Title -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">Todas Transações</h1>
      <p class="text-sm text-gray-500">Veja suas transações filtradas por data</p>
    </div>

    <!-- Search & Filters Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar transação, loja, valor ou tag..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
        />
      </div>

      <div class="flex items-center space-x-2 text-xs font-medium">
        <button
          v-for="period in ['Outubro 2026', 'Setembro 2026', 'Agosto 2026', 'Personalizado']"
          :key="period"
          @click="selectedPeriod = period"
          :class="[
            'px-3 py-1.5 rounded-lg transition',
            selectedPeriod === period ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- Sub-Filters Pills -->
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <button
        v-for="banco in ['Todas as Contas', 'Nubank', 'Itaú', 'Inter', 'Cartão Black']"
        :key="banco"
        @click="selectedAccount = banco"
        :class="[
          'px-3 py-1 rounded-full font-medium transition',
          selectedAccount === banco ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <span v-if="banco === 'Todas as Contas'">✓ </span>{{ banco }}
      </button>

      <div class="h-4 w-px bg-gray-300 mx-1"></div>

      <button
        @click="filterType = 'ENTRADAS'"
        :class="['px-3 py-1 rounded-full transition font-medium', filterType === 'ENTRADAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600']"
      >
        Apenas Entradas (+)
      </button>
      <button
        @click="filterType = 'SAIDAS'"
        :class="['px-3 py-1 rounded-full transition font-medium', filterType === 'SAIDAS' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-600']"
      >
        Apenas Saídas (-)
      </button>
    </div>

    <!-- Loading / Erro / Conteúdo -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Consolidação Card Left Side -->
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 h-max">
        <div>
          <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Consolidação</span>
          <h3 class="text-base font-bold text-gray-900">{{ selectedPeriod }}</h3>
          <span class="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            {{ transacoes.length }} Lançamentos
          </span>
        </div>

        <div class="space-y-3 pt-2">
          <div class="bg-gray-50 p-3 rounded-xl">
            <span class="text-xs text-gray-400 block">Entradas</span>
            <span class="text-sm font-bold text-emerald-600">+{{ formatCurrency(totalEntradas) }}</span>
          </div>

          <div class="bg-gray-50 p-3 rounded-xl">
            <span class="text-xs text-gray-400 block">Saídas</span>
            <span class="text-sm font-bold text-rose-600">-{{ formatCurrency(totalSaidas) }}</span>
          </div>

          <div class="bg-black text-white p-3 rounded-xl">
            <span class="text-xs text-gray-400 block">Líquido</span>
            <span class="text-sm font-bold text-white">{{ formatCurrency(totalEntradas - totalSaidas) }}</span>
          </div>
        </div>
      </div>

      <!-- Transactions Columns (Right Side) -->
      <div class="lg:col-span-3 space-y-6">
        <p v-if="Object.keys(transacoesAgrupadas).length === 0" class="text-sm text-gray-500 bg-white p-6 rounded-2xl border border-gray-100 text-center">
          Nenhuma transação encontrada com os filtros selecionados.
        </p>

        <div v-for="(grupo, data) in transacoesAgrupadas" :key="data" class="space-y-3">
          <!-- Day Header -->
          <div class="flex justify-between items-center text-xs font-semibold text-gray-400 tracking-wider">
            <span>{{ data }}</span>
            <span>- {{ formatCurrency(grupo.totalSaidas) }} • + {{ formatCurrency(grupo.totalEntradas) }}</span>
          </div>

          <!-- Cards de Transações -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="t in grupo.itens"
              :key="t.id"
              class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                  <ShoppingBag v-if="t.categoria === 'Tecnologia'" class="w-4 h-4" />
                  <ShoppingCart v-else-if="t.categoria === 'Alimentação'" class="w-4 h-4" />
                  <ArrowDownLeft v-else-if="t.tipo === 'ENTRADA' || t.tipo === 'RECEITA'" class="w-4 h-4 text-emerald-600" />
                  <Receipt v-else class="w-4 h-4" />
                </div>

                <div>
                  <h4 class="font-bold text-xs text-gray-900">{{ t.descricao }}</h4>
                  <p class="text-[11px] text-gray-400">{{ t.instituicao || t.conta || 'Conta Integrada' }}</p>
                  <div class="flex items-center space-x-1.5 mt-1">
                    <span class="text-[10px] text-gray-400">{{ t.categoria || 'Geral' }}</span>
                    <span v-if="t.tipoPagamentoTag || t.formaPagamento" class="px-1.5 py-0.2 text-[9px] bg-gray-100 text-gray-600 rounded font-semibold uppercase">
                      {{ t.tipoPagamentoTag || t.formaPagamento }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span :class="['font-bold text-xs block', (t.tipo === 'ENTRADA' || t.tipo === 'RECEITA') ? 'text-emerald-600' : 'text-gray-900']">
                  {{ (t.tipo === 'ENTRADA' || t.tipo === 'RECEITA') ? '+' : '-' }} {{ formatCurrency(t.valor) }}
                </span>
                <span class="text-[10px] text-gray-400 block mt-1">{{ t.hora || '12:00' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConnectionStore } from '@/stores/connection.store';
import { financeService } from '../services/finance.service';
import type { ApiResponse } from '../types/finance.types';
import { Search, ShoppingBag, ShoppingCart, ArrowDownLeft, Receipt } from 'lucide-vue-next';

const connectionStore = useConnectionStore();

const searchQuery = ref('');
const selectedPeriod = ref('Outubro 2026');
const selectedAccount = ref('Todas as Contas');
const filterType = ref<'TODAS' | 'ENTRADAS' | 'SAIDAS'>('TODAS');

const loading = ref(true);
const error = ref<string | null>(null);
const transacoes = ref<ApiResponse[]>([]);

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

// Totais gerais calculados com base nas transações carregadas
const totalEntradas = computed(() => {
  return transacoes.value
    .filter(t => t.tipo === 'ENTRADA' || t.tipo === 'RECEITA')
    .reduce((acc, curr) => acc + curr.valor, 0);
});

const totalSaidas = computed(() => {
  return transacoes.value
    .filter(t => t.tipo === 'SAIDA' || t.tipo === 'DESPESA')
    .reduce((acc, curr) => acc + curr.valor, 0);
});

// Agrupamento por data para exibição em blocos
const transacoesAgrupadas = computed(() => {
  const grupos: Record<string, { itens: ApiResponse[]; totalEntradas: number; totalSaidas: number }> = {};

  const filtradas = transacoes.value.filter(t => {
    const isEntrada = t.tipo === 'ENTRADA' || t.tipo === 'RECEITA';
    const isSaida = t.tipo === 'SAIDA' || t.tipo === 'DESPESA';

    if (filterType.value === 'ENTRADAS' && !isEntrada) return false;
    if (filterType.value === 'SAIDAS' && !isSaida) return false;
    if (searchQuery.value && !t.descricao.toLowerCase().includes(searchQuery.value.toLowerCase())) return false;
    return true;
  });

  filtradas.forEach(t => {
    const key = t.data || 'Outros';
    if (!grupos[key]) {
      grupos[key] = { itens: [], totalEntradas: 0, totalSaidas: 0 };
    }
    grupos[key].itens.push(t);
    
    if (t.tipo === 'ENTRADA' || t.tipo === 'RECEITA') {
      grupos[key].totalEntradas += t.valor;
    } else {
      grupos[key].totalSaidas += t.valor;
    }
  });

  return grupos;
});

onMounted(async () => {
  try {
    loading.value = true;
    const itemId = await connectionStore.requireItemId();

    if (!itemId) {
      error.value = 'Nenhuma conexão financeira ativa selecionada.';
      return;
    }

    const res = await financeService.getTransacoes(itemId);
    transacoes.value = res?.transacoes || [];
  } catch (err: any) {
    error.value = 'Erro ao carregar as transações.';
  } finally {
    loading.value = false;
  }
});
</script>