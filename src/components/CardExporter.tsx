/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Copy, Check, Code2, BookOpen, ExternalLink, Terminal, GitBranch, FolderGit2, ShieldCheck } from 'lucide-react';
import { I18N, Language } from '../types/i18n.ts';

interface CardExporterProps {
  cardTitle: string;
  entityPrefix: string;
  climateEntity: string;
  customEntities?: Record<string, string>;
  hasCustomEntities?: boolean;
  lang: Language;
}

export const CardExporter: React.FC<CardExporterProps> = ({
  cardTitle,
  entityPrefix,
  climateEntity,
  customEntities,
  hasCustomEntities = false,
  lang,
}) => {
  const t = I18N[lang];
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedHacsJson, setCopiedHacsJson] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [activeTab, setActiveTab] = useState<'yaml' | 'guide' | 'code' | 'hacs'>('yaml');
  const [jsCode, setJsCode] = useState<string>('');
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [hacsContent, setHacsContent] = useState<string>('');

  // Generate dynamic YAML snippet
  const yamlConfig = React.useMemo(() => {
    let yaml = `type: custom:sonoff-trv-schedule-card\n`;
    yaml += `title: "${cardTitle || (lang === 'en' ? 'Heating Schedule' : 'Розклад опалення')}"\n`;
    if (entityPrefix) {
      yaml += `entity_prefix: ${entityPrefix}\n`;
    }
    if (climateEntity) {
      yaml += `climate_entity: ${climateEntity}\n`;
    }
    if (lang === 'en') {
      yaml += `language: en\n`;
    }
    if (hasCustomEntities && customEntities && Object.keys(customEntities).length > 0) {
      yaml += `entities:\n`;
      for (const [day, id] of Object.entries(customEntities)) {
        yaml += `  ${day}: ${id}\n`;
      }
    }
    return yaml;
  }, [cardTitle, entityPrefix, climateEntity, customEntities, hasCustomEntities, lang]);

  const loadJsCode = async () => {
    if (!jsCode) {
      try {
        const res = await fetch('/sonoff-trv-schedule-card.js');
        const text = await res.text();
        setJsCode(text);
      } catch (err) {
        console.error('Failed to load JS file', err);
      }
    }
  };

  const loadHacsFiles = async () => {
    try {
      if (!readmeContent) {
        const r = await fetch('/README.md');
        setReadmeContent(await r.text());
      }
      if (!hacsContent) {
        const h = await fetch('/hacs.json');
        setHacsContent(await h.text());
      }
    } catch (err) {
      console.error('Failed to load HACS files', err);
    }
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlConfig);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2500);
  };

  const handleCopyJs = async () => {
    await loadJsCode();
    if (jsCode) {
      navigator.clipboard.writeText(jsCode);
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2500);
    }
  };

  const handleCopyHacsJson = async () => {
    await loadHacsFiles();
    const content = hacsContent || `{\n  "name": "Sonoff TRVZB Weekly Schedule Card",\n  "content_in_root": true,\n  "filename": "sonoff-trv-schedule-card.js",\n  "render_readme": true\n}`;
    navigator.clipboard.writeText(content);
    setCopiedHacsJson(true);
    setTimeout(() => setCopiedHacsJson(false), 2500);
  };

  const handleCopyReadme = async () => {
    await loadHacsFiles();
    if (readmeContent) {
      navigator.clipboard.writeText(readmeContent);
      setCopiedReadme(true);
      setTimeout(() => setCopiedReadme(false), 2500);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('yaml')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'yaml'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.tabYaml}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('hacs');
              loadHacsFiles();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'hacs'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>{t.tabHacs}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'guide'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.tabGuide}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('code');
              loadJsCode();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'code'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.tabCode}
          </button>
        </div>

        {/* Primary Download Button */}
        <button
          type="button"
          onClick={() => triggerDownload('/sonoff-trv-schedule-card.js', 'sonoff-trv-schedule-card.js')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{t.btnDownloadJs}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* YAML Tab */}
        {activeTab === 'yaml' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{t.readyYamlTitle}</h3>
                <p className="text-xs text-slate-400">{t.readyYamlSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyYaml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {copiedYaml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{t.copiedSuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.btnCopyYaml}</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 text-sky-300 leading-relaxed overflow-x-auto select-all">
              <pre>{yamlConfig}</pre>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              💡 {t.yamlHowItWorks}
            </div>
          </div>
        )}

        {/* HACS & GitHub Tab */}
        {activeTab === 'hacs' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-amber-400" />
                <span>{t.hacsTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.hacsSubtitle}</p>
            </div>

            {/* Structure Diagram & Download Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  {t.hacsRepoStructure}
                </span>
                <div className="font-mono text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-sky-300">📁 hacs.json</span>
                    <button
                      onClick={handleCopyHacsJson}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      {copiedHacsJson ? '✓' : 'Копіювати'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-sky-300">📄 README.md</span>
                    <button
                      onClick={handleCopyReadme}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      {copiedReadme ? '✓' : 'Копіювати'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-sky-300">⚖️ LICENSE (Apache-2.0)</span>
                    <button
                      onClick={() => triggerDownload('/LICENSE', 'LICENSE')}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Завантажити
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-emerald-400 font-bold">⚡ sonoff-trv-schedule-card.js</span>
                    <button
                      onClick={() => triggerDownload('/sonoff-trv-schedule-card.js', 'sonoff-trv-schedule-card.js')}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Завантажити
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions for GitHub */}
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Завантаження файлів для репозиторію:
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => triggerDownload('/hacs.json', 'hacs.json')}
                    className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                  >
                    <span>Завантажити <strong>hacs.json</strong></span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => triggerDownload('/README.md', 'README.md')}
                    className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                  >
                    <span>Завантажити <strong>README.md</strong></span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => triggerDownload('/LICENSE', 'LICENSE')}
                    className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                  >
                    <span>Завантажити <strong>LICENSE</strong></span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* How to publish and install in HACS */}
            <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-3 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {t.hacsHowToInstall}
              </span>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  Створіть новий публічний репозиторій на GitHub (наприклад,{' '}
                  <code className="text-sky-300 font-mono">sonoff-trv-schedule-card</code>).
                </li>
                <li>
                  Завантажте у корінь 4 файли: <code className="text-amber-300 font-mono">hacs.json</code>,{' '}
                  <code className="text-amber-300 font-mono">sonoff-trv-schedule-card.js</code>,{' '}
                  <code className="text-amber-300 font-mono">README.md</code> та{' '}
                  <code className="text-amber-300 font-mono">LICENSE</code>.
                </li>
                <li>
                  Зробіть GitHub Release (наприклад, тег <code className="text-emerald-300 font-mono">v1.0.0</code>).
                </li>
                <li>
                  У Home Assistant відкрийте <strong>HACS</strong> → три крапки вгорі справа →{' '}
                  <strong>Користувацькі репозиторії (Custom repositories)</strong>.
                </li>
                <li>
                  Вставте посилання на ваш репозиторій, оберіть категорію <strong>Dashboard (Панель)</strong> та натисніть <strong>Додати</strong>.
                </li>
                <li>
                  Тепер картку можна оновлювати в 1 клік через інтерфейс HACS!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Installation Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white">{t.guideTitle}</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center font-mono">
                    1
                  </div>
                  <span>{t.step1Title}</span>
                </div>
                <p className="text-xs text-slate-300">{t.step1Desc}</p>
                <div className="p-2 bg-slate-950 font-mono text-[11px] text-slate-300 rounded border border-slate-800 select-all">
                  /config/www/sonoff-trv-schedule-card.js
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center font-mono">
                    2
                  </div>
                  <span>{t.step2Title}</span>
                </div>
                <p className="text-xs text-slate-300">{t.step2Desc}</p>
                <div className="p-2 bg-slate-950 font-mono text-[11px] text-slate-300 rounded border border-slate-800">
                  URL: <strong>/local/sonoff-trv-schedule-card.js</strong>
                  <br />
                  Тип: <strong>JavaScript Module</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center font-mono">
                    3
                  </div>
                  <span>{t.step3Title}</span>
                </div>
                <p className="text-xs text-slate-300">{t.step3Desc}</p>
                <div className="text-[11px] text-emerald-400 font-medium">
                  ✓ Готово! Графік і кнопки керування з'являться на панелі.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JS Code Tab */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Автономний Web Component (Vanilla JavaScript)
                </h3>
                <p className="text-xs text-slate-400">
                  Підтримує українську та англійську мови, без зовнішніх залежностей.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyJs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {copiedJs ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{t.copiedSuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копіювати JS-код</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-normal select-all">
              <pre>{jsCode || '// Завантаження коду...'}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
