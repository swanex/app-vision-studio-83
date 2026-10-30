// Конфигурация пороговых значений и цветовых схем градиента линий (Figma Spec)

export const DEFAULT_PRESSURE_THRESHOLDS = {
  systolic: {
    low: 90,
    high: 140
  },
  diastolic: {
    low: 60,
    high: 85
  }
};

// Эталонные цвета из приложенных схем Figma
export const STROKE_GRADIENT_PALETTE = {
  systolic: {
    highPeak: '#FDAD62',      // 0% в схеме Figma (оранжевый пик)
    upperNormal: '#679F39',   // 30% в схеме Figma (верхняя граница зеленого)
    lowerNormal: '#67A036',   // 70% в схеме Figma (нижняя граница зеленого)
    lowValley: '#8754FF'      // 100% в схеме Figma (фиолетовый спад)
  },
  diastolic: {
    highPeak: '#FDAD62',      // 0% в схеме Figma (оранжевый пик)
    upperNormal: '#5CA4B6',   // 30% в схеме Figma (верхняя граница голубого)
    lowerNormal: '#5CA4B6',   // 70% в схеме Figma (нижняя граница голубого)
    lowValley: '#8754FF'      // 100% в схеме Figma (фиолетовый спад)
  }
};

/**
 * Возвращает индивидуальные пороги пользователя (задел под будущие настройки профиля/протокола)
 */
export const getUserPressureThresholds = (user) => {
  if (user?.pressureThresholds) {
    return user.pressureThresholds;
  }
  return DEFAULT_PRESSURE_THRESHOLDS;
};

/**
 * Рассчитывает точные процентные позиции Gradient Stops относительно вертикальной шкалы Y.
 * Так как ось Y в SVG направлена сверху вниз (0% — верх графика yMax, 100% — низ графика yMin),
 * значение давления переводится в координату по формуле: (yMax - value) / (yMax - yMin).
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

  // Точка полного раскрытия теплого (оранжевого) оттенка выше верхнего порога
  const highExtremeVal = Math.min(yMax, highThreshold + transitionSpan);
  // Точка полного раскрытия холодного (фиолетового) оттенка ниже нижнего порога
  const lowExtremeVal = Math.max(yMin, lowThreshold - transitionSpan);

  return [
    { offset: toPercent(highExtremeVal), color: palette.highPeak },
    { offset: toPercent(highThreshold), color: palette.upperNormal },
    { offset: toPercent(lowThreshold), color: palette.lowerNormal },
    { offset: toPercent(lowExtremeVal), color: palette.lowValley }
  ];
};