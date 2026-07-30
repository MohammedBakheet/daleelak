#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const calendarsRoot = path.join(root, 'calendars');
const dataRoot = path.join(root, 'data');
const siteUrl = String(process.env.SITE_URL || 'https://mohammedbakheet.github.io/daleelak').replace(/\/$/, '');
const required = ['id','title','organization','category','year','lastUpdate','description'];

function walk(dir, names) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, names);
    if (entry.isFile() && names.includes(entry.name)) return [full];
    return [];
  });
}
function fail(message) { console.error(`ERROR: ${message}`); process.exitCode = 1; }
function toPosix(p) { return p.split(path.sep).join('/'); }
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail(`${toPosix(path.relative(root,file))}: JSON غير صالح (${error.message})`); return null; }
}
function countEvents(icsFile) {
  if (!fs.existsSync(icsFile)) return 0;
  return (fs.readFileSync(icsFile,'utf8').match(/BEGIN:VEVENT/g) || []).length;
}
function xml(value) { return String(value).replace(/[<>&'\"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c])); }

const categoriesFile = path.join(dataRoot, 'categories.json');
const categoriesData = readJson(categoriesFile) || {categories:[]};
const categoryIds = new Set((categoriesData.categories || []).map(x => x.id));
const files = walk(calendarsRoot, ['info.json','metadata.json']).sort((a,b)=>a.localeCompare(b,'en'));
const ids = new Set();
const entries = [];

for (const file of files) {
  const info = readJson(file);
  if (!info) continue;
  const relInfo = toPosix(path.relative(root,file));
  for (const key of required) if (!String(info[key] ?? '').trim()) fail(`${relInfo}: الحقل ${key} مطلوب`);
  if (ids.has(info.id)) fail(`${relInfo}: المعرّف مكرر (${info.id})`); else ids.add(info.id);
  if (!categoryIds.has(info.category)) fail(`${relInfo}: التصنيف غير موجود (${info.category})`);
  const folder = path.dirname(file);
  const icsName = info.ics || 'calendar.ics';
  const icsFile = path.join(folder, icsName);
  if (!fs.existsSync(icsFile)) fail(`${relInfo}: ملف ICS غير موجود (${icsName})`);
  else {
    const ics = fs.readFileSync(icsFile,'utf8');
    if (!ics.includes('BEGIN:VCALENDAR') || !ics.includes('END:VCALENDAR')) fail(`${relInfo}: بنية ICS غير صالحة`);
  }
  const logoName = info.logo || '';
  if (logoName && !fs.existsSync(path.join(folder,logoName))) fail(`${relInfo}: الشعار غير موجود (${logoName})`);
  const folderRel = toPosix(path.relative(root,folder));
  entries.push({
    ...info,
    infoPath: relInfo,
    folderPath: `${folderRel}/`,
    icsPath: `${folderRel}/${icsName}`,
    logoPath: logoName ? `${folderRel}/${logoName}` : '',
    eventsCount: Number(info.eventsCount || countEvents(icsFile)),
    detailPath: `calendar.html?id=${encodeURIComponent(info.id)}`
  });
}

// Read sports league definitions and build one static data file per league.
const leagueFiles = walk(path.join(calendarsRoot,'sports'), ['league.json']).sort((a,b)=>a.localeCompare(b,'en'));
const leagues = [];
for (const file of leagueFiles) {
  const league = readJson(file);
  if (!league || league.status === 'inactive') continue;
  if (!league.id || !league.title || !league.leagueCalendarId) {
    fail(`${toPosix(path.relative(root,file))}: id وtitle وleagueCalendarId مطلوبة`);
    continue;
  }
  const mainCalendar = entries.find(x => x.id === league.leagueCalendarId);
  if (!mainCalendar) {
    fail(`${toPosix(path.relative(root,file))}: تقويم البطولة غير موجود (${league.leagueCalendarId})`);
    continue;
  }
  const teams = entries
    .filter(x => x.category === 'sports' && x.league === league.id && x.calendarScope === 'team')
    .sort((a,b)=>String(a.teamName || a.title).localeCompare(String(b.teamName || b.title),'ar'));
  const folderRel = toPosix(path.relative(root,path.dirname(file)));
  const logoPath = league.logo ? toPosix(path.normalize(path.join(folderRel,league.logo))) : mainCalendar.logoPath;
  const item = {
    ...league,
    logoPath,
    detailPath: `league.html?id=${encodeURIComponent(league.id)}`,
    calendarsCount: 1 + teams.length,
    mainCalendar,
    teams
  };
  leagues.push(item);
}
leagues.sort((a,b)=>(a.order||999)-(b.order||999) || String(a.title).localeCompare(String(b.title),'ar'));

if (process.exitCode) process.exit(process.exitCode);
entries.sort((a,b) => String(b.lastUpdate).localeCompare(String(a.lastUpdate),'en') || String(a.organization).localeCompare(String(b.organization),'ar'));
const catalog = {version:5,updatedAt:new Date().toISOString(),count:entries.length,calendars:files.map(f=>toPosix(path.relative(root,f))),entries};
fs.mkdirSync(dataRoot,{recursive:true});
fs.writeFileSync(path.join(dataRoot,'catalog.json'), JSON.stringify(catalog,null,2)+'\n','utf8');
fs.writeFileSync(path.join(dataRoot,'sports-leagues.json'), JSON.stringify({version:1,updatedAt:new Date().toISOString(),count:leagues.length,leagues:leagues.map(({mainCalendar,teams,...x})=>x)},null,2)+'\n','utf8');
const leaguesDataRoot = path.join(dataRoot,'leagues');
fs.mkdirSync(leaguesDataRoot,{recursive:true});
for (const league of leagues) {
  fs.writeFileSync(path.join(leaguesDataRoot,`${league.id}.json`), JSON.stringify({version:1,updatedAt:new Date().toISOString(),...league},null,2)+'\n','utf8');
}

const urls = [
  {loc:`${siteUrl}/`,priority:'1.0'},
  ...(categoriesData.categories || []).filter(c=>c.status==='active').map(c=>({loc:`${siteUrl}/category.html?id=${encodeURIComponent(c.id)}`,priority:'0.8'})),
  ...leagues.map(l=>({loc:`${siteUrl}/league.html?id=${encodeURIComponent(l.id)}`,priority:'0.8'})),
  ...entries.map(c=>({loc:`${siteUrl}/calendar.html?id=${encodeURIComponent(c.id)}`,lastmod:c.lastUpdate,priority:'0.7'}))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${xml(u.loc)}</loc>${u.lastmod?`<lastmod>${xml(u.lastmod)}</lastmod>`:''}<priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap,'utf8');
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,'utf8');
console.log(`Generated catalog (${entries.length}), sports leagues (${leagues.length}), sitemap.xml and robots.txt.`);
