# تنفيذ التصنيفات الفرعية داخل قسم الرياضة

## ما تم تنفيذه

1. إضافة صفحة مستقلة للبطولة: `league.html?id=yellow`.
2. تحويل صفحة تصنيف الرياضة لتعرض البطولات بدل عرض كل تقاويم الفرق مباشرة.
3. إضافة دوري يلو بكامل مبارياته و18 تقويمًا مستقلًا للأندية.
4. نقل تقويم دوري روشن إلى البنية الرياضية الموحدة داخل `calendars/sports/roshn/league/`.
5. إضافة ملفات بيانات مولدة:
   - `data/sports-leagues.json`
   - `data/leagues/yellow.json`
   - `data/leagues/roshn.json`
6. توسيع `scripts/build-catalog.js` ليقرأ المجلدات المتداخلة ويولد بيانات البطولات وصفحات خريطة الموقع.
7. إضافة البحث داخل صفحة البطولة وشبكة تقاويم الأندية بالدوائر الملونة.

## خطوات رفع النسخة

1. فك ضغط الحزمة.
2. ارفع جميع الملفات والمجلدات إلى المستودع مع المحافظة على البنية نفسها.
3. من GitHub افتح تبويب Actions وتأكد أن مهمة بناء الفهرس تعمل بنجاح.
4. بعد النشر افتح:
   - `category.html?id=sports`
   - `league.html?id=yellow`
   - `calendar.html?id=YELLOW`
   - `calendar.html?id=YELLOW-ALADALAH`
5. اختبر الاشتراك من هاتفك في تقويم الدوري وتقويم فريق واحد.

## تحديث مباراة في دوري يلو حاليًا

تعديل ملفات ICS الموجودة ثم تشغيل:

```bash
node scripts/build-catalog.js
```

سيُعاد توليد الفهرس وملفات البطولات وخريطة الموقع.

## إضافة بطولة جديدة

أنشئ البنية التالية:

```text
calendars/sports/league-id/
├── league.json
├── league/
│   ├── calendar.ics
│   ├── metadata.json
│   └── logo.png
└── teams/
    ├── LEAGUE-TEAM1/
    │   ├── calendar.ics
    │   ├── metadata.json
    │   └── logo.png
    └── ...
```

في تقويم البطولة أضف:

```json
"league": "league-id",
"calendarScope": "league"
```

وفي تقويم كل فريق أضف:

```json
"league": "league-id",
"calendarScope": "team",
"teamId": "TEAM1",
"teamName": "اسم الفريق",
"teamColor": "#123456"
```

ثم شغّل:

```bash
node scripts/build-catalog.js
```

## ملاحظة مهمة

تم نقل تقويم دوري روشن من المسار السابق إلى `calendars/sports/roshn/league/` لأن الموقع لا يملك مشتركين حاليًا في الرابط القديم. رابط الاشتراك الجديد هو `calendars/sports/roshn/league/calendar.ics`.
