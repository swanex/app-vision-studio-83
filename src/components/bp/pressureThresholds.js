// Конфигурация пороговых значений, целевой нормы и цветовых схем графика и бейджей (Figma Spec V3)

export const DEFAULT_PRESSURE_THRESHOLDS = {
  // Целевая норма (отображается двумя пунктирными линиями и цифрами слева на графике)
  targetNorm: {
    sys: 120,
    dia: 80
  },
  // Верхнее (систолическое) давление:
  // 100..129 — "В норме" (зеленый коридор)
  // 130..139 — "Выше нормы"
  // >= 140   — "Высокое ↑"
  // 90..99   — "Ниже нормы"
  // < 90     — "Низкое ↓"
  systolic: {
    veryLow: 90,
    low: 100,
    normalMax: 129,
    high: 140,
    highFullColorAt: 145,
    lowFullColorAt: 88
  },
  // Нижнее (диастолическое) давление:
  // 60..84 — "В норме" (бирюзово-голубой коридор)
  // 85..89 — "Выше нормы"
  // >= 90  — "Высокое ↑"
  // 55..59 — "Ниже нормы"
  // < 55   — "Низкое ↓"
  diastolic: {
    veryLow: 55,
    low: 60,
    normalMax: 84,
    high: 90,
    highFullColorAt: 92,
    lowFullColorAt: 53
  }
};

// Точные цвета бейджей статусов и карточки нормы из макета Figma
export const STATUS_BADGE_PALETTE = {
  low: {
    text: 'Низкое', // Иконка со стрелкой теперь рендерится отдельно в компоненте AnimatedStatusBadge / History
    lightBg: '#A98BFF',
    lightText: '#2B1766', // Глубокий индиго
    darkBg: '#46307A',
    darkText: '#EAE2FF',
    icon: 'down'
  },
  belowNormal: {
    text: 'Ниже нормы',
    lightBg: '#DACFF1',
    lightText: '#141A16',
    darkBg: '#32284A',
    darkText: '#DACFF1',
    icon: null
  },
  normal: {
    text: 'В норме',
    lightBg: '#DCEBFE',
    lightText: '#141A16',
    darkBg: '#223247',
    darkText: '#DCEBFE',
    icon: null
  },
  aboveNormal: {
    text: 'Выше нормы',
    lightBg: '#F2E5D5',
    lightText: '#141A16',
    darkBg: '#3E342A',
    darkText: '#F2E5D5',
    icon: null
  },
  high: {
    text: 'Высокое', // Иконка со стрелкой теперь рендерится отдельно
    lightBg: '#FFB066',
    lightText: '#5C2D00', // Плотный коричневый
    darkBg: '#5C3818',
    darkText: '#FFD6AD',
    icon: 'up'
  }
};

// Сочная палитра линий и заливок графика из раскладки Figma
export const STROKE_GRADIENT_PALETTE = {
  systolic: {
    highPeak: '#FDAD62',      // 0% — оранжевый пик
    upperNormal: '#4FAE25',   // верхняя граница зеленого коридора (129)
    lowerNormal: '#4FAE25',   // нижняя граница зеленого коридора (100)
    lowValley: '#8754FF',     // 100% — фиолетовый спад
    fillColor: '#4FAE25'      // базовый цвет заливки (40% -> 0%)
  },
  diastolic: {
    highPeak: '#FDAD62',      // 0% — оранжевый пик
    upperNormal: '#21B5B7',   // верхняя граница бирюзово-голубого коридора (84)
    lowerNormal: '#21B5B7',   // нижняя граница бирюзово-голубого коридора (60)
    lowValley: '#8754FF',     // 100% — фиолетовый спад
    fillColor: '#21B5B7'      // базовый цвет заливки (40% -> 0%)
  }
};

/**
 * Возвращает индивидуальные пороги и целевую норму пользователя.
 */
export const getUserPressureThresholds = (user) => {
  if (!user?.pressureThresholds) {
    return DEFAULT_PRESSURE_THRESHOLDS;
  }
  return {
    ...DEFAULT_PRESSURE_THRESHOLDS,
    ...user.pressureThresholds,
    targetNorm: {
      ...DEFAULT_PRESSURE_THRESHOLDS.targetNorm,
      ...(user.pressureThresholds.targetNorm || {})
    },
    systolic: {
      ...DEFAULT_PRESSURE_THRESHOLDS.systolic,
      ...(user.pressureThresholds.systolic || {})
    },
    diastolic: {
      ...DEFAULT_PRESSURE_THRESHOLDS.diastolic,
      ...(user.pressureThresholds.diastolic || {})
    }
  };
};

/**
 * ЕДИНАЯ ФУНКЦИЯ ОПРЕДЕЛЕНИЯ СТАТУСА ДАВЛЕНИЯ (5 уровней)
 * Синхронизирована с порогами цветового кодирования графика (100..129 и 60..84).
 * Используется для главной карточки, карточки "Замеров в норме" и списка Истории.
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
      textCol: theme === 'dark' ? '#96A099' : '#7A827D',
      icon: null
    };
  }

  const sysVeryLow = thresholds?.systolic?.veryLow ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.veryLow;
  const sysLow = thresholds?.systolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.low;
  const sysNormalMax = thresholds?.systolic?.normalMax ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.normalMax;
  const sysHigh = thresholds?.systolic?.high ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.high;

  const diaVeryLow = thresholds?.diastolic?.veryLow ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.veryLow;
  const diaLow = thresholds?.diastolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.low;
  const diaNormalMax = thresholds?.diastolic?.normalMax ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.normalMax;
  const diaHigh = thresholds?.diastolic?.high ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.high;

  const pick = (entry, key, isNormal = false) => ({
    key,
    isNormal,
    text: entry.text,
    bg: theme === 'dark' ? entry.darkBg : entry.lightBg,
    textCol: theme === 'dark' ? entry.darkText : entry.lightText,
    icon: entry.icon
  });

  // 1. Высокое ↑ (выход на уровень гипертонии: >= 140 или >= 90)
  if (sys >= sysHigh || dia >= diaHigh) {
    return pick(STATUS_BADGE_PALETTE.high, 'high', false);
  }

  // 2. Низкое ↓ (выраженная гипотония: < 90 или < 55)
  if (sys < sysVeryLow || dia < diaVeryLow) {
    return pick(STATUS_BADGE_PALETTE.low, 'low', false);
  }

  // 3. Выше нормы (выше зеленого/голубого коридора: 130..139 или 85..89)
  if (sys > sysNormalMax || dia > diaNormalMax) {
    return pick(STATUS_BADGE_PALETTE.aboveNormal, 'aboveNormal', false);
  }

  // 4. Ниже нормы (умеренное снижение: 90..99 или 55..59)
  if (sys < sysLow || dia < diaLow) {
    return pick(STATUS_BADGE_PALETTE.belowNormal, 'belowNormal', false);
  }

  // 5. В норме (строго внутри коридора 100..129 и 60..84)
  return pick(STATUS_BADGE_PALETTE.normal, 'normal', true);
};

/**
 * Рассчитывает точные процентные позиции Gradient Stops относительно вертикальной шкалы Y.
 */
export const computeStrokeGradientStops = ({
  yMin,
  yMax,
  lowThreshold,
  highThreshold,
  lowFullColorAt,
  highFullColorAt,
  palette
}) => {
  const span = Math.max(1, yMax - yMin);
  const toPercent = (val) => {
    const clamped = Math.min(yMax, Math.max(yMin, val));
    return `${(((yMax - clamped) / span) * 100).toFixed(2)}%`;
  };

  const highExtremeVal = Math.min(
    yMax,
    typeof highFullColorAt === 'number' ? highFullColorAt : highThreshold + 14
  );

  const lowExtremeVal = Math.max(
    yMin,
    typeof lowFullColorAt === 'number' ? lowFullColorAt : lowThreshold - 10
  );

  return [
    { offset: toPercent(highExtremeVal), color: palette.highPeak },
    { offset: toPercent(highThreshold), color: palette.upperNormal },
    { offset: toPercent(lowThreshold), color: palette.lowerNormal },
    { offset: toPercent(lowExtremeVal), color: palette.lowValley }
  ];
};