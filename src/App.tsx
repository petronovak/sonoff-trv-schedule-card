/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DayOfWeek,
  DAYS_INFO,
  formatScheduleString,
  parseScheduleString,
  ScheduleTransition,
} from './types/trv.ts';
import { I18N, Language } from './types/i18n.ts';
import { ROOM_PRESETS } from './services/mockData.ts';
import { LovelaceCardPreview } from './components/LovelaceCardPreview.tsx';
import { ScheduleEditorModal } from './components/ScheduleEditorModal.tsx';
import { CardExporter } from './components/CardExporter.tsx';
import { HaLiveConnector, ServiceCallLog } from './components/HaLiveConnector.tsx';
import {
  Flame,
  Download,
  ExternalLink,
  HelpCircle,
  Globe,
} from 'lucide-react';

export default function App() {
  // Localization: 'uk' or 'en'
  const [lang, setLang] = useState<Language>('uk');
  const t = I18N[lang];

  // Current active preset room
  const [selectedRoomId, setSelectedRoomId] = useState<string>('vitalnia');
  const activePreset = ROOM_PRESETS.find(r => r.id === selectedRoomId) || ROOM_PRESETS[0];

  // Card configuration
  const [cardTitle, setCardTitle] = useState<string>(
    lang === 'en' ? 'Living Room Heating Schedule' : 'Розклад термоголовки (Вітальня)'
  );
  const [entityPrefix, setEntityPrefix] = useState<string>('text.trv_vitalnia');
  const [climateEntity, setClimateEntity] = useState<string>('climate.trv_vitalnia');

  // Individual custom entity overrides if needed
  const [customEntities, setCustomEntities] = useState<Record<DayOfWeek, string>>({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });

  // Schedule state for each day (stored as parsed transitions)
  const [schedules, setSchedules] = useState<Record<DayOfWeek, ScheduleTransition[]>>(() => {
    const initial: Record<DayOfWeek, ScheduleTransition[]> = {
      monday: parseScheduleString(activePreset.schedules.monday),
      tuesday: parseScheduleString(activePreset.schedules.tuesday),
      wednesday: parseScheduleString(activePreset.schedules.wednesday),
      thursday: parseScheduleString(activePreset.schedules.thursday),
      friday: parseScheduleString(activePreset.schedules.friday),
      saturday: parseScheduleString(activePreset.schedules.saturday),
      sunday: parseScheduleString(activePreset.schedules.sunday),
    };
    return initial;
  });

  // Modal editor state
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);

  // Service call logs
  const [serviceLogs, setServiceLogs] = useState<ServiceCallLog[]>([]);

  // Navigation section
  const [activeSection, setActiveSection] = useState<'emulator' | 'config' | 'export'>('emulator');

  // Live HA connection options
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [haUrl, setHaUrl] = useState<string>('');
  const [haToken, setHaToken] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');

  // When room preset changes, load schedules and default titles
  const handleSelectRoom = (roomId: string) => {
    const room = ROOM_PRESETS.find(r => r.id === roomId);
    if (!room) return;
    setSelectedRoomId(roomId);
    const roomBaseName = lang === 'en' ? (roomId === 'vitalnia' ? 'Living Room' : roomId === 'spalnya' ? 'Bedroom' : 'Nursery') : room.name.split('(')[0].trim();
    setCardTitle(lang === 'en' ? `${roomBaseName} Heating Schedule` : `Розклад ${roomBaseName}`);
    setEntityPrefix(room.prefix);
    setClimateEntity(room.climateEntity);

    const newSchedules: Record<DayOfWeek, ScheduleTransition[]> = {
      monday: parseScheduleString(room.schedules.monday),
      tuesday: parseScheduleString(room.schedules.tuesday),
      wednesday: parseScheduleString(room.schedules.wednesday),
      thursday: parseScheduleString(room.schedules.thursday),
      friday: parseScheduleString(room.schedules.friday),
      saturday: parseScheduleString(room.schedules.saturday),
      sunday: parseScheduleString(room.schedules.sunday),
    };
    setSchedules(newSchedules);

    logServiceCall(
      'ui.select_room',
      room.prefix,
      lang === 'en' ? `Loaded preset for ${room.name}` : `Завантажено пресет кімнати ${room.name}`
    );
  };

  const logServiceCall = (service: string, entityId: string, value: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: ServiceCallLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      service,
      entityId,
      value,
      status: 'success',
    };

    setServiceLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  // Save schedule from editor modal
  const handleSaveDaySchedule = async (transitions: ScheduleTransition[]) => {
    if (!editingDay) return;
    const formatted = formatScheduleString(transitions);
    const targetEntity =
      customEntities[editingDay] || `${entityPrefix}_weekly_schedule_${editingDay}`;

    setSchedules(prev => ({
      ...prev,
      [editingDay]: transitions,
    }));

    logServiceCall('text.set_value', targetEntity, formatted);

    if (isLiveConnection && haUrl && haToken) {
      try {
        const cleanUrl = haUrl.replace(/\/+$/, '');
        await fetch(`${cleanUrl}/api/services/text/set_value`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${haToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_id: targetEntity,
            value: formatted,
          }),
        });
      } catch (err: any) {
        console.error('Failed to call real HA service:', err);
      }
    }
  };

  const handleBulkCopy = (targetDays: DayOfWeek[], sourceTransitions: ScheduleTransition[]) => {
    const formatted = formatScheduleString(sourceTransitions);

    setSchedules(prev => {
      const next = { ...prev };
      for (const d of targetDays) {
        next[d] = JSON.parse(JSON.stringify(sourceTransitions));
        const targetEntity = customEntities[d] || `${entityPrefix}_weekly_schedule_${d}`;
        logServiceCall('text.set_value', targetEntity, formatted);
      }
      return next;
    });
  };

  const handleCopyDayFromCard = (fromDay: DayOfWeek, toDays: DayOfWeek[]) => {
    const sourceTransitions = schedules[fromDay];
    if (!sourceTransitions) return;
    handleBulkCopy(toDays, sourceTransitions);
  };

  const handleTestConnection = async () => {
    if (!haUrl || !haToken) return;
    setConnectionStatus('testing');
    setConnectionError('');

    try {
      const cleanUrl = haUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/`, {
        headers: {
          Authorization: `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Home Assistant HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.message === 'API running.') {
        setConnectionStatus('connected');
        logServiceCall('system.ha_connect', cleanUrl, 'Connected to HA API');
      } else {
        setConnectionStatus('connected');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionError(
        err.message || 'Connection failed. Verify URL, token, or HA CORS settings.'
      );
    }
  };

  const handleDownloadCard = () => {
    const link = document.createElement('a');
    link.href = `/sonoff-trv-schedule-card.js?v=${Date.now()}`;
    link.download = 'sonoff-trv-schedule-card.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const editingDayInfo = editingDay ? DAYS_INFO.find(d => d.key === editingDay) : null;
  const editingDayEntity = editingDay
    ? customEntities[editingDay] || `${entityPrefix}_weekly_schedule_${editingDay}`
    : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Bar Contract (1 line brand, 4-5 nav links, 1 primary action) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Brand mark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              {t.appName}
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveSection('emulator')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'emulator' ? 'text-white' : ''
              }`}
            >
              {t.navEmulator}
            </button>
            <button
              onClick={() => setActiveSection('config')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'config' ? 'text-white' : ''
              }`}
            >
              {t.navConfig}
            </button>
            <button
              onClick={() => setActiveSection('export')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'export' ? 'text-white' : ''
              }`}
            >
              {t.navExport}
            </button>
            <a
              href="https://www.zigbee2mqtt.io/devices/TRVZB.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1"
            >
              <span>{t.navDocs}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </nav>

          {/* Zone 3: Language Toggle & Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setLang('uk')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  lang === 'uk' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Українська"
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  lang === 'en' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            <button
              onClick={handleDownloadCard}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.btnDownloadJs}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Context Kicker Banner */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">{t.bannerTitle}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>
                {t.bannerEntities} <code className="text-sky-300 font-mono">{entityPrefix}_weekly_schedule_*</code>
              </span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-slate-400 font-mono">{t.bannerFormat}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t.roomLabel}</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {ROOM_PRESETS.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    selectedRoomId === r.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'en'
                    ? r.id === 'vitalnia' ? 'Living' : r.id === 'spalnya' ? 'Bedroom' : 'Nursery'
                    : r.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Section Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Lovelace Card Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {t.cardPreviewTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {t.cardPreviewSubtitle}
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                {t.cardTypeTag}
              </div>
            </div>

            <LovelaceCardPreview
              title={cardTitle}
              entityPrefix={entityPrefix}
              climateEntity={climateEntity}
              currentTemp={activePreset.currentTemp}
              targetTemp={activePreset.targetTemp}
              battery={activePreset.battery}
              hvacAction={activePreset.hvacAction}
              schedules={schedules}
              onEditDay={day => setEditingDay(day)}
              onCopyDay={handleCopyDayFromCard}
              lang={lang}
            />

            {/* Quick Helper Tips */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>
                  {lang === 'en'
                    ? 'How Sonoff TRVZB weekly scheduling works:'
                    : 'Як працює тижневий розклад Sonoff TRVZB:'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                {lang === 'en' ? (
                  <>
                    <li>Each day is divided into up to 6 time intervals (first must start at 00:00).</li>
                    <li>Automatic color visualization: Blue (Eco &lt;16°), Teal (Night 17-18.5°), Green (Comfort 19-21.5°), Amber (Warm 22-23.5°), Red (Boost 24°+).</li>
                    <li>Any modification is safely formatted and sent directly to the <code className="text-amber-300 font-mono">text.set_value</code> service.</li>
                  </>
                ) : (
                  <>
                    <li>Кожен день ділиться максимум на 6 часових інтервалів (перший завжди о 00:00).</li>
                    <li>Кольори шкали: синій (еко), бірюзовий (ніч), зелений (комфорт 19-21.5°), бурштиновий (тепло 22-23.5°), червоний (24°+).</li>
                    <li>Будь-яка зміна автоматично валідується та надсилається у сервіс <code className="text-amber-300 font-mono">text.set_value</code>.</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Right Column: Configuration & Code Export (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Entity Configuration and Simulator */}
            <HaLiveConnector
              cardTitle={cardTitle}
              onCardTitleChange={setCardTitle}
              entityPrefix={entityPrefix}
              onEntityPrefixChange={setEntityPrefix}
              climateEntity={climateEntity}
              onClimateEntityChange={setClimateEntity}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              customEntities={customEntities}
              onCustomEntityChange={(day, val) =>
                setCustomEntities(prev => ({ ...prev, [day]: val }))
              }
              serviceLogs={serviceLogs}
              onClearLogs={() => setServiceLogs([])}
              isLiveConnection={isLiveConnection}
              onToggleLiveConnection={setIsLiveConnection}
              haUrl={haUrl}
              onHaUrlChange={setHaUrl}
              haToken={haToken}
              onHaTokenChange={setHaToken}
              onTestConnection={handleTestConnection}
              connectionStatus={connectionStatus}
              connectionError={connectionError}
              lang={lang}
            />

            {/* Ready Lovelace YAML Snippet, HACS, & Download Guide */}
            <CardExporter
              cardTitle={cardTitle}
              entityPrefix={entityPrefix}
              climateEntity={climateEntity}
              customEntities={customEntities}
              hasCustomEntities={Object.values(customEntities).some(Boolean)}
              lang={lang}
            />
          </div>
        </div>
      </main>

      {/* Schedule Editor Modal */}
      {editingDay && editingDayInfo && (
        <ScheduleEditorModal
          dayInfo={editingDayInfo}
          entityId={editingDayEntity}
          initialTransitions={schedules[editingDay] || [{ time: '00:00', temperature: 20 }]}
          isOpen={true}
          onClose={() => setEditingDay(null)}
          onSave={handleSaveDaySchedule}
          onBulkCopy={handleBulkCopy}
          lang={lang}
        />
      )}
    </div>
  );
}
