/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DayInfo {
  key: DayOfWeek;
  nameUk: string;
  shortUk: string;
  nameEn: string;
  shortEn: string;
  isWeekend: boolean;
}

export const DAYS_INFO: DayInfo[] = [
  { key: 'monday', nameUk: 'Понеділок', shortUk: 'Пн', nameEn: 'Monday', shortEn: 'Mon', isWeekend: false },
  { key: 'tuesday', nameUk: 'Вівторок', shortUk: 'Вт', nameEn: 'Tuesday', shortEn: 'Tue', isWeekend: false },
  { key: 'wednesday', nameUk: 'Середа', shortUk: 'Ср', nameEn: 'Wednesday', shortEn: 'Wed', isWeekend: false },
  { key: 'thursday', nameUk: 'Четвер', shortUk: 'Чт', nameEn: 'Thursday', shortEn: 'Thu', isWeekend: false },
  { key: 'friday', nameUk: "П'ятниця", shortUk: 'Пт', nameEn: 'Friday', shortEn: 'Fri', isWeekend: false },
  { key: 'saturday', nameUk: 'Субота', shortUk: 'Сб', nameEn: 'Saturday', shortEn: 'Sat', isWeekend: true },
  { key: 'sunday', nameUk: 'Неділя', shortUk: 'Нд', nameEn: 'Sunday', shortEn: 'Sun', isWeekend: true },
];

export interface ScheduleTransition {
  time: string; // 'HH:mm'
  temperature: number; // 4.0 - 35.0 (step 0.5)
}

export interface ScheduleInterval {
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  temperature: number;
  index: number;
}

export interface DaySchedule {
  day: DayOfWeek;
  entityId: string;
  rawString: string;
  transitions: ScheduleTransition[];
}

export interface CardConfig {
  title?: string;
  entity_prefix?: string;
  climate_entity?: string;
  show_timeline_hours?: boolean;
  default_view?: 'tabs' | 'list';
  entities?: Partial<Record<DayOfWeek, string>>;
}

export interface TemperaturePreset {
  label: string;
  labelUk: string;
  temperature: number;
  description: string;
  iconName: string;
}

export const TEMPERATURE_PRESETS: TemperaturePreset[] = [
  { label: 'Away', labelUk: 'Захист від замерзання', temperature: 7.0, description: 'Мінімальний обігрів', iconName: 'snowflake' },
  { label: 'Eco', labelUk: 'Економ', temperature: 17.0, description: 'Коли нікого немає вдома', iconName: 'leaf' },
  { label: 'Sleep', labelUk: 'Ніч / Сон', temperature: 19.0, description: 'Прохолода для здорового сну', iconName: 'moon' },
  { label: 'Comfort', labelUk: 'Комфорт', temperature: 21.5, description: 'Оптимальна денна температура', iconName: 'sun' },
  { label: 'Warm', labelUk: 'Тепло', temperature: 23.0, description: 'Підвищений комфорт', iconName: 'flame' },
  { label: 'Boost', labelUk: 'Швидкий нагрів', temperature: 25.0, description: 'Інтенсивне прогрівання', iconName: 'zap' },
];

/**
 * Converts HH:mm string to minutes from start of day (0 - 1440)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.min(1440, Math.max(0, h * 60 + m));
}

/**
 * Converts minutes from start of day (0 - 1440) to HH:mm string
 */
export function minutesToTime(minutes: number): string {
  const clamped = Math.min(1440, Math.max(0, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Round temperature to 0.5°C step and clamp to valid 4.0 - 35.0 range
 */
export function normalizeTemperature(temp: number): number {
  if (isNaN(temp)) return 20.0;
  const rounded = Math.round(temp * 2) / 2;
  return Math.min(35.0, Math.max(4.0, rounded));
}

/**
 * Formats a number to clean representation (e.g. 21 or 21.5)
 */
export function formatTempNumber(temp: number): string {
  const norm = normalizeTemperature(temp);
  return norm % 1 === 0 ? norm.toString() : norm.toFixed(1);
}

/**
 * Parses Sonoff TRVZB schedule text attribute (e.g. "00:00/23 07:00/21 10:00/20 19:30/23")
 */
export function parseScheduleString(raw: string): ScheduleTransition[] {
  if (!raw || typeof raw !== 'string') {
    return [{ time: '00:00', temperature: 20.0 }];
  }

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const transitions: ScheduleTransition[] = [];

  for (const part of parts) {
    const [timeStr, tempStr] = part.split('/');
    if (!timeStr || tempStr === undefined) continue;

    // Validate time format HH:mm
    const timeMatch = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) continue;

    const formattedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    const parsedTemp = parseFloat(tempStr);
    if (isNaN(parsedTemp)) continue;

    transitions.push({
      time: formattedTime,
      temperature: normalizeTemperature(parsedTemp),
    });
  }

  // Deduplicate and sort by time
  transitions.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Sonoff TRVZB requirement: first transition MUST start at 00:00
  if (transitions.length === 0) {
    transitions.push({ time: '00:00', temperature: 20.0 });
  } else if (transitions[0].time !== '00:00') {
    transitions.unshift({ time: '00:00', temperature: transitions[0].temperature });
  }

  // Sonoff TRVZB maximum: 6 transitions per day
  return transitions.slice(0, 6);
}

/**
 * Formats transitions array into the Sonoff TRVZB string for Zigbee2MQTT
 */
export function formatScheduleString(transitions: ScheduleTransition[]): string {
  if (!transitions || transitions.length === 0) {
    return '00:00/20';
  }

  // Clone, sort, enforce first at 00:00, clamp to 6
  const clean = [...transitions]
    .map(t => ({
      time: t.time.trim(),
      temperature: normalizeTemperature(t.temperature),
    }))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  if (clean.length === 0 || clean[0].time !== '00:00') {
    clean.unshift({ time: '00:00', temperature: clean[0]?.temperature ?? 20.0 });
  }

  // Eliminate same-time duplicates
  const uniqueTransitions: ScheduleTransition[] = [];
  for (const t of clean) {
    const existing = uniqueTransitions.find(item => item.time === t.time);
    if (!existing) {
      uniqueTransitions.push(t);
    } else {
      existing.temperature = t.temperature;
    }
  }

  return uniqueTransitions
    .slice(0, 6)
    .map(t => `${t.time}/${formatTempNumber(t.temperature)}`)
    .join(' ');
}

/**
 * Converts transitions into consecutive intervals covering the full 24h (1440 minutes)
 */
export function calculateIntervals(transitions: ScheduleTransition[]): ScheduleInterval[] {
  const sorted = [...transitions].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  if (sorted.length === 0 || sorted[0].time !== '00:00') {
    sorted.unshift({ time: '00:00', temperature: sorted[0]?.temperature ?? 20.0 });
  }

  const intervals: ScheduleInterval[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const startMinutes = timeToMinutes(current.time);
    const endMinutes = next ? timeToMinutes(next.time) : 1440;
    const durationMinutes = Math.max(0, endMinutes - startMinutes);

    intervals.push({
      startTime: current.time,
      endTime: next ? next.time : '24:00',
      startMinutes,
      endMinutes,
      durationMinutes,
      temperature: current.temperature,
      index: i,
    });
  }

  return intervals;
}

/**
 * Returns color classes and hex for a given temperature
 */
export function getTemperatureColor(temp: number): {
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  labelUk: string;
} {
  const t = normalizeTemperature(temp);

  if (t < 16) {
    return {
      hex: '#0284c7', // sky-600
      bgClass: 'bg-sky-500',
      borderClass: 'border-sky-400',
      textClass: 'text-sky-300',
      badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      labelUk: 'Охолодження / Еко',
    };
  }
  if (t < 19) {
    return {
      hex: '#0d9488', // teal-600
      bgClass: 'bg-teal-500',
      borderClass: 'border-teal-400',
      textClass: 'text-teal-300',
      badgeBg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      labelUk: 'Економний',
    };
  }
  if (t <= 21.5) {
    return {
      hex: '#16a34a', // green-600
      bgClass: 'bg-emerald-500',
      borderClass: 'border-emerald-400',
      textClass: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      labelUk: 'Комфорт',
    };
  }
  if (t <= 23.5) {
    return {
      hex: '#ea580c', // orange-600
      bgClass: 'bg-amber-500',
      borderClass: 'border-amber-400',
      textClass: 'text-amber-300',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      labelUk: 'Тепло',
    };
  }
  return {
    hex: '#dc2626', // red-600
    bgClass: 'bg-rose-500',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    labelUk: 'Інтенсивний нагрів',
  };
}

/**
 * Returns the currently active transition based on current time
 */
export function getActiveInterval(intervals: ScheduleInterval[], nowMinutes?: number): ScheduleInterval | null {
  if (!intervals || intervals.length === 0) return null;

  const currentM = nowMinutes !== undefined
    ? nowMinutes
    : new Date().getHours() * 60 + new Date().getMinutes();

  for (const interval of intervals) {
    if (currentM >= interval.startMinutes && currentM < interval.endMinutes) {
      return interval;
    }
  }

  return intervals[intervals.length - 1] ?? null;
}
