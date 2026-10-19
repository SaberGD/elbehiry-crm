# دليل التطوير والنشر

| الفرع | الرابط | الغرض |
|---|---|---|
| `main` | https://elbehiry.engsaber.space | النسخة المعتمدة (Production). لا يُدفع عليها مباشرة. |
| `dev` | https://dev-elbehiry.engsaber.space | بيئة التطوير والتجربة. كل شغل جديد يمر منها. |

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
