/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayOfWeek, DaySchedule, parseScheduleString } from '../types/trv.ts';

export interface TrvRoomPreset {
  id: string;
  name: string;
  prefix: string;
  climateEntity: string;
  currentTemp: number;
  targetTemp: number;
  battery: number;
  hvacAction: 'heating' | 'idle' | 'off';
  schedules: Record<DayOfWeek, string>;
}

export const ROOM_PRESETS: TrvRoomPreset[] = [
  {
    id: 'vitalnia',
    name: 'Вітальня (TRV Вітальня)',
    prefix: 'text.trv_vitalnia',
    climateEntity: 'climate.trv_vitalnia',
    currentTemp: 21.8,
    targetTemp: 23.0,
    battery: 92,
    hvacAction: 'heating',
    schedules: {
      monday: '00:00/23 07:00/21 10:00/20 19:30/23',
      tuesday: '00:00/23 07:00/21 10:00/20 19:30/23',
      wednesday: '00:00/23 07:00/21 10:00/20 19:30/23',
      thursday: '00:00/23 07:00/21 10:00/20 19:30/23',
      friday: '00:00/23 07:00/21 10:00/20 18:00/23',
      saturday: '00:00/22 08:30/23 13:00/22 18:00/23.5 23:00/20',
      sunday: '00:00/23 08:00/21 10:00/20 18:00/23',
    },
  },
  {
    id: 'spalnya',
    name: 'Спальня (TRV Спальня)',
    prefix: 'text.trv_spalnya',
    climateEntity: 'climate.trv_spalnya',
    currentTemp: 19.4,
    targetTemp: 19.0,
    battery: 88,
    hvacAction: 'idle',
    schedules: {
      monday: '00:00/18.5 06:30/21 08:30/17 19:00/21.5 22:30/18.5',
      tuesday: '00:00/18.5 06:30/21 08:30/17 19:00/21.5 22:30/18.5',
      wednesday: '00:00/18.5 06:30/21 08:30/17 19:00/21.5 22:30/18.5',
      thursday: '00:00/18.5 06:30/21 08:30/17 19:00/21.5 22:30/18.5',
      friday: '00:00/18.5 06:30/21 08:30/17 19:00/21.5 23:30/18.5',
      saturday: '00:00/19 08:00/21.5 12:00/20 18:00/22 23:30/19',
      sunday: '00:00/19 08:00/21.5 12:00/20 18:00/22 23:00/18.5',
    },
  },
  {
    id: 'dytiacha',
    name: 'Дитяча кімната',
    prefix: 'text.trv_dytiacha',
    climateEntity: 'climate.trv_dytiacha',
    currentTemp: 21.5,
    targetTemp: 22.0,
    battery: 95,
    hvacAction: 'heating',
    schedules: {
      monday: '00:00/20.5 07:00/22 09:00/21 16:30/22 21:00/20.5',
      tuesday: '00:00/20.5 07:00/22 09:00/21 16:30/22 21:00/20.5',
      wednesday: '00:00/20.5 07:00/22 09:00/21 16:30/22 21:00/20.5',
      thursday: '00:00/20.5 07:00/22 09:00/21 16:30/22 21:00/20.5',
      friday: '00:00/20.5 07:00/22 09:00/21 16:30/22 21:30/20.5',
      saturday: '00:00/21 08:00/22 13:00/21.5 18:00/22 21:30/20.5',
      sunday: '00:00/21 08:00/22 13:00/21.5 18:00/22 21:00/20.5',
    },
  },
  {
    id: 'kabinet',
    name: 'Кабінет (TRV Кабінет)',
    prefix: 'text.trv_kabinet',
    climateEntity: 'climate.trv_kabinet',
    currentTemp: 22.1,
    targetTemp: 22.5,
    battery: 98,
    hvacAction: 'heating',
    schedules: {
      monday: '00:00/19 08:00/22.5 18:30/20',
      tuesday: '00:00/19 08:00/22.5 18:30/20',
      wednesday: '00:00/19 08:00/22.5 18:30/20',
      thursday: '00:00/19 08:00/22.5 18:30/20',
      friday: '00:00/19 08:00/22.5 17:00/19.5',
      saturday: '00:00/19 10:00/21.5 19:00/19',
      sunday: '00:00/19 10:00/21.5 19:00/19',
    },
  },
];

export function buildDaySchedules(
  prefix: string,
  rawMap: Record<DayOfWeek, string>,
  customEntities?: Partial<Record<DayOfWeek, string>>
): DaySchedule[] {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.map(day => {
    const entityId = customEntities?.[day] || `${prefix}_weekly_schedule_${day}`;
    const rawString = rawMap[day] || '00:00/21';
    return {
      day,
      entityId,
      rawString,
      transitions: parseScheduleString(rawString),
    };
  });
}
