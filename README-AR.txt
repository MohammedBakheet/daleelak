تحديث دوري روشن السعودي

الملفات المتغيرة فقط:
- calendars/saudi-pro-league/calendar.ics: مباريات الجولات 1–6 (54 مباراة).
- calendars/saudi-pro-league/info.json: بيانات التقويم والملاحظة.
- category.html وassets/js/site.js وassets/css/style.css: عرض الملاحظة أسفل التصنيف.

ارفع محتويات هذا المجلد إلى جذر مستودع daleelak مع استبدال الملفات المطابقة. لا حاجة إلى إعادة رفع بقية الموقع.

## إضافة تقويم جديد تلقائيًا

1. أنشئ مجلدًا جديدًا داخل `calendars/`.
2. أضف `calendar.ics` وملف بيانات باسم `metadata.json` أو `info.json`.
3. ارفع التغييرات إلى GitHub.

سيشغّل GitHub Actions الملف `scripts/build-catalog.js` تلقائيًا، ويضيف التقويم إلى
`data/catalog.json` دون تعديل صفحات الموقع أو JavaScript.

الحقول الأساسية لملف البيانات:
`id`, `title`, `organization`, `category`, `year`, `hijriYear`, `region`,
`calendarType`, `lastUpdate`, `description`, `ics`, `source`, `publisher`.

## النظام النهائي للتوسع (المراحل 2 و3 و4)

- المرحلة الثانية: الموقع يقرأ `data/catalog.json` ويولّد التصنيفات والبطاقات وصفحات التفاصيل والاشتراك والبحث والترتيب تلقائيًا.
- المرحلة الثالثة: `scripts/build-catalog.js` يفحص ملفات البيانات وICS والمعرّفات والتصنيفات والشعارات، ثم يولّد فهرسًا مدمجًا سريعًا و`robots.txt` و`sitemap.xml`.
- المرحلة الرابعة: GitHub Actions يشغّل الفحص والبناء عند كل تعديل، مع تحسين SEO وبيانات Schema.org والوصول للجوال وصفحة 404 وملف أمان.

### إضافة تقويم جديد
أنشئ مجلدًا تحت `calendars/` وضع فيه `calendar.ics` و`metadata.json` أو `info.json`، ثم ارفع التغييرات. لا يلزم تعديل HTML أو JavaScript.

### اختبار محلي
```bash
node scripts/build-catalog.js
python3 -m http.server 8000
```
ثم افتح `http://localhost:8000`.
