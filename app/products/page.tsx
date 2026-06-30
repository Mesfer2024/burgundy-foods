import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import prisma from "@/lib/prisma";
import ProductsCatalog from "@/components/ProductsCatalog";

export default async function ProductsPage() {
  const products = process.env.DATABASE_URL
    ? await prisma.product.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          type: true,
          weight: true,
          originCountry: true,
          imageUrl: true,
          isVerified: true,
        },
      })
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <ProductsCatalog products={products} />
      </main>
      <SiteFooter />
    </div>
  );
}
