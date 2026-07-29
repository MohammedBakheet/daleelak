#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const calendarsRoot = path.join(root, 'calendars');
const output = path.join(root, 'data', 'catalog.json');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.isFile() && ['info.json', 'metadata.json'].includes(entry.name)) return [full];
    return [];
  });
}

const entries = walk(calendarsRoot)
  .map(file => path.relative(root, file).split(path.sep).join('/'))
  .sort((a, b) => a.localeCompare(b, 'en'));

const catalog = {
  version: 2,
  updatedAt: new Date().toISOString().slice(0, 10),
  calendars: entries
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`Generated ${path.relative(root, output)} with ${entries.length} calendars.`);
