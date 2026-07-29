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
