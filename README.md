# Burgundy Foods

موقع Next.js ولوحة تحكم لإدارة عمليات **مؤسسة برغندي للأغذية** (Burgundy Foods Establishment) — مؤسسة سعودية لتجارة وتوزيع المنتجات الغذائية من الرياض: المنتجات، العملاء، الطلبات، المخزون، إعدادات الشركة، ونماذج التواصل وطلبات عروض الأسعار.

- النطاق الرسمي: [www.burgundy-foods.com](https://www.burgundy-foods.com)
- البريد الرسمي: [info@burgundy-foods.com](mailto:info@burgundy-foods.com)
- الرقم الوطني الموحد: 7052343444

## التشغيل المحلي

```bash
cp .env.example .env
# عدّل القيم في .env — حدد على وجه الخصوص SEED_ADMIN_PASSWORD بكلمة قوية
npm install
npm run dev
```

أمر `npm run dev` ينفذ تلقائياً:

- توليد Prisma Client.
- تجهيز قاعدة SQLite المحلية في `prisma/dev.db`.
- زرع بيانات تجريبية أولية (يتطلب `SEED_ADMIN_PASSWORD` في `.env`).
- تشغيل Next.js على `http://127.0.0.1:3000`.

بيانات دخول لوحة التحكم المحلية تأتي من ملف `.env`:

- البريد: قيمة `SEED_ADMIN_EMAIL` (الافتراضي: `admin@burgundy-foods.com`)
- كلمة المرور: قيمة `SEED_ADMIN_PASSWORD` التي ضبطتها في `.env` — السكربت يرفض التشغيل إذا لم تُضبط
- بعد أول تسجيل دخول، غيّر كلمة المرور من قاعدة البيانات أو واجهة الإدارة

## أوامر مفيدة

```bash
npm run lint
npm run build
npm run setup:local
```

> ملاحظة: تم ضبط المشروع على SQLite للتطوير المحلي. عند الانتقال للإنتاج (Vercel) يمكن تبديل datasource في `prisma/schema.prisma` إلى PostgreSQL وتحديث `DATABASE_URL`.

## النشر

1. ادفع المستودع إلى GitHub.
2. اربط المشروع بـ Vercel واضبط متغيرات البيئة الحساسة على المنصة (لا تضعها في الكود):
   - `DATABASE_URL` (Postgres مُدار، مثل Neon أو Vercel Postgres)
   - `NEXTAUTH_URL` = `https://www.burgundy-foods.com`
   - `NEXTAUTH_SECRET` = قيمة عشوائية قوية
   - `SEED_ADMIN_EMAIL` و `SEED_ADMIN_PASSWORD` (تستخدم مرة واحدة عند تشغيل `prisma db seed` على بيئة الإنتاج، ثم تستبدل كلمة المرور من واجهة الإدارة)
3. اضبط النطاق `www.burgundy-foods.com` من إعدادات النطاقات في Vercel.
