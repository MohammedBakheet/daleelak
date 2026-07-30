# تفعيل Google Analytics 4 في موقع دليلك

## الملف الجديد

تم إنشاء الملف:

`assets/js/analytics.js`

هذا الملف يقوم بأربع مهام:

1. تحميل Google tag (`gtag.js`).
2. إرسال الزيارات العادية إلى GA4.
3. إرسال أحداث مخصصة مثل فتح التقويم، نسخ الرابط وتنزيل ICS.
4. إضافة معلومات التقويم والتصنيف مع كل حدث.

## الخطوة الوحيدة المطلوبة للتفعيل

افتح الملف `assets/js/analytics.js` وابحث في بدايته عن:

```js
const MEASUREMENT_ID = 'G-XXXXXXXXXX';
```

استبدل `G-XXXXXXXXXX` بالمعرف الحقيقي الذي تحصل عليه من Google Analytics، مثال:

```js
const MEASUREMENT_ID = 'G-ABC1234567';
```

لا تضف Google tag مرة ثانية في صفحات HTML؛ الملف يقوم بتحميله تلقائيًا.

## أين رُبط الملف؟

أُضيف هذا السطر مباشرة بعد `<head>` في صفحات HTML الرئيسية:

```html
<script src="assets/js/analytics.js"></script>
```

وذلك لأن Google توصي بوضع Google tag في أعلى `<head>` في كل صفحة.

## الأحداث التي أصبحت جاهزة

- `view_category`: فتح تصنيف.
- `view_calendar`: فتح صفحة تقويم.
- `view_league`: فتح صفحة بطولة.
- `select_category`: اختيار تصنيف من الرئيسية.
- `select_calendar`: اختيار تقويم من بطاقة.
- `select_league`: اختيار بطولة.
- `select_subscription_method`: فتح خيارات Android أو طريقة عامة.
- `open_apple_calendar`: فتح Apple Calendar.
- `open_google_calendar`: فتح Google Calendar.
- `open_outlook_calendar`: فتح Outlook Calendar.
- `copy_calendar_url`: نسخ رابط الاشتراك.
- `download_ics`: تنزيل ملف ICS.
- `open_android_help`: فتح شرح Android.
- `share_calendar_page`: مشاركة صفحة التقويم.
- `report_calendar_error`: الإبلاغ عن مشكلة.
- `calendar_search`: البحث مع وجود نتائج.
- `search_no_results`: البحث بدون نتائج.

## الاختبار قبل النشر

بعد وضع Measurement ID الحقيقي، افتح الموقع بهذا الشكل:

`https://mohammedbakheet.github.io/daleelak/?ga_debug=1`

ثم افتح أدوات المطور في المتصفح > Console. ستظهر رسائل تبدأ بـ:

`[دليلك Analytics]`

وفي Google Analytics افتح:

Admin / Reports > DebugView أو Realtime

ثم جرّب فتح تقويم، نسخ الرابط وتنزيل ICS.

## تنبيه مهم

الأحداث تقيس الضغط أو بداية محاولة الاشتراك، ولا تؤكد أن المستخدم أكمل الاشتراك داخل تطبيق Apple أو Google أو Outlook.
