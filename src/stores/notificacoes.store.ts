import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificacoesService } from '@/features/notificacoes/services/notificacoes.service'

export const useNotificacoesStore = defineStore('notificacoes', () => {
  const naoLidas = ref(0)

  async function atualizarContagem(idUsuario: number): Promise<void> {
    try {
      naoLidas.value = await notificacoesService.contarNaoLidas(idUsuario)
    } catch {
      // Falha silenciosa: contagem do badge não é informação crítica para o usuário
    }
  }

  function decrementar(quantidade = 1): void {
    naoLidas.value = Math.max(0, naoLidas.value - quantidade)
  }

  function zerar(): void {
    naoLidas.value = 0
  }

  return { naoLidas, atualizarContagem, decrementar, zerar }
})
