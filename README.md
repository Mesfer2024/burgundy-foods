# Burgundy Foods

موقع Next.js ولوحة تحكم لإدارة عمليات **مؤسسة برغندي للأغذية** (Burgundy Foods Establishment) — مؤسسة سعودية لتجارة وتوزيع المنتجات الغذائية من الرياض: المنتجات، العملاء، الموردون، المشتريات، عروض الأسعار، أوامر البيع، سندات التسليم، الفواتير، المقبوضات والمدفوعات، المخزون، التقارير، وإعدادات الشركة.

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

`npm install` يستدعي تلقائياً `prisma generate` (هوك `postinstall`).
`npm run dev` ينفذ تلقائياً:

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
npm run test:e2e
npm run setup:local
```

> ملاحظة: التطوير المحلي يستخدم SQLite في `prisma/dev.db`. الإنتاج على Vercel يستخدم PostgreSQL — التفاصيل في قسم النشر أدناه.

## النشر على Vercel

### 1. جهّز قاعدة بيانات Postgres مُدارة

اختر أحد المزودين (مجاني للبدء):

- **Neon** ([neon.tech](https://neon.tech)) — مُوصى به، Serverless Postgres، طبقة مجانية كافية للبدء.
- **Supabase** ([supabase.com](https://supabase.com)) — Postgres + Storage + Auth.
- **Vercel Postgres** — من تبويب Storage في لوحة Vercel، تكامل مباشر.

انسخ سلسلة الاتصال (Connection String). ستحتاجها في الخطوة 4.

### 2. بدّل Prisma من SQLite إلى Postgres

في `prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

> المهجرات (migrations) الحالية في `prisma/migrations/` مكتوبة بصياغة SQLite (`DATETIME`, `REAL`, `INTEGER NOT NULL PRIMARY KEY`). لن تعمل على Postgres كما هي.

احذف مجلد المهجرات الحالي ثم أنشئ مهجرة Postgres جديدة:

```bash
rm -rf prisma/migrations
DATABASE_URL="<production-postgres-url>" npx prisma migrate dev --name init
```

التزم المهجرة الجديدة:

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Switch Prisma datasource to PostgreSQL for production"
git push
```

### 3. اربط المستودع بـ Vercel

- من لوحة Vercel: **Add New… → Project → Import** ثم اختر `Mesfer2024/burgundy-foods`.
- اترك إطار العمل افتراضيًا (Next.js).
- أمر البناء: `npm run build` (يستدعي `prisma generate` تلقائياً).

### 4. اضبط متغيرات البيئة في Vercel

من **Project Settings → Environment Variables** أضف القيم التالية (Production + Preview):

| المتغير | القيمة |
|---|---|
| `DATABASE_URL` | سلسلة اتصال Postgres من الخطوة 1 |
| `NEXTAUTH_URL` | `https://www.burgundy-foods.com` |
| `NEXTAUTH_SECRET` | قيمة عشوائية: `openssl rand -base64 32` |
| `SEED_ADMIN_EMAIL` | `admin@burgundy-foods.com` |
| `SEED_ADMIN_PASSWORD` | كلمة مرور قوية مؤقتة — ستُغيَّر بعد أول دخول |

⚠ لا تضع هذه القيم في الكود ولا في `.env.example`، فقط في إعدادات Vercel.

### 5. شغّل المهجرات وزرع المدير على قاعدة الإنتاج

من جهازك (متصل بنفس قاعدة الإنتاج، لمرة واحدة فقط):

```bash
DATABASE_URL="<production-postgres-url>" npx prisma migrate deploy
DATABASE_URL="<production-postgres-url>" \
SEED_ADMIN_EMAIL="admin@burgundy-foods.com" \
SEED_ADMIN_PASSWORD="<temporary-strong-password>" \
npx prisma db seed
```

### 6. اضبط النطاق

- **Settings → Domains** في Vercel، أضف `www.burgundy-foods.com` و `burgundy-foods.com`.
- اتبع تعليمات Vercel لإضافة سجلات DNS عند مزود النطاق.

### 7. أول تسجيل دخول

- افتح `https://www.burgundy-foods.com/auth/signin`
- ادخل بـ `SEED_ADMIN_EMAIL` و `SEED_ADMIN_PASSWORD`
- **غيّر كلمة المرور فوراً** من قاعدة البيانات أو واجهة الإدارة، ثم احذف قيمة `SEED_ADMIN_PASSWORD` من Vercel env vars (لم تعد ضرورية).

### قائمة تحقّق ما قبل النشر

- [ ] قاعدة Postgres جاهزة وسلسلة الاتصال محفوظة بأمان
- [ ] `provider` في schema.prisma بدّل إلى `postgresql`
- [ ] مهجرة جديدة لـ Postgres مُولّدة وملتزمة
- [ ] جميع متغيرات البيئة الخمسة مضبوطة في Vercel
- [ ] `NEXTAUTH_SECRET` ليس قيمة المثال
- [ ] `SEED_ADMIN_PASSWORD` كلمة قوية وليس القيمة الافتراضية
- [ ] `npx prisma migrate deploy` تم تنفيذه على قاعدة الإنتاج
- [ ] `npx prisma db seed` تم تنفيذه على قاعدة الإنتاج
- [ ] بعد أول دخول، كلمة مرور المدير تم تغييرها
