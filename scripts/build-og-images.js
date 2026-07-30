#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const siteUrl = String(process.env.SITE_URL || 'https://mohammedbakheet.github.io/daleelak').replace(/\/$/, '');
const catalogPath = path.join(root, 'data', 'catalog.json');
const ogDir = path.join(root, 'og');
const shareDir = path.join(root, 'share');
const cachePath = path.join(ogDir, '.cache.json');

function esc(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])); }
function short(value='', max=108) {
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max - 1).trim()}…`;
}
function lines(value='', maxChars=43, maxLines=2) {
  const words = String(value).replace(/\s+/g, ' ').trim().split(' ');
  const out=[]; let current='';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) { out.push(current); current=word; }
    else current=next;
    if (out.length === maxLines) break;
  }
  if (current && out.length < maxLines) out.push(current);
  if (out.length === maxLines && words.join(' ').length > out.join(' ').length) out[maxLines-1] = `${out[maxLines-1].replace(/…$/, '')}…`;
  return out;
}
function dataUri(file) {
  if (!file || !fs.existsSync(file)) return '';
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}
function hashEntry(entry, brandLogo) {
  const logo = entry.logoPath ? path.join(root, entry.logoPath) : '';
  const logoHash = logo && fs.existsSync(logo) ? crypto.createHash('sha1').update(fs.readFileSync(logo)).digest('hex') : '';
  return crypto.createHash('sha1').update(JSON.stringify({id:entry.id,title:entry.title,organization:entry.organization,description:entry.description,logoHash,brandLogo})).digest('hex');
}
function svg(entry) {
  const brand = dataUri(path.join(root, 'assets/brand/logo-icon.svg'));
  const orgLogo = dataUri(entry.logoPath ? path.join(root, entry.logoPath) : '');
  const titleLines = lines(short(entry.title, 58), 31, 2);
  const descLines = lines(short(entry.description, 112), 48, 2);
  const org = short(entry.organization, 38);
  const orgImage = orgLogo
    ? `<image href="${orgLogo}" x="1000" y="82" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="1010" y="92" width="100" height="100" rx="25" fill="#EAF7F7"/><text x="1060" y="157" text-anchor="middle" font-size="48" font-weight="800" fill="#179FA0">${esc(org.charAt(0) || 'د')}</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F2D3D" flood-opacity=".10"/></filter></defs>
  <rect width="1200" height="630" fill="#F7FAFB"/>
  <rect x="36" y="36" width="1128" height="558" rx="34" fill="#FFFFFF" stroke="#DDE8EB" stroke-width="2" filter="url(#s)"/>
  <line x1="430" y1="72" x2="430" y2="558" stroke="#E3ECEF" stroke-width="2"/>
  <image href="${brand}" x="145" y="105" width="176" height="176" preserveAspectRatio="xMidYMid meet"/>
  <text x="233" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0F2D3D">دليلك</text>
  <text x="233" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" font-weight="700" fill="#179FA0">تقاويمك المفضلة، في مكان واحد</text>
  <text x="233" y="493" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#0F2D3D">تحديث تلقائي  •  موثوق وآمن  •  بدون تسجيل</text>
  ${orgImage}
  <text x="800" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="29" font-weight="700" fill="#179FA0">${esc(org)}</text>
  ${titleLines.map((l,i)=>`<text x="800" y="${255+i*54}" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#0F2D3D">${esc(l)}</text>`).join('\n')}
  ${descLines.map((l,i)=>`<text x="800" y="${390+i*38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#5E7180">${esc(l)}</text>`).join('\n')}
  <line x1="485" y1="480" x2="1110" y2="480" stroke="#E3ECEF" stroke-width="2"/>
  <text x="800" y="526" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0F2D3D">مجاني  •  بدون تسجيل  •  تحديث تلقائي</text>
  <text x="800" y="559" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="#738590">mohammedbakheet.github.io/daleelak</text>
</svg>`;
}
function versionToken(entry) {
  return crypto.createHash('sha1').update(JSON.stringify({id:entry.id,title:entry.title,description:entry.description,lastUpdate:entry.lastUpdate,logoPath:entry.logoPath})).digest('hex').slice(0,12);
}
function shareHtml(entry) {
  const target = `${siteUrl}/calendar.html?id=${encodeURIComponent(entry.id)}`;
  const share = `${siteUrl}/share/${encodeURIComponent(entry.id)}/`;
  const image = `${siteUrl}/og/${encodeURIComponent(entry.id)}.png?v=${versionToken(entry)}`;
  const title = `${entry.title} — ${entry.organization} | دليلك`;
  const description = short(entry.description, 150);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${share}"><meta property="og:type" content="website"><meta property="og:site_name" content="دليلك"><meta property="og:locale" content="ar_SA"><meta property="og:url" content="${share}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="بطاقة ${esc(entry.title)} من دليلك"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><meta name="theme-color" content="#0F2D3D"><link rel="icon" href="../../assets/icons/favicon-32.png"><meta http-equiv="refresh" content="1;url=${target}"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7fafb;color:#0f2d3d;font-family:Arial,sans-serif;text-align:center}.card{max-width:520px;padding:32px}.card img{width:92px}.card a{display:inline-block;margin-top:18px;padding:13px 22px;border-radius:12px;background:#179fa0;color:#fff;text-decoration:none;font-weight:700}</style><script>window.location.replace(${JSON.stringify(target)});</script></head><body><main class="card"><img src="../../assets/brand/logo-icon.svg" alt="دليلك"><h1>${esc(entry.title)}</h1><p>${esc(description)}</p><a href="${target}">فتح صفحة التقويم</a></main></body></html>`;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const oldCache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
  const newCache = {};
  fs.mkdirSync(ogDir, {recursive:true});
  fs.mkdirSync(shareDir, {recursive:true});
  const validIds = new Set((catalog.entries || []).map(entry => String(entry.id)));
  for (const name of fs.readdirSync(ogDir)) {
    if (name.endsWith('.png') && !validIds.has(name.slice(0, -4))) fs.rmSync(path.join(ogDir, name), {force:true});
  }
  for (const name of fs.readdirSync(shareDir)) {
    const full = path.join(shareDir, name);
    if (fs.statSync(full).isDirectory() && !validIds.has(name)) fs.rmSync(full, {recursive:true, force:true});
  }
  let generated=0, skipped=0;
  for (const entry of catalog.entries || []) {
    const h = hashEntry(entry, fs.readFileSync(path.join(root,'assets/brand/logo.svg'),'utf8'));
    newCache[entry.id]=h;
    const out = path.join(ogDir, `${entry.id}.png`);
    if (oldCache[entry.id] === h && fs.existsSync(out)) skipped++;
    else { await sharp(Buffer.from(svg(entry))).png({compressionLevel:9}).toFile(out); generated++; }
    const dir = path.join(shareDir, entry.id);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), shareHtml(entry), 'utf8');
  }
  fs.writeFileSync(cachePath, JSON.stringify(newCache,null,2)+'\n');
  console.log(`OG images: ${generated} generated, ${skipped} unchanged; ${catalog.entries.length} share pages.`);
}
main().catch(err=>{console.error(err);process.exit(1)});
