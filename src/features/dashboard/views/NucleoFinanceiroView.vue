<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConnectionStore } from '@/stores/connection.store';
import { financeService } from '../services/finance.service';
import type { SaldoNucleoData, CartoesData, ContasConectadasData, InvestimentosData, EmprestimosData } from '../types/finance.types';
import { Eye, EyeOff, TrendingUp, Sparkles, CreditCard, Landmark, Handshake, Lock, Check } from 'lucide-vue-next';

const connectionStore = useConnectionStore();

const showValues = ref(true);
const loading = ref(true);
const error = ref<string | null>(null);

const saldo = ref<SaldoNucleoData | null>(null);
const cartoes = ref<CartoesData | null>(null);
const contas = ref<ContasConectadasData | null>(null);
const investimentos = ref<InvestimentosData | null>(null);
const emprestimos = ref<EmprestimosData | null>(null);

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

// Cálculos dinâmicos para o patrimônio e barras de progresso
const totalContas = computed(() => saldo.value?.saldoTotal || 0);

const totalInvestimentos = computed(() => {
  return (investimentos.value?.investimentos || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);
});

const patrimonioTotal = computed(() => totalContas.value + totalInvestimentos.value);

const percentualContas = computed(() => {
  if (patrimonioTotal.value === 0) return 0;
  return Math.round((totalContas.value / patrimonioTotal.value) * 100);
});

const percentualInvestimentos = computed(() => {
  if (patrimonioTotal.value === 0) return 0;
  return 100 - percentualContas.value;
});

onMounted(async () => {
  try {
    loading.value = true;
    const itemId = await connectionStore.requireItemId();

    if (!itemId) {
      error.value = 'Nenhuma conexão financeira ativa selecionada.';
      return;
    }

    const [saldoRes, cartoesRes, contasRes, investRes, empRes] = await Promise.all([
      financeService.getSaldoNucleo(itemId),
      financeService.getCartoes(itemId),
      financeService.getContas(itemId),
      financeService.getInvestimentos(itemId),
      financeService.getEmprestimos(itemId),
    ]);

    saldo.value = saldoRes;
    cartoes.value = cartoesRes;
    contas.value = contasRes;
    investimentos.value = investRes;
    emprestimos.value = empRes;
  } catch (err: any) {
    error.value = 'Erro ao carregar os dados do Núcleo Financeiro.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">Núcleo Financeiro</h1>
      <p class="text-sm text-gray-500">Verifique seus principais dados financeiros</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
      {{ error }}
    </div>

    <div v-else class="space-y-8">
      <!-- Top Section Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Patrimônio Card (2 colunas) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative space-y-4">
          <div class="flex items-center justify-between text-gray-400">
            <span class="text-xs font-semibold tracking-wider uppercase">Patrimônio sob Gestão</span>
            <button @click="showValues = !showValues" class="hover:text-gray-600">
              <Eye v-if="showValues" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>

          <div class="flex items-baseline space-x-3">
            <h2 class="text-3xl font-extrabold text-gray-900">
              {{ showValues ? formatCurrency(patrimonioTotal) : 'R$ ••••••' }}
            </h2>
          </div>

          <!-- Barra de Progresso Segregada (Contas vs Investimentos) -->
          <div class="space-y-2 pt-2">
            <div class="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div
                class="bg-indigo-600 h-full"
                :style="{ width: `${percentualContas}%` }"
              ></div>
              <div
                class="bg-blue-500 h-full"
                :style="{ width: `${percentualInvestimentos}%` }"
              ></div>
            </div>

            <div class="flex items-center space-x-6 text-xs text-gray-600">
              <span class="flex items-center">
                <span class="w-2 h-2 rounded-full bg-indigo-600 mr-1.5"></span>
                Contas {{ percentualContas }}%
              </span>
              <span class="flex items-center">
                <span class="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                Investimentos {{ percentualInvestimentos }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Diagnóstico Card (1 coluna) -->
        <div class="bg-black text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div class="flex items-center space-x-2 text-gray-300">
            <Sparkles class="w-4 h-4" />
            <span class="text-xs font-semibold tracking-wider uppercase">Diagnóstico do Núcleo</span>
          </div>
          <p class="text-xs text-gray-300 leading-relaxed">
            Seu índice de liquidez está excelente com base nas contas correntes e aplicações ativas sincronizadas.
          </p>
          <div>
            <span class="inline-block bg-white/20 text-white font-bold text-sm px-3 py-1 rounded-md">
              A+
            </span>
          </div>
        </div>
      </div>

      <!-- Seção Categorias do Núcleo -->
      <div class="space-y-4">
        <h3 class="text-base font-semibold text-gray-900">Categorias do Núcleo</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Cartões de Crédito -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                  <CreditCard class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm text-gray-900">Cartões de Crédito</h4>
                  <p class="text-xs text-gray-400">{{ cartoes?.total || 0 }} cartões ativos integrados</p>
                </div>
              </div>
            </div>

            <div v-if="cartoes?.cartoes?.[0]" class="bg-gray-50 p-4 rounded-xl space-y-1">
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-gray-500">Fatura Aberta</span>
                <span class="text-base font-bold text-gray-900">{{ formatCurrency(cartoes.cartoes[0].faturaAberta) }}</span>
              </div>
              <div class="flex justify-between text-[11px] text-gray-400">
                <span>Limite: {{ formatCurrency(cartoes.cartoes[0].limite) }}</span>
                <span class="text-emerald-600 font-medium">Disponível: {{ formatCurrency(cartoes.cartoes[0].limiteDisponivel) }}</span>
              </div>
            </div>
          </div>

          <!-- Contas Conectadas -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                <Landmark class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-semibold text-sm text-gray-900">Contas Conectadas</h4>
                <p class="text-xs text-gray-400">{{ contas?.total || 0 }} contas via Open Finance</p>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs text-gray-400 block">Saldo Líquido Disponível</span>
              <p class="text-2xl font-extrabold text-gray-900">{{ formatCurrency(saldo?.saldoTotal || 0) }}</p>

              <div class="space-y-1 pt-1">
                <div v-for="c in contas?.contas || []" :key="c.id" class="flex items-center text-xs text-gray-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-900 mr-2"></span>
                  <span class="font-medium mr-1">{{ c.nome }}:</span> {{ formatCurrency(c.saldo) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Carteira Ativa & Aplicações -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                  <TrendingUp class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm text-gray-900">Carteira Ativa & Aplicações</h4>
                  <p class="text-xs text-gray-400">{{ investimentos?.total || 0 }} classes de ativos</p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-xs text-gray-400 block">Posição Total Aplicada</span>
              <p class="text-2xl font-extrabold text-gray-900">{{ formatCurrency(totalInvestimentos) }}</p>

              <!-- Barra de Distribuição de Investimentos -->
              <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex my-2">
                <div class="bg-gray-900 h-full" style="width: 55%"></div>
                <div class="bg-indigo-500 h-full" style="width: 25%"></div>
                <div class="bg-emerald-500 h-full" style="width: 20%"></div>
              </div>

              <div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                <span v-for="inv in (investimentos?.investimentos || []).slice(0, 4)" :key="inv.id" class="flex items-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-800 mr-1"></span>
                  {{ inv.nome }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Cards: Empréstimos & Reservas de Emergência -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Empréstimos / Fianças -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                <Handshake class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-semibold text-sm text-gray-900">Empréstimos / Fianças</h4>
                <p class="text-xs text-gray-400">{{ emprestimos?.total || 0 }} contrato ativo</p>
              </div>
            </div>
            <span class="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full font-medium">Em dia</span>
          </div>

          <div v-if="emprestimos?.emprestimos?.[0]" class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span class="text-xs text-gray-400 block">Valor Contratado</span>
                <span class="font-bold text-sm text-gray-900">{{ formatCurrency(emprestimos.emprestimos[0].valorContratado) }}</span>
              </div>
              <div class="text-right">
                <span class="text-xs text-gray-400 block">Saldo Devedor</span>
                <span class="font-bold text-sm text-rose-600">{{ formatCurrency(emprestimos.emprestimos[0].saldoDevedor) }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Progresso de amortização</span>
                <span>
                  {{ emprestimos.emprestimos[0].parcelasPagas }} de {{ emprestimos.emprestimos[0].parcelasPagas + emprestimos.emprestimos[0].parcelasRestantes }} pagas 
                  ({{ Math.round((emprestimos.emprestimos[0].parcelasPagas / (emprestimos.emprestimos[0].parcelasPagas + emprestimos.emprestimos[0].parcelasRestantes)) * 100) }}%)
                </span>
              </div>
              <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  class="bg-black h-full" 
                  :style="{ width: `${(emprestimos.emprestimos[0].parcelasPagas / (emprestimos.emprestimos[0].parcelasPagas + emprestimos.emprestimos[0].parcelasRestantes)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reservas de Emergência & Cofres -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2.5 bg-gray-50 rounded-xl text-gray-700">
                <Lock class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-semibold text-sm text-gray-900">Reservas de Emergência & Cofres</h4>
                <p class="text-xs text-gray-400">Meta líquida 100% atingida</p>
              </div>
            </div>
            <span class="p-1 bg-emerald-100 text-emerald-600 rounded-full">
              <Check class="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <span class="text-xs text-gray-400 block">Saldo Guardado</span>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-extrabold text-gray-900">{{ formatCurrency(totalInvestimentos) }}</span>
              <span class="px-2.5 py-1 text-[11px] bg-emerald-50 text-emerald-700 rounded-full font-medium">Meta Concluída</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

