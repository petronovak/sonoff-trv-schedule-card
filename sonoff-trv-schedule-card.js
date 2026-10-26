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
      add: '+ Додати період',
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
      viewDay: 'День',
      viewWeek: 'Тиждень',
      activeNow: 'Зараз активно:',
      clickToEdit: 'Натисніть на будь-який день для перегляду та редагування:',
      dayStartLocked: 'початок доби 00:00',
      notFoundInHa: 'не знайдено в HA',
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
      add: '+ Add period',
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
      viewDay: 'Day',
      viewWeek: 'Week',
      activeNow: 'Active now:',
      clickToEdit: 'Click any day to view and edit schedule:',
      dayStartLocked: 'day start 00:00',
      notFoundInHa: 'not found in HA',
      tempLabels: {
        eco: 'Eco',
        night: 'Night',
        comfort: 'Comfort',
        warm: 'Warm',
        heat: 'Boost',
      },
    },
  };

  const PRESETS = [17, 19, 21.5, 23];

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
      this._viewMode = 'tabs'; // 'tabs' or 'list'
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
      const climate = config.climate_entity || config.entity || '';
      this._config = {
        title: config.title || '',
        entity_prefix: config.entity_prefix || '',
        climate_entity: climate,
        entities: config.entities || {},
        language: config.language || '',
        default_view: config.default_view || 'tabs',
        ...config,
      };
      if (config.default_view) {
        this._viewMode = config.default_view;
      }
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
      let prefix = (this._config.entity_prefix || '').trim();

      // Auto-derive schedule prefix from climate entity or generic entity
      if (!prefix) {
        const candidate = (this._config.climate_entity || this._config.entity || '').trim();
        if (candidate) {
          if (candidate.startsWith('climate.')) {
            prefix = candidate.replace(/^climate\./, 'text.');
          } else if (candidate.startsWith('text.')) {
            prefix = candidate;
          } else {
            prefix = `text.${candidate}`;
          }
        }
      }

      // If prefix has _weekly_schedule_ suffix attached, strip it to get base prefix
      if (prefix) {
        prefix = prefix.replace(/_weekly_schedule_.*$/, '');
      }

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

      // Current active interval
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const isSelectedToday = this._selectedDayIndex === this._getTodayIndex();
      let activeInterval = null;
      if (isSelectedToday) {
        for (const iv of intervals) {
          if (nowMinutes >= iv.startMin && nowMinutes < iv.endMin) {
            activeInterval = iv;
            break;
          }
        }
        if (!activeInterval && intervals.length > 0) {
          activeInterval = intervals[intervals.length - 1];
        }
      }

      // Climate badge in header
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

      // 24h timeline segments for Day view
      const timelineSegments = intervals.map(iv => {
        const pct = (iv.duration / 1440) * 100;
        const color = getTempColor(iv.temperature, lang);
        return `
          <div class="tl-segment" style="width: ${pct}%; background-color: ${color.bg};" title="${iv.startTime} - ${iv.endTime} (${iv.temperature}°C)">
            ${pct > 8 ? `<span class="tl-seg-label">${iv.temperature}°</span>` : ''}
          </div>
        `;
      }).join('');

      // Periods markup (View mode vs Edit mode)
      let periodsContent = '';
      if (!this._editing) {
        periodsContent = intervals.map((iv, idx) => {
          const color = getTempColor(iv.temperature, lang);
          const isNowActive = isSelectedToday && activeInterval?.index === idx;
          return `
            <div class="period-row ${isNowActive ? 'period-row-active' : ''}">
              <div class="period-time">
                <span class="time-index">${idx + 1}</span>
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
            </div>
          `;
        }).join('');
      } else {
        // Detailed Interactive Editor for each transition point
        periodsContent = activeTransitions.map((t, idx) => {
          const color = getTempColor(t.temperature, lang);
          const isFirst = idx === 0;
          return `
            <div class="period-edit-card">
              <div class="edit-card-top">
                <div class="time-input-group">
                  <span class="time-index">${idx + 1}</span>
                  ${isFirst ? `
                    <div class="time-locked-badge">
                      <span>00:00</span>
                      <span class="locked-note">(${lang.dayStartLocked})</span>
                    </div>
                  ` : `
                    <div class="time-field-wrapper">
                      <span class="time-icon">🕒</span>
                      <input type="time" class="time-input" data-index="${idx}" value="${t.time}" />
                    </div>
                  `}
                </div>

                <div class="temp-stepper">
                  <button class="btn-step" data-action="temp-sub" data-index="${idx}" title="-0.5°C">−</button>
                  <span class="temp-value" style="color: ${color.text};">${formatTemp(t.temperature)}°C</span>
                  <button class="btn-step" data-action="temp-add" data-index="${idx}" title="+0.5°C">+</button>
                </div>

                ${!isFirst ? `
                  <button class="btn-del" data-action="del-period" data-index="${idx}" title="Delete">✕</button>
                ` : `
                  <div style="width: 32px;"></div>
                `}
              </div>

              <!-- Quick Presets -->
              <div class="presets-row">
                <span class="presets-label">Пресети:</span>
                ${PRESETS.map(p => `
                  <button type="button" class="btn-preset ${t.temperature === p ? 'active' : ''}" data-index="${idx}" data-preset="${p}">
                    ${p}°
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }

      // Week view content (All 7 days miniature list)
      const weekListContent = lang.days.map((d, i) => {
        const dData = this._getDayData(d.key);
        const dIntervals = getIntervals(dData.transitions);
        const isToday = i === this._getTodayIndex();
        const dSegs = dIntervals.map(iv => {
          const pct = (iv.duration / 1440) * 100;
          const col = getTempColor(iv.temperature, lang);
          return `<div class="tl-segment" style="width: ${pct}%; background-color: ${col.bg};"></div>`;
        }).join('');

        return `
          <div class="week-day-row ${isToday ? 'week-day-today' : ''}" data-select-day="${i}">
            <div class="week-day-info">
              <div class="week-day-name">
                <span>${d.name}</span>
                ${isToday ? `<span class="badge-today">${lang.today}</span>` : ''}
              </div>
              <span class="week-day-points">${dData.transitions.length} / 6 ${lang.periods}</span>
            </div>
            <div class="timeline-bar timeline-bar-mini">
              ${dSegs}
            </div>
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
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
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

          /* Navigation and View Switcher */
          .nav-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 14px;
          }
          .days-nav {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            background: rgba(0, 0, 0, 0.25);
            padding: 4px;
            border-radius: 10px;
            flex: 1;
          }
          .day-tab {
            background: transparent;
            border: none;
            padding: 7px 2px;
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
          .view-toggle {
            display: flex;
            align-items: center;
            gap: 2px;
            background: rgba(0, 0, 0, 0.25);
            padding: 4px;
            border-radius: 10px;
            shrink: 0;
          }
          .view-btn {
            background: transparent;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            color: var(--secondary-text-color, #94a3b8);
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
          }
          .view-btn.active {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          /* 24-Hour Timeline Bar */
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
            height: 26px;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .timeline-bar-mini {
            height: 14px;
            border-radius: 6px;
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

          /* Active Interval Box */
          .active-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 12px;
          }
          .active-left {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #94a3b8;
          }
          .dot-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
          }
          .active-right {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .active-temp {
            font-size: 14px;
            font-weight: 700;
            color: #34d399;
            font-family: monospace;
          }

          /* Periods list (View Mode) */
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
          .period-row-active {
            border-color: rgba(2, 132, 199, 0.5);
            background: rgba(2, 132, 199, 0.08);
          }
          .period-time {
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: monospace;
            font-variant-numeric: tabular-nums;
          }
          .time-index {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #94a3b8;
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

          /* Detailed Period Edit Card (Edit Mode) */
          .period-edit-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .edit-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
          }
          .time-input-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .time-locked-badge {
            font-family: monospace;
            font-weight: 600;
            font-size: 13px;
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .locked-note {
            font-size: 10px;
            color: #94a3b8;
            font-family: sans-serif;
          }
          .time-field-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2px 6px;
            border-radius: 6px;
          }
          .time-icon {
            font-size: 12px;
            opacity: 0.6;
          }
          .time-input {
            background: transparent;
            border: none;
            color: #ffffff;
            font-family: monospace;
            font-size: 13px;
            font-weight: 600;
            outline: none;
            cursor: pointer;
          }
          .temp-stepper {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.3);
            padding: 2px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .btn-step {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: none;
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            font-weight: bold;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .btn-step:hover {
            background: rgba(255, 255, 255, 0.18);
          }
          .temp-value {
            font-family: monospace;
            font-weight: 700;
            font-size: 13px;
            min-width: 54px;
            text-align: center;
          }
          .btn-del {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: 1px solid rgba(248, 113, 113, 0.3);
            background: rgba(248, 113, 113, 0.1);
            color: #f87171;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
          }
          .btn-del:hover {
            background: rgba(248, 113, 113, 0.25);
          }
          .presets-row {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-top: 4px;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            flex-wrap: wrap;
          }
          .presets-label {
            font-size: 11px;
            color: #94a3b8;
          }
          .btn-preset {
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: #cbd5e1;
            font-size: 11px;
            font-family: monospace;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .btn-preset:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
          }
          .btn-preset.active {
            background: #f59e0b;
            color: #0f172a;
            font-weight: bold;
            border-color: #f59e0b;
          }

          /* Week Mode Rows */
          .week-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 14px;
          }
          .week-day-row {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .week-day-row:hover {
            background: rgba(255, 255, 255, 0.07);
            border-color: rgba(255, 255, 255, 0.12);
          }
          .week-day-today {
            border-color: rgba(2, 132, 199, 0.4);
            background: rgba(2, 132, 199, 0.05);
          }
          .week-day-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
          }
          .week-day-name {
            font-weight: 600;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .badge-today {
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 4px;
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            font-weight: 600;
          }
          .week-day-points {
            font-size: 11px;
            color: #94a3b8;
            font-family: monospace;
          }

          /* Toolbar */
          .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }
          .btn-primary {
            background: var(--primary-color, #0284c7);
            color: #ffffff;
            border: none;
            padding: 7px 16px;
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
          <!-- Card Header -->
          <div class="header">
            <div class="title-group">
              <div class="icon-trv">♨</div>
              <div>
                <h2 class="title">${title}</h2>
                <p class="entity-sub">
                  ${dayData.entityId}
                  ${this._hass && !dayData.stateObj ? `<span style="color: #f87171; font-weight: bold; margin-left: 4px;">(${lang.notFoundInHa})</span>` : ''}
                </p>
              </div>
            </div>
            ${climateInfo}
          </div>

          <!-- Navigation: Day Tabs & View Mode Switcher -->
          <div class="nav-row">
            <div class="days-nav">
              ${lang.days.map((d, i) => {
                const isToday = i === this._getTodayIndex();
                const isActive = i === this._selectedDayIndex && this._viewMode === 'tabs';
                return `
                  <button class="day-tab ${isActive ? 'active' : ''}" data-day-index="${i}">
                    <span>${d.short}</span>
                    <span class="day-dot ${isToday ? 'today' : ''}"></span>
                  </button>
                `;
              }).join('')}
            </div>

            <div class="view-toggle">
              <button class="view-btn ${this._viewMode === 'tabs' ? 'active' : ''}" data-view="tabs">
                ${lang.viewDay}
              </button>
              <button class="view-btn ${this._viewMode === 'list' ? 'active' : ''}" data-view="list">
                ${lang.viewWeek}
              </button>
            </div>
          </div>

          <!-- MODE 1: DAY VIEW (Tabs) -->
          ${this._viewMode === 'tabs' ? `
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

            ${isSelectedToday && activeInterval && !this._editing ? `
              <div class="active-box">
                <div class="active-left">
                  <div class="dot-pulse"></div>
                  <span>${lang.activeNow}</span>
                  <strong style="color: #fff; font-family: monospace;">${activeInterval.startTime} - ${activeInterval.endTime}</strong>
                </div>
                <div class="active-right">
                  <span>${lang.target}:</span>
                  <span class="active-temp">${formatTemp(activeInterval.temperature)}°C</span>
                </div>
              </div>
            ` : ''}

            <!-- Periods List or Detailed Editor -->
            <div class="periods-list">
              ${periodsContent}
            </div>

            <!-- Bottom Toolbar -->
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
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button class="btn-primary" id="btn-save" style="background: #16a34a;">
                    ${lang.save}
                  </button>
                  <button class="btn-secondary" id="btn-cancel">
                    ${lang.cancel}
                  </button>
                </div>
                ${activeTransitions.length < 6 ? `
                  <button class="btn-secondary" id="btn-add-period">
                    ${lang.add}
                  </button>
                ` : ''}
              `}
            </div>

            <div class="raw-preview">
              ${lang.rawStringLabel} ${serializeSchedule(activeTransitions)}
            </div>
          ` : `
            <!-- MODE 2: WEEK VIEW (All 7 Days) -->
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
              ${lang.clickToEdit}
            </div>
            <div class="week-list">
              ${weekListContent}
            </div>
          `}

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

      // Day tabs navigation
      root.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const idx = parseInt(tab.getAttribute('data-day-index'), 10);
          if (!isNaN(idx)) {
            this._selectedDayIndex = idx;
            this._viewMode = 'tabs';
            this._editing = false;
            this._render();
          }
        });
      });

      // View mode buttons (Day vs Week)
      root.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.getAttribute('data-view');
          if (view === 'tabs' || view === 'list') {
            this._viewMode = view;
            this._editing = false;
            this._render();
          }
        });
      });

      // Week mode row clicks (jump directly into that day's view)
      root.querySelectorAll('.week-day-row').forEach(row => {
        row.addEventListener('click', () => {
          const idx = parseInt(row.getAttribute('data-select-day'), 10);
          if (!isNaN(idx)) {
            this._selectedDayIndex = idx;
            this._viewMode = 'tabs';
            this._render();
          }
        });
      });

      // Edit Mode Toggle
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

      // Cancel Edit
      const cancelBtn = root.getElementById('btn-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this._editing = false;
          this._render();
        });
      }

      // Save in HA
      const saveBtn = root.getElementById('btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          this._saveSchedule(day.key, this._editingTransitions);
        });
      }

      // Time Input Change Handler in Edit Mode
      root.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('change', e => {
          const idx = parseInt(input.getAttribute('data-index'), 10);
          const newTime = e.target.value;
          if (idx > 0 && newTime && this._editingTransitions[idx]) {
            this._editingTransitions[idx].time = newTime;
            this._editingTransitions.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
            this._render();
          }
        });
      });

      // Quick Preset Temperature Buttons in Edit Mode
      root.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          const presetVal = parseFloat(btn.getAttribute('data-preset'));
          if (!isNaN(idx) && !isNaN(presetVal) && this._editingTransitions[idx]) {
            this._editingTransitions[idx].temperature = presetVal;
            this._render();
          }
        });
      });

      // Temperature +/- Buttons and Delete in Edit Mode
      root.querySelectorAll('.btn-step, .btn-del').forEach(btn => {
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

      // Add New Period Button
      const addBtn = root.getElementById('btn-add-period');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          if (this._editingTransitions.length >= 6) return;
          const existingMins = this._editingTransitions.map(t => timeToMin(t.time));
          let candidate = 12 * 60;
          if (existingMins.includes(candidate)) candidate = 16 * 60;
          if (existingMins.includes(candidate)) candidate = 8 * 60;
          if (existingMins.includes(candidate)) candidate = 20 * 60;

          const newTimeStr = minToTime(candidate);
          this._editingTransitions.push({ time: newTimeStr, temperature: 21.0 });
          this._editingTransitions.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
          this._render();
        });
      }

      // Copy to Weekdays
      const copyWdBtn = root.getElementById('btn-copy-weekdays');
      if (copyWdBtn) {
        copyWdBtn.addEventListener('click', () => {
          const day = lang.days[this._selectedDayIndex];
          const data = this._getDayData(day.key);
          const weekdays = lang.days.filter(d => !d.isWeekend);
          this._copyToDays(weekdays, data.transitions);
        });
      }

      // Copy to All
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

    static getConfigElement() {
      return document.createElement('sonoff-trv-schedule-card-editor');
    }

    static getStubConfig(hass, entities) {
      const trv = entities.find(e => e.startsWith('climate.trv_')) ||
                  entities.find(e => e.startsWith('climate.')) || '';
      return {
        type: 'custom:sonoff-trv-schedule-card',
        title: 'Розклад опалення',
        climate_entity: trv,
        entity_prefix: trv ? trv.replace(/^climate\./, 'text.') : '',
        default_view: 'tabs',
        language: '',
      };
    }
  }

  class SonoffTrvScheduleCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
    }

    setConfig(config) {
      this._config = { ...config };
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    _valueChanged(key, value) {
      if (!this._config) return;
      const newConfig = { ...this._config, [key]: value };

      if (key === 'climate_entity' && value) {
        if (!this._config.entity_prefix || this._config.entity_prefix.startsWith('text.trv_')) {
          newConfig.entity_prefix = value.replace(/^climate\./, 'text.');
        }
      }

      this._config = newConfig;
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }));
    }

    _render() {
      const root = this.shadowRoot;
      if (!root) return;

      const langCode = (this._hass && (this._hass.locale?.language || this._hass.language)) || 'uk';
      const isUk = langCode.startsWith('uk') || langCode.startsWith('ua');

      const title = this._config.title || '';
      const climate = this._config.climate_entity || this._config.entity || '';
      const prefix = this._config.entity_prefix || (climate ? climate.replace(/^climate\./, 'text.') : '');
      const defaultView = this._config.default_view || 'tabs';
      const cardLang = this._config.language || '';

      const climateEntities = this._hass
        ? Object.keys(this._hass.states).filter(eid => eid.startsWith('climate.'))
        : [];

      root.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 8px 0;
            font-family: var(--ha-card-font-family, system-ui, -apple-system, sans-serif);
            color: var(--primary-text-color, #e2e8f0);
            box-sizing: border-box;
          }
          *, *::before, *::after {
            box-sizing: inherit;
          }
          .editor-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .label {
            font-size: 13px;
            font-weight: 600;
            color: var(--primary-text-color, #f8fafc);
          }
          .hint {
            font-size: 11px;
            color: var(--secondary-text-color, #94a3b8);
            line-height: 1.4;
          }
          .input, .select {
            background: var(--input-fill-color, rgba(255, 255, 255, 0.06));
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.15));
            border-radius: 8px;
            color: var(--primary-text-color, #fff);
            padding: 10px 12px;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
          }
          .input:focus, .select:focus {
            border-color: var(--primary-color, #0284c7);
          }
          .select {
            cursor: pointer;
          }
          .select option {
            background: #1e293b;
            color: #fff;
          }
          .entity-quick-pills {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
          }
          .pill-btn {
            background: rgba(2, 132, 199, 0.15);
            border: 1px solid rgba(2, 132, 199, 0.3);
            color: #38bdf8;
            font-size: 11px;
            font-family: monospace;
            padding: 3px 8px;
            border-radius: 6px;
            cursor: pointer;
          }
          .pill-btn:hover {
            background: rgba(2, 132, 199, 0.25);
          }
        </style>

        <div class="editor-container">
          <div class="form-group">
            <label class="label">${isUk ? 'Назва картки' : 'Card Title'}</label>
            <input type="text" class="input" id="field-title" value="${title}" placeholder="${isUk ? 'Розклад опалення' : 'Heating Schedule'}" />
          </div>

          <div class="form-group">
            <label class="label">
              ${isUk ? 'Клімат-сутність (TRV Valve)' : 'Climate Entity (TRV Valve)'}
            </label>
            <input type="text" list="climate-list" class="input" id="field-climate" value="${climate}" placeholder="climate.trv_kabinet" />
            <datalist id="climate-list">
              ${climateEntities.map(id => `<option value="${id}">${this._hass?.states[id]?.attributes?.friendly_name || id}</option>`).join('')}
            </datalist>
            <span class="hint">
              ${isUk ? 'Оберіть термостат. Картка автоматично підтягне поточну температуру та сформує префікс для розкладу.' : 'Select radiator TRV. The card will link current temperature and auto-derive schedule prefix.'}
            </span>
            ${climateEntities.length > 0 ? `
              <div class="entity-quick-pills">
                <span class="hint" style="align-self: center;">${isUk ? 'Швидкий вибір:' : 'Quick pick:'}</span>
                ${climateEntities.slice(0, 5).map(id => `
                  <button type="button" class="pill-btn" data-entity="${id}">${id.replace('climate.', '')}</button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label class="label">
              ${isUk ? 'Базовий префікс сутностей розкладу (Entity Prefix)' : 'Schedule Entity Prefix'}
            </label>
            <input type="text" class="input" id="field-prefix" value="${prefix}" placeholder="text.trv_kabinet" style="font-family: monospace;" />
            <span class="hint">
              ${isUk ? 'Картка звертається до: ' : 'Card connects to: '}
              <code style="color: #38bdf8;">${prefix ? prefix : 'text.trv_kabinet'}_weekly_schedule_[monday..sunday]</code>
            </span>
          </div>

          <div class="form-group">
            <label class="label">
              ${isUk ? 'Початковий режим перегляду' : 'Default View Mode'}
            </label>
            <select class="select" id="field-view">
              <option value="tabs" ${defaultView === 'tabs' ? 'selected' : ''}>${isUk ? 'День (Вкладки днів)' : 'Day (Single Day Tabs)'}</option>
              <option value="list" ${defaultView === 'list' ? 'selected' : ''}>${isUk ? 'Тиждень (Огляд усіх 7 днів)' : 'Week (All 7 Days List)'}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="label">
              ${isUk ? 'Мова картки' : 'Card Language'}
            </label>
            <select class="select" id="field-lang">
              <option value="" ${cardLang === '' ? 'selected' : ''}>${isUk ? 'Автоматично (з налаштувань Home Assistant)' : 'Auto (from Home Assistant settings)'}</option>
              <option value="uk" ${cardLang === 'uk' ? 'selected' : ''}>Українська (Ukrainian)</option>
              <option value="en" ${cardLang === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
        </div>
      `;

      this._attachListeners();
    }

    _attachListeners() {
      const root = this.shadowRoot;
      if (!root) return;

      const titleInput = root.getElementById('field-title');
      if (titleInput) {
        titleInput.addEventListener('change', e => this._valueChanged('title', e.target.value));
      }

      const climateInput = root.getElementById('field-climate');
      if (climateInput) {
        climateInput.addEventListener('change', e => this._valueChanged('climate_entity', e.target.value));
      }

      const prefixInput = root.getElementById('field-prefix');
      if (prefixInput) {
        prefixInput.addEventListener('change', e => this._valueChanged('entity_prefix', e.target.value));
      }

      const viewSelect = root.getElementById('field-view');
      if (viewSelect) {
        viewSelect.addEventListener('change', e => this._valueChanged('default_view', e.target.value));
      }

      const langSelect = root.getElementById('field-lang');
      if (langSelect) {
        langSelect.addEventListener('change', e => this._valueChanged('language', e.target.value));
      }

      root.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ent = btn.getAttribute('data-entity');
          if (ent) {
            this._valueChanged('climate_entity', ent);
            const climateInp = root.getElementById('field-climate');
            if (climateInp) climateInp.value = ent;
          }
        });
      });
    }
  }

  if (!customElements.get('sonoff-trv-schedule-card-editor')) {
    customElements.define('sonoff-trv-schedule-card-editor', SonoffTrvScheduleCardEditor);
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
      documentationURL: 'https://github.com/petronovak/sonoff-trv-schedule-card',
    });
  }
})();
