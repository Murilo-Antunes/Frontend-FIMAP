/** Paleta do gráfico de categorias (ordem = maior gasto → menor), como no design. */
const PALETA = ['#0a0a0a', '#5c5c5c', '#5b4fe0', '#e3e3e3', '#0ea5e9', '#f59e0b']

export const corDaCategoria = (indice: number): string => PALETA[indice % PALETA.length]
