/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'uk' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  navEmulator: string;
  navConfig: string;
  navExport: string;
  navHacs: string;
  navDocs: string;
  btnDownloadJs: string;
  bannerTitle: string;
  bannerEntities: string;
  bannerFormat: string;
  roomLabel: string;
  cardPreviewTitle: string;
  cardPreviewSubtitle: string;
  cardTypeTag: string;
  todayBadge: string;
  weekendBadge: string;
  periodsCount: string;
  activeNow: string;
  targetTempLabel: string;
  currentTempLabel: string;
  batteryLabel: string;
  hourScale: string;
  btnEditSchedule: string;
  btnCopyWeekdays: string;
  btnCopyWeekend: string;
  btnCopyAll: string;
  viewDay: string;
  viewWeek: string;
  clickToEditWeek: string;
  modalTitle: string;
  modalPointsCount: string;
  modalScale24h: string;
  modalStepInfo: string;
  modalTransitionPoints: string;
  btnAddPeriod: string;
  dayStartLocked: string;
  modalQuickCopy: string;
  modalRawServiceString: string;
  modalValidated: string;
  modalCancel: string;
  modalSave: string;
  modalCopyWeekdaysSuccess: string;
  modalCopyWeekendSuccess: string;
  modalCopyAllSuccess: string;
  copiedNotificationWeekdays: string;
  copiedNotificationWeekend: string;
  copiedNotificationAll: string;
  configTitle: string;
  configSubtitle: string;
  modeSimulator: string;
  modeLiveHa: string;
  quickRoomSelect: string;
  liveHaParams: string;
  haUrlLabel: string;
  haTokenLabel: string;
  btnTestConnection: string;
  statusConnected: string;
  statusTesting: string;
  cardTitleField: string;
  entityPrefixField: string;
  climateEntityField: string;
  advancedEntitiesToggle: string;
  advancedEntitiesHint: string;
  serviceLogsTitle: string;
  btnClearLogs: string;
  noLogsMsg: string;
  tabYaml: string;
  tabGuide: string;
  tabCode: string;
  tabHacs: string;
  readyYamlTitle: string;
  readyYamlSubtitle: string;
  btnCopyYaml: string;
  copiedSuccess: string;
  yamlHowItWorks: string;
  guideTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  hacsTitle: string;
  hacsSubtitle: string;
  hacsRepoStructure: string;
  btnCopyHacsJson: string;
  btnCopyReadme: string;
  btnDownloadReadme: string;
  btnDownloadHacsJson: string;
  btnDownloadLicense: string;
  hacsHowToInstall: string;
  presets: {
    away: string;
    eco: string;
    sleep: string;
    comfort: string;
    warm: string;
    boost: string;
  };
}

export const I18N: Record<Language, Translations> = {
  uk: {
    appName: 'Sonoff TRVZB Lovelace Card',
    appSubtitle: 'Графічний 24-годинний розклад опалення для Home Assistant (Zigbee2MQTT)',
    navEmulator: 'Інтерактивна картка',
    navConfig: 'Конфігурація сутностей',
    navExport: 'YAML та інсталяція',
    navHacs: 'HACS & GitHub',
    navDocs: 'Документація TRVZB',
    btnDownloadJs: 'Завантажити .js',
    bannerTitle: 'Картка тижневого розкладу для Zigbee2MQTT',
    bannerEntities: 'Сутності:',
    bannerFormat: 'Формат: HH:mm/t (до 6 періодів на добу)',
    roomLabel: 'Кімната:',
    cardPreviewTitle: 'Превʼю картки Lovelace',
    cardPreviewSubtitle: 'Саме так картка виглядає на вашому дашборді Home Assistant',
    cardTypeTag: 'type: custom:sonoff-trv-schedule-card',
    todayBadge: 'Сьогодні',
    weekendBadge: 'Вихідний',
    periodsCount: 'періодів',
    activeNow: 'Зараз активно:',
    targetTempLabel: 'Цільова:',
    currentTempLabel: 'Поточна',
    batteryLabel: 'Батарея',
    hourScale: '24-годинна шкала:',
    btnEditSchedule: 'Редагувати розклад',
    btnCopyWeekdays: 'На будні',
    btnCopyWeekend: 'На вихідні',
    btnCopyAll: 'На тиждень',
    viewDay: 'День',
    viewWeek: 'Тиждень',
    clickToEditWeek: 'Натисніть на будь-який день для детального редагування:',
    modalTitle: 'Розклад:',
    modalPointsCount: 'точок',
    modalScale24h: '24-годинний профіль дня',
    modalStepInfo: 'Крок температури: 0.5°C (діапазон 4.0 - 35.0°C)',
    modalTransitionPoints: 'Точки переходу температури',
    btnAddPeriod: 'Додати період',
    dayStartLocked: '(початок доби фіксований)',
    modalQuickCopy: 'Швидке копіювання розкладу цього дня:',
    modalRawServiceString: 'Рядок для сервісу text.set_value (Zigbee2MQTT):',
    modalValidated: '✓ Валідовано',
    modalCancel: 'Скасувати',
    modalSave: 'Зберегти розклад у сутність',
    modalCopyWeekdaysSuccess: 'Скопійовано на всі будні дні (Пн-Пт)!',
    modalCopyWeekendSuccess: 'Скопійовано на вихідні (Сб-Нд)!',
    modalCopyAllSuccess: 'Скопійовано на весь тиждень (7 днів)!',
    copiedNotificationWeekdays: 'Розклад скопійовано на всі будні (Пн-Пт)',
    copiedNotificationWeekend: 'Розклад скопійовано на вихідні (Сб-Нд)',
    copiedNotificationAll: 'Розклад скопійовано на весь тиждень',
    configTitle: 'Конфігурація та привʼязка сутностей',
    configSubtitle: 'Налаштування термостата Sonoff TRVZB для картки та перевірка викликів служб',
    modeSimulator: 'Вбудований симулятор',
    modeLiveHa: 'Підключення до мого HA',
    quickRoomSelect: 'Швидкий вибір кімнати (демо-пресети)',
    liveHaParams: 'Параметри прямого підключення до вашого Home Assistant',
    haUrlLabel: 'URL вашого Home Assistant (наприклад, http://homeassistant.local:8123)',
    haTokenLabel: 'Long-Lived Access Token (Профіль у HA → Безпека → Створити токен)',
    btnTestConnection: 'Перевірити підключення',
    statusConnected: 'Підключено до Home Assistant!',
    statusTesting: 'Перевірка зв\'язку...',
    cardTitleField: 'Назва картки на дашборді',
    entityPrefixField: 'Базовий префікс сутності (Zigbee2MQTT)',
    climateEntityField: 'Клімат-сутність (опційно для поточної t°)',
    advancedEntitiesToggle: 'Індивідуальні сутності для кожного дня (автоматично генеруються за префіксом)',
    advancedEntitiesHint: 'За замовчуванням система підставляє _weekly_schedule_<day>. Змініть за потреби:',
    serviceLogsTitle: 'Журнал викликів служб Home Assistant (text.set_value)',
    btnClearLogs: 'Очистити журнал',
    noLogsMsg: 'Жодних викликів служб поки не було. Відредагуйте або скопіюйте розклад вище.',
    tabYaml: 'Конфігурація картки (YAML)',
    tabGuide: 'Інструкція встановлення',
    tabCode: 'Вихідний код (.js)',
    tabHacs: 'HACS & GitHub репозиторій',
    readyYamlTitle: 'Готовий YAML для вашого Lovelace',
    readyYamlSubtitle: 'Вставте цей фрагмент при додаванні ручної картки (Manual Card) у Home Assistant.',
    btnCopyYaml: 'Копіювати YAML',
    copiedSuccess: 'Скопійовано!',
    yamlHowItWorks: 'Картка автоматично підключається до сутностей і викликає text.set_value при збереженні.',
    guideTitle: 'Покрокове встановлення картки в Home Assistant (3 простих кроки)',
    step1Title: 'Скопіювати файл',
    step1Desc: 'Завантажте файл sonoff-trv-schedule-card.js та покладіть його в теку /config/www/',
    step2Title: 'Зареєструвати ресурс',
    step2Desc: 'У Налаштування → Панелі приладів → Ресурси додайте URL /local/sonoff-trv-schedule-card.js як JavaScript Module',
    step3Title: 'Додати картку',
    step3Desc: 'На дашборді оберіть "Додати картку" → "Вручну" і вставте згенерований YAML-код',
    hacsTitle: 'Публікація та встановлення через HACS',
    hacsSubtitle: 'Усі файли, готові для створення власного GitHub репозиторію та додавання в HACS',
    hacsRepoStructure: 'Структура репозиторію GitHub:',
    btnCopyHacsJson: 'Копіювати hacs.json',
    btnCopyReadme: 'Копіювати README.md',
    btnDownloadReadme: 'Завантажити README.md',
    btnDownloadHacsJson: 'Завантажити hacs.json',
    btnDownloadLicense: 'Завантажити LICENSE',
    hacsHowToInstall: 'Як додати у HACS як кастомний репозиторій:',
    presets: {
      away: 'Антизамерзання',
      eco: 'Економ',
      sleep: 'Ніч / Сон',
      comfort: 'Комфорт',
      warm: 'Тепло',
      boost: 'Швидкий нагрів',
    },
  },
  en: {
    appName: 'Sonoff TRVZB Lovelace Card',
    appSubtitle: 'Graphical 24-hour weekly heating schedule card for Home Assistant (Zigbee2MQTT)',
    navEmulator: 'Interactive Card',
    navConfig: 'Entity Configuration',
    navExport: 'YAML & Install',
    navHacs: 'HACS & GitHub',
    navDocs: 'TRVZB Docs',
    btnDownloadJs: 'Download .js',
    bannerTitle: 'Zigbee2MQTT Weekly Heating Schedule Card',
    bannerEntities: 'Entities:',
    bannerFormat: 'Format: HH:mm/temp (up to 6 transitions per day)',
    roomLabel: 'Room:',
    cardPreviewTitle: 'Lovelace Card Preview',
    cardPreviewSubtitle: 'Exactly how the card appears on your Home Assistant dashboard',
    cardTypeTag: 'type: custom:sonoff-trv-schedule-card',
    todayBadge: 'Today',
    weekendBadge: 'Weekend',
    periodsCount: 'periods',
    activeNow: 'Active now:',
    targetTempLabel: 'Target:',
    currentTempLabel: 'Current',
    batteryLabel: 'Battery',
    hourScale: '24-hour scale:',
    btnEditSchedule: 'Edit schedule',
    btnCopyWeekdays: 'To weekdays',
    btnCopyWeekend: 'To weekend',
    btnCopyAll: 'To whole week',
    viewDay: 'Day',
    viewWeek: 'Week',
    clickToEditWeek: 'Click any day for detailed schedule editing:',
    modalTitle: 'Schedule:',
    modalPointsCount: 'points',
    modalScale24h: '24-hour day profile',
    modalStepInfo: 'Temperature step: 0.5°C (range 4.0 - 35.0°C)',
    modalTransitionPoints: 'Temperature transition points',
    btnAddPeriod: 'Add period',
    dayStartLocked: '(day start is locked to 00:00)',
    modalQuickCopy: 'Quick copy schedule from this day:',
    modalRawServiceString: 'String for text.set_value service (Zigbee2MQTT):',
    modalValidated: '✓ Validated',
    modalCancel: 'Cancel',
    modalSave: 'Save schedule to entity',
    modalCopyWeekdaysSuccess: 'Copied to all weekdays (Mon-Fri)!',
    modalCopyWeekendSuccess: 'Copied to weekend (Sat-Sun)!',
    modalCopyAllSuccess: 'Copied to all 7 days of the week!',
    copiedNotificationWeekdays: 'Schedule copied to all weekdays (Mon-Fri)',
    copiedNotificationWeekend: 'Schedule copied to weekend (Sat-Sun)',
    copiedNotificationAll: 'Schedule copied to the entire week',
    configTitle: 'Entity Configuration & Binding',
    configSubtitle: 'Configure Sonoff TRVZB entities for Lovelace and inspect live service calls',
    modeSimulator: 'Built-in Simulator',
    modeLiveHa: 'Connect to my HA',
    quickRoomSelect: 'Quick room preset selection (Demo)',
    liveHaParams: 'Direct connection parameters to your Home Assistant',
    haUrlLabel: 'Your Home Assistant URL (e.g. http://homeassistant.local:8123)',
    haTokenLabel: 'Long-Lived Access Token (HA Profile → Security → Create token)',
    btnTestConnection: 'Test Connection',
    statusConnected: 'Connected to Home Assistant!',
    statusTesting: 'Testing connection...',
    cardTitleField: 'Card title on dashboard',
    entityPrefixField: 'Base entity prefix (Zigbee2MQTT)',
    climateEntityField: 'Climate entity (optional for current t°)',
    advancedEntitiesToggle: 'Individual entities per day (automatically generated from prefix)',
    advancedEntitiesHint: 'By default the card appends _weekly_schedule_<day>. Override if necessary:',
    serviceLogsTitle: 'Home Assistant Service Call Log (text.set_value)',
    btnClearLogs: 'Clear log',
    noLogsMsg: 'No service calls yet. Edit or copy a schedule above to see the payload sent.',
    tabYaml: 'Card Configuration (YAML)',
    tabGuide: 'Installation Guide',
    tabCode: 'Source Code (.js)',
    tabHacs: 'HACS & GitHub Repository',
    readyYamlTitle: 'Ready YAML for your Lovelace Dashboard',
    readyYamlSubtitle: 'Paste this snippet when adding a Manual Card in Home Assistant.',
    btnCopyYaml: 'Copy YAML',
    copiedSuccess: 'Copied!',
    yamlHowItWorks: 'The card binds automatically to entities and calls text.set_value on each save.',
    guideTitle: 'Step-by-step Home Assistant Installation (3 simple steps)',
    step1Title: 'Copy the file',
    step1Desc: 'Download sonoff-trv-schedule-card.js and place it into your /config/www/ folder',
    step2Title: 'Register Resource',
    step2Desc: 'In Settings → Dashboards → Resources, add /local/sonoff-trv-schedule-card.js as JavaScript Module',
    step3Title: 'Add Card',
    step3Desc: 'On any dashboard click "Add Card" → "Manual" and paste the generated YAML snippet',
    hacsTitle: 'Publishing & Installing via HACS',
    hacsSubtitle: 'All files ready to create your GitHub repository and install through HACS Community Store',
    hacsRepoStructure: 'GitHub Repository Structure:',
    btnCopyHacsJson: 'Copy hacs.json',
    btnCopyReadme: 'Copy README.md',
    btnDownloadReadme: 'Download README.md',
    btnDownloadHacsJson: 'Download hacs.json',
    btnDownloadLicense: 'Download LICENSE',
    hacsHowToInstall: 'How to add to HACS as a Custom Repository:',
    presets: {
      away: 'Frost Protection',
      eco: 'Eco',
      sleep: 'Sleep / Night',
      comfort: 'Comfort',
      warm: 'Warm',
      boost: 'Boost Heat',
    },
  },
};
