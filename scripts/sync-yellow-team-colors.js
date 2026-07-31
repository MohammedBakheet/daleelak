#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const yellowRoot = path.join(root, 'calendars', 'sports', 'yellow');
const leagueColorsFile = path.join(yellowRoot, 'league', 'team-colors.json');
const teamsRoot = path.join(yellowRoot, 'teams');

const approved = {
  'العروبة': { hex: '#015B65', icon: '🟢', colorName: 'أخضر داكن مائل للفيروزي' },
  'الوحدة': { hex: '#BE0101', icon: '🔴', colorName: 'أحمر' },
  'الرائد': { hex: '#950000', icon: '🔴', colorName: 'أحمر داكن' },
  'العدالة': { hex: '#0F3759', icon: '🔵', colorName: 'كحلي' },
  'الأنوار': { hex: '#6C757D', icon: '⚫', colorName: 'رمادي' },
  'العلا': { hex: '#2F537D', icon: '🔵', colorName: 'أزرق رمادي' },
  'الدرعية': { hex: '#930000', icon: '🔴', colorName: 'أحمر داكن' },
  'الجندل': { hex: '#C01722', icon: '🔴', colorName: 'أحمر' },
  'الطائي': { hex: '#6C757D', icon: '⚫', colorName: 'رمادي' },
  'الباطن': { hex: '#97BFE7', icon: '🔵', colorName: 'أزرق سماوي' },
  'الفيصلي': { hex: '#832B2A', icon: '🟤', colorName: 'عنابي مائل للبني' },
  'البكيرية': { hex: '#65388F', icon: '🟣', colorName: 'بنفسجي' },
  'أبها': { hex: '#1751C0', icon: '🔵', colorName: 'أزرق' },
  'العربي': { hex: '#DA2740', icon: '🔴', colorName: 'أحمر وردي' },
  'الجبلين': { hex: '#4E1616', icon: '🟤', colorName: 'بني داكن' },
  'جدة': { hex: '#2E4074', icon: '🔵', colorName: 'أزرق داكن' },
  'الزلفي': { hex: '#FF6F00', icon: '🟠', colorName: 'برتقالي' },
  'الجبيل': { hex: '#B9B434', icon: '🟡', colorName: 'أصفر زيتوني' }
};

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function walk(dir, filename) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, filename);
    return entry.isFile() && entry.name === filename ? [full] : [];
  });
}
function replaceTeamIcon(text, team, icon) {
  const escaped = team.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const emoji = '(?:🔴|🟠|🟡|🟢|🔵|🟣|🟤|⚫|⚪|⚽)';
  return text.replace(new RegExp(`${emoji}\\s*${escaped}`, 'gu'), `${icon} ${team}`);
}

const colors = readJson(leagueColorsFile);
for (const [team, value] of Object.entries(approved)) colors[team] = value;
writeJson(leagueColorsFile, colors);

// Keep every team copy synchronized with the league source.
for (const file of walk(teamsRoot, 'team-colors.json')) writeJson(file, colors);

// Update team metadata where a matching current calendar exists.
for (const file of walk(teamsRoot, 'metadata.json')) {
  const data = readJson(file);
  const name = data.teamName || data.team;
  if (approved[name]) {
    data.teamColor = approved[name];
    writeJson(file, data);
  }
}

// Update event JSON files (league + individual teams).
for (const file of walk(yellowRoot, 'events.json')) {
  const events = readJson(file);
  let changed = false;
  for (const event of events) {
    for (const side of ['home', 'away']) {
      const name = event[side];
      const value = approved[name];
      if (!value) continue;
      event[`${side}Icon`] = value.icon;
      event[`${side}Color`] = value.colorName;
      event[`${side}Hex`] = value.hex;
      changed = true;
    }
    if (approved[event.home] || approved[event.away]) {
      const homeIcon = approved[event.home]?.icon || event.homeIcon || '⚽';
      const awayIcon = approved[event.away]?.icon || event.awayIcon || '⚽';
      event.title = `${homeIcon} ${event.home} × ${awayIcon} ${event.away}`;
      changed = true;
    }
  }
  if (changed) writeJson(file, events);
}

// Update emoji markers in all Yellow ICS files, including descriptions.
for (const file of walk(yellowRoot, 'calendar.ics')) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [team, value] of Object.entries(approved)) text = replaceTeamIcon(text, team, value.icon);
  if (text !== before) fs.writeFileSync(file, text, 'utf8');
}

console.log(`Synchronized ${Object.keys(approved).length} approved Yellow League team colors.`);
