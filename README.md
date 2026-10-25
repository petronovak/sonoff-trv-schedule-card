# Sonoff TRVZB Weekly Heating Schedule Card for Home Assistant (Lovelace)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/default)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.1%2B-blue.svg)](https://www.home-assistant.io/)
[![Zigbee2MQTT](https://img.shields.io/badge/Zigbee2MQTT-Compatible-emerald.svg)](https://www.zigbee2mqtt.io/devices/TRVZB.html)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A modern, intuitive, and error-free Lovelace card to view and edit weekly heating schedules for **Sonoff TRVZB** thermostatic radiator valves integrated via **Zigbee2MQTT**.

*Також доступно українською мовою нижче.*

---

## English

### Overview
In Zigbee2MQTT, the heating schedule for Sonoff TRVZB valves is configured via 7 text entities (`text.trv_*_weekly_schedule_monday` ... `sunday`), using the raw format:
`00:00/23 07:00/21 10:00/20 18:00/23`

Editing these strings manually in text inputs is tedious, prone to typing errors, and lacks visual feedback. This card solves the problem with:
- **24-hour visual heat gradient timeline** for each day of the week.
- **Error-free period editor**: Automatically enforces the mandatory `00:00` start, sorts chronologically, respects the 6-period limit, and steps in `0.5°C` (range `4.0°C` – `35.0°C`).
- **Quick temperature presets**: Frost Protection (7°C), Eco (17°C), Sleep (19°C), Comfort (21.5°C), Warm (23°C), Boost (25°C).
- **Bulk copy**: Copy schedule from any day to **All Weekdays (Mon-Fri)**, **Weekend (Sat-Sun)**, or **Whole Week** in one click.
- **Bilingual (English & Ukrainian)**: Automatically detects Home Assistant interface language or can be set manually.
- **Optional Climate integration**: Shows current room temperature, setpoint, and battery level directly in the card header.

---

### Installation via HACS (Recommended)

1. Open **HACS** in your Home Assistant.
2. Click on the 3 dots in the top right corner and choose **Custom repositories**.
3. Enter your repository URL: `https://github.com/petronovak/sonoff-trv-schedule-card`
4. Select category: **Dashboard** (or **Lovelace**).
5. Click **Add**, find **Sonoff TRVZB Weekly Schedule Card** in the list, and click **Download**.
6. Refresh your browser (or reload Lovelace resources).

---

### Manual Installation

1. Download [`sonoff-trv-schedule-card.js`](sonoff-trv-schedule-card.js).
2. Copy `sonoff-trv-schedule-card.js` into your `/config/www/` folder.
3. In Home Assistant, go to **Settings → Dashboards → Resources** and click **Add Resource**:
   - **URL**: `/local/sonoff-trv-schedule-card.js`
   - **Resource type**: `JavaScript Module`
4. Add the card to any dashboard using the manual YAML editor.

---

### Configuration Options

| Option | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | string | **Yes** | `custom:sonoff-trv-schedule-card` | Card type identifier |
| `entity` / `climate_entity` | string | Recommended | `''` | Linked climate entity (e.g. `climate.trv_kabinet`). **The card automatically derives the prefix** `text.trv_kabinet` for all 7 days! |
| `title` | string | No | `'Sonoff TRVZB Heating Schedule'` | Card header title |
| `entity_prefix` | string | No | Auto from climate | Common prefix for the 7 text entities (e.g. `text.trv_kabinet`). Overrides auto-derivation. |
| `language` | string | No | `'auto'` | Force language: `'en'` or `'uk'`. If omitted, detects automatically from Home Assistant. |
| `entities` | map | No | `{}` | Explicit mapping of custom entity IDs for each day (`monday` to `sunday`) if needed. |

#### Minimal Example (Auto-derived from Climate Entity):

```yaml
type: custom:sonoff-trv-schedule-card
entity: climate.trv_kabinet
# Automatically binds to: text.trv_kabinet_weekly_schedule_monday ... sunday
```

#### Full Example:

```yaml
type: custom:sonoff-trv-schedule-card
title: "Кабінет (Опалення)"
entity: climate.trv_kabinet
language: uk
```

#### Example with Manual Entity Mapping:

```yaml
type: custom:sonoff-trv-schedule-card
title: "Custom Radiator"
climate_entity: climate.radiator_valve
entities:
  monday: text.trv_rad_monday_sched
  tuesday: text.trv_rad_tuesday_sched
  wednesday: text.trv_rad_wednesday_sched
  thursday: text.trv_rad_thursday_sched
  friday: text.trv_rad_friday_sched
  saturday: text.trv_rad_saturday_sched
  sunday: text.trv_rad_sunday_sched
```

---

## Українська (Ukrainian)

### Опис
У Zigbee2MQTT тижневий розклад термоголовок Sonoff TRVZB зберігається у 7 текстових сутностях (`text.trv_*_weekly_schedule_monday` ... `sunday`) у форматі рядка `00:00/23 07:00/21 10:00/20 18:00/23`.

Ця Lovelace-картка перетворює налаштування на зручний графічний процес:
- 24-годинні кольорові таймлайни температури.
- Захист від помилок: обов'язковий старт о 00:00, до 6 точок, крок 0.5°C (від 4 до 35°C).
- Швидкі пресети (Еко, Ніч, Комфорт, Тепло, Boost).
- Копіювання розкладу в 1 клік на всі будні або весь тиждень.
- Підтримка відображення поточної температури з прив'язаного `climate.*`.

### Ліцензія
Розповсюджується за ліцензією [Apache 2.0](LICENSE).
