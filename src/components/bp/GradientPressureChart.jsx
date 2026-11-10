import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatHumanDate } from './bpUtils';
import {
  DEFAULT_PRESSURE_THRESHOLDS,
  STROKE_GRADIENT_PALETTE,
  computeStrokeGradientStops
} from './pressureThresholds';

// Геометрия вертикальной области построения Recharts при h-[150px] и margin.top = 12
const PLOT_AREA_Y_TOP = 12;
const PLOT_AREA_Y_BOTTOM = 120;

export const GradientPressureChart = ({
  chartData,
  theme,
  thresholds = DEFAULT_PRESSURE_THRESHOLDS,
  onInitialAnimationEnd
}) => {
  const normSys = thresholds?.targetNorm?.sys ?? DEFAULT_PRESSURE_THRESHOLDS.targetNorm.sys;
  const normDia = thresholds?.targetNorm?.dia ?? DEFAULT_PRESSURE_THRESHOLDS.targetNorm.dia;

  const sysLow = thresholds?.systolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.low;
  const sysNormalMax =
    thresholds?.systolic?.normalMax ??
    thresholds?.systolic?.high ??
    DEFAULT_PRESSURE_THRESHOLDS.systolic.normalMax;
  const sysHighFull =
    thresholds?.systolic?.highFullColorAt ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.highFullColorAt;
  const sysLowFull =
    thresholds?.systolic?.lowFullColorAt ?? DEFAULT_PRESSURE_THRESHOLDS.systolic.lowFullColorAt;

  const diaLow = thresholds?.diastolic?.low ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.low;
  const diaNormalMax =
    thresholds?.diastolic?.normalMax ??
    thresholds?.diastolic?.high ??
    DEFAULT_PRESSURE_THRESHOLDS.diastolic.normalMax;
  const diaHighFull =
    thresholds?.diastolic?.highFullColorAt ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.highFullColorAt;
  const diaLowFull =
    thresholds?.diastolic?.lowFullColorAt ?? DEFAULT_PRESSURE_THRESHOLDS.diastolic.lowFullColorAt;

  // Гарантируем, что шкала Y вмещает и пики/провалы, и целевые линии нормы без обрезания
  const [yMin, yMax] = useMemo(() => {
    let minVal = Math.min(52, normDia - 25);
    let maxVal = Math.max(152, normSys + 32);
    if (Array.isArray(chartData) && chartData.length > 0) {
      chartData.forEach((d) => {
        if (typeof d.dia === 'number' && d.dia < minVal + 4) {
          minVal = Math.min(minVal, Math.floor((d.dia - 5) / 5) * 5);
        }
        if (typeof d.sys === 'number' && d.sys > maxVal - 4) {
          maxVal = Math.max(maxVal, Math.ceil((d.sys + 5) / 5) * 5);
        }
      });
    }
    return [minVal, maxVal];
  }, [chartData, normSys, normDia]);

  const sysStops = useMemo(
    () =>
      computeStrokeGradientStops({
        yMin,
        yMax,
        lowThreshold: sysLow,
        highThreshold: sysNormalMax,
        lowFullColorAt: sysLowFull,
        highFullColorAt: sysHighFull,
        palette: STROKE_GRADIENT_PALETTE.systolic
      }),
    [yMin, yMax, sysLow, sysNormalMax, sysLowFull, sysHighFull]
  );

  const diaStops = useMemo(
    () =>
      computeStrokeGradientStops({
        yMin,
        yMax,
        lowThreshold: diaLow,
        highThreshold: diaNormalMax,
        lowFullColorAt: diaLowFull,
        highFullColorAt: diaHighFull,
        palette: STROKE_GRADIENT_PALETTE.diastolic
      }),
    [yMin, yMax, diaLow, diaNormalMax, diaLowFull, diaHighFull]
  );

  return (
    <ResponsiveContainer width="100%" height="100%" className="relative z-0">
      <AreaChart data={chartData} margin={{ top: 12, right: 0, left: -24, bottom: 0 }}>
        <defs>
          {/* Сочные градиенты заливки (Fill: 40% -> 0% по схеме Figma) */}
          <linearGradient id="sysFillV2" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={STROKE_GRADIENT_PALETTE.systolic.fillColor}
              stopOpacity={theme === 'dark' ? 0.32 : 0.4}
            />
            <stop
              offset="100%"
              stopColor={STROKE_GRADIENT_PALETTE.systolic.fillColor}
              stopOpacity={0}
            />
          </linearGradient>

          <linearGradient id="diaFillV2" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={STROKE_GRADIENT_PALETTE.diastolic.fillColor}
              stopOpacity={theme === 'dark' ? 0.3 : 0.4}
            />
            <stop
              offset="100%"
              stopColor={STROKE_GRADIENT_PALETTE.diastolic.fillColor}
              stopOpacity={0}
            />
          </linearGradient>

          {/* Вертикальные градиенты обводки (Stroke) в координатах шкалы Y */}
          <linearGradient
            id="systolicStrokeGradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={PLOT_AREA_Y_TOP}
            x2="0"
            y2={PLOT_AREA_Y_BOTTOM}
          >
            {sysStops.map((stop, idx) => (
              <stop
                key={`sys-stop-${idx}`}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={1}
              />
            ))}
          </linearGradient>

          <linearGradient
            id="diastolicStrokeGradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={PLOT_AREA_Y_TOP}
            x2="0"
            y2={PLOT_AREA_Y_BOTTOM}
          >
            {diaStops.map((stop, idx) => (
              <stop
                key={`dia-stop-${idx}`}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={1}
              />
            ))}
          </linearGradient>
        </defs>

        {/* СТРОГО ДВЕ горизонтальные пунктирные линии на уровнях нормы (120 и 80), без крайних линий сверху/снизу */}
        <ReferenceLine
          y={normSys}
          stroke="var(--chart-grid)"
          strokeDasharray="3 3"
          ifOverflow="extendDomain"
        />
        <ReferenceLine
          y={normDia}
          stroke="var(--chart-grid)"
          strokeDasharray="3 3"
          ifOverflow="extendDomain"
        />

        <XAxis
          dataKey="shortLabel"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
          minTickGap={34}
        />

        <YAxis
          domain={[yMin, yMax]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
          ticks={[normDia, normSys]}
          interval={0}
        />

        <Tooltip
          wrapperStyle={{ zIndex: 100 }}
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const item = payload[0].payload;
            return (
              <div className="bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] rounded-[20px] px-4 py-3">
                <div className="text-xs text-[var(--tooltip-sub)] mb-0.5">
                  {formatHumanDate(item.date)} · {item.time}
                </div>
                <div className="text-lg font-bold">
                  {item.sys}/{item.dia}{' '}
                  {item.pulse && (
                    <span className="text-sm font-normal text-[#D6EBB4] ml-1">
                      ♥ {item.pulse}
                    </span>
                  )}
                </div>
                {item.note && (
                  <div className="text-xs text-[var(--tooltip-note)] mt-1 max-w-[200px] leading-snug">
                    {item.note}
                  </div>
                )}
              </div>
            );
          }}
        />

        <Area
          type="monotone"
          dataKey="sys"
          stroke="url(#systolicStrokeGradient)"
          strokeWidth={2.6}
          fill="url(#sysFillV2)"
          animationDuration={380}
          onAnimationEnd={onInitialAnimationEnd}
          activeDot={{
            r: 5,
            fill: STROKE_GRADIENT_PALETTE.systolic.upperNormal,
            stroke: 'var(--dot-stroke)',
            strokeWidth: 2
          }}
        />
        <Area
          type="monotone"
          dataKey="dia"
          stroke="url(#diastolicStrokeGradient)"
          strokeWidth={2.6}
          fill="url(#diaFillV2)"
          animationDuration={380}
          activeDot={{
            r: 5,
            fill: STROKE_GRADIENT_PALETTE.diastolic.upperNormal,
            stroke: 'var(--dot-stroke)',
            strokeWidth: 2
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};