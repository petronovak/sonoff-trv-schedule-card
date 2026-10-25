/**
 * Sonoff TRVZB Weekly Heating Schedule Card for Home Assistant (Lovelace)
 * Compatible with Zigbee2MQTT text entities (format: HH:mm/temperature ...)
 * Supports Ukrainian (uk) and English (en) with automatic language detection.
 * Author: Petro Novak / AI Studio Build
 * License: Apache-2.0
 */

(function () {
  const I18N = {
    uk: {
      days: [
        { key: 'monday', name: 'Понеділок', short: 'Пн', isWeekend: false },
        { key: 'tuesday', name: 'Вівторок', short: 'Вт', isWeekend: false },
        { key: 'wednesday', name: 'Середа', short: 'Ср', isWeekend: false },
        { key: 'thursday', name: 'Четвер', short: 'Чт', isWeekend: false },
        { key: 'friday', name: "П'ятниця", short: 'Пт', isWeekend: false },
        { key: 'saturday', name: 'Субота', short: 'Сб', isWeekend: true },
        { key: 'sunday', name: 'Неділя', short: 'Нд', isWeekend: true },
      ],
      current: 'Поточна',
      target: 'Ціль',
      scale24h: '24-годинна шкала:',
      periods: 'періодів',
      hoursUnit: 'год',
      edit: '✎ Редагувати розклад',
      save: '✓ Зберегти зміни в HA',
      cancel: '✕ Скасувати',
      add: '+ Додати',
      newTransition: '+ Новий перехід:',
      weekdays: 'Будні (Пн-Пт)',
      weekend: 'Вихідні (Сб-Нд)',
      allWeek: 'Весь тиждень',
      savedFor: 'Збережено для',
      copiedSuccess: 'Розклад успішно скопійовано на',
      daysCount: 'дн.',
      errorPrefix: 'Помилка збереження:',
      rawStringLabel: 'Zigbee2MQTT рядок:',
      today: 'Сьогодні',
      tempLabels: {
        eco: 'Еко',
        night: 'Ніч',
        comfort: 'Комфорт',
        warm: 'Тепло',
        heat: 'Нагрів',
      },
    },
    en: {
      days: [
        { key: 'monday', name: 'Monday', short: 'Mon', isWeekend: false },
        { key: 'tuesday', name: 'Tuesday', short: 'Tue', isWeekend: false },
        { key: 'wednesday', name: 'Wednesday', short: 'Wed', isWeekend: false },
        { key: 'thursday', name: 'Thursday', short: 'Thu', isWeekend: false },
        { key: 'friday', name: 'Friday', short: 'Fri', isWeekend: false },
        { key: 'saturday', name: 'Saturday', short: 'Sat', isWeekend: true },
        { key: 'sunday', name: 'Sunday', short: 'Sun', isWeekend: true },
      ],
      current: 'Current',
      target: 'Target',
      scale24h: '24-hour scale:',
      periods: 'periods',
      hoursUnit: 'h',
      edit: '✎ Edit schedule',
      save: '✓ Save changes to HA',
      cancel: '✕ Cancel',
      add: '+ Add',
      newTransition: '+ New transition:',
      weekdays: 'Weekdays (Mon-Fri)',
      weekend: 'Weekend (Sat-Sun)',
      allWeek: 'Whole week',
      savedFor: 'Saved for',
      copiedSuccess: 'Schedule copied successfully to',
      daysCount: 'days',
      errorPrefix: 'Save error:',
      rawStringLabel: 'Zigbee2MQTT string:',
      today: 'Today',
      tempLabels: {
        eco: 'Eco',
        night: 'Night',
        comfort: 'Comfort',
        warm: 'Warm',
        heat: 'Boost',
      },
    },
  };

  function timeToMin(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function minToTime(minutes) {
    const clamped = Math.min(1440, Math.max(0, Math.round(minutes)));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function normTemp(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return 20.0;
    const rounded = Math.round(num * 2) / 2;
    return Math.min(35.0, Math.max(4.0, rounded));
  }

  function formatTemp(val) {
    const n = normTemp(val);
    return n % 1 === 0 ? n.toString() : n.toFixed(1);
  }

  function parseSchedule(str) {
    if (!str || typeof str !== 'string') return [{ time: '00:00', temperature: 20.0 }];
    const parts = str.trim().split(/\s+/).filter(Boolean);
    const list = [];
    for (const p of parts) {
      const [tStr, tempStr] = p.split('/');
      if (!tStr || tempStr === undefined) continue;
      const m = tStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!m) continue;
      const timeFmt = `${m[1].padStart(2, '0')}:${m[2]}`;
      const tempFmt = normTemp(tempStr);
      list.push({ time: timeFmt, temperature: tempFmt });
    }
    list.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
    if (list.length === 0) list.push({ time: '00:00', temperature: 20.0 });
    else if (list[0].time !== '00:00') list.unshift({ time: '00:00', temperature: list[0].temperature });
    return list.slice(0, 6);
  }

  function serializeSchedule(transitions) {
    const clean = [...transitions]
      .map(t => ({ time: t.time.trim(), temperature: normTemp(t.temperature) }))
      .sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
    if (clean.length === 0 || clean[0].time !== '00:00') {
      clean.unshift({ time: '00:00', temperature: clean[0]?.temperature ?? 20.0 });
    }
    const uniq = [];
    for (const t of clean) {
      const ex = uniq.find(item => item.time === t.time);
      if (!ex) uniq.push(t);
      else ex.temperature = t.temperature;
    }
    return uniq.slice(0, 6).map(t => `${t.time}/${formatTemp(t.temperature)}`).join(' ');
  }

  function getIntervals(transitions) {
    const sorted = [...transitions].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
    if (sorted.length === 0 || sorted[0].time !== '00:00') {
      sorted.unshift({ time: '00:00', temperature: sorted[0]?.temperature ?? 20.0 });
    }
    const intervals = [];
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      const startMin = timeToMin(cur.time);
      const endMin = next ? timeToMin(next.time) : 1440;
      intervals.push({
        startTime: cur.time,
        endTime: next ? next.time : '24:00',
        startMin,
        endMin,
        duration: endMin - startMin,
        temperature: cur.temperature,
        index: i,
      });
    }
    return intervals;
  }

  function getTempColor(t, langStrings) {
    const val = normTemp(t);
    const l = langStrings.tempLabels;
    if (val < 16) return { bg: '#0284c7', text: '#38bdf8', label: l.eco };
    if (val < 19) return { bg: '#0d9488', text: '#2dd4bf', label: l.night };
    if (val <= 21.5) return { bg: '#16a34a', text: '#4ade80', label: l.comfort };
    if (val <= 23.5) return { bg: '#d97706', text: '#fbbf24', label: l.warm };
    return { bg: '#dc2626', text: '#f87171', label: l.heat };
  }

  class SonoffTrvScheduleCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
      this._selectedDayIndex = this._getTodayIndex();
      this._editing = false;
      this._editingTransitions = [];
      this._statusMsg = '';
      this._statusTimeout = null;
    }

    _getTodayIndex() {
      const d = new Date().getDay(); // 0 is Sunday
      return d === 0 ? 6 : d - 1; // 0 is Monday
    }

    _getLangStrings() {
      const preferred = this._config.language || (this._hass && (this._hass.locale?.language || this._hass.language)) || 'uk';
      if (preferred.startsWith('uk') || preferred.startsWith('ua')) {
        return I18N.uk;
      }
      return I18N.en;
    }

    setConfig(config) {
      if (!config) throw new Error('Invalid configuration');
      this._config = {
        title: config.title || '',
        entity_prefix: config.entity_prefix || '',
        climate_entity: config.climate_entity || '',
        entities: config.entities || {},
        language: config.language || '',
        ...config,
      };
      this._render();
    }

    set hass(hass) {
      const oldHass = this._hass;
      this._hass = hass;
      if (!oldHass || this._hasEntityChanged(oldHass, hass)) {
        if (!this._editing) {
          this._render();
        }
      }
    }

    _hasEntityChanged(oldHass, newHass) {
      const lang = this._getLangStrings();
      const entities = this._resolveEntityMap();
      for (const day of lang.days) {
        const id = entities[day.key];
        if (id && oldHass.states[id]?.state !== newHass.states[id]?.state) {
          return true;
        }
      }
      if (this._config.climate_entity) {
        const cid = this._config.climate_entity;
        if (oldHass.states[cid]?.state !== newHass.states[cid]?.state) return true;
      }
      return false;
    }

    _resolveEntityMap() {
      const lang = this._getLangStrings();
      const prefix = (this._config.entity_prefix || '').trim();
      const map = {};
      for (const d of lang.days) {
        if (this._config.entities && this._config.entities[d.key]) {
          map[d.key] = this._config.entities[d.key];
        } else if (prefix) {
          map[d.key] = `${prefix}_weekly_schedule_${d.key}`;
        } else {
          map[d.key] = `text.trv_weekly_schedule_${d.key}`;
        }
      }
      return map;
    }

    _getDayData(dayKey) {
      const map = this._resolveEntityMap();
      const entityId = map[dayKey];
      const stateObj = this._hass ? this._hass.states[entityId] : null;
      const raw = stateObj ? stateObj.state : '00:00/21 07:00/21.5 10:00/20 18:00/23';
      const transitions = parseSchedule(raw);
      return { entityId, raw, transitions, stateObj };
    }

    _showStatus(msg) {
      this._statusMsg = msg;
      if (this._statusTimeout) clearTimeout(this._statusTimeout);
      this._statusTimeout = setTimeout(() => {
        this._statusMsg = '';
        this._render();
      }, 3500);
      this._render();
    }

    async _saveSchedule(dayKey, transitions) {
      if (!this._hass) return;
      const map = this._resolveEntityMap();
      const entityId = map[dayKey];
      const value = serializeSchedule(transitions);
      const lang = this._getLangStrings();
      try {
        await this._hass.callService('text', 'set_value', {
          entity_id: entityId,
          value: value,
        });
        this._editing = false;
        const dayName = lang.days.find(d => d.key === dayKey)?.name || dayKey;
        this._showStatus(`${lang.savedFor} ${dayName}: ${value}`);
      } catch (err) {
        this._showStatus(`${lang.errorPrefix} ${err.message}`);
      }
    }

    async _copyToDays(targetDays, sourceTransitions) {
      if (!this._hass) return;
      const map = this._resolveEntityMap();
      const val = serializeSchedule(sourceTransitions);
      const lang = this._getLangStrings();
      try {
        for (const d of targetDays) {
          const entityId = map[d.key];
          await this._hass.callService('text', 'set_value', {
            entity_id: entityId,
            value: val,
          });
        }
        this._showStatus(`${lang.copiedSuccess} ${targetDays.length} ${lang.daysCount}.`);
      } catch (err) {
        this._showStatus(`${lang.errorPrefix} ${err.message}`);
      }
    }

    _render() {
      const root = this.shadowRoot;
      if (!root) return;

      const lang = this._getLangStrings();
      const selectedDay = lang.days[this._selectedDayIndex];
      const dayData = this._getDayData(selectedDay.key);
      const activeTransitions = this._editing ? this._editingTransitions : dayData.transitions;
      const intervals = getIntervals(activeTransitions);

      const defaultTitle = this._config.language === 'en' ? 'Sonoff TRVZB Heating Schedule' : 'Розклад термоголовки Sonoff TRVZB';
      const title = this._config.title || defaultTitle;

      // Climate info if available
      let climateInfo = '';
      if (this._config.climate_entity && this._hass) {
        const clState = this._hass.states[this._config.climate_entity];
        if (clState) {
          const curTemp = clState.attributes?.current_temperature ?? '--';
          const targetTemp = clState.attributes?.temperature ?? '--';
          const hvacAction = clState.attributes?.hvac_action || clState.state || 'auto';
          climateInfo = `
            <div class="climate-badge">
              <span class="cl-item">${lang.current}: <strong>${curTemp}°C</strong></span>
              <span class="cl-sep">·</span>
              <span class="cl-item">${lang.target}: <strong>${targetTemp}°C</strong></span>
              <span class="cl-sep">·</span>
              <span class="cl-item cl-mode">${hvacAction}</span>
            </div>
          `;
        }
      }

      // 24h timeline segments
      const timelineSegments = intervals.map(iv => {
        const pct = (iv.duration / 1440) * 100;
        const color = getTempColor(iv.temperature, lang);
        return `
          <div class="tl-segment" style="width: ${pct}%; background-color: ${color.bg};" title="${iv.startTime} - ${iv.endTime} (${iv.temperature}°C)">
            ${pct > 8 ? `<span class="tl-seg-label">${iv.temperature}°</span>` : ''}
          </div>
        `;
      }).join('');

      // Intervals list
      const intervalCards = intervals.map((iv, idx) => {
        const color = getTempColor(iv.temperature, lang);
        return `
          <div class="period-row ${this._editing ? 'period-row-editing' : ''}">
            <div class="period-time">
              <span class="time-clock">${iv.startTime}</span>
              <span class="time-arrow">→</span>
              <span class="time-clock text-muted">${iv.endTime}</span>
              <span class="period-duration">(${Math.round(iv.duration / 60 * 10) / 10} ${lang.hoursUnit})</span>
            </div>
            
            <div class="period-temp-block">
              <span class="temp-badge" style="background-color: ${color.bg}25; color: ${color.text}; border: 1px solid ${color.bg}50;">
                ${formatTemp(iv.temperature)}°C
              </span>
              <span class="temp-label">${color.label}</span>
            </div>

            ${this._editing ? `
              <div class="period-actions">
                <button class="btn-icon" data-action="temp-sub" data-index="${idx}" title="-0.5°C">−</button>
                <button class="btn-icon" data-action="temp-add" data-index="${idx}" title="+0.5°C">+</button>
                ${idx > 0 ? `
                  <button class="btn-icon btn-del" data-action="del-period" data-index="${idx}" title="Delete">✕</button>
                ` : `
                  <span class="badge-lock" title="Fixed day start">🔒 00:00</span>
                `}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      root.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--ha-card-font-family, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif);
            color: var(--primary-text-color, #e2e8f0);
            box-sizing: border-box;
          }
          *, *::before, *::after {
            box-sizing: inherit;
          }
          .card-container {
            background: var(--ha-card-background, #1e293b);
            border-radius: var(--ha-card-border-radius, 16px);
            border: 1px solid var(--ha-card-border-color, rgba(255, 255, 255, 0.08));
            padding: 16px;
            box-shadow: var(--ha-card-box-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
          }
          .title-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .icon-trv {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          }
          .title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: var(--primary-text-color, #f8fafc);
          }
          .entity-sub {
            font-size: 11px;
            color: var(--secondary-text-color, #94a3b8);
            margin: 0;
            font-family: monospace;
          }
          .climate-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--secondary-text-color, #94a3b8);
            background: rgba(255, 255, 255, 0.04);
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.06);
          }
          .cl-item strong {
            color: var(--primary-text-color, #f8fafc);
          }
          .cl-sep {
            opacity: 0.5;
          }
          .cl-mode {
            text-transform: capitalize;
            color: #10b981;
          }
          .days-nav {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            background: rgba(0, 0, 0, 0.2);
            padding: 4px;
            border-radius: 10px;
            margin-bottom: 16px;
          }
          .day-tab {
            background: transparent;
            border: none;
            padding: 6px 2px;
            border-radius: 6px;
            color: var(--secondary-text-color, #94a3b8);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            transition: all 0.15s ease;
          }
          .day-tab:hover {
            color: var(--primary-text-color, #fff);
            background: rgba(255, 255, 255, 0.05);
          }
          .day-tab.active {
            background: var(--primary-color, #0284c7);
            color: #ffffff;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          }
          .day-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: currentColor;
            opacity: 0.6;
          }
          .day-dot.today {
            background: #f59e0b;
            opacity: 1;
            box-shadow: 0 0 6px #f59e0b;
          }
          .timeline-wrapper {
            margin-bottom: 14px;
          }
          .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: var(--secondary-text-color, #94a3b8);
            margin-bottom: 6px;
          }
          .timeline-bar {
            height: 24px;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .tl-segment {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: width 0.2s ease;
          }
          .tl-seg-label {
            font-size: 11px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            font-variant-numeric: tabular-nums;
          }
          .timeline-ticks {
            display: flex;
            justify-content: space-between;
            padding: 3px 2px 0 2px;
            font-size: 10px;
            color: var(--secondary-text-color, #64748b);
            font-family: monospace;
          }
          .periods-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 14px;
          }
          .period-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            font-size: 13px;
          }
          .period-row-editing {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.12);
          }
          .period-time {
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: monospace;
            font-variant-numeric: tabular-nums;
          }
          .time-clock {
            font-weight: 600;
          }
          .time-arrow {
            opacity: 0.4;
          }
          .text-muted {
            opacity: 0.7;
          }
          .period-duration {
            font-size: 11px;
            color: var(--secondary-text-color, #94a3b8);
            margin-left: 4px;
          }
          .period-temp-block {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .temp-badge {
            font-weight: 700;
            font-size: 13px;
            padding: 2px 8px;
            border-radius: 6px;
            font-variant-numeric: tabular-nums;
          }
          .temp-label {
            font-size: 11px;
            color: var(--secondary-text-color, #94a3b8);
          }
          .period-actions {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .btn-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.06);
            color: var(--primary-text-color, #fff);
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .btn-icon:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          .btn-del {
            color: #f87171;
            border-color: rgba(248, 113, 113, 0.3);
          }
          .badge-lock {
            font-size: 10px;
            opacity: 0.5;
            padding: 2px 6px;
          }
          .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }
          .btn-primary {
            background: var(--primary-color, #0284c7);
            color: #ffffff;
            border: none;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: opacity 0.15s ease;
          }
          .btn-primary:hover {
            opacity: 0.9;
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: var(--primary-text-color, #f8fafc);
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.14);
          }
          .add-row-block {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          .add-row-block input[type="time"] {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-family: monospace;
          }
          .add-row-block input[type="number"] {
            width: 70px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-family: monospace;
          }
          .status-banner {
            margin-top: 10px;
            font-size: 12px;
            padding: 6px 10px;
            border-radius: 6px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .raw-preview {
            margin-top: 10px;
            font-size: 11px;
            color: var(--secondary-text-color, #64748b);
            font-family: monospace;
            word-break: break-all;
            background: rgba(0,0,0,0.2);
            padding: 4px 8px;
            border-radius: 4px;
          }
        </style>

        <div class="card-container">
          <div class="header">
            <div class="title-group">
              <div class="icon-trv">♨</div>
              <div>
                <h2 class="title">${title}</h2>
                <p class="entity-sub">${dayData.entityId}</p>
              </div>
            </div>
            ${climateInfo}
          </div>

          <div class="days-nav">
            ${lang.days.map((d, i) => {
              const isToday = i === this._getTodayIndex();
              const isActive = i === this._selectedDayIndex;
              return `
                <button class="day-tab ${isActive ? 'active' : ''}" data-day-index="${i}">
                  <span>${d.short}</span>
                  <span class="day-dot ${isToday ? 'today' : ''}"></span>
                </button>
              `;
            }).join('')}
          </div>

          <div class="timeline-wrapper">
            <div class="timeline-header">
              <span>${lang.scale24h} <strong>${selectedDay.name}</strong></span>
              <span>${intervals.length} / 6 ${lang.periods}</span>
            </div>
            <div class="timeline-bar">
              ${timelineSegments}
            </div>
            <div class="timeline-ticks">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          ${this._editing && activeTransitions.length < 6 ? `
            <div class="add-row-block">
              <span style="font-size: 12px; color: #94a3b8;">${lang.newTransition}</span>
              <input type="time" id="new-time" value="12:00" step="900" />
              <input type="number" id="new-temp" value="21.0" min="4" max="35" step="0.5" />
              <button class="btn-secondary" id="btn-add-period">${lang.add}</button>
            </div>
          ` : ''}

          <div class="periods-list">
            ${intervalCards}
          </div>

          <div class="toolbar">
            ${!this._editing ? `
              <button class="btn-primary" id="btn-edit-mode">
                ${lang.edit}
              </button>
              <div style="display: flex; gap: 6px;">
                <button class="btn-secondary" id="btn-copy-weekdays" title="${lang.weekdays}">
                  ${lang.weekdays}
                </button>
                <button class="btn-secondary" id="btn-copy-all" title="${lang.allWeek}">
                  ${lang.allWeek}
                </button>
              </div>
            ` : `
              <button class="btn-primary" id="btn-save" style="background: #16a34a;">
                ${lang.save}
              </button>
              <button class="btn-secondary" id="btn-cancel">
                ${lang.cancel}
              </button>
            `}
          </div>

          <div class="raw-preview">
            ${lang.rawStringLabel} ${serializeSchedule(activeTransitions)}
          </div>

          ${this._statusMsg ? `
            <div class="status-banner">${this._statusMsg}</div>
          ` : ''}
        </div>
      `;

      this._attachEventListeners();
    }

    _attachEventListeners() {
      const root = this.shadowRoot;
      if (!root) return;
      const lang = this._getLangStrings();

      root.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const idx = parseInt(tab.getAttribute('data-day-index'), 10);
          if (!isNaN(idx)) {
            this._selectedDayIndex = idx;
            this._editing = false;
            this._render();
          }
        });
      });

      const editBtn = root.getElementById('btn-edit-mode');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          const data = this._getDayData(day.key);
          this._editingTransitions = JSON.parse(JSON.stringify(data.transitions));
          this._editing = true;
          this._render();
        });
      }

      const cancelBtn = root.getElementById('btn-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this._editing = false;
          this._render();
        });
      }

      const saveBtn = root.getElementById('btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          this._saveSchedule(day.key, this._editingTransitions);
        });
      }

      const addBtn = root.getElementById('btn-add-period');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const timeInput = root.getElementById('new-time');
          const tempInput = root.getElementById('new-temp');
          if (!timeInput || !tempInput) return;

          const timeVal = timeInput.value || '12:00';
          const tempVal = normTemp(tempInput.value);

          const existing = this._editingTransitions.find(t => t.time === timeVal);
          if (existing) {
            existing.temperature = tempVal;
          } else {
            this._editingTransitions.push({ time: timeVal, temperature: tempVal });
          }
          this._editingTransitions.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
          this._render();
        });
      }

      root.querySelectorAll('.btn-icon').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (isNaN(idx) || !this._editingTransitions[idx]) return;

          if (action === 'temp-add') {
            this._editingTransitions[idx].temperature = normTemp(this._editingTransitions[idx].temperature + 0.5);
            this._render();
          } else if (action === 'temp-sub') {
            this._editingTransitions[idx].temperature = normTemp(this._editingTransitions[idx].temperature - 0.5);
            this._render();
          } else if (action === 'del-period') {
            if (idx > 0) {
              this._editingTransitions.splice(idx, 1);
              this._render();
            }
          }
        });
      });

      const copyWdBtn = root.getElementById('btn-copy-weekdays');
      if (copyWdBtn) {
        copyWdBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          const data = this._getDayData(day.key);
          const weekdays = lang.days.filter(d => !d.isWeekend);
          this._copyToDays(weekdays, data.transitions);
        });
      }

      const copyAllBtn = root.getElementById('btn-copy-all');
      if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          const data = this._getDayData(day.key);
          this._copyToDays(lang.days, data.transitions);
        });
      }
    }

    getCardSize() {
      return 6;
    }
  }

  if (!customElements.get('sonoff-trv-schedule-card')) {
    customElements.define('sonoff-trv-schedule-card', SonoffTrvScheduleCard);
  }

  window.customCards = window.customCards || [];
  const exists = window.customCards.some(c => c.type === 'sonoff-trv-schedule-card');
  if (!exists) {
    window.customCards.push({
      type: 'sonoff-trv-schedule-card',
      name: 'Sonoff TRVZB Schedule Card',
      description: 'Graphical 24-hour weekly heating schedule card for Sonoff TRVZB (Zigbee2MQTT)',
      preview: true,
      documentationURL: 'https://github.com/petro-novak/sonoff-trv-schedule-card',
    });
  }
})();
