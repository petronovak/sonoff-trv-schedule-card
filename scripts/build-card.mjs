/**
 * Build script for Sonoff TRVZB Schedule Card
 * Synchronizes and validates the standalone Lovelace card bundle.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = process.cwd();
const sourceCard = path.join(rootDir, 'sonoff-trv-schedule-card.js');
const publicCard = path.join(rootDir, 'public', 'sonoff-trv-schedule-card.js');
const distDir = path.join(rootDir, 'dist');
const distCard = path.join(distDir, 'sonoff-trv-schedule-card.js');

console.log('📦 [build:card] Checking and packaging sonoff-trv-schedule-card.js...');

if (!fs.existsSync(sourceCard)) {
  console.error('❌ Error: sonoff-trv-schedule-card.js not found at workspace root.');
  process.exit(1);
}

const content = fs.readFileSync(sourceCard, 'utf8');

// Basic syntax check using Node vm
try {
  new vm.Script(content, { filename: 'sonoff-trv-schedule-card.js' });
  console.log('✅ Syntax check passed: valid JavaScript.');
} catch (err) {
  console.error('❌ Syntax error detected in sonoff-trv-schedule-card.js:', err.message);
  process.exit(1);
}

// Ensure public dir exists and write
fs.mkdirSync(path.dirname(publicCard), { recursive: true });
fs.writeFileSync(publicCard, content, 'utf8');
console.log(`✅ Synced to: ${path.relative(rootDir, publicCard)}`);

// If dist dir exists, sync there as well
if (fs.existsSync(distDir)) {
  fs.writeFileSync(distCard, content, 'utf8');
  console.log(`✅ Synced to: ${path.relative(rootDir, distCard)}`);
}

const stats = fs.statSync(sourceCard);
const sizeKb = (stats.size / 1024).toFixed(2);
console.log(`🎉 [build:card] Completed successfully! Size: ${sizeKb} KB (Version 1.1.0)`);
