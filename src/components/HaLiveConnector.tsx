/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DAYS_INFO,
  DayOfWeek,
} from '../types/trv.ts';
import { I18N, Language } from '../types/i18n.ts';
import {
  Sliders,
  Activity,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export interface ServiceCallLog {
  id: string;
  timestamp: string;
  service: string;
  entityId: string;
  value: string;
  status: 'success' | 'error';
}

interface HaLiveConnectorProps {
  cardTitle: string;
  onCardTitleChange: (val: string) => void;
  entityPrefix: string;
  onEntityPrefixChange: (val: string) => void;
  climateEntity: string;
  onClimateEntityChange: (val: string) => void;
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  customEntities: Record<DayOfWeek, string>;
  onCustomEntityChange: (day: DayOfWeek, val: string) => void;
  serviceLogs: ServiceCallLog[];
  onClearLogs: () => void;
  isLiveConnection: boolean;
  onToggleLiveConnection: (enabled: boolean) => void;
  haUrl: string;
  onHaUrlChange: (val: string) => void;
  haToken: string;
  onHaTokenChange: (val: string) => void;
  onTestConnection: () => Promise<void>;
  connectionStatus: 'idle' | 'testing' | 'connected' | 'error';
  connectionError: string;
  lang: Language;
}

export const HaLiveConnector: React.FC<HaLiveConnectorProps> = ({
  cardTitle,
  onCardTitleChange,
  entityPrefix,
  onEntityPrefixChange,
  climateEntity,
  onClimateEntityChange,
  selectedRoomId,
  onSelectRoom,
  customEntities,
  onCustomEntityChange,
  serviceLogs,
  onClearLogs,
  isLiveConnection,
  onToggleLiveConnection,
  haUrl,
  onHaUrlChange,
  haToken,
  onHaTokenChange,
  onTestConnection,
  connectionStatus,
  connectionError,
  lang,
}) => {
  const t = I18N[lang];
  const [showAdvancedEntities, setShowAdvancedEntities] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t.configTitle}</h3>
            <p className="text-xs text-slate-400">{t.configSubtitle}</p>
          </div>
        </div>

        {/* Mode Toggle: Simulation vs Live HA */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onToggleLiveConnection(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !isLiveConnection
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.modeSimulator}
          </button>
          <button
            type="button"
            onClick={() => onToggleLiveConnection(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isLiveConnection
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.modeLiveHa}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Preset Rooms (if in simulator mode) */}
        {!isLiveConnection && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t.quickRoomSelect}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'vitalnia', name: lang === 'en' ? 'Living Room (Screenshot)' : 'Вітальня (як на скріншоті)', prefix: 'text.trv_vitalnia' },
                { id: 'spalnya', name: lang === 'en' ? 'Bedroom (Eco Nights)' : 'Спальня (економні ночі)', prefix: 'text.trv_spalnya' },
                { id: 'dytiacha', name: lang === 'en' ? 'Nursery (Stable 21-22°)' : 'Дитяча (стабільні 21-22°)', prefix: 'text.trv_dytiacha' },
              ].map(room => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRoomId === room.id
                      ? 'bg-sky-950/60 border-sky-500/60 shadow-sm ring-1 ring-sky-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{room.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">{room.prefix}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live HA Configuration */}
        {isLiveConnection && (
          <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Server className="w-4 h-4" />
              <span>{t.liveHaParams}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  {t.haUrlLabel}
                </label>
                <input
                  type="url"
                  value={haUrl}
                  onChange={e => onHaUrlChange(e.target.value)}
                  placeholder="http://homeassistant.local:8123"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  {t.haTokenLabel}
                </label>
                <input
                  type="password"
                  value={haToken}
                  onChange={e => onHaTokenChange(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs">
                {connectionStatus === 'connected' && (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-4 h-4" /> {t.statusConnected}
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4" /> {connectionError}
                  </span>
                )}
                {connectionStatus === 'testing' && (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" /> {t.statusTesting}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onTestConnection}
                disabled={!haUrl || !haToken || connectionStatus === 'testing'}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{t.btnTestConnection}</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Settings Fields */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.cardTitleField}
            </label>
            <input
              type="text"
              value={cardTitle}
              onChange={e => onCardTitleChange(e.target.value)}
              placeholder="Living Room Heating"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-medium focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.entityPrefixField}
            </label>
            <input
              type="text"
              value={entityPrefix}
              onChange={e => onEntityPrefixChange(e.target.value)}
              placeholder="text.trv_vitalnia"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sky-400 font-mono text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.climateEntityField}
            </label>
            <input
              type="text"
              value={climateEntity}
              onChange={e => onClimateEntityChange(e.target.value)}
              placeholder="climate.trv_vitalnia"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Advanced Accordion: Individual 7 Days Override */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvancedEntities(!showAdvancedEntities)}
            className="w-full px-4 py-3 bg-slate-800/40 hover:bg-slate-800/70 text-left flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{t.advancedEntitiesToggle}</span>
            </span>
            {showAdvancedEntities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedEntities && (
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-2">
              <p className="text-xs text-slate-400 mb-3">
                {t.advancedEntitiesHint}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {DAYS_INFO.map(day => (
                  <div key={day.key} className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-slate-400">
                      {lang === 'en' ? day.nameEn : day.nameUk}:
                    </span>
                    <input
                      type="text"
                      value={customEntities[day.key] || `${entityPrefix}_weekly_schedule_${day.key}`}
                      onChange={e => onCustomEntityChange(day.key, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Service Calls Log */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              {t.serviceLogsTitle}
            </span>
            {serviceLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {t.btnClearLogs}
              </button>
            )}
          </div>

          <div className="max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
            {serviceLogs.length === 0 ? (
              <div className="text-slate-500 py-3 text-center font-sans text-xs">
                {t.noLogsMsg}
              </div>
            ) : (
              serviceLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 text-slate-300 border-b border-slate-900 pb-1 last:border-none last:pb-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-500 tabular-nums">{log.timestamp}</span>
                    <span className="text-amber-400 font-semibold">{log.service}</span>
                    <span className="text-sky-300 truncate">{log.entityId}</span>
                  </div>
                  <div className="text-slate-400 shrink-0 select-all font-mono">
                    "{log.value}"
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
