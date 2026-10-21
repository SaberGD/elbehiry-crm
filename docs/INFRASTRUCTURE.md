# البنية والحسابات (مرجع سريع)

## المسار من الكود إلى الموقع
```
test  ──►  dev  ──►  main          (الترتيب إلزامي، انظر DEVELOPMENT.md)
 │          │          │
 ▼          ▼          ▼
test-       dev-       elbehiry.
elbehiry.   elbehiry.  engsaber.space
engsaber.   engsaber.
space       space
```
- GitHub (الفروع `test` و`dev` و`main`) ← GitHub Actions (فحص + بناء + نشر FTPS) ← Hostinger.
- الدمج بين الفروع عبر Pull Request ثم Merge، والنشر تلقائي بعد الدمج.
- ملف النشر: `.github/workflows/deploy.yml`.

## البيئات
| البيئة | الرابط | Firebase / قاعدة البيانات |
|---|---|---|
| test | https://test-elbehiry.engsaber.space | مشروع `albehairy-test` (منفصل، مجاني) |
| dev | https://dev-elbehiry.engsaber.space | مشروع `albehairy-group` (الأصلي) |
| main | https://elbehiry.engsaber.space | مشروع `albehairy-group` (الأصلي) |

## الحسابات (كل خدمة وأي بريد يملكها)
| الخدمة | الاستخدام | الحساب / الرابط |
|---|---|---|
| Hostinger | الاستضافة والنطاق `engsaber.space` | https://hpanel.hostinger.com (املأ بريد الحساب هنا) |
| Firebase | Firestore + Auth | albehairygroup@gmail.com ← https://console.firebase.google.com/project/albehairy-group · https://console.firebase.google.com/project/albehairy-test |
| Google Cloud | نفس مشروعي Firebase (فوترة، مفاتيح الخدمة) | نفس حساب Firebase ← https://console.cloud.google.com |
| GitHub | الكود والـ Actions | https://github.com/SaberGD/El.-Behery-CRM |

## GitHub Actions والخصوصية
المستودع خاص ويبقى خاصًا. دقائق Actions المجانية محدودة (2000 دقيقة/شهر)، وكل فحص وبناء ونشر يستهلك منها.

## الوثائق
- `docs/DEVELOPMENT.md`: الفروع والنشر وترتيب الرفع.
- `docs/admin-setup.md`: الأدوار وإعادة تعيين كلمات المرور.
- `docs/roles-and-permissions.md`، `docs/backups.md`، `docs/security-review.md`، `docs/pwa.md`، `docs/ai-setup.md`.
