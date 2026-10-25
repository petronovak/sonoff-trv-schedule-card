/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  calculateIntervals,
  DayInfo,
  DayOfWeek,
  DAYS_INFO,
  formatTempNumber,
  getActiveInterval,
  getTemperatureColor,
  ScheduleTransition,
} from '../types/trv.ts';
import { I18N, Language } from '../types/i18n.ts';
import { ScheduleTimelineBar } from './ScheduleTimelineBar.tsx';
import {
  Flame,
  Battery,
  Edit3,
  CheckCircle2,
} from 'lucide-react';

interface LovelaceCardPreviewProps {
  title: string;
  entityPrefix: string;
  climateEntity?: string;
  currentTemp?: number;
  targetTemp?: number;
  battery?: number;
  hvacAction?: 'heating' | 'idle' | 'off';
  schedules: Record<DayOfWeek, ScheduleTransition[]>;
  onEditDay: (day: DayOfWeek) => void;
  onCopyDay: (fromDay: DayOfWeek, toDays: DayOfWeek[]) => void;
  lang: Language;
}

export const LovelaceCardPreview: React.FC<LovelaceCardPreviewProps> = ({
  title,
  entityPrefix,
  climateEntity,
  currentTemp = 21.8,
  targetTemp = 23.0,
  battery = 92,
  hvacAction = 'heating',
  schedules,
  onEditDay,
  onCopyDay,
  lang,
}) => {
  const t = I18N[lang];

  // Determine current day of week (0 is Sunday, 1 is Monday ...)
  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayIndex);
  const [viewMode, setViewMode] = useState<'tabs' | 'list'>('tabs');
  const [copiedNotification, setCopiedNotification] = useState<string>('');

  const selectedDay = DAYS_INFO[selectedDayIndex];
  const dayDisplayName = lang === 'en' ? selectedDay.nameEn : selectedDay.nameUk;
  const activeDayTransitions = schedules[selectedDay.key] || [{ time: '00:00', temperature: 20 }];
  const intervals = calculateIntervals(activeDayTransitions);

  // Active period right now
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isSelectedToday = selectedDayIndex === todayIndex;
  const currentInterval = isSelectedToday ? getActiveInterval(intervals, currentMinutes) : null;

  const handleQuickCopy = (e: React.MouseEvent, target: 'weekdays' | 'weekend' | 'all') => {
    e.stopPropagation();
    let targets: DayOfWeek[] = [];
    let notif = '';
    if (target === 'weekdays') {
      targets = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      notif = t.copiedNotificationWeekdays;
    } else if (target === 'weekend') {
      targets = ['saturday', 'sunday'];
      notif = t.copiedNotificationWeekend;
    } else {
      targets = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      notif = t.copiedNotificationAll;
    }

    onCopyDay(selectedDay.key, targets);
    setCopiedNotification(notif);
    setTimeout(() => setCopiedNotification(''), 3000);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Visual Home Assistant Card Shell */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
        {/* Card Header */}
        <div className="p-5 pb-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate tracking-tight">
                {title || (lang === 'en' ? 'Sonoff TRVZB Heating Schedule' : 'Розклад термоголовки Sonoff TRVZB')}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
                <span>{entityPrefix || 'text.trv_vitalnia'}</span>
              </div>
            </div>
          </div>

          {/* Climate badge if configured */}
          {climateEntity && (
            <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400">{t.currentTempLabel}</div>
                <div className="text-sm font-bold text-white font-mono tabular-nums">
                  {formatTempNumber(currentTemp)}°C
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-right">
                <div className="text-xs text-slate-400">{t.targetTempLabel}</div>
                <div className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                  {formatTempNumber(targetTemp)}°C
                </div>
              </div>
              {battery !== undefined && (
                <>
                  <div className="w-px h-6 bg-slate-800" />
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono tabular-nums">{battery}%</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* View Mode & Tabs Bar */}
        <div className="px-5 pt-4 flex items-center justify-between gap-2">
          {/* Day Selector Buttons */}
          <div className="grid grid-cols-7 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 flex-1">
            {DAYS_INFO.map((d, i) => {
              const isToday = i === todayIndex;
              const isSelected = i === selectedDayIndex && viewMode === 'tabs';
              const shortLabel = lang === 'en' ? d.shortEn : d.shortUk;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setSelectedDayIndex(i);
                    setViewMode('tabs');
                  }}
                  className={`py-2 px-1 text-center rounded-lg transition-all text-xs flex flex-col items-center gap-1 relative ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="leading-none">{shortLabel}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isToday
                        ? isSelected
                          ? 'bg-amber-300'
                          : 'bg-amber-400 ring-2 ring-amber-400/40'
                        : isSelected
                        ? 'bg-white/40'
                        : 'bg-transparent'
                    }`}
                    title={isToday ? t.todayBadge : ''}
                  />
                </button>
              );
            })}
          </div>

          {/* Toggle View: Day Tabs or All 7 Days */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'tabs' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title={t.viewDay}
            >
              {t.viewDay}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title={t.viewWeek}
            >
              {t.viewWeek}
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {copiedNotification && (
          <div className="mx-5 mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Mode 1: Single Day View */}
        {viewMode === 'tabs' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{dayDisplayName}</span>
                {isSelectedToday && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
                    {t.todayBadge}
                  </span>
                )}
                {selectedDay.isWeekend && (
                  <span className="text-[10px] text-slate-500">{t.weekendBadge}</span>
                )}
              </div>
              <span className="font-mono text-slate-500">
                {activeDayTransitions.length} / 6 {t.periodsCount}
              </span>
            </div>

            {/* Visual 24h Timeline Bar */}
            <ScheduleTimelineBar
              transitions={activeDayTransitions}
              isToday={isSelectedToday}
              onSelectInterval={() => onEditDay(selectedDay.key)}
            />

            {/* Currently Active Interval Highlight */}
            {isSelectedToday && currentInterval && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400">{t.activeNow}</span>
                  <span className="font-mono text-slate-200">
                    {currentInterval.startTime} - {currentInterval.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t.targetTempLabel}</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm tabular-nums">
                    {formatTempNumber(currentInterval.temperature)}°C
                  </span>
                </div>
              </div>
            )}

            {/* List of Intervals */}
            <div className="space-y-2">
              {intervals.map((iv, idx) => {
                const color = getTemperatureColor(iv.temperature);
                const isNow = isSelectedToday && currentInterval?.index === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => onEditDay(selectedDay.key)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isNow
                        ? 'bg-slate-800/90 border-sky-500/50 shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center font-mono text-xs font-semibold text-slate-400">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-mono text-sm text-slate-200 font-medium tabular-nums">
                          <span>{iv.startTime}</span>
                          <span className="text-slate-500">→</span>
                          <span>{iv.endTime}</span>
                          <span className="text-xs text-slate-500 font-sans">
                            ({Math.round((iv.durationMinutes / 60) * 10) / 10} {lang === 'en' ? 'h' : 'год'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${color.badgeBg}`}>
                        {formatTempNumber(iv.temperature)}°C
                      </span>
                      <Edit3 className="w-4 h-4 text-slate-500 hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions for current day */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEditDay(selectedDay.key)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t.btnEditSchedule} ({dayDisplayName})</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={e => handleQuickCopy(e, 'weekdays')}
                  className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors"
                  title={t.btnCopyWeekdays}
                >
                  {t.btnCopyWeekdays}
                </button>
                <button
                  type="button"
                  onClick={e => handleQuickCopy(e, 'all')}
                  className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors"
                  title={t.btnCopyAll}
                >
                  {t.btnCopyAll}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: All 7 Days Week Overview */}
        {viewMode === 'list' && (
          <div className="p-5 space-y-3">
            <div className="text-xs text-slate-400 mb-1">
              {t.clickToEditWeek}
            </div>
            {DAYS_INFO.map((d, i) => {
              const dayTransitions = schedules[d.key] || [{ time: '00:00', temperature: 20 }];
              const isToday = i === todayIndex;
              const name = lang === 'en' ? d.nameEn : d.nameUk;

              return (
                <div
                  key={d.key}
                  onClick={() => onEditDay(d.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    isToday
                      ? 'bg-slate-800/80 border-sky-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{name}</span>
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold">
                          {t.todayBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {dayTransitions.length} {t.modalPointsCount}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* 24h compact timeline */}
                  <ScheduleTimelineBar
                    transitions={dayTransitions}
                    compact={true}
                    interactive={false}
                    isToday={isToday}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
