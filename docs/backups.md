# النسخ الاحتياطي اليومي (Google Cloud / Firebase)

المشروع: `albehairy-group`. الهدف: ألا تضيع أي بيانات.

## 1) المتطلب
فعّل فاتورة **Blaze** (Firebase Console ← Usage and billing). الجداول والاسترجاع ميزات مدفوعة، والتكلفة صغيرة لحجم البيانات هنا.

## 2) جدول نسخ يومي
Firebase Console ← Firestore Database ← **Disaster recovery** ← **Backup schedules** ← Create:
- Frequency: **Daily**
- Retention: **14 days** (أقصاه 14 أسبوع للجداول الأسبوعية)

أو بسطر واحد:
```
gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=14d --project=albehairy-group
```

## 3) استرجاع لأي لحظة (PITR) وحماية الحذف
```
gcloud firestore databases update --database='(default)' --enable-pitr --delete-protection --project=albehairy-group
```
PITR يحفظ آخر 7 أيام بدقة الدقيقة.

## 4) تصدير إضافي للأمان (اختياري)
Bucket منفصل ثم تصدير أسبوعي:
```
gcloud firestore export gs://albehairy-group-backups/$(date +%F) --project=albehairy-group
```
ويمكن جدولته بـ Cloud Scheduler.

## 5) ما لا يغطيه Firestore
- **حسابات الدخول (Auth):** `firebase auth:export users.json --project albehairy-group` شهريًا.
- **Storage:** فعّل Object Versioning على الـ bucket.
- **الأسرار على السيرفر** (`crm-ai-secrets.php`, `crm-firebase-admin.json`): نسخة آمنة خارج Git.

## 6) تجربة الاسترجاع (مرة واحدة)
```
gcloud firestore databases restore --source-backup=<BACKUP_NAME> --destination-database=restore-test --project=albehairy-group
```
تأكد من العدّ، ثم احذف `restore-test`.

## 7) تنبيه تكلفة
Google Cloud ← Billing ← Budgets & alerts: حد شهري مناسب مع تنبيه عند 50% و90%.
