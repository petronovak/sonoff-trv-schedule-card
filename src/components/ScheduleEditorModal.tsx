/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DayInfo,
  DayOfWeek,
  DAYS_INFO,
  formatScheduleString,
  formatTempNumber,
  getTemperatureColor,
  normalizeTemperature,
  ScheduleTransition,
  TEMPERATURE_PRESETS,
  timeToMinutes,
} from '../types/trv.ts';
import { I18N, Language } from '../types/i18n.ts';
import { ScheduleTimelineBar } from './ScheduleTimelineBar.tsx';
import {
  Calendar,
  Clock,
  Copy,
  Plus,
  Trash2,
  X,
  Check,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  Square,
} from 'lucide-react';

interface ScheduleEditorModalProps {
  dayInfo: DayInfo;
  entityId: string;
  initialTransitions: ScheduleTransition[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (transitions: ScheduleTransition[]) => void;
  onBulkCopy: (targetDays: DayOfWeek[], transitions: ScheduleTransition[]) => void;
  lang: Language;
}

export const ScheduleEditorModal: React.FC<ScheduleEditorModalProps> = ({
  dayInfo,
  entityId,
  initialTransitions,
  isOpen,
  onClose,
  onSave,
  onBulkCopy,
  lang,
}) => {
  const t = I18N[lang];
  const [transitions, setTransitions] = useState<ScheduleTransition[]>(() =>
    JSON.parse(JSON.stringify(initialTransitions))
  );

  const [copySuccessMsg, setCopySuccessMsg] = useState<string>('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    targetDays: DayOfWeek[];
    notif: string;
  } | null>(null);

  // Custom Days Selection Modal state
  const [customDaysModal, setCustomDaysModal] = useState<{
    isOpen: boolean;
    selectedKeys: Set<DayOfWeek>;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTransitions(JSON.parse(JSON.stringify(initialTransitions)));
      setCopySuccessMsg('');
      setConfirmModal(null);
      setCustomDaysModal(null);
    }
  }, [isOpen, initialTransitions]);

  const rawString = useMemo(() => formatScheduleString(transitions), [transitions]);

  const validation = useMemo(() => {
    const count = transitions.length;
    const hasZero = transitions.some(tr => tr.time === '00:00');
    const isValid = count >= 1 && count <= 6 && hasZero;
    return {
      isValid,
      count,
      max: 6,
    };
  }, [transitions]);

  if (!isOpen) return null;

  const dayTitle = lang === 'en' ? dayInfo.nameEn : dayInfo.nameUk;

  const handleTimeChange = (index: number, newTime: string) => {
    if (index === 0) return;
    setTransitions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], time: newTime };
      return copy.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    });
  };

  const handleTempChange = (index: number, newTemp: number) => {
    setTransitions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], temperature: normalizeTemperature(newTemp) };
      return copy;
    });
  };

  const handleAddTransition = () => {
    if (transitions.length >= 6) return;

    const existingMinutes = transitions.map(tr => timeToMinutes(tr.time));
    let candidateMinutes = 12 * 60;
    if (existingMinutes.includes(candidateMinutes)) {
      candidateMinutes = 16 * 60;
    }
    if (existingMinutes.includes(candidateMinutes)) {
      candidateMinutes = 8 * 60;
    }

    const h = Math.floor(candidateMinutes / 60);
    const m = candidateMinutes % 60;
    const newTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    setTransitions(prev => {
      const copy = [...prev, { time: newTime, temperature: 21.0 }];
      return copy.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    });
  };

  const handleDeleteTransition = (index: number) => {
    if (index === 0) return;
    setTransitions(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (index: number, presetTemp: number) => {
    handleTempChange(index, presetTemp);
  };

  const handlePromptCopyWeekdays = () => {
    const weekdays: DayOfWeek[] = (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]).filter(k => k !== dayInfo.key);
    setConfirmModal({
      isOpen: true,
      title: t.confirmCopyWeekdays.replace('{day}', dayTitle),
      targetDays: weekdays,
      notif: t.modalCopyWeekdaysSuccess,
    });
  };

  const handlePromptCopyWeekend = () => {
    const weekend: DayOfWeek[] = (['saturday', 'sunday'] as DayOfWeek[]).filter(k => k !== dayInfo.key);
    setConfirmModal({
      isOpen: true,
      title: `${t.btnCopyWeekend}: ${dayTitle}`,
      targetDays: weekend,
      notif: t.modalCopyWeekendSuccess,
    });
  };

  const handlePromptCopyAll = () => {
    const allDays: DayOfWeek[] = (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayOfWeek[]).filter(k => k !== dayInfo.key);
    setConfirmModal({
      isOpen: true,
      title: t.confirmCopyAll.replace('{day}', dayTitle),
      targetDays: allDays,
      notif: t.modalCopyAllSuccess,
    });
  };

  const handleOpenCustomDays = () => {
    const otherDays = DAYS_INFO.filter(d => d.key !== dayInfo.key).map(d => d.key);
    setCustomDaysModal({
      isOpen: true,
      selectedKeys: new Set(otherDays),
    });
  };

  const handleConfirmCopy = () => {
    if (!confirmModal) return;
    onBulkCopy(confirmModal.targetDays, transitions);
    setCopySuccessMsg(confirmModal.notif);
    setConfirmModal(null);
    setTimeout(() => setCopySuccessMsg(''), 3000);
  };

  const handleApplyCustomDays = () => {
    if (!customDaysModal) return;
    const targets = Array.from(customDaysModal.selectedKeys);
    onBulkCopy(targets, transitions);
    setCopySuccessMsg(`${t.copiedNotificationCustom} (${targets.length})`);
    setCustomDaysModal(null);
    setTimeout(() => setCopySuccessMsg(''), 3000);
  };

  const toggleCustomDay = (key: DayOfWeek) => {
    if (!customDaysModal) return;
    const next = new Set(customDaysModal.selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setCustomDaysModal({ ...customDaysModal, selectedKeys: next });
  };

  const selectAllCustomDays = () => {
    if (!customDaysModal) return;
    const all = DAYS_INFO.filter(d => d.key !== dayInfo.key).map(d => d.key);
    setCustomDaysModal({ ...customDaysModal, selectedKeys: new Set(all) });
  };

  const deselectAllCustomDays = () => {
    if (!customDaysModal) return;
    setCustomDaysModal({ ...customDaysModal, selectedKeys: new Set() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t.modalTitle} {dayTitle}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {transitions.length} / 6 {t.modalPointsCount}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-sm">
                {entityId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Visual 24h Timeline */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-medium text-slate-300">{t.modalScale24h}</span>
              <span className="font-mono text-[11px] text-slate-400">
                {t.modalStepInfo}
              </span>
            </div>
            <ScheduleTimelineBar transitions={transitions} compact={false} />
          </div>

          {/* Periods List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t.modalTransitionPoints}
              </h4>
              <button
                type="button"
                onClick={handleAddTransition}
                disabled={transitions.length >= 6}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  transitions.length >= 6
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                    : 'bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.btnAddPeriod}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {transitions.map((item, idx) => {
                const color = getTemperatureColor(item.temperature);
                const isFirst = idx === 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors hover:border-slate-600"
                  >
                    {/* Time Input */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 font-mono">
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {isFirst ? (
                          <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono text-sm font-semibold flex items-center gap-1.5">
                            <span>00:00</span>
                            <span className="text-[10px] text-slate-500 font-sans">{t.dayStartLocked}</span>
                          </div>
                        ) : (
                          <input
                            type="time"
                            value={item.time}
                            onChange={e => handleTimeChange(idx, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Temperature Controls & Presets */}
                    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                      {/* +/- Steppers and Value */}
                      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleTempChange(idx, item.temperature - 0.5)}
                          disabled={item.temperature <= 4.0}
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm disabled:opacity-40"
                          title="-0.5°C"
                        >
                          −
                        </button>

                        <div className="w-16 text-center">
                          <span className="font-mono text-sm font-bold text-white tabular-nums">
                            {formatTempNumber(item.temperature)}°C
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTempChange(idx, item.temperature + 0.5)}
                          disabled={item.temperature >= 35.0}
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm disabled:opacity-40"
                          title="+0.5°C"
                        >
                          +
                        </button>
                      </div>

                      {/* Temperature Range Slider */}
                      <input
                        type="range"
                        min="4"
                        max="35"
                        step="0.5"
                        value={item.temperature}
                        onChange={e => handleTempChange(idx, parseFloat(e.target.value))}
                        className="w-24 accent-sky-400 cursor-pointer hidden sm:block"
                      />

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        {TEMPERATURE_PRESETS.slice(1, 5).map(pr => (
                          <button
                            key={pr.label}
                            type="button"
                            onClick={() => handleApplyPreset(idx, pr.temperature)}
                            className={`px-1.5 py-1 text-[10px] font-medium rounded transition-colors ${
                              item.temperature === pr.temperature
                                ? 'bg-amber-400 text-slate-950 font-bold shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title={`${pr.temperature}°C`}
                          >
                            {pr.temperature}°
                          </button>
                        ))}
                      </div>

                      {/* Delete Button */}
                      {!isFirst ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTransition(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-7 hidden md:block" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Copy Section */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                {t.modalQuickCopy}
              </span>
              {copySuccessMsg && (
                <span className="text-xs text-emerald-400 font-medium animate-fade-in">
                  {copySuccessMsg}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePromptCopyWeekdays}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {t.btnCopyWeekdays}
              </button>
              <button
                type="button"
                onClick={handlePromptCopyWeekend}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {t.btnCopyWeekend}
              </button>
              <button
                type="button"
                onClick={handlePromptCopyAll}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {t.btnCopyAll}
              </button>
              <button
                type="button"
                onClick={handleOpenCustomDays}
                className="px-3 py-1.5 text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
              >
                {t.btnCopyCustom}
              </button>
            </div>
          </div>

          {/* Zigbee2MQTT Raw String Preview */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {t.modalRawServiceString}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">{t.modalValidated}</span>
            </div>
            <div className="font-mono text-xs text-sky-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 select-all overflow-x-auto whitespace-nowrap">
              {rawString}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {t.modalCancel}
          </button>

          <button
            type="button"
            onClick={() => {
              onSave(transitions);
              onClose();
            }}
            disabled={!validation.isValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{t.modalSave}</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {confirmModal && confirmModal.isOpen && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-white tracking-tight">{t.confirmCopyTitle}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmModal.title}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap py-1">
                {confirmModal.targetDays.map(k => {
                  const day = DAYS_INFO.find(d => d.key === k);
                  return (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {lang === 'en' ? day?.nameEn : day?.nameUk}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  {t.cancelAction}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCopy}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                >
                  {t.confirmAction}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Days Selection Modal */}
        {customDaysModal && customDaysModal.isOpen && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sky-400">
                  <Calendar className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-white tracking-tight">{t.selectDaysTitle}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomDaysModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300">
                {t.selectDaysSubtitle.replace('{day}', dayTitle)}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={selectAllCustomDays}
                  className="text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  {t.selectAll}
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={deselectAllCustomDays}
                  className="text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  {t.deselectAll}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {DAYS_INFO.map(d => {
                  const isCurrent = d.key === dayInfo.key;
                  const isChecked = customDaysModal.selectedKeys.has(d.key);
                  const label = lang === 'en' ? d.nameEn : d.nameUk;
                  return (
                    <div
                      key={d.key}
                      onClick={() => !isCurrent && toggleCustomDay(d.key)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'opacity-40 cursor-not-allowed bg-slate-950/50 border-slate-800'
                          : isChecked
                          ? 'bg-sky-950/40 border-sky-500/50 text-white'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="font-medium">{label}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-slate-500">
                            ({lang === 'en' ? 'current' : 'поточний'})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCustomDaysModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  {t.cancelAction}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDays}
                  disabled={customDaysModal.selectedKeys.size === 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t.applyToSelected} ({customDaysModal.selectedKeys.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
