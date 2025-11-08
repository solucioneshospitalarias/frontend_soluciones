/**
 * Utilidades para manejo y formateo de números decimales
 */

/**
 * Redondea un número a un número específico de decimales
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Formatea un número para display con número fijo de decimales
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return roundTo(value, decimals).toFixed(decimals);
};

/**
 * Formatea un porcentaje para display
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
 * Calcula el puntaje ponderado
 */
export const calculateWeightedScore = (score: number, weight: number): number => {
  const weighted = (score * weight) / 100;
  return roundTo(weighted, 2);
};

/**
 * Obtiene el nivel de desempeño basado en el porcentaje
 */
export const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 90) {
    return {
      text: 'EXCELENTE',
      description: 'Desempeño sobresaliente',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#a7f3d0',
      gradient: 'from-emerald-500 to-green-600',
      textColorClass: 'text-emerald-600',
      bgColorClass: 'bg-emerald-50',
      borderColorClass: 'border-emerald-200'
    };
  }
  if (percentage >= 75) {
    return {
      text: 'BUEN DESEMPEÑO',
      description: 'Desempeño satisfactorio con oportunidades',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      borderColor: '#93c5fd',
      gradient: 'from-blue-500 to-blue-600',
      textColorClass: 'text-blue-600',
      bgColorClass: 'bg-blue-50',
      borderColorClass: 'border-blue-200'
    };
  }
  if (percentage >= 60) {
    return {
      text: 'SATISFACTORIO',
      description: 'Cumple con las expectativas básicas',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fcd34d',
      gradient: 'from-yellow-500 to-orange-500',
      textColorClass: 'text-orange-600',
      bgColorClass: 'bg-orange-50',
      borderColorClass: 'border-orange-200'
    };
  }
  return {
    text: 'NECESITA MEJORA',
    description: 'Requiere plan de desarrollo',
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    gradient: 'from-red-500 to-red-600',
    textColorClass: 'text-red-600',
    bgColorClass: 'bg-red-50',
    borderColorClass: 'border-red-200'
  };
};

/**
 * Obtiene el color para una barra de progreso
 */
export const getProgressBarColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Genera recomendaciones basadas en el puntaje
 */
export const generateRecommendation = (
  percentage: number, 
  weakAreas: string[] = []
): string => {
  let base = '';
  
  if (percentage >= 90) {
    base = 'Excelente desempeño. Mantener el nivel y considerar para roles de liderazgo o mentoría.';
  } else if (percentage >= 75) {
    base = 'Buen desempeño general. Enfocar esfuerzos en los criterios con menor puntuación para alcanzar la excelencia.';
  } else if (percentage >= 60) {
    base = 'Desempeño satisfactorio. Se recomienda crear un plan de mejora específico para los criterios más débiles.';
  } else {
    base = 'Se requiere un plan de mejora inmediato. Considerar capacitación adicional y seguimiento frecuente.';
  }
  
  if (weakAreas.length > 0) {
    base += ` Áreas prioritarias: ${weakAreas.join(', ')}.`;
  }
  
  return base;
};

/**
 * Formatea el puntaje con contexto
 */
export const formatScoreWithContext = (
  score: number, 
  maxScore: number, 
  includePercentage: boolean = true
): string => {
  const percentage = (score / maxScore) * 100;
  const formattedScore = formatNumber(score, 1);
  const formattedMax = formatNumber(maxScore, 0);
  
  if (includePercentage) {
    return `${formatNumber(percentage, 1)}% (${formattedScore}/${formattedMax})`;
  }
  return `${formattedScore}/${formattedMax}`;
};

/**
 * Formatea un valor para ser usado en un input HTML number
 */
export const formatForInput = (value: number, decimals: number = 2): string => {
  return parseFloat(roundTo(value, decimals).toFixed(decimals)).toString();
};

/**
 * Normaliza un array de pesos para que sumen exactamente 100
 */
export const normalizeWeights = (
  weights: number[], 
  lockedIndices: number[] = []
): number[] => {
  if (weights.length === 0) return [];
  
  const lockedSum = lockedIndices.reduce((sum, index) => {
    return sum + (weights[index] || 0);
  }, 0);
  
  if (lockedIndices.length === weights.length || lockedSum >= 100) {
    return weights.map(w => roundTo(w, 2));
  }
  
  const targetForUnlocked = 100 - lockedSum;
  const unlockedIndices = weights
    .map((_, index) => index)
    .filter(index => !lockedIndices.includes(index));
  
  if (unlockedIndices.length === 0) {
    return weights.map(w => roundTo(w, 2));
  }
  
  const currentUnlockedSum = unlockedIndices.reduce((sum, index) => {
    return sum + weights[index];
  }, 0);
  
  if (currentUnlockedSum === 0) {
    const equalWeight = targetForUnlocked / unlockedIndices.length;
    return weights.map((w, i) => 
      lockedIndices.includes(i) ? roundTo(w, 2) : roundTo(equalWeight, 2)
    );
  }
  
  const scaleFactor = targetForUnlocked / currentUnlockedSum;
  return weights.map((w, i) => 
    lockedIndices.includes(i) ? roundTo(w, 2) : roundTo(w * scaleFactor, 2)
  );
};

/**
 * Obtiene el paso para inputs numéricos
 */
export const getInputStep = (decimals: number): string => {
  return decimals === 0 ? "1" : `0.${"0".repeat(decimals - 1)}1`;
};

/**
 * Sanitiza un valor de input para números
 */
export const sanitizeInputValue = (
  value: string | number, 
  decimals: number = 2, 
  defaultValue: number = 0
): number => {
  const parsed = typeof value === 'string' ? 
    parseFloat(value) : value;
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  
  return roundTo(parsed, decimals);
};