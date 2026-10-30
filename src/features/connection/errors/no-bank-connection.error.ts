/** O usuário ainda não conectou nenhuma conta: deve ser levado à tela de conexão. */
export class NoBankConnectionError extends Error {
  constructor() {
    super('Nenhuma conta bancária conectada.')
    this.name = 'NoBankConnectionError'
  }
}
