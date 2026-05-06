/**
 * ============================================
 * CÁLCULO DE COMISSÕES - RECARGAS FÍSICAS DE TELEFONE
 * ============================================
 * Taxa fixa de 6% para cada recarga distribuída.
 * Valores disponíveis: 10, 20, 50, 100, 200, 500, 1000 MZN
 */

const TAXA_RECARGA = 0.06;

const VALORES_RECARGA = [10, 20, 50, 100, 200, 500, 1000];

/**
 * Calcula a comissão de uma recarga
 * @param {number} valor - Valor da recarga em MZN
 * @returns {number} Comissão em MZN
 */
function calcularComissaoRecarga(valor) {
  return Math.round(valor * TAXA_RECARGA * 100) / 100;
}

/**
 * Retorna a tabela completa de recargas com comissões
 * @returns {Array<{valor: number, comissao: number}>}
 */
function getTabelaRecargas() {
  return VALORES_RECARGA.map(function(v) {
    return {
      valor: v,
      comissao: calcularComissaoRecarga(v)
    };
  });
}
