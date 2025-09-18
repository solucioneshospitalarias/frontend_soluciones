/**
 * Utilidades para manejo y formateo de números decimales
 */

/**
 * Redondea un número a un número específico de decimales
 * @param value - Valor a redondear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Número redondeado
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Formatea un número para display con número fijo de decimales
 * @param value - Valor a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return roundTo(value, decimals).toFixed(decimals);
};

/**
 * Formatea un porcentaje para display
 * @param value - Valor del porcentaje
 * @param includeSymbol - Si incluir el símbolo %
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado del porcentaje
 */
export const formatPercentage = (
  value: number, 
  includeSymbol: boolean = true,
  decimals: number = 2
): string => {
  const formatted = formatNumber(value, decimals);
  return includeSymbol ? `${formatted}%` : formatted;
};

/**
 * Normaliza un array de pesos para que sumen exactamente 100
 * @param weights - Array de pesos a normalizar
 * @param lockedIndices - Índices de pesos bloqueados que no deben cambiar
 * @returns Array de pesos normalizados
 */
export const normalizeWeights = (
  weights: number[], 
  lockedIndices: number[] = []
): number[] => {
  if (weights.length === 0) return [];
  
  // Calcular la suma de los pesos bloqueados
  const lockedSum = lockedIndices.reduce((sum, index) => {
    return sum + (weights[index] || 0);
  }, 0);
  
  // Si todos están bloqueados o la suma bloqueada es >= 100, retornar sin cambios
  if (lockedIndices.length === weights.length || lockedSum >= 100) {
    return weights.map(w => roundTo(w, 2));
  }
  
  // Calcular cuánto deben sumar los no bloqueados
  const targetForUnlocked = 100 - lockedSum;
  
  // Obtener índices no bloqueados
  const unlockedIndices = weights
    .map((_, index) => index)
    .filter(index => !lockedIndices.includes(index));
  
  if (unlockedIndices.length === 0) {
    return weights.map(w => roundTo(w, 2));
  }
  
  // Calcular la suma actual de los no bloqueados
  const currentUnlockedSum = unlockedIndices.reduce((sum, index) => {
    return sum + weights[index];
  }, 0);
  
  // Si la suma actual es 0, distribuir equitativamente
  if (currentUnlockedSum === 0) {
    const equalWeight = targetForUnlocked / unlockedIndices.length;
    const result = [...weights];
    unlockedIndices.forEach(index => {
      result[index] = roundTo(equalWeight, 2);
    });
    
    // Ajustar el último elemento para asegurar suma exacta de 100
    const lastUnlockedIndex = unlockedIndices[unlockedIndices.length - 1];
    const currentTotal = result.reduce((sum, w) => sum + w, 0);
    result[lastUnlockedIndex] = roundTo(result[lastUnlockedIndex] + (100 - currentTotal), 2);
    
    return result;
  }
  
  // Calcular el factor de escala
  const scaleFactor = targetForUnlocked / currentUnlockedSum;
  
  // Aplicar el factor de escala a los no bloqueados
  const result = [...weights];
  unlockedIndices.forEach(index => {
    result[index] = roundTo(weights[index] * scaleFactor, 2);
  });
  
  // Ajustar cualquier diferencia de redondeo en el último elemento no bloqueado
  const currentTotal = result.reduce((sum, w) => sum + w, 0);
  const difference = roundTo(100 - currentTotal, 2);
  
  if (Math.abs(difference) > 0.001 && unlockedIndices.length > 0) {
    const lastUnlockedIndex = unlockedIndices[unlockedIndices.length - 1];
    result[lastUnlockedIndex] = roundTo(result[lastUnlockedIndex] + difference, 2);
  }
  
  return result;
};

/**
 * Valida si un conjunto de pesos suma aproximadamente 100
 * @param weights - Array de pesos a validar
 * @param tolerance - Tolerancia permitida (por defecto 0.01)
 * @returns True si la suma está dentro de la tolerancia
 */
export const validateWeightsSum = (
  weights: number[], 
  tolerance: number = 0.01
): boolean => {
  const sum = weights.reduce((total, weight) => total + weight, 0);
  return Math.abs(sum - 100) <= tolerance;
};

/**
 * Obtiene el step apropiado para un input HTML de tipo number
 * basado en el número de decimales deseados
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String del step para el input
 */
export const getInputStep = (decimals: number = 2): string => {
  return (1 / Math.pow(10, decimals)).toString();
};

/**
 * Sanitiza un valor de input para asegurar que sea un número válido
 * @param value - Valor del input (puede ser string o number)
 * @param defaultValue - Valor por defecto si el input no es válido
 * @param decimals - Número de decimales a mantener
 * @returns Número sanitizado
 */
export const sanitizeInputValue = (
  value: string | number,
  defaultValue: number = 0,
  decimals: number = 2
): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  
  return roundTo(parsed, decimals);
};

/**
 * Calcula el puntaje ponderado
 * @param score - Puntuación (típicamente 1-5)
 * @param weight - Peso del criterio (0-100)
 * @returns Puntaje ponderado redondeado
 */
export const calculateWeightedScore = (score: number, weight: number): number => {
  // La fórmula es: (score / 5) * weight
  const weighted = (score / 5) * weight;
  return roundTo(weighted, 2);
};

/**
 * Formatea un valor para ser usado en un input HTML number
 * @param value - Valor a formatear
 * @param decimals - Número de decimales
 * @returns String formateado para el input
 */
export const formatForInput = (value: number, decimals: number = 2): string => {
  // Usar parseFloat para eliminar ceros innecesarios
  return parseFloat(roundTo(value, decimals).toFixed(decimals)).toString();
};