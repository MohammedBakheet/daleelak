مشروع دليلك — نسخة التصنيفات الفرعية للرياضة

تم تنظيم البطولات الرياضية داخل مسارات موحدة، وأصبح تقويم دوري روشن في المسار:
- calendars/sports/roshn/league/calendar.ics
- calendars/sports/roshn/league/metadata.json
- calendars/sports/roshn/league/logo.png
- calendars/sports/roshn/league.json

وأصبح دوري يلو في المسار:
- calendars/sports/yellow/league/
- calendars/sports/yellow/teams/
- calendars/sports/yellow/league.json

## إضافة تقويم جديد تلقائيًا

1. أنشئ مجلدًا جديدًا داخل `calendars/`.
2. أضف `calendar.ics` وملف بيانات باسم `metadata.json` أو `info.json`.
3. أضف `logo.png` واكتب `"logo": "logo.png"` داخل ملف البيانات.
4. ارفع التغييرات إلى GitHub.

سيشغّل GitHub Actions الملف `scripts/build-catalog.js` تلقائيًا، ويضيف التقويم إلى
`data/catalog.json` دون تعديل صفحات الموقع أو JavaScript.

## اختبار محلي

```bash
node scripts/build-catalog.js
python3 -m http.server 8000
```

ثم افتح `http://localhost:8000`.
