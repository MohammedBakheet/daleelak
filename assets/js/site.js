const SITE = {
  owner: 'م. محمد البخيت',
  social: {
    x: 'https://x.com/mbinbakheet',
    linkedin: 'https://www.linkedin.com/in/mohammed-bakheet'
  }
};
const qs = (s, root = document) => root.querySelector(s);
const qsa = (s, root = document) => [...root.querySelectorAll(s)];
const absoluteUrl = path => new URL(path, document.baseURI).href;
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const normalizeArabic = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي');
const formatDate = value => {
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {year:'numeric',month:'long',day:'numeric'}).format(new Date(`${value}T12:00:00`)); }
  catch { return value; }
};
async function fetchJson(path) {
  const response = await fetch(absoluteUrl(path), {cache:'no-store'});
  if (!response.ok) throw new Error(`تعذر تحميل ${path}`);
  return response.json();
}

async function loadCategories() {
  const data = await fetchJson('data/categories.json');
  return (data.categories || []).filter(c => c.status === 'active').sort((a,b) => (a.order || 999) - (b.order || 999));
}
async function loadCatalog() {
  const catalog = await fetchJson('data/catalog.json');
  const items = await Promise.all((catalog.calendars || []).map(async infoPath => {
    const infoUrl = absoluteUrl(infoPath);
    const response = await fetch(infoUrl, {cache:'no-store'});
    if (!response.ok) throw new Error(`تعذر تحميل ${infoPath}`);
    const info = await response.json();
    const folder = infoUrl.slice(0, infoUrl.lastIndexOf('/') + 1);
    return {
      ...info,
      infoUrl,
      folder,
      icsUrl: new URL(info.ics || 'calendar.ics', folder).href,
      logoUrl: info.logo ? new URL(info.logo, folder).href : '',
      detailUrl: `${absoluteUrl('calendar.html')}?id=${encodeURIComponent(info.id)}`
    };
  }));
  return items;
}
async function renderNavigation() {
  const navs = qsa('[data-main-nav]');
  if (!navs.length) return;
  try {
    const categories = await loadCategories();
    const links = [`<a href="${absoluteUrl('index.html')}">الرئيسية</a>`, ...categories.map(c => `<a href="${absoluteUrl('category.html')}?id=${encodeURIComponent(c.id)}">${escapeHtml(c.name)}</a>`)];
    navs.forEach(nav => nav.innerHTML = links.join(''));
  } catch {
    navs.forEach(nav => nav.innerHTML = `<a href="${absoluteUrl('index.html')}">الرئيسية</a>`);
  }
}
async function renderCategoryCards() {
  const grid = qs('[data-category-grid]');
  if (!grid) return;
  try {
    const [categories, calendars] = await Promise.all([loadCategories(), loadCatalog()]);
    grid.innerHTML = '';
    categories.forEach(c => {
      const count = calendars.filter(x => x.category === c.id).length;
      const article = document.createElement('article');
      article.className = 'category-card';
      article.innerHTML = `
        <div class="card-icon" aria-hidden="true">${escapeHtml(c.icon || '📅')}</div>
        <h3 class="card-title">${escapeHtml(c.name)}</h3>
        <p class="card-text">${escapeHtml(c.description)}</p>
        <div class="category-count">${count ? `${count} تقويم متاح` : 'سيتم إضافة التقاويم قريبًا'}</div>
        <a class="card-link" href="${absoluteUrl('category.html')}?id=${encodeURIComponent(c.id)}">عرض التصنيف ←</a>`;
      grid.appendChild(article);
    });
  } catch (error) {
    grid.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
  }
}
function calendarCard(c) {
  const card = document.createElement('article');
  card.className = 'calendar-card';
  card.dataset.search = normalizeArabic([c.title,c.organization,c.region,c.year,c.hijriYear,c.categoryLabel].join(' '));
  card.innerHTML = `
    <div class="card-head">
      <div class="calendar-logo" aria-hidden="true">${c.logoUrl ? `<img src="${c.logoUrl}" alt="">` : escapeHtml((c.organization || 'د').trim().charAt(0))}</div>
      <span class="badge">${escapeHtml(c.year)}</span>
    </div>
    <div><p class="org">${escapeHtml(c.organization)}</p><h3>${escapeHtml(c.title)}</h3></div>
    <dl class="meta-list">
      <div><dt>النطاق</dt><dd>${escapeHtml(c.region)}</dd></div>
      <div><dt>التقويم</dt><dd>${escapeHtml(c.calendarType)}</dd></div>
      <div><dt>آخر تحديث</dt><dd>${escapeHtml(formatDate(c.lastUpdate))}</dd></div>
    </dl>
    <div class="actions">
      <a class="btn btn-primary" href="${c.detailUrl}">عرض التفاصيل</a>
      <a class="btn btn-secondary" href="${c.icsUrl}" download>تنزيل ICS</a>
    </div>`;
  return card;
}
async function renderCategoryPage() {
  const grid = qs('[data-calendar-grid]');
  if (!grid) return;
  const categoryId = new URLSearchParams(location.search).get('id') || grid.dataset.category || '';
  const status = qs('[data-status]');
  try {
    const [categories, allCalendars] = await Promise.all([loadCategories(), loadCatalog()]);
    const category = categories.find(c => c.id === categoryId);
    if (!category) throw new Error('التصنيف المطلوب غير موجود');
    document.title = `${category.name} | دليلك`;
    qs('[data-category-title]').textContent = category.name;
    qs('[data-category-breadcrumb]').textContent = category.name;
    qs('[data-category-description]').textContent = category.description;
    let calendars = allCalendars.filter(c => c.category === categoryId).sort((a,b) => String(b.lastUpdate).localeCompare(String(a.lastUpdate),'en'));
    grid.innerHTML = '';
    calendars.forEach(c => grid.appendChild(calendarCard(c)));
    if (!calendars.length) grid.innerHTML = `<div class="notice empty-state">لا توجد تقاويم منشورة في هذا التصنيف حاليًا. سيظهر أي تقويم جديد هنا تلقائيًا بعد إضافته إلى الفهرس.</div>`;
    const categoryNote = qs('[data-category-note]');
    const noteText = calendars.map(c => c.categoryNote).find(Boolean);
    if (categoryNote && noteText) {
      categoryNote.textContent = noteText;
      categoryNote.hidden = false;
    }
    if (status) status.textContent = calendars.length ? `${calendars.length} تقويم متاح` : 'لا توجد تقاويم حاليًا';
    const search = qs('[data-search]');
    if (search && calendars.length) search.addEventListener('input', () => {
      const value = normalizeArabic(search.value.trim());
      let visible = 0;
      qsa('.calendar-card', grid).forEach(card => {
        const show = card.dataset.search.includes(value);
        card.hidden = !show;
        if (show) visible++;
      });
      if (status) status.textContent = visible ? `${visible} نتيجة` : 'لا توجد نتائج مطابقة';
    });
  } catch (error) {
    grid.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
    if (status) status.textContent = '';
  }
}

function detectDevice() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  if (/iPhone/i.test(ua)) return { key:'iphone', name:'iPhone', action:'إضافة إلى تقويم iPhone', badge:'لأجهزة iPhone', icon:'' };
  if (/iPad/i.test(ua) || touchMac) return { key:'ipad', name:'iPad', action:'إضافة إلى تقويم iPad', badge:'لأجهزة iPad', icon:'' };
  if (/Android/i.test(ua)) return { key:'android', name:'Android', action:'إضافة إلى Google Calendar', badge:'لأجهزة Android', icon:'G' };
  if (/Windows/i.test(ua)) return { key:'windows', name:'Windows', action:'إضافة إلى Outlook Calendar', badge:'لأجهزة Windows', icon:'O' };
  if (/Macintosh|Mac OS X/i.test(ua)) return { key:'mac', name:'Mac', action:'إضافة إلى Apple Calendar', badge:'لأجهزة Mac', icon:'' };
  return { key:'other', name:'جهازك', action:'إضافة إلى تطبيق التقويم', badge:'للتطبيقات الداعمة للاشتراك', icon:'📅' };
}

function getPrimarySubscription(device, icsUrl) {
  const webcal = icsUrl.replace(/^https?:/, 'webcal:');
  if (['iphone','ipad','mac'].includes(device.key)) return { href:webcal, external:false };
  if (device.key === 'android') {
    return {
      href:`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icsUrl)}`,
      external:true
    };
  }
  if (device.key === 'windows') {
    return {
      href:`https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(icsUrl)}&name=${encodeURIComponent('تقويم دليلك')}`,
      external:true
    };
  }
  return { href:webcal, external:false };
}

async function renderDetail() {
  const root = qs('[data-calendar-detail]');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { root.innerHTML = '<div class="notice error">لم يتم تحديد التقويم.</div>'; return; }
  try {
    const calendars = await loadCatalog();
    const c = calendars.find(x => x.id === id);
    if (!c) throw new Error('التقويم المطلوب غير موجود');

    document.title = `${c.title} | دليلك`;
    const device = detectDevice();
    const primary = getPrimarySubscription(device, c.icsUrl);
    const externalAttrs = primary.external ? ' target="_blank" rel="noopener"' : '';

    const appName = ({
      iphone: 'Apple Calendar',
      ipad: 'Apple Calendar',
      mac: 'Apple Calendar',
      android: 'Google Calendar',
      windows: 'Outlook Calendar',
      other: 'تطبيق التقويم'
    })[device.key] || 'تطبيق التقويم';

    root.innerHTML = `
      <div class="detail-hero">
        <div class="calendar-logo large">${c.logoUrl ? `<img src="${c.logoUrl}" alt="">` : escapeHtml((c.organization || 'د').trim().charAt(0))}</div>
        <div>
          <p class="org">${escapeHtml(c.organization)}</p>
          <h1>${escapeHtml(c.title)}</h1>
          <p>${escapeHtml(c.description)}</p>
        </div>
      </div>

      <div class="detail-grid">
        <section class="panel">
          <h2>معلومات التقويم</h2>
          <dl class="meta-list detail-meta">
            <div><dt>السنة</dt><dd>${escapeHtml(c.year)} / ${escapeHtml(c.hijriYear)}</dd></div>
            <div><dt>النطاق</dt><dd>${escapeHtml(c.region)}</dd></div>
            <div><dt>نوع الأحداث</dt><dd>أحداث طوال اليوم</dd></div>
            <div><dt>آخر تحديث</dt><dd>${escapeHtml(formatDate(c.lastUpdate))}</dd></div>
            <div><dt>المصدر</dt><dd>${escapeHtml(c.source)}</dd></div>
            <div><dt>إعداد ونشر</dt><dd>${escapeHtml(c.publisher)}</dd></div>
          </dl>
          <div class="detail-tools">
            <a class="btn btn-secondary" data-report-link href="#">⚠️ الإبلاغ عن مشكلة</a>
            <button class="btn btn-secondary" type="button" data-share-page>↗ مشاركة الصفحة</button>
          </div>
        </section>

        <section class="panel subscribe-panel smart-subscribe featured-subscribe">
          <div class="subscribe-hero-icon" aria-hidden="true">
            <span class="calendar-glyph">▦</span><span class="calendar-plus">+</span>
          </div>

          <div class="subscribe-heading centered">
            <div>
              <h2>اشترك في التقويم</h2>
              <p>سيتم فتح ${escapeHtml(appName)} لإضافة التقويم.</p>
            </div>
          </div>

          <div class="subscription-update-note">
            <span class="update-note-icon" aria-hidden="true">↻</span>
            <p>يتم تحديث التقويم تلقائيًا عند نشر أي تعديل، وقد يستغرق ظهور التحديث عدة ساعات حسب تطبيق التقويم المستخدم.</p>
          </div>

          <div class="subscription-benefits" aria-label="مزايا الاشتراك">
            <span>✓ مجاني</span>
            <span>✓ بدون تسجيل</span>
            <span>✓ تحديث تلقائي</span>
            <span>✓ يمكن إلغاء الاشتراك بأي وقت</span>
          </div>

          <a class="primary-subscribe-button" href="${primary.href}"${externalAttrs}>
            <span aria-hidden="true">＋</span>
            <strong>إضافة إلى ${escapeHtml(appName)}</strong>
          </a>

          <div class="secondary-subscribe-actions">
            <button class="subscribe-option option-copy" type="button" data-copy="${c.icsUrl}">
              <span class="option-icon" aria-hidden="true">🔗</span>
              <span class="option-content">
                <strong>نسخ رابط الاشتراك</strong>
                <small>للتطبيقات الأخرى</small>
                <span>استخدم الرابط لإضافة التقويم من داخل التطبيق.</span>
              </span>
              <span class="option-arrow" aria-hidden="true">‹</span>
            </button>

            <a class="subscribe-option option-download" href="${c.icsUrl}" download>
              <span class="option-icon" aria-hidden="true">↓</span>
              <span class="option-content">
                <strong>تنزيل ملف ICS</strong>
                <small>إضافة مرة واحدة</small>
                <span>الملف المنزّل لا يستقبل التحديثات تلقائيًا.</span>
              </span>
              <span class="option-arrow" aria-hidden="true">‹</span>
            </a>
          </div>
        </section>
      </div>`;
    const btn = qs('[data-copy]', root);
    btn?.addEventListener('click', async () => {
      const original = btn.innerHTML;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const label = qs('.option-content strong', btn);
        if (label) label.textContent = 'تم نسخ الرابط بنجاح';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1800);
      } catch {
        prompt('انسخ رابط الاشتراك:', btn.dataset.copy);
      }
    });

    const reportLink = qs('[data-report-link]', root);
    if (reportLink) {
      const subject = `إبلاغ عن مشكلة في تقويم: ${c.title}`;
      const body = `صفحة التقويم: ${location.href}\nرابط التقويم: ${c.icsUrl}\n\nوصف المشكلة:`;
      reportLink.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    const shareButton = qs('[data-share-page]', root);
    shareButton?.addEventListener('click', async () => {
      const shareData = { title: c.title, text: c.description || c.title, url: location.href };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(location.href);
          const originalText = shareButton.textContent;
          shareButton.textContent = '✓ تم نسخ رابط الصفحة';
          setTimeout(() => { shareButton.textContent = originalText; }, 1800);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') prompt('انسخ رابط الصفحة:', location.href);
      }
    });
  } catch (error) {
    root.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  qsa('[data-current-year]').forEach(x => x.textContent = new Date().getFullYear());
  renderNavigation();
  renderCategoryCards();
  renderCategoryPage();
  renderDetail();
});
