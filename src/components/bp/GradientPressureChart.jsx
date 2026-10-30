import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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
const PLOT_AREA_Y_BOTTOM = 120; // 150px (высота контейнера) - 30px (высота XAxis)

export const GradientPressureChart = ({
  chartData,
  theme,
  thresholds = DEFAULT_PRESSURE_THRESHOLDS,
  onInitialAnimationEnd
}) => {
  // Гарантируем, что шкала Y вмещает экстремальные пики/провалы без обрезания верхушек
  const [yMin, yMax] = useMemo(() => {
    let minVal = 60;
    let maxVal = 152;
    if (Array.isArray(chartData) && chartData.length > 0) {
      chartData.forEach((d) => {
        if (typeof d.dia === 'number' && d.dia < minVal + 4) {
          minVal = Math.min(minVal, Math.floor((d.dia - 6) / 5) * 5);
        }
        if (typeof d.sys === 'number' && d.sys > maxVal - 4) {
          maxVal = Math.max(maxVal, Math.ceil((d.sys + 6) / 5) * 5);
        }
      });
    }
    return [minVal, maxVal];
  }, [chartData]);

  const sysStops = useMemo(
    () =>
      computeStrokeGradientStops({
        yMin,
        yMax,
        lowThreshold: thresholds.systolic.low,
        highThreshold: thresholds.systolic.high,
        palette: STROKE_GRADIENT_PALETTE.systolic,
        transitionSpan: 15
      }),
    [yMin, yMax, thresholds.systolic.low, thresholds.systolic.high]
  );

  const diaStops = useMemo(
    () =>
      computeStrokeGradientStops({
        yMin,
        yMax,
        lowThreshold: thresholds.diastolic.low,
        highThreshold: thresholds.diastolic.high,
        palette: STROKE_GRADIENT_PALETTE.diastolic,
        transitionSpan: 12
      }),
    [yMin, yMax, thresholds.diastolic.low, thresholds.diastolic.high]
  );

  return (
    <ResponsiveContainer width="100%" height="100%" className="relative z-0">
      <AreaChart data={chartData} margin={{ top: 12, right: 0, left: -26, bottom: 0 }}>
        <defs>
          {/* Исходные градиенты заливки (Fill) — без малейших изменений */}
          <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--chart-sys-grad-start)"
              stopOpacity={theme === 'dark' ? 0.35 : 0.8}
            />
            <stop offset="95%" stopColor="var(--chart-sys-grad-end)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--chart-dia-grad-start)"
              stopOpacity={theme === 'dark' ? 0.32 : 0.75}
            />
            <stop offset="95%" stopColor="var(--chart-dia-grad-end)" stopOpacity={0.05} />
          </linearGradient>

          {/* Новые вертикальные градиенты обводки (Stroke) в координатах шкалы Y */}
          <linearGradient
            id="systolicStrokeGradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={PLOT_AREA_Y_TOP}
            x2="0"
            y2={PLOT_AREA_Y_BOTTOM}
          >
            {sysStops.map((stop, idx) => (
              <stop key={`sys-stop-${idx}`} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
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
              <stop key={`dia-stop-${idx}`} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
            ))}
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
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
          ticks={[75, 100, 125]}
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
          strokeWidth={2.4}
          fill="url(#sysFill)"
          animationDuration={380}
          onAnimationEnd={onInitialAnimationEnd}
          activeDot={{
            r: 5,
            fill: 'var(--upper-pressure)',
            stroke: 'var(--dot-stroke)',
            strokeWidth: 2
          }}
        />
        <Area
          type="monotone"
          dataKey="dia"
          stroke="url(#diastolicStrokeGradient)"
          strokeWidth={2.4}
          fill="url(#diaFill)"
          animationDuration={380}
          activeDot={{
            r: 5,
            fill: 'var(--lower-pressure)',
            stroke: 'var(--dot-stroke)',
            strokeWidth: 2
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};