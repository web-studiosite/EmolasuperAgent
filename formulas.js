/**
 * ============================================
 * FÓRMULAS DE COMISSÃO - OPERAÇÕES DE CARTEIRA MÓVEL
 * ============================================
 * Edite as taxas abaixo conforme necessário.
 * As alterações refletem imediatamente em todo o sistema.
 */

const TAXAS_OPERACAO = {
  deposito: 0.04,
  levantamento: 0.05,
  transferencia: 0.04,
  pagamento: 0.05
};

const LABELS_OPERACAO = {
  deposito: 'Depósito',
  levantamento: 'Levantamento',
  transferencia: 'Transferência',
  pagamento: 'Pagamento de Serviços'
};

/**
 * Calcula a comissão de uma operação
 * @param {number} valor - Valor da operação em MZN
 * @param {string} tipoOperacao - Tipo da operação (deposito, levantamento, etc.)
 * @returns {number} Valor da comissão em MZN
 */
function calcularComissao(valor, tipoOperacao) {
  const taxa = TAXAS_OPERACAO[tipoOperacao] || 0.04;
  return Math.round(valor * taxa * 100) / 100;
}

/**
 * Retorna a taxa percentual de uma operação
 * @param {string} tipoOperacao
 * @returns {number} Percentual (ex: 4 para 4%)
 */
function getTaxaPercent(tipoOperacao) {
  return (TAXAS_OPERACAO[tipoOperacao] || 0.04) * 100;
}
