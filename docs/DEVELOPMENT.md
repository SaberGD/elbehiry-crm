# دليل التطوير والنشر

| الفرع | الرابط | الغرض |
|---|---|---|
| `main` | https://elbehiry.engsaber.space | النسخة المعتمدة (Production). لا يُدفع عليها مباشرة. |
| `dev` | https://dev-elbehiry.engsaber.space | بيئة التطوير والتجربة. كل شغل جديد يمر منها. |
| `test` | https://test-elbehiry.engsaber.space | بيئة تجريبية بقاعدة بيانات Firestore منفصلة اسمها `test` (نفس مشروع `albehairy-group`). |

## قاعدة الشغل
1. اشتغل على `dev` (أو على فرع قصير يتفرع منها مثل `feature/اسم-الميزة`).
2. أي `push` على `dev` يبني المشروع ويرفعه تلقائيًا على موقع dev بعد نجاح `lint` و`test` و`build`.
3. جرّب على موقع dev، واتفقوا إن التعديل تمام.
4. افتح Pull Request من `dev` إلى `main`، وبعد المراجعة اعمل Merge.
5. الـ Merge على `main` يرفع تلقائيًا على موقع الإنتاج.

لا تدفع مباشرة على `main`، ولا تعمل `force push` على أي من الفرعين.

## الأوامر
```bash
bun install --frozen-lockfile   # التثبيت (الملف المرجعي bun.lock)
bun run dev                     # تشغيل محلي على :3000
bun run lint                    # فحص الأنواع
bun run test                    # الاختبارات
bun run build                   # بناء dist
```

## النشر التلقائي (GitHub Actions)
الملف: `.github/workflows/deploy.yml`. الـ Pull Request يشغّل الفحوصات فقط ولا ينشر.

يحتاج هذه الـ Secrets في GitHub (Settings ← Secrets and variables ← Actions):
`FTP_SERVER` و`FTP_USERNAME` و`FTP_PASSWORD` (حساب FTP من لوحة Hostinger).

مسار كل موقع على الاستضافة يُضبط في `deploy.yml` (`SERVER_DIR_MAIN` و`SERVER_DIR_DEV`).

## ملاحظات
- Firebase: بيئتا dev وmain تستخدمان نفس مشروع `albehairy-group` حاليًا، فأي بيانات تُدخل من dev تظهر في الإنتاج. يُفضّل مشروع Firebase منفصل لـ dev.
- قواعد Firestore في `firestore.rules` تُنشر يدويًا من Firebase Console.
- راجع `docs/roles-and-permissions.md` قبل أي تغيير في الصلاحيات.

## بيئة التجربة (test)
- قاعدة البيانات: Firestore باسم `test` داخل مشروع `albehairy-group`، تُحدَّد وقت البناء عبر `VITE_FIRESTORE_DATABASE_ID=test` (يضبطها `deploy.yml` لفرع `test` فقط). `main` و`dev` يبقيان على `(default)`.
- خطوات لمرة واحدة: (1) أنشئ النطاق الفرعي `test-elbehiry.engsaber.space` في Hostinger بمجلد `public_html/test-elbehiry`. (2) أنشئ قاعدة `test` من Firebase Console ← Firestore ← Add database (نفس الموقع)، وانشر عليها `firestore.rules`. (3) أضف `test-elbehiry.engsaber.space` في Authentication ← Authorized domains. (4) أنشئ GitHub Environment باسم `test` وفرع `test`.
- Auth مشترك بين البيئات (مستخدمو المشروع نفسهم)؛ البيانات فقط معزولة.
