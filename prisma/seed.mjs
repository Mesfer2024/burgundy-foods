import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LONG_PASTA_IMAGE = "/burgundy-product-spaghetti-fettuccini-tagliatelli.png";
const SHORT_PASTA_IMAGE = "/burgundy-product-elbow-rigatoni.png";
const CLASSIC_PASTA_IMAGE = "/burgundy-product-vermicelli-spiral-fusilli.png";
const WHOLE_WHEAT_IMAGE = "/burgundy-product-whole-wheat-penne-fusilli.png";

// Seed products carry only data we can stand behind without official source documents:
// name (AR + EN), category type, internal SKU, image. Specs (weight, packsPerCarton,
// originCountry, barcode, costs) are intentionally null and isVerified=false so the
// admin must enter them from the supplier invoice / packing list before they ever
// appear on the public site.
const productSeeds = [
  // Short Pasta Collection
  { sku: "BF-PEN",   nameAr: "مكرونة بيني",                nameEn: "Penne",                type: "Penne",              imageUrl: SHORT_PASTA_IMAGE },
  { sku: "BF-ELB",   nameAr: "مكرونة أكواع",               nameEn: "Elbow",                type: "Elbow",              imageUrl: SHORT_PASTA_IMAGE },
  { sku: "BF-ELB24", nameAr: "مكرونة أكواع رقم 24",        nameEn: "Elbow No. 24",         type: "Elbow No. 24",       imageUrl: SHORT_PASTA_IMAGE },
  { sku: "BF-RGL",   nameAr: "مكرونة ريجاتوني طويلة",      nameEn: "Rigatoni Long",        type: "Rigatoni Long",      imageUrl: SHORT_PASTA_IMAGE },
  { sku: "BF-RGS",   nameAr: "مكرونة ريجاتوني قصيرة",      nameEn: "Rigatoni Short",       type: "Rigatoni Short",     imageUrl: SHORT_PASTA_IMAGE },
  // Classic Pasta Collection
  { sku: "BF-VER",   nameAr: "شعيرية",                     nameEn: "Vermicelli",           type: "Vermicelli",         imageUrl: CLASSIC_PASTA_IMAGE },
  { sku: "BF-SPI",   nameAr: "مكرونة سبايرل",              nameEn: "Spiral",               type: "Spiral",             imageUrl: CLASSIC_PASTA_IMAGE },
  { sku: "BF-FUS",   nameAr: "مكرونة فوسيلي",              nameEn: "Fusilli",              type: "Fusilli",            imageUrl: CLASSIC_PASTA_IMAGE },
  // Long Pasta Collection
  { sku: "BF-SPG5",  nameAr: "سباغيتي رقم 5",              nameEn: "Spaghetti No. 5",      type: "Spaghetti No. 5",    imageUrl: LONG_PASTA_IMAGE },
  { sku: "BF-SPG1",  nameAr: "سباغيتي رقم 1",              nameEn: "Spaghetti No. 1",      type: "Spaghetti No. 1",    imageUrl: LONG_PASTA_IMAGE },
  { sku: "BF-FET",   nameAr: "فيتوتشيني",                  nameEn: "Fettuccini",           type: "Fettuccini",         imageUrl: LONG_PASTA_IMAGE },
  { sku: "BF-TAG",   nameAr: "تاليا تيلي",                 nameEn: "Tagliatelli",          type: "Tagliatelli",        imageUrl: LONG_PASTA_IMAGE },
  // Whole Wheat Collection
  { sku: "BF-PWW",   nameAr: "بيني الحبة الكاملة",         nameEn: "Penne Whole Wheat",    type: "Penne Whole Wheat",  imageUrl: WHOLE_WHEAT_IMAGE },
  { sku: "BF-FWW",   nameAr: "فوسيلي الحبة الكاملة",       nameEn: "Fusilli Whole Wheat",  type: "Fusilli Whole Wheat", imageUrl: WHOLE_WHEAT_IMAGE },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@burgundy-foods.com";
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedPassword) {
    console.error("✗ SEED_ADMIN_PASSWORD is required to seed the admin user.");
    console.error("  Set it in your local .env (e.g. SEED_ADMIN_PASSWORD=\"choose-a-strong-password\") then re-run.");
    process.exit(1);
  }
  const password = await bcrypt.hash(seedPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password, role: "ADMIN" },
    create: {
      name: "مدير Burgundy Foods",
      email: adminEmail,
      password,
      role: "ADMIN",
    },
  });

  await prisma.companySetting.upsert({
    where: { id: 1 },
    update: {
      nameAr: "مؤسسة برغندي للأغذية",
      nameEn: "Burgundy Foods Establishment",
      phone: "+966533012014",
      email: "info@burgundy-foods.com",
      address: "الرياض، المملكة العربية السعودية",
      tradeLicense: "7052343444",
      description: "مؤسسة برغندي للأغذية: تجارة وتوزيع المواد الغذائية في المملكة العربية السعودية.",
      logoUrl: "/burgundy-logo.png",
      brandColor: "#7b102c",
    },
    create: {
      id: 1,
      nameAr: "مؤسسة برغندي للأغذية",
      nameEn: "Burgundy Foods Establishment",
      phone: "+966533012014",
      email: "info@burgundy-foods.com",
      address: "الرياض، المملكة العربية السعودية",
      tradeLicense: "7052343444",
      description: "مؤسسة برغندي للأغذية: تجارة وتوزيع المواد الغذائية في المملكة العربية السعودية.",
      logoUrl: "/burgundy-logo.png",
      brandColor: "#7b102c",
    },
  });

  await prisma.product.updateMany({
    where: { sku: { startsWith: "MAC-" } },
    data: { active: false },
  });

  for (const product of productSeeds) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: { ...product, isVerified: false, active: true },
      create: { ...product, isVerified: false, active: true },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
