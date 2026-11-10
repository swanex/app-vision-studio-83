// Конфигурация пороговых значений, целевой нормы и цветовых схем графика (Figma Spec V2)

export const DEFAULT_PRESSURE_THRESHOLDS = {
  // Целевая норма (отображается пунктиром и цифрами слева на графике)
  targetNorm: {
    sys: 120,
    dia: 80
  },
  // Пороги для градиентного окрашивания линий и определения статуса "В норме"
  systolic: {
    low: 90,
    high: 140
  },
  diastolic: {
    low: 60,
    high: 85
  }
};

// Новая сочная палитра из раскладки Figma
export const STROKE_GRADIENT_PALETTE = {
  systolic: {
    highPeak: '#FDAD62',      // 0% — оранжевый пик
    upperNormal: '#4FAE25',   // 30% — сочный зеленый
    lowerNormal: '#4FAE25',   // 70% — сочный зеленый
    lowValley: '#8754FF',     // 100% — фиолетовый спад
    fillColor: '#4FAE25'      // Базовый цвет заливки (40% -> 0%)
  },
  diastolic: {
    highPeak: '#FDAD62',      // 0% — оранжевый пик
    upperNormal: '#21B5B7',   // 30% — сочный бирюзово-голубой
    lowerNormal: '#21B5B7',   // 70% — сочный бирюзово-голубой
    lowValley: '#8754FF',     // 100% — фиолетовый спад
    fillColor: '#21B5B7'      // Базовый цвет заливки (40% -> 0%)
  }
};

/**
 * Возвращает индивидуальные пороги и норму пользователя (задел под настройку в профиле)
 */
export const getUserPressureThresholds = (user) => {
  if (user?.pressureThresholds) {
    return {
      ...DEFAULT_PRESSURE_THRESHOLDS,
      ...user.pressureThresholds,
      targetNorm: {
        ...DEFAULT_PRESSURE_THRESHOLDS.targetNorm,
        ...(user.pressureThresholds.targetNorm || {})
      }
    };
  }
  return DEFAULT_PRESSURE_THRESHOLDS;
};

/**
 * ЕДИНАЯ ФУНКЦИЯ ОПРЕДЕЛЕНИЯ СТАТУСА ДАВЛЕНИЯ
 * Используется на главном экране, в карточке "Замеров в норме" и в Истории.
 */
export const evaluatePressureStatus = (
  sys,
  dia,
  thresholds = DEFAULT_PRESSURE_THRESHOLDS,
  theme = 'light'
) => {
  if (!sys || !dia) {
    return {
      key: 'unknown',
      isNormal: false,
      text: 'Нет данных',
      bg: theme === 'dark' ? '#252F28' : '#E4E4E4',
      textCol: theme === 'dark' ? '#96A099' : '#7A827D'
    };
  }

  const sysLow = thresholds?.systolic?.low ?? 90;
  const sysHigh = thresholds?.systolic?.high ?? 140;
  const diaLow = thresholds?.diastolic?.low ?? 60;
  const diaHigh = thresholds?.diastolic?.high ?? 85;

  // 1. Высокое (выход за верхний порог: >= 140 или > 85)
  if (sys >= sysHigh || dia > diaHigh) {
    return {
      key: 'high',
      isNormal: false,
      text: 'Высокое',
      bg: theme === 'dark' ? '#4A3520' : '#FCE0BD',
      textCol: theme === 'dark' ? '#FDAD62' : '#181C24'
    };
  }

  // 2. Низкое (ниже нижнего порога: < 90 или < 60)
  if (sys < sysLow || dia < diaLow) {
    return {
      key: 'low',
      isNormal: false,
      text: 'Низкое',
      bg: theme === 'dark' ? '#32264D' : '#DCD2F2',
      textCol: theme === 'dark' ? '#C4B0FF' : '#181C24'
    };
  }

  // 3. Повышенное (предгипертония внутри верхней границы: 130..139)
  if (sys >= 130) {
    return {
      key: 'elevated',
      isNormal: false,
      text: 'Повышенное',
      bg: theme === 'dark' ? '#3E342A' : '#F2E6D8',
      textCol: theme === 'dark' ? '#EBC89E' : '#181C24'
    };
  }

  // 4. В норме (нейтральный голубой шильдик)
  return {
    key: 'normal',
    isNormal: true,
    text: 'В норме',
    bg: theme === 'dark' ? '#223042' : '#E4EEFC',
    textCol: theme === 'dark' ? '#BDD6FA' : '#181C24'
  };
};

/**
 * Рассчитывает процентные позиции Gradient Stops относительно вертикальной шкалы Y.
 */
export const computeStrokeGradientStops = ({
  yMin,
  yMax,
  lowThreshold,
  highThreshold,
  palette,
  transitionSpan = 16
}) => {
  const span = Math.max(1, yMax - yMin);
  const toPercent = (val) => {
    const clamped = Math.min(yMax, Math.max(yMin, val));
    return `${(((yMax - clamped) / span) * 100).toFixed(2)}%`;
  };

  const highExtremeVal = Math.min(yMax, highThreshold + transitionSpan);
  const lowExtremeVal = Math.max(yMin, lowThreshold - transitionSpan);

  return [
    { offset: toPercent(highExtremeVal), color: palette.highPeak },
    { offset: toPercent(highThreshold), color: palette.upperNormal },
    { offset: toPercent(lowThreshold), color: palette.lowerNormal },
    { offset: toPercent(lowExtremeVal), color: palette.lowValley }
  ];
};