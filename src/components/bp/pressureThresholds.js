// Конфигурация пороговых значений, целевой нормы и цветовых схем графика (ESC/ESH + Figma Spec)
// Все пороги вынесены в единый конфигурационный объект для будущего управления из настроек профиля.

export const DEFAULT_PRESSURE_THRESHOLDS = {
  // Целевая норма (отображается двумя пунктирными линиями и цифрами слева на графике)
  targetNorm: {
    sys: 120,
    dia: 80
  },
  // Верхнее (систолическое) давление:
  // 100..129 — зеленый коридор ("В норме")
  // > 129 — начало перехода в желто-оранжевый (130..139 "Повышенное", >= 140 "Высокое")
  // < 100 — начало перехода в фиолетовый ("Низкое")
  systolic: {
    low: 100,
    normalMax: 129,
    high: 140,
    highFullColorAt: 145,
    lowFullColorAt: 88
  },
  // Нижнее (диастолическое) давление:
  // 60..84 — бирюзово-голубой коридор ("В норме")
  // > 84 — начало перехода в желто-оранжевый (85..89 "Повышенное", >= 90 "Высокое")
  // < 60 — начало перехода в фиолетовый ("Низкое")
  diastolic: {
    low: 60,
    normalMax: 84,
    high: 90,
    highFullColorAt: 92,
    lowFullColorAt: 53
  }
};

// Сочная палитра линий и заливок из раскладки Figma
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
 * Если в профиле пользователя (user.pressureThresholds) будут заданы персональные настройки,
 * они безопасно переопределят дефолтные константы.
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
 * ЕДИНАЯ ФУНКЦИЯ ОПРЕДЕЛЕНИЯ СТАТУСА ДАВЛЕНИЯ
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
      textCol: theme === 'dark' ? '#96A099' : '#7A827D'
    };
  }

  const sysLow = thresholds?.systolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.low;
  const sysNormalMax = thresholds?.systolic?.normalMax ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.normalMax;
  const sysHigh = thresholds?.systolic?.high ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.high;

  const diaLow = thresholds?.diastolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.low;
  const diaNormalMax = thresholds?.diastolic?.normalMax ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.normalMax;
  const diaHigh = thresholds?.diastolic?.high ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.high;

  // 1. Высокое (выход на уровень гипертонии: >= 140 или >= 90)
  if (sys >= sysHigh || dia >= diaHigh) {
    return {
      key: 'high',
      isNormal: false,
      text: 'Высокое',
      bg: theme === 'dark' ? '#4A3520' : '#FCE0BD',
      textCol: theme === 'dark' ? '#FDAD62' : '#181C24'
    };
  }

  // 2. Низкое (ниже нижнего порога нормы: < 100 или < 60)
  if (sys < sysLow || dia < diaLow) {
    return {
      key: 'low',
      isNormal: false,
      text: 'Низкое',
      bg: theme === 'dark' ? '#32264D' : '#DCD2F2',
      textCol: theme === 'dark' ? '#C4B0FF' : '#181C24'
    };
  }

  // 3. Повышенное (выше зеленого/голубого коридора: 130..139 или 85..89)
  if (sys > sysNormalMax || dia > diaNormalMax) {
    return {
      key: 'elevated',
      isNormal: false,
      text: 'Повышенное',
      bg: theme === 'dark' ? '#3E342A' : '#F2E6D8',
      textCol: theme === 'dark' ? '#EBC89E' : '#181C24'
    };
  }

  // 4. В норме (строго внутри коридора 100..129 и 60..84)
  return {
    key: 'normal',
    isNormal: true,
    text: 'В норме',
    bg: theme === 'dark' ? '#223042' : '#E4EEFC',
    textCol: theme === 'dark' ? '#BDD6FA' : '#181C24'
  };
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
  lowFullColorAt,
  highFullColorAt,
  palette
}) => {
  const span = Math.max(1, yMax - yMin);
  const toPercent = (val) => {
    const clamped = Math.min(yMax, Math.max(yMin, val));
    return `${(((yMax - clamped) / span) * 100).toFixed(2)}%`;
  };

  // Точка полного раскрытия оранжевого пика выше верхнего порога
  const highExtremeVal = Math.min(
    yMax,
    typeof highFullColorAt === 'number' ? highFullColorAt : highThreshold + 14
  );

  // Точка полного раскрытия фиолетового спада ниже нижнего порога
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