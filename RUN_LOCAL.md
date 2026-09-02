# تشغيل منصة رصد محليًا

## المتطلبات
- Node.js مناسب لإصدار المشروع.
- pnpm 10.x (المشروع يثبت مدير الحزم عبر packageManager).
- MySQL متاح محليًا أو قاعدة MySQL مستضافة.

## 1. تنزيل المشروع
```bash
git clone https://github.com/salautairi-web/rasd-automotive-platform.git
cd rasd-automotive-platform
git checkout main
```

## 2. تثبيت الحزم
```bash
corepack enable
pnpm install
```

## 3. إعداد البيئة
انسخ `.env.example` إلى `.env`:

```bash
cp .env.example .env
```

ثم عدّل `DATABASE_URL` إلى اتصال MySQL حقيقي.

## 4. تجهيز قاعدة البيانات
```bash
pnpm db:push
```

لا تنفذ هذه الخطوة ضد قاعدة بيانات إنتاجية قبل أخذ نسخة احتياطية ومراجعة تغييرات المخطط.

## 5. فحص المشروع
```bash
pnpm check
pnpm test
pnpm build
```

## 6. تشغيل التطوير
```bash
pnpm dev
```

ثم افتح:

`http://localhost:3000`

المنفذ الافتراضي 3000، والخادم يبحث تلقائيًا عن منفذ بديل إذا كان مشغولًا.

## 7. تشغيل الإنتاج بعد نجاح البناء
```bash
pnpm start
```

## ملاحظات
- لا تضع كلمات المرور أو مفاتيح OAuth في Git.
- `DATABASE_URL` مطلوب لأوامر Drizzle.
- نجاح البناء والاختبارات يجب التحقق منهما فعليًا على الجهاز أو داخل CI؛ وجود الأوامر في `package.json` لا يعني أنها نجحت مسبقًا.
- عند استخدام خدمة استضافة، اضبط متغيرات البيئة من لوحة الاستضافة بدل رفع ملف `.env`.
