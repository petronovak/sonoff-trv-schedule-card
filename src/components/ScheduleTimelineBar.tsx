/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  calculateIntervals,
  formatTempNumber,
  getActiveInterval,
  getTemperatureColor,
  ScheduleTransition,
} from '../types/trv.ts';

interface ScheduleTimelineBarProps {
  transitions: ScheduleTransition[];
  isToday?: boolean;
  onSelectInterval?: (index: number) => void;
  interactive?: boolean;
  compact?: boolean;
}

export const ScheduleTimelineBar: React.FC<ScheduleTimelineBarProps> = ({
  transitions,
  isToday = false,
  onSelectInterval,
  interactive = true,
  compact = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const intervals = useMemo(() => calculateIntervals(transitions), [transitions]);

  // Current time in minutes for today marker
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activeInterval = useMemo(
    () => (isToday ? getActiveInterval(intervals, currentMinutes) : null),
    [intervals, isToday, currentMinutes]
  );

  const nowPct = Math.min(100, Math.max(0, (currentMinutes / 1440) * 100));

  return (
    <div className="w-full select-none">
      {/* 24-Hour Bar Container */}
      <div
        className={`relative w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-700/60 shadow-inner flex ${
          compact ? 'h-6' : 'h-9'
        }`}
      >
        {intervals.map((interval, idx) => {
          const widthPct = (interval.durationMinutes / 1440) * 100;
          const color = getTemperatureColor(interval.temperature);
          const isHovered = hoveredIndex === idx;
          const isActiveNow = isToday && activeInterval?.index === idx;

          return (
            <button
              key={`${interval.startTime}-${idx}`}
              type="button"
              onClick={() => onSelectInterval?.(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: `${widthPct}%`,
                backgroundColor: color.hex,
              }}
              className={`relative h-full transition-all duration-150 flex items-center justify-center text-center focus:outline-none ${
                interactive ? 'cursor-pointer hover:brightness-110 active:brightness-95' : 'cursor-default'
              } ${isHovered ? 'ring-2 ring-white/80 z-10' : ''}`}
              title={`${interval.startTime} - ${interval.endTime}: ${formatTempNumber(interval.temperature)}°C (${color.labelUk})`}
            >
              {/* Show temperature label if segment is wide enough */}
              {widthPct >= 8 && (
                <span
                  className={`font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tabular-nums ${
                    compact ? 'text-[10px]' : 'text-xs'
                  }`}
                >
                  {formatTempNumber(interval.temperature)}°
                </span>
              )}

              {/* Active Now border glow */}
              {isActiveNow && (
                <div className="absolute inset-0 border-2 border-white/90 animate-pulse pointer-events-none" />
              )}
            </button>
          );
        })}

        {/* Current Time Needle (if today) */}
        {isToday && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${nowPct}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 shadow-md -mt-0.5" />
            <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>
        )}
      </div>

      {/* Hour Markers (0h, 4h, 8h, 12h, 16h, 20h, 24h) */}
      {!compact && (
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5 pt-1.5 font-mono tabular-nums">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span className="font-semibold text-slate-300">12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>
      )}
    </div>
  );
};
